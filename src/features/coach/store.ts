import { create } from 'zustand';
import { persist } from 'zustand/middleware';

import type { PlanoDieta } from '@/features/dieta/contrato';
import type { SlotRefeicao } from '@/features/dieta/mesclar';
import { montarDietaPorRegras } from '@/features/dieta/regras';
import { aplicarNaSemana, planoDoDia, type DietaSemana } from '@/features/dieta/semana';
import { limparPlano } from '@/features/dieta/texto';
import { useDietaStore, type OrigemPlano } from '@/features/dieta/store';
import type { RespostaTreinosIa } from '@/features/treinos/contratoIa';
import { diasDoTexto } from '@/features/treinos/diasIa';
import { paraDadosTreino } from '@/features/treinos/ia';
import { guardarRegistros } from '@/features/treinos/logica';
import { sessoesValidas } from '@/features/treinos/mesclar';
import { montarTreinosPorRegras } from '@/features/treinos/regrasIa';
import { useTreinosStore } from '@/features/treinos/store';
import type { DadosTreino, Treino } from '@/features/treinos/types';
import { armazenamento } from '@/shared/lib/armazenamento';
import { SemIa } from '@/shared/lib/semIa';

import { conversarComCoach } from './api';
import { montarContextoCoach } from './contexto';
import { LIMITES_COACH, type EventoCoach, type MensagemCoach, type PedidoCoach } from './contrato';
import { responderModoDemo, type DadosDemo } from './demo';
import {
  diasCitados,
  diasDoAjusteDeTreino,
  modoDaDieta,
  modoDoTreino,
  refeicoesPedidas,
  type ModoMudanca,
} from './intencao';
import {
  aplicarProposta as marcarAplicada,
  desfazerProposta as marcarDesfeita,
  esquecerAnteriores,
  podeDesfazer,
  propostaDeDieta,
  propostaDeTreinos,
  recusarProposta as marcarRecusada,
  type Proposta,
} from './proposta';

export type MensagemChat = MensagemCoach & {
  id: string;
  /** Conversas antigas: o coach salvou a dieta direto (antes das propostas). */
  dietaAtualizada?: boolean;
  /** Conversas antigas: o coach trocou os treinos direto. */
  treinosAtualizados?: boolean;
  /** Dieta ou treinos propostos nesta resposta: só salvam se a pessoa aplicar. */
  proposta?: Proposta;
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
  /** Salva a proposta da mensagem (dieta ou treinos) e guarda o que havia antes. */
  aplicarProposta: (mensagemId: string) => void;
  /** "não, obrigado": marca como descartada, nada muda. */
  recusarProposta: (mensagemId: string) => void;
  /** Volta a dieta ou os treinos de antes de aplicar. */
  desfazerProposta: (mensagemId: string) => void;
  limpar: () => void;
};

let contador = 0;

function novoId(): string {
  contador += 1;

  return `${Date.now()}-${contador}`;
}

/** Treinos salvos, no formato do pedido (o servidor ajusta só o que foi pedido). */
function treinosParaPedido(treinos: readonly Treino[]): NonNullable<PedidoCoach['treinosAtuais']> {
  return treinos.slice(0, LIMITES_COACH.treinos).map((treino) => ({
    id: treino.id,
    nome: treino.nome,
    ...(treino.foco ? { foco: treino.foco } : {}),
    ...(treino.dias && treino.dias.length > 0 ? { dias: treino.dias } : {}),
    exercicios: treino.exercicios.slice(0, LIMITES_COACH.exercicios).map((exercicio) => ({
      id: exercicio.id,
      nome: exercicio.nome,
      ...(exercicio.grupo ? { grupo: exercicio.grupo } : {}),
      series: exercicio.series,
      repeticoes: exercicio.repeticoes,
      ...(exercicio.cargaKg === undefined ? {} : { cargaKg: exercicio.cargaKg }),
      ...(exercicio.observacao ? { observacao: exercicio.observacao } : {}),
    })),
  }));
}

/** Dieta da semana salva hoje (plano padrão e dias com plano próprio). */
function semanaAtual(): DietaSemana {
  const { plano, porDia } = useDietaStore.getState();

  return { plano, porDia: porDia ?? {} };
}

/** Dias com plano próprio, no formato do pedido. */
function dietaPorDiaParaPedido(semana: DietaSemana): NonNullable<PedidoCoach['dietaPorDia']> {
  return Object.entries(semana.porDia).flatMap(([dia, plano]) =>
    plano ? [{ dia: Number(dia), plano }] : [],
  );
}

type DicaDieta = { modo?: ModoMudanca; refeicoes?: SlotRefeicao[]; dias?: number[] };
type DicaTreinos = { modo?: ModoMudanca; diasPedidos?: number[]; diasAlvo?: number[] };

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

      /** Dieta nova ou ajustada: vira proposta na resposta, nada é salvo ainda. */
      function proporDieta(
        plano: PlanoDieta,
        origem: OrigemPlano,
        pergunta: string,
        dica: DicaDieta = {},
      ) {
        // "muda o almoço de quarta": o alvo é o plano de quarta
        const dias = dica.dias ?? diasCitados(pergunta);
        const semana = semanaAtual();
        const atual = dias.length > 0 ? planoDoDia(semana, dias[0]) : semana.plano;
        const modo = dica.modo ?? modoDaDieta(pergunta, atual !== null);
        const proposta = propostaDeDieta(atual, limparPlano(plano), {
          modo,
          alvos: dica.refeicoes ?? (modo === 'ajuste' ? refeicoesPedidas(pergunta) : []),
          origem,
          dias,
        });

        if (proposta) {
          atualizarResposta((m) => ({ ...m, proposta }));
        }
      }

      /**
       * Treinos novos ou ajustados: vira proposta, com os dias e os ids
       * preservados. Ajuste com dia ("o supino da sexta"): só o treino daquele dia muda.
       */
      function proporTreinos(
        resultado: RespostaTreinosIa | DadosTreino[],
        pergunta: string,
        dica: DicaTreinos = {},
      ) {
        const atuais = useTreinosStore.getState().treinos;
        const modo = dica.modo ?? modoDoTreino(pergunta, atuais.length > 0);
        const dados = Array.isArray(resultado) ? resultado : paraDadosTreino(resultado);
        const proposta = propostaDeTreinos(atuais, dados, {
          modo,
          diasPedidos: dica.diasPedidos ?? diasDoTexto(pergunta),
          diasAlvo: dica.diasAlvo ?? (modo === 'ajuste' ? diasDoAjusteDeTreino(pergunta) : []),
        });

        if (proposta) {
          atualizarResposta((m) => ({ ...m, proposta }));
        }
      }

      function receber(evento: EventoCoach, pergunta: string) {
        if (evento.tipo === 'texto') {
          atualizarResposta((m) => ({ ...m, texto: m.texto + evento.texto }));
        } else if (evento.tipo === 'dieta') {
          proporDieta(evento.plano, 'ia', pergunta, evento);
        } else if (evento.tipo === 'treinos') {
          proporTreinos(evento.resultado, pergunta, evento);
        } else if (evento.tipo === 'erro') {
          set({ erro: evento.mensagem });
        }
      }

      function propostaDe(mensagemId: string): Proposta | undefined {
        return get().mensagens.find((mensagem) => mensagem.id === mensagemId)?.proposta;
      }

      function trocarProposta(mensagemId: string, proposta: Proposta) {
        set((state) => ({
          mensagens: state.mensagens.map((mensagem) =>
            mensagem.id === mensagemId ? { ...mensagem, proposta } : mensagem,
          ),
        }));
      }

      /** Troca os treinos mantendo as sessões que ainda fazem sentido. */
      function trocarTreinos(treinos: Treino[]) {
        const { sessoes, treinos: antigos } = useTreinosStore.getState();

        useTreinosStore.setState({
          treinos,
          sessoes: guardarRegistros(sessoesValidas(sessoes, treinos), antigos, treinos),
        });
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
            planoAtual: resposta.acao.novo
              ? undefined
              : (planoDoDia(semanaAtual(), resposta.acao.dias?.[0] ?? -1) ?? undefined),
          });

          if (plano) {
            proporDieta(plano, 'demo', pergunta, {
              modo: resposta.acao.novo ? 'novo' : 'ajuste',
              refeicoes: resposta.acao.trocarRefeicao ? [resposta.acao.trocarRefeicao] : [],
              dias: resposta.acao.dias ?? [],
            });
          }
        } else if (resposta.acao?.tipo === 'ajusteTreino') {
          proporTreinos(resposta.acao.treinos, pergunta, {
            modo: 'ajuste',
            diasAlvo: resposta.acao.diasAlvo,
          });
        } else if (resposta.acao?.tipo === 'treinos') {
          const resultado = montarTreinosPorRegras(dados.perfil, {
            diasPorSemana: resposta.acao.diasPorSemana,
            local: resposta.acao.local,
            minutos: 60,
          });

          proporTreinos(resultado, pergunta, {
            modo: 'novo',
            diasPedidos: resposta.acao.diasPedidos,
          });
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

          // Todo pedido leva a dieta (todos os dias) e os treinos (com dias) de agora
          const treinosAtuais = useTreinosStore.getState().treinos;
          const semana: DietaSemana = {
            plano: dados.plano,
            porDia: dados.porDia ?? semanaAtual().porDia,
          };
          const dietaPorDia = dietaPorDiaParaPedido(semana);
          const pedido: PedidoCoach = {
            mensagens: historico,
            contexto: montarContextoCoach(dados),
            ...(semana.plano ? { planoAtual: semana.plano } : {}),
            ...(dietaPorDia.length > 0 ? { dietaPorDia } : {}),
            ...(treinosAtuais.length > 0
              ? { treinosAtuais: treinosParaPedido(treinosAtuais) }
              : {}),
          };

          try {
            await conversarComCoach(pedido, (evento) => receber(evento, limpo));
          } catch (erro) {
            if (erro instanceof SemIa) {
              await responderSemIa(limpo, dados);
            } else {
              set({ erro: erro instanceof Error ? erro.message : 'erro inesperado.' });
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
                    !mensagem.texto &&
                    !mensagem.proposta
                  ),
              ),
            }));
          }
        },

        aplicarProposta: (mensagemId) => {
          const proposta = propostaDe(mensagemId);

          if (!proposta || proposta.estado !== 'pendente') {
            return;
          }

          if (proposta.tipo === 'dieta') {
            const { origem, geradoEm } = useDietaStore.getState();
            const antes = semanaAtual();

            useDietaStore.setState({
              ...aplicarNaSemana(antes, proposta.plano, {
                dias: proposta.dias,
                alvos: proposta.alvos,
                modo: proposta.modo,
              }),
              origem: proposta.origem,
              provedor: null,
              geradoEm: new Date().toISOString(),
              erro: null,
            });
            trocarProposta(
              mensagemId,
              marcarAplicada(proposta, {
                plano: antes.plano,
                porDia: antes.porDia,
                origem,
                geradoEm,
              }),
            );
          } else {
            const anterior = { treinos: useTreinosStore.getState().treinos };

            trocarTreinos(proposta.treinos);
            trocarProposta(mensagemId, marcarAplicada(proposta, anterior));
          }

          // Só a última proposta aplicada de cada tipo guarda o "antes"
          set((state) => ({
            mensagens: esquecerAnteriores(state.mensagens, proposta.tipo, mensagemId),
          }));
        },

        recusarProposta: (mensagemId) => {
          const proposta = propostaDe(mensagemId);

          if (proposta?.estado === 'pendente') {
            trocarProposta(mensagemId, marcarRecusada(proposta));
          }
        },

        desfazerProposta: (mensagemId) => {
          const proposta = propostaDe(mensagemId);

          if (!proposta || !podeDesfazer(proposta)) {
            return;
          }

          if (proposta.tipo === 'dieta' && proposta.anterior) {
            useDietaStore.setState({
              plano: proposta.anterior.plano,
              porDia: proposta.anterior.porDia ?? useDietaStore.getState().porDia,
              origem: proposta.anterior.origem,
              geradoEm: proposta.anterior.geradoEm,
              provedor: null,
              erro: null,
            });
          } else if (proposta.tipo === 'treinos' && proposta.anterior) {
            trocarTreinos(proposta.anterior.treinos);
          }

          trocarProposta(mensagemId, marcarDesfeita(proposta));
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
