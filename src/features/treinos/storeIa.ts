import { create } from 'zustand';
import { persist } from 'zustand/middleware';

import type { Perfil } from '@/features/perfil/types';
import { armazenamento } from '@/shared/lib/armazenamento';
import { SemIa, type ProvedorIa } from '@/shared/lib/semIa';

import { pedirTreinosIa } from './apiIa';
import type { PreferenciasTreino } from './contratoIa';
import { paraDadosTreino } from './ia';
import { montarTreinosPorRegras } from './regrasIa';
import { useTreinosStore } from './store';

/** Quem montou os treinos: uma das IAs ou o modo demonstração offline. */
export type OrigemTreinos = ProvedorIa | 'demo';

export type UltimaGeracao = {
  origem: OrigemTreinos;
  resumo: string;
  quantidade: number;
  /** Data ISO. */
  geradoEm: string;
};

type TreinosIaState = {
  preferencias: PreferenciasTreino;
  ultima: UltimaGeracao | null;
  /** Os dois abaixo não são salvos: só valem enquanto o app está aberto. */
  gerando: boolean;
  erro: string | null;
  mudarPreferencias: (mudanca: Partial<PreferenciasTreino>) => void;
  /** Monta os treinos e substitui os atuais. Devolve true se deu certo. */
  gerar: (perfil: Perfil) => Promise<boolean>;
  apagarTudo: () => void;
};

export const PREFERENCIAS_PADRAO: PreferenciasTreino = {
  diasPorSemana: 3,
  local: 'academia',
  minutos: 60,
};

export const useTreinosIaStore = create<TreinosIaState>()(
  persist(
    (set, get) => ({
      preferencias: PREFERENCIAS_PADRAO,
      ultima: null,
      gerando: false,
      erro: null,

      mudarPreferencias: (mudanca) =>
        set((state) => ({ preferencias: { ...state.preferencias, ...mudanca } })),

      gerar: async (perfil) => {
        if (get().gerando) {
          return false;
        }

        const { preferencias } = get();
        set({ gerando: true, erro: null });

        let resultado;
        let origem: OrigemTreinos;

        try {
          const resposta = await pedirTreinosIa(perfil, preferencias);
          resultado = resposta.resultado;
          origem = resposta.provedor;
        } catch (erro) {
          if (!(erro instanceof SemIa)) {
            set({
              gerando: false,
              erro: erro instanceof Error ? erro.message : 'Erro inesperado.',
            });
            return false;
          }

          // Sem IA (ou sem internet): o app monta os treinos sozinho, offline
          resultado = montarTreinosPorRegras(perfil, preferencias);
          origem = 'demo';
        }

        const dados = paraDadosTreino(resultado);

        if (dados.length === 0) {
          set({ gerando: false, erro: 'Os treinos vieram vazios. Tente de novo.' });
          return false;
        }

        useTreinosStore.getState().substituirTreinos(dados);
        set({
          gerando: false,
          ultima: {
            origem,
            resumo: resultado.resumo,
            quantidade: dados.length,
            geradoEm: new Date().toISOString(),
          },
        });

        return true;
      },

      apagarTudo: () => set({ preferencias: PREFERENCIAS_PADRAO, ultima: null, erro: null }),
    }),
    {
      name: 'apexfit/treinos-ia',
      storage: armazenamento,
      version: 1,
      partialize: ({ preferencias, ultima }) => ({ preferencias, ultima }),
    },
  ),
);
