import { create } from 'zustand';
import { persist } from 'zustand/middleware';

import type { Perfil } from '@/features/perfil/types';
import { armazenamento } from '@/shared/lib/armazenamento';
import { SemIa, type ProvedorIa } from '@/shared/lib/semIa';

import { pedirDietaComProvedor, type OpcoesPedidoDieta } from './api';
import type { PlanoDieta } from './contrato';
import { montarDietaPorRegras } from './regras';
import {
  definirDias,
  migrarDieta,
  planoDaSemanaToda,
  planoDoDia,
  voltarAoPadrao,
  type DietaPorDia,
  type DietaSemana,
} from './semana';

/** De onde veio o plano: da IA (Claude ou local) ou montado offline pelo app. */
export type OrigemPlano = 'ia' | 'demo';

type DietaState = {
  /** Plano padrão: vale em todos os dias que não têm plano próprio. */
  plano: PlanoDieta | null;
  /** Dias com plano próprio (0 = domingo a 6 = sábado). Ver `dieta/semana.ts`. */
  porDia: DietaPorDia;
  /** Data ISO de quando o plano foi gerado. */
  geradoEm: string | null;
  origem: OrigemPlano | null;
  /** Qual IA montou o plano (quando a origem é IA e o servidor informou). */
  provedor?: ProvedorIa | null;
  /** Os três abaixo não são salvos: só valem enquanto o app está aberto. */
  gerando: boolean;
  /** Dia que está sendo montado (plano de um dia só); `null` quando é a semana toda. */
  diaGerando: number | null;
  erro: string | null;
  /** Sem `dia`: plano novo para a semana toda. Com `dia`: plano só daquele dia. */
  gerar: (perfil: Perfil, opcoes?: OpcoesPedidoDieta) => Promise<void>;
  /** O dia deixa de ter plano próprio e volta a seguir o plano da semana. */
  usarPlanoDaSemana: (dia: number) => void;
  apagarTudo: () => void;
};

/** A semana depois de receber um plano novo (da semana toda ou de um dia). */
function semanaCom(atual: DietaSemana, plano: PlanoDieta, dia: number | undefined): DietaSemana {
  return dia === undefined ? planoDaSemanaToda(plano) : definirDias(atual, [dia], plano);
}

export const useDietaStore = create<DietaState>()(
  persist(
    (set, get) => ({
      plano: null,
      porDia: {},
      geradoEm: null,
      origem: null,
      gerando: false,
      diaGerando: null,
      erro: null,

      gerar: async (perfil, opcoes = {}) => {
        if (get().gerando) {
          return;
        }

        const { dia } = opcoes;

        set({ gerando: true, diaGerando: dia ?? null, erro: null });

        try {
          const { plano, provedor } = await pedirDietaComProvedor(perfil, opcoes);

          set({
            ...semanaCom(get(), plano, dia),
            origem: 'ia',
            provedor: provedor ?? null,
            geradoEm: new Date().toISOString(),
            gerando: false,
            diaGerando: null,
          });
        } catch (erro) {
          // Sem IA (ou sem internet): o app monta o plano sozinho, offline
          const offline =
            erro instanceof SemIa ? montarDietaPorRegras(perfil, { semente: Date.now() }) : null;

          if (offline) {
            set({
              ...semanaCom(get(), offline, dia),
              origem: 'demo',
              provedor: null,
              geradoEm: new Date().toISOString(),
              gerando: false,
              diaGerando: null,
            });
            return;
          }

          const mensagem = erro instanceof Error ? erro.message : 'Erro inesperado.';

          // Mantém o plano anterior, se houver: melhor que tela vazia
          set({ gerando: false, diaGerando: null, erro: mensagem });
        }
      },

      usarPlanoDaSemana: (dia) => set((state) => voltarAoPadrao(state, dia)),

      apagarTudo: () =>
        set({
          plano: null,
          porDia: {},
          geradoEm: null,
          origem: null,
          provedor: null,
          erro: null,
        }),
    }),
    {
      name: 'apexfit/dieta',
      storage: armazenamento,
      // 2: dieta da semana (plano padrão + dias com plano próprio)
      version: 2,
      migrate: (salvo, versao) => migrarDieta(salvo, versao) as unknown as DietaState,
      partialize: ({ plano, porDia, geradoEm, origem, provedor }) => ({
        plano,
        porDia,
        geradoEm,
        origem,
        provedor,
      }),
    },
  ),
);

/** O plano que vale hoje (o próprio do dia ou o da semana). */
export function usePlanoDeHoje(): PlanoDieta | null {
  return useDietaStore((state) => planoDoDia(state, new Date().getDay()));
}
