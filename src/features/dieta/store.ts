import { create } from 'zustand';
import { persist } from 'zustand/middleware';

import type { Perfil } from '@/features/perfil/types';
import { armazenamento } from '@/shared/lib/armazenamento';

import { pedirDieta } from './api';
import type { PlanoDieta } from './contrato';

type DietaState = {
  plano: PlanoDieta | null;
  /** Data ISO de quando o plano foi gerado. */
  geradoEm: string | null;
  /** Os dois abaixo não são salvos: só valem enquanto o app está aberto. */
  gerando: boolean;
  erro: string | null;
  gerar: (perfil: Perfil) => Promise<void>;
  apagarTudo: () => void;
};

export const useDietaStore = create<DietaState>()(
  persist(
    (set, get) => ({
      plano: null,
      geradoEm: null,
      gerando: false,
      erro: null,

      gerar: async (perfil) => {
        if (get().gerando) {
          return;
        }

        set({ gerando: true, erro: null });

        try {
          const plano = await pedirDieta(perfil);

          set({ plano, geradoEm: new Date().toISOString(), gerando: false });
        } catch (erro) {
          const mensagem = erro instanceof Error ? erro.message : 'Erro inesperado.';

          // Mantém o plano anterior, se houver: melhor que tela vazia
          set({ gerando: false, erro: mensagem });
        }
      },

      apagarTudo: () => set({ plano: null, geradoEm: null, erro: null }),
    }),
    {
      name: 'apexfit/dieta',
      storage: armazenamento,
      version: 1,
      partialize: (state) => ({ plano: state.plano, geradoEm: state.geradoEm }),
    },
  ),
);
