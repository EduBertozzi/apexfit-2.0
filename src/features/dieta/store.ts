import { create } from 'zustand';
import { persist } from 'zustand/middleware';

import type { Perfil } from '@/features/perfil/types';
import { armazenamento } from '@/shared/lib/armazenamento';
import { SemIa } from '@/shared/lib/semIa';

import { pedirDieta } from './api';
import type { PlanoDieta } from './contrato';
import { montarDietaPorRegras } from './regras';

/** De onde veio o plano: da IA (Claude ou local) ou montado offline pelo app. */
export type OrigemPlano = 'ia' | 'demo';

type DietaState = {
  plano: PlanoDieta | null;
  /** Data ISO de quando o plano foi gerado. */
  geradoEm: string | null;
  origem: OrigemPlano | null;
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
      origem: null,
      gerando: false,
      erro: null,

      gerar: async (perfil) => {
        if (get().gerando) {
          return;
        }

        set({ gerando: true, erro: null });

        try {
          const plano = await pedirDieta(perfil);

          set({ plano, origem: 'ia', geradoEm: new Date().toISOString(), gerando: false });
        } catch (erro) {
          // Sem IA (ou sem internet): o app monta o plano sozinho, offline
          const offline =
            erro instanceof SemIa ? montarDietaPorRegras(perfil, { semente: Date.now() }) : null;

          if (offline) {
            set({
              plano: offline,
              origem: 'demo',
              geradoEm: new Date().toISOString(),
              gerando: false,
            });
            return;
          }

          const mensagem = erro instanceof Error ? erro.message : 'Erro inesperado.';

          // Mantém o plano anterior, se houver: melhor que tela vazia
          set({ gerando: false, erro: mensagem });
        }
      },

      apagarTudo: () => set({ plano: null, geradoEm: null, origem: null, erro: null }),
    }),
    {
      name: 'apexfit/dieta',
      storage: armazenamento,
      version: 1,
      partialize: ({ plano, geradoEm, origem }) => ({ plano, geradoEm, origem }),
    },
  ),
);
