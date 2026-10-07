import { create } from 'zustand';
import { persist } from 'zustand/middleware';

import type { PlanoDieta } from '@/features/dieta/contrato';
import { montarDietaPorRegras } from '@/features/dieta/regras';
import { useDietaStore, type OrigemPlano } from '@/features/dieta/store';
import type { RespostaTreinosIa } from '@/features/treinos/contratoIa';
import { paraDadosTreino } from '@/features/treinos/ia';
import { useTreinosStore } from '@/features/treinos/store';
import { armazenamento } from '@/shared/lib/armazenamento';
import { SemIa } from '@/shared/lib/semIa';

import { conversarComCoach } from './api';
import { montarContextoCoach } from './contexto';
import { LIMITES_COACH, type MensagemCoach } from './contrato';
import { responderModoDemo, type DadosDemo } from './demo';

export type MensagemChat = MensagemCoach & {
  id: string;
  /** O coach mexeu na dieta nesta resposta. */
  dietaAtualizada?: boolean;
  /** O coach trocou os treinos nesta resposta. */
  treinosAtualizados?: boolean;
  /** Resposta do modo demonstração (sem IA). */
  demo?: boolean;
};

/** Intervalo entre as palavras na resposta do modo demonstração (efeito "digitando"). */
export const RITMO_DEMO_MS = 18;

/** Quantas mensagens ficam salvas no aparelho. */
export const MENSAGENS_GUARDADAS = 80;

type CoachState = {
  mensagens: MensagemChat[];
  respondendo: boolean;
  erro: string | null;
  enviar: (texto: string, dados: DadosDemo) => Promise<void>;
  limpar: () => void;
};

let contador = 0;

function novoId(): string {
  contador += 1;

  return `${Date.now()}-${contador}`;
}

export const useCoachStore = create<CoachState>()(
  persist(
    (set, get) => {
      /** Muda só a última mensagem (a resposta que está chegando). */
      function atualizarResposta(mudar: (mensagem: MensagemChat) => MensagemChat) {
        set((state) => ({
          mensagens: state.mensagens.map((mensagem, i) =>
            i === state.mensagens.length - 1 ? mudar(mensagem) : mensagem,
          ),
        }));
      }

      function salvarDieta(plano: PlanoDieta, origem: OrigemPlano) {
        useDietaStore.setState({
          plano,
          origem,
          provedor: null,
          geradoEm: new Date().toISOString(),
          erro: null,
        });
        atualizarResposta((m) => ({ ...m, dietaAtualizada: true }));
      }

      function salvarTreinos(resultado: RespostaTreinosIa) {
        const dados = paraDadosTreino(resultado);

        if (dados.length > 0) {
          useTreinosStore.getState().substituirTreinos(dados);
          atualizarResposta((m) => ({ ...m, treinosAtualizados: true }));
        }
      }

      /** Sem IA: responde offline com o motor de demonstração, palavra por palavra. */
      async function responderSemIa(pergunta: string, dados: DadosDemo) {
        const semente = Date.now();
        const resposta = responderModoDemo(pergunta, dados, semente);

        atualizarResposta((m) => ({ ...m, demo: true }));

        if (resposta.acao?.tipo === 'dieta') {
          const plano = montarDietaPorRegras(dados.perfil, {
            semente,
            trocarRefeicao: resposta.acao.trocarRefeicao,
            planoAtual: resposta.acao.novo ? undefined : (dados.plano ?? undefined),
          });

          if (plano) {
            salvarDieta(plano, 'demo');
          }
        }

        for (const palavra of resposta.texto.split(/(?<= )/)) {
          atualizarResposta((m) => ({ ...m, texto: m.texto + palavra }));
          await new Promise((resolver) => setTimeout(resolver, RITMO_DEMO_MS));
        }
      }

      return {
        mensagens: [],
        respondendo: false,
        erro: null,

        enviar: async (texto, dados) => {
          const limpo = texto.trim().slice(0, LIMITES_COACH.texto);

          if (limpo === '' || get().respondendo) {
            return;
          }

          const pergunta: MensagemChat = { id: novoId(), papel: 'usuario', texto: limpo };
          const resposta: MensagemChat = { id: novoId(), papel: 'coach', texto: '' };
          const historico = [...get().mensagens, pergunta]
            .filter((mensagem) => mensagem.texto !== '')
            .slice(-LIMITES_COACH.historico)
            .map(({ papel, texto: conteudo }) => ({ papel, texto: conteudo }));

          set((state) => ({
            mensagens: [...state.mensagens, pergunta, resposta].slice(-MENSAGENS_GUARDADAS),
            respondendo: true,
            erro: null,
          }));

          try {
            await conversarComCoach(
              { mensagens: historico, contexto: montarContextoCoach(dados) },
              (evento) => {
                if (evento.tipo === 'texto') {
                  atualizarResposta((m) => ({ ...m, texto: m.texto + evento.texto }));
                } else if (evento.tipo === 'dieta') {
                  salvarDieta(evento.plano, 'ia');
                } else if (evento.tipo === 'treinos') {
                  salvarTreinos(evento.resultado);
                } else if (evento.tipo === 'erro') {
                  set({ erro: evento.mensagem });
                }
              },
            );
          } catch (erro) {
            if (erro instanceof SemIa) {
              await responderSemIa(limpo, dados);
            } else {
              set({ erro: erro instanceof Error ? erro.message : 'Erro inesperado.' });
            }
          } finally {
            // Resposta vazia (deu erro antes de chegar texto) some da conversa
            set((state) => ({
              respondendo: false,
              mensagens: state.mensagens.filter(
                (mensagem, i) =>
                  !(
                    i === state.mensagens.length - 1 &&
                    mensagem.papel === 'coach' &&
                    !mensagem.texto
                  ),
              ),
            }));
          }
        },

        limpar: () => set({ mensagens: [], erro: null }),
      };
    },
    {
      name: 'apexfit/coach',
      storage: armazenamento,
      version: 1,
      partialize: (state) => ({ mensagens: state.mensagens }),
    },
  ),
);
