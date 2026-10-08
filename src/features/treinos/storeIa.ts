import { create } from 'zustand';
import { persist } from 'zustand/middleware';

import type { Perfil } from '@/features/perfil/types';
import { armazenamento } from '@/shared/lib/armazenamento';
import type { ProvedorIa } from '@/shared/lib/semIa';

import { pedirSemanaIa } from './apiIa';
import { alternarItemAquecimento, mudarMedidaAquecimento, passoAquecimento } from './aquecimento';
import {
  primeiroErroEscolhas,
  type AreaTreino,
  type EscolhasSemana,
  type MedidaAquecimento,
} from './contratoIa';
import { paraDadosTreino } from './ia';
import {
  alternarArea,
  alternarDiaTreino,
  alternarRegiao,
  copiarDia,
  ESCOLHAS_PADRAO,
  escolhasValidas,
  prepararSemana,
} from './montadorIa';
import { montarSemanaPorRegras } from './regrasSemana';
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
  /** Últimas escolhas do montador da semana: ficam salvas para reabrir rápido. */
  escolhas: EscolhasSemana;
  ultima: UltimaGeracao | null;
  /** Os dois abaixo não são salvos: só valem enquanto o app está aberto. */
  gerando: boolean;
  erro: string | null;
  mudarEscolhas: (mudanca: Partial<EscolhasSemana>) => void;
  alternarDia: (dia: number) => void;
  alternarArea: (dia: number, area: AreaTreino) => void;
  alternarRegiao: (dia: number, area: AreaTreino, regiao: string) => void;
  copiarDia: (de: number, para: number) => void;
  ligarAquecimento: (ativo: boolean) => void;
  alternarAquecimento: (nome: string) => void;
  medidaAquecimento: (nome: string, medida: MedidaAquecimento) => void;
  passoAquecimento: (nome: string, sentido: 1 | -1) => void;
  /** Monta um treino por dia escolhido e substitui os atuais. Devolve true se deu certo. */
  gerar: (perfil: Perfil) => Promise<boolean>;
  apagarTudo: () => void;
};

export const useTreinosIaStore = create<TreinosIaState>()(
  persist(
    (set, get) => {
      /** Toda mudança nas escolhas apaga o erro antigo. */
      const mudar = (funcao: (escolhas: EscolhasSemana) => EscolhasSemana) =>
        set((state) => ({ escolhas: funcao(state.escolhas), erro: null }));
      const noAquecimento = (
        funcao: (
          itens: EscolhasSemana['aquecimento']['itens'],
        ) => EscolhasSemana['aquecimento']['itens'],
      ) =>
        mudar((escolhas) => ({
          ...escolhas,
          aquecimento: { ...escolhas.aquecimento, itens: funcao(escolhas.aquecimento.itens) },
        }));

      return {
        escolhas: ESCOLHAS_PADRAO,
        ultima: null,
        gerando: false,
        erro: null,

        mudarEscolhas: (mudanca) => mudar((escolhas) => ({ ...escolhas, ...mudanca })),
        alternarDia: (dia) => mudar((escolhas) => alternarDiaTreino(escolhas, dia)),
        alternarArea: (dia, area) => mudar((escolhas) => alternarArea(escolhas, dia, area)),
        alternarRegiao: (dia, area, regiao) =>
          mudar((escolhas) => alternarRegiao(escolhas, dia, area, regiao)),
        copiarDia: (de, para) => mudar((escolhas) => copiarDia(escolhas, de, para)),
        ligarAquecimento: (ativo) =>
          mudar((escolhas) => ({ ...escolhas, aquecimento: { ...escolhas.aquecimento, ativo } })),
        alternarAquecimento: (nome) =>
          noAquecimento((itens) => alternarItemAquecimento(itens, nome)),
        medidaAquecimento: (nome, medida) =>
          noAquecimento((itens) => mudarMedidaAquecimento(itens, nome, medida)),
        passoAquecimento: (nome, sentido) =>
          noAquecimento((itens) => passoAquecimento(itens, nome, sentido)),

        gerar: async (perfil) => {
          if (get().gerando) {
            return false;
          }

          const { escolhas } = get();
          const invalido = primeiroErroEscolhas(escolhas);

          if (invalido) {
            set({ erro: invalido });
            return false;
          }

          set({ gerando: true, erro: null });

          // O modo offline também é a reserva de um dia que a IA deixar vazio
          const offline = montarSemanaPorRegras(perfil, escolhas);
          let resultado = offline;
          let origem: OrigemTreinos = 'demo';

          try {
            const resposta = await pedirSemanaIa(perfil, escolhas);
            resultado = resposta.resultado;
            origem = resposta.provedor;
          } catch {
            // Sem IA, sem internet ou erro no servidor: a semana sai offline, a demo nunca falha
          }

          const dados = prepararSemana(
            paraDadosTreino(resultado),
            escolhas,
            paraDadosTreino(offline),
          );

          if (dados.length === 0) {
            set({ gerando: false, erro: 'os treinos vieram vazios. tente de novo.' });
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

        apagarTudo: () => set({ escolhas: ESCOLHAS_PADRAO, ultima: null, erro: null }),
      };
    },
    {
      name: 'apexfit/treinos-ia',
      storage: armazenamento,
      // 2: as preferências antigas (dias por semana, local, minutos) viraram o montador da semana
      version: 2,
      partialize: ({ escolhas, ultima }) => ({ escolhas, ultima }),
      migrate: (salvo) => {
        const antigo = (salvo ?? {}) as { escolhas?: unknown; ultima?: UltimaGeracao | null };

        return { escolhas: escolhasValidas(antigo.escolhas), ultima: antigo.ultima ?? null };
      },
      merge: (salvo, atual) => {
        const dados = (salvo ?? {}) as Partial<TreinosIaState>;

        return {
          ...atual,
          ...dados,
          escolhas: escolhasValidas(dados.escolhas),
        };
      },
    },
  ),
);
