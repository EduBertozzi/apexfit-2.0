import { create } from 'zustand';
import { persist } from 'zustand/middleware';

import type { Perfil } from '@/features/perfil/types';
import { armazenamento } from '@/shared/lib/armazenamento';
import { SemIa, type ProvedorIa } from '@/shared/lib/semIa';

import { useTreinosStore } from '@/features/treinos/store';

import { pedirDietaComProvedor, type OpcoesPedidoDieta } from './api';
import type { PlanoDieta } from './contrato';
import {
  alternarSem,
  PREFERENCIAS_DIETA_PADRAO,
  preferenciasValidas,
  quantidadeDeRefeicoesEscolhida,
  restricoesComPreferencias,
  type PreferenciasDieta,
  type SemDieta,
} from './preferencias';
import { montarDietaPorRegras } from './regras';
import {
  definirDias,
  diasDeDescanso,
  migrarDieta,
  planoDoDia,
  semanaTreinoEDescanso,
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
  /** Dias que receberam o plano de descanso na última semana gerada (para a legenda). */
  diasDescanso: number[];
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
  /** Opções da central de IA. Valem em todo pedido de dieta (IA e offline). */
  preferencias: PreferenciasDieta;
  mudarPreferencias: (parcial: Partial<PreferenciasDieta>) => void;
  alternarSem: (item: SemDieta) => void;
  /** Sem `dia`: plano novo para a semana toda. Com `dia`: plano só daquele dia. */
  gerar: (perfil: Perfil, opcoes?: OpcoesPedidoDieta) => Promise<void>;
  /** O dia deixa de ter plano próprio e volta a seguir o plano da semana. */
  usarPlanoDaSemana: (dia: number) => void;
  apagarTudo: () => void;
};

type Pedido = { plano: PlanoDieta; provedor?: ProvedorIa; origem: OrigemPlano };

/**
 * A semana depois de gerar: plano de um dia só muda aquele dia (e ele deixa de
 * ser "de descanso"); a semana toda ganha o plano de treino e o de descanso.
 */
function semanaDepois(
  atual: DietaState,
  treino: PlanoDieta,
  descanso: PlanoDieta | null,
  dia: number | undefined,
  diasSemTreino: readonly number[],
): DietaSemana & { diasDescanso: number[] } {
  if (dia !== undefined) {
    return {
      ...definirDias(atual, [dia], treino),
      diasDescanso: atual.diasDescanso.filter((item) => item !== dia),
    };
  }

  return {
    ...semanaTreinoEDescanso(treino, descanso, diasSemTreino),
    diasDescanso: descanso ? [...diasSemTreino] : [],
  };
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
      diasDescanso: [],
      preferencias: PREFERENCIAS_DIETA_PADRAO,

      mudarPreferencias: (parcial) =>
        set((state) => ({ preferencias: { ...state.preferencias, ...parcial } })),

      alternarSem: (item) =>
        set((state) => ({
          preferencias: { ...state.preferencias, sem: alternarSem(state.preferencias.sem, item) },
        })),

      gerar: async (perfil, opcoes = {}) => {
        if (get().gerando) {
          return;
        }

        const { dia } = opcoes;
        const { preferencias } = get();
        // Semana toda com treinos em dias fixos: um plano para treino e outro para descanso
        const diasSemTreino =
          dia === undefined
            ? diasDeDescanso(useTreinosStore.getState().treinos.map((treino) => treino.dias))
            : [];
        const comDescanso = diasSemTreino.length > 0;

        set({ gerando: true, diaGerando: dia ?? null, erro: null });

        const offline = (deslocamento: number): PlanoDieta | null =>
          montarDietaPorRegras(
            { ...perfil, restricoes: restricoesComPreferencias(perfil.restricoes, preferencias) },
            {
              semente: Date.now() + deslocamento,
              refeicoes: quantidadeDeRefeicoesEscolhida(preferencias),
            },
          );

        // Cada plano tenta a IA; sem IA (ou sem internet), o app monta sozinho, offline
        const pedir = async (
          tipoDia: 'treino' | 'descanso' | undefined,
          deslocamento: number,
        ): Promise<Pedido> => {
          try {
            const resposta = await pedirDietaComProvedor(perfil, {
              ...opcoes,
              preferencias,
              ...(tipoDia ? { tipoDia } : {}),
            });

            return { ...resposta, origem: 'ia' };
          } catch (erro) {
            const plano = erro instanceof SemIa ? offline(deslocamento) : null;

            if (plano) {
              return { plano, origem: 'demo' };
            }

            throw erro;
          }
        };

        const [treino, descanso] = await Promise.allSettled([
          pedir(comDescanso ? 'treino' : undefined, 0),
          comDescanso ? pedir('descanso', 7) : Promise.resolve(null),
        ]);

        if (treino.status === 'rejected') {
          const mensagem =
            treino.reason instanceof Error ? treino.reason.message : 'erro inesperado.';

          // Mantém o plano anterior, se houver: melhor que tela vazia
          set({ gerando: false, diaGerando: null, erro: mensagem });
          return;
        }

        // Se só o de descanso falhou, a semana fica com o plano de treino em todos os dias
        const planoDescanso =
          descanso.status === 'fulfilled' ? (descanso.value?.plano ?? null) : null;

        set({
          ...semanaDepois(get(), treino.value.plano, planoDescanso, dia, diasSemTreino),
          origem: treino.value.origem,
          provedor: treino.value.provedor ?? null,
          geradoEm: new Date().toISOString(),
          gerando: false,
          diaGerando: null,
        });
      },

      usarPlanoDaSemana: (dia) =>
        set((state) => ({
          ...voltarAoPadrao(state, dia),
          diasDescanso: state.diasDescanso.filter((item) => item !== dia),
        })),

      apagarTudo: () =>
        set({
          plano: null,
          porDia: {},
          diasDescanso: [],
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
      partialize: ({ plano, porDia, diasDescanso, geradoEm, origem, provedor, preferencias }) => ({
        plano,
        porDia,
        diasDescanso,
        geradoEm,
        origem,
        provedor,
        preferencias,
      }),
      // Preferências salvas antigas ou estragadas voltam ao padrão sem perder o plano
      merge: (salvo, atual) => {
        const dados = (salvo ?? {}) as Partial<DietaState>;

        return {
          ...atual,
          ...dados,
          diasDescanso: Array.isArray(dados.diasDescanso) ? dados.diasDescanso : [],
          preferencias: preferenciasValidas(dados.preferencias),
        };
      },
    },
  ),
);

/** O plano que vale hoje (o próprio do dia ou o da semana). */
export function usePlanoDeHoje(): PlanoDieta | null {
  return useDietaStore((state) => planoDoDia(state, new Date().getDay()));
}
