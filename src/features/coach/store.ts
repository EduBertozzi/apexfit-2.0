import { create } from 'zustand';
import { persist } from 'zustand/middleware';

import { useDietaStore } from '@/features/dieta/store';
import { armazenamento } from '@/shared/lib/armazenamento';

import { conversarComCoach } from './api';
import { LIMITES_COACH, type MensagemCoach } from './contrato';

export type MensagemChat = MensagemCoach & {
  id: string;
  /** O coach mexeu na dieta nesta resposta. */
  dietaAtualizada?: boolean;
};

/** Quantas mensagens ficam salvas no aparelho. */
export const MENSAGENS_GUARDADAS = 80;

type CoachState = {
  mensagens: MensagemChat[];
  respondendo: boolean;
  erro: string | null;
  enviar: (texto: string, contexto: string) => Promise<void>;
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

      return {
        mensagens: [],
        respondendo: false,
        erro: null,

        enviar: async (texto, contexto) => {
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
            await conversarComCoach({ mensagens: historico, contexto }, (evento) => {
              if (evento.tipo === 'texto') {
                atualizarResposta((m) => ({ ...m, texto: m.texto + evento.texto }));
              } else if (evento.tipo === 'dieta') {
                useDietaStore.setState({
                  plano: evento.plano,
                  geradoEm: new Date().toISOString(),
                  erro: null,
                });
                atualizarResposta((m) => ({ ...m, dietaAtualizada: true }));
              } else if (evento.tipo === 'erro') {
                set({ erro: evento.mensagem });
              }
            });
          } catch (erro) {
            set({ erro: erro instanceof Error ? erro.message : 'Erro inesperado.' });
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
