import { create } from 'zustand';
import { persist } from 'zustand/middleware';

import type { Perfil } from '@/features/perfil/types';
import { armazenamento } from '@/shared/lib/armazenamento';
import { SemIa, type ProvedorIa } from '@/shared/lib/semIa';

import { pedirDietaComProvedor } from './api';
import type { PlanoDieta } from './contrato';
import { montarDietaPorRegras } from './regras';

/** De onde veio o plano: da IA (Claude ou local) ou montado offline pelo app. */
export type OrigemPlano = 'ia' | 'demo';

type DietaState = {
  plano: PlanoDieta | null;
  /** Data ISO de quando o plano foi gerado. */
  geradoEm: string | null;
  origem: OrigemPlano | null;
  /** Qual IA montou o plano (quando a origem é IA e o servidor informou). */
  provedor?: ProvedorIa | null;
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
          const { plano, provedor } = await pedirDietaComProvedor(perfil);

          set({
            plano,
            origem: 'ia',
            provedor: provedor ?? null,
            geradoEm: new Date().toISOString(),
            gerando: false,
          });
        } catch (erro) {
          // Sem IA (ou sem internet): o app monta o plano sozinho, offline
          const offline =
            erro instanceof SemIa ? montarDietaPorRegras(perfil, { semente: Date.now() }) : null;

          if (offline) {
            set({
              plano: offline,
              origem: 'demo',
              provedor: null,
              geradoEm: new Date().toISOString(),
              gerando: false,
            });
            return;
          }

          const mensagem = erro instanceof Error ? erro.message : 'erro inesperado.';

          // Mantém o plano anterior, se houver: melhor que tela vazia
          set({ gerando: false, erro: mensagem });
        }
      },

      apagarTudo: () =>
        set({ plano: null, geradoEm: null, origem: null, provedor: null, erro: null }),
    }),
    {
      name: 'apexfit/dieta',
      storage: armazenamento,
      version: 1,
      partialize: ({ plano, geradoEm, origem, provedor }) => ({
        plano,
        geradoEm,
        origem,
        provedor,
      }),
    },
  ),
);
