import { create } from 'zustand';
import { persist } from 'zustand/middleware';

import { armazenamento } from '@/shared/lib/armazenamento';

import {
  ajustarFim,
  ajustarInicio,
  intervaloValido,
  montarLembretes,
  type Horario,
} from './logica';
import {
  agendarLembretes,
  cancelarLembretes,
  notificacoesSuportadas,
  pedirPermissao,
} from './notificacoes';

export type ResultadoLigar = 'ligado' | 'negado' | 'indisponivel';

type LembretesState = {
  ativo: boolean;
  inicio: Horario;
  fim: Horario;
  intervaloMin: number;
  /** Pede permissão e agenda. Se a pessoa negar, continua desligado. */
  ligar: () => Promise<ResultadoLigar>;
  desligar: () => Promise<void>;
  definirIntervalo: (intervaloMin: number) => Promise<void>;
  mudarInicio: (direcao: 1 | -1) => Promise<void>;
  mudarFim: (direcao: 1 | -1) => Promise<void>;
  apagarTudo: () => Promise<void>;
};

const PADRAO = {
  ativo: false,
  inicio: '08:00' as Horario,
  fim: '22:00' as Horario,
  intervaloMin: 120,
};

// Toques rápidos geram vários reagendamentos: a fila roda um de cada vez,
// sempre com o estado mais novo, para não sobrar lembrete de uma configuração velha.
let fila: Promise<void> = Promise.resolve();

function sincronizar(ler: () => LembretesState): Promise<void> {
  fila = fila
    .then(async () => {
      const { ativo, inicio, fim, intervaloMin } = ler();

      if (ativo) {
        await agendarLembretes(montarLembretes({ inicio, fim, intervaloMin }));
      } else {
        await cancelarLembretes();
      }
    })
    .catch((erro) => {
      console.warn('Não deu para atualizar os lembretes de água', erro);
    });

  return fila;
}

export const useLembretesStore = create<LembretesState>()(
  persist(
    (set, get) => ({
      ...PADRAO,

      ligar: async () => {
        if (!notificacoesSuportadas()) {
          return 'indisponivel';
        }

        let permitido = false;

        try {
          permitido = await pedirPermissao();
        } catch {
          return 'indisponivel';
        }

        if (!permitido) {
          set({ ativo: false });
          return 'negado';
        }

        set({ ativo: true });
        await sincronizar(get);
        return 'ligado';
      },

      desligar: async () => {
        set({ ativo: false });
        await sincronizar(get);
      },

      definirIntervalo: async (intervaloMin) => {
        if (!intervaloValido(intervaloMin)) {
          return;
        }

        set({ intervaloMin });
        await sincronizar(get);
      },

      mudarInicio: async (direcao) => {
        set({ inicio: ajustarInicio(get(), direcao) });
        await sincronizar(get);
      },

      mudarFim: async (direcao) => {
        set({ fim: ajustarFim(get(), direcao) });
        await sincronizar(get);
      },

      apagarTudo: async () => {
        set(PADRAO);
        await sincronizar(get);
      },
    }),
    {
      name: 'apexfit/lembretes',
      storage: armazenamento,
      version: 1,
      partialize: ({ ativo, inicio, fim, intervaloMin }) => ({ ativo, inicio, fim, intervaloMin }),
    },
  ),
);
