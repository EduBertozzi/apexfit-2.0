import { useMemo } from 'react';
import { create } from 'zustand';
import { persist } from 'zustand/middleware';

import { armazenamento } from '@/shared/lib/armazenamento';
import { chaveDoDia } from '@/shared/lib/data';

import {
  adicionarExercicio,
  adicionarExercicios,
  adicionarTreino,
  alternarExercicio,
  aplicarModelo,
  criarTreino,
  definirDias,
  descartarSessoesAbertas,
  guardarRegistros,
  editarExercicio,
  editarTreino,
  finalizarSessao,
  iniciarSessao,
  limparSessoesAntigas,
  marcarExercicioNoDia,
  moverExercicio,
  moverTreino,
  proximoNomeDeTreino,
  removerExercicio,
  removerTreino,
  sessaoDeHoje,
  situacaoDoDia,
  treinosNaSemana,
  type Direcao,
} from './logica';
import { substituirTreinos } from './ia';
import { moverExercicioNoGrupo, reordenarExercicioNoGrupo } from './montagem';
import type { ModeloTreino } from './modelos';
import {
  atribuirDia,
  distribuirAutomatico,
  planoDaSemana,
  resumoDoPlano,
  semPlano,
} from './planoSemana';
import { calcularSequencia } from './regraSequencia';
import { diasDaSemana, nomeDoDia, resumoDaSemana } from './semana';
import type { DadosExercicio, DadosTreino, Sessao, Treino } from './types';
import { visaoDoDia } from './visaoDoDia';

type TreinosState = {
  treinos: Treino[];
  sessoes: Sessao[];
  /**
   * Dias (AAAA-MM-DD) em que um congelador já salvou a sequência. Ficam salvos
   * para o dia continuar congelado mesmo se o plano mudar depois.
   */
  congelados: string[];

  /** Cria um treino vazio com o próximo nome livre e devolve o id dele. */
  novoTreino: () => string;
  usarModelo: (modelo: ModeloTreino) => void;
  editarTreino: (id: string, dados: { nome: string; foco?: string }) => void;
  removerTreino: (id: string) => void;
  moverTreino: (id: string, direcao: Direcao) => void;
  /** Plano semanal: dias em que o treino acontece (0 = domingo). Vazio volta para o rodízio. */
  definirDias: (id: string, dias: number[]) => void;
  /** Minha semana: dá o dia a um treino e tira dos outros (null = descanso). */
  atribuirDia: (dia: number, treinoId: string | null) => void;
  /** Minha semana: espalha os treinos pela semana no padrão (troca os dias atuais). */
  distribuirAutomatico: () => void;

  adicionarExercicio: (treinoId: string, dados: DadosExercicio) => void;
  adicionarExercicios: (treinoId: string, dados: DadosExercicio[]) => void;
  editarExercicio: (treinoId: string, exercicioId: string, dados: DadosExercicio) => void;
  removerExercicio: (treinoId: string, exercicioId: string) => void;
  moverExercicio: (treinoId: string, exercicioId: string, direcao: Direcao) => void;
  /** Sobe ou desce entre os exercícios do mesmo grupo (como a tela mostra). */
  moverNoGrupo: (treinoId: string, exercicioId: string, direcao: Direcao) => void;
  /** Arrastar: leva o exercício para a posição `destino` dentro do grupo dele. */
  reordenarNoGrupo: (treinoId: string, exercicioId: string, destino: number) => void;

  /** Começa ou retoma o treino de hoje. */
  comecarTreino: (treinoId: string, data?: Date) => void;
  alternarExercicio: (exercicioId: string, data?: Date) => void;
  /** Marca da tela inicial: começa o treino de hoje sozinho se preciso. */
  marcarExercicioDeHoje: (treinoId: string, exercicioId: string, data?: Date) => void;
  /** Devolve true se finalizou (precisa de pelo menos um exercício marcado). */
  finalizarTreino: (data?: Date) => boolean;

  /** Troca todos os treinos (ex: os montados pela IA). O histórico fica. */
  substituirTreinos: (dados: DadosTreino[]) => void;

  /** Guarda os dias que a regra da sequência acabou de congelar. */
  registrarCongelados: (dias: readonly string[]) => void;

  apagarTudo: () => void;
};

/** Junta sem repetir, em ordem, e guarda no máximo um ano e pouco de dias. */
export function juntarCongelados(atuais: readonly string[], novos: readonly string[]): string[] {
  return [...new Set([...atuais, ...novos])].sort().slice(-400);
}

export const useTreinosStore = create<TreinosState>()(
  persist(
    (set, get) => ({
      treinos: [],
      sessoes: [],
      congelados: [],

      novoTreino: () => {
        const treino = criarTreino({ nome: proximoNomeDeTreino(get().treinos) });

        set({ treinos: adicionarTreino(get().treinos, treino) });

        return treino.id;
      },

      usarModelo: (modelo) => set({ treinos: aplicarModelo(get().treinos, modelo) }),

      editarTreino: (id, dados) => set({ treinos: editarTreino(get().treinos, id, dados) }),

      removerTreino: (id) => {
        const { treinos, sessoes } = get();
        const restantes = removerTreino(treinos, id);

        set({
          treinos: restantes,
          sessoes: guardarRegistros(descartarSessoesAbertas(sessoes, id), treinos, restantes),
        });
      },

      moverTreino: (id, direcao) => set({ treinos: moverTreino(get().treinos, id, direcao) }),

      definirDias: (id, dias) => set({ treinos: definirDias(get().treinos, id, dias) }),

      atribuirDia: (dia, treinoId) => set({ treinos: atribuirDia(get().treinos, dia, treinoId) }),

      distribuirAutomatico: () => set({ treinos: distribuirAutomatico(get().treinos) }),

      adicionarExercicio: (treinoId, dados) =>
        set({ treinos: adicionarExercicio(get().treinos, treinoId, dados) }),

      adicionarExercicios: (treinoId, dados) =>
        set({ treinos: adicionarExercicios(get().treinos, treinoId, dados) }),

      editarExercicio: (treinoId, exercicioId, dados) =>
        set({ treinos: editarExercicio(get().treinos, treinoId, exercicioId, dados) }),

      removerExercicio: (treinoId, exercicioId) =>
        set({ treinos: removerExercicio(get().treinos, treinoId, exercicioId) }),

      moverExercicio: (treinoId, exercicioId, direcao) =>
        set({ treinos: moverExercicio(get().treinos, treinoId, exercicioId, direcao) }),

      moverNoGrupo: (treinoId, exercicioId, direcao) =>
        set({ treinos: moverExercicioNoGrupo(get().treinos, treinoId, exercicioId, direcao) }),

      reordenarNoGrupo: (treinoId, exercicioId, destino) =>
        set({ treinos: reordenarExercicioNoGrupo(get().treinos, treinoId, exercicioId, destino) }),

      comecarTreino: (treinoId, data = new Date()) => {
        const hoje = chaveDoDia(data);
        const { sessoes } = iniciarSessao(get().sessoes, treinoId, hoje);

        set({ sessoes: limparSessoesAntigas(sessoes, hoje) });
      },

      alternarExercicio: (exercicioId, data = new Date()) => {
        const sessao = sessaoDeHoje(get().sessoes, chaveDoDia(data));

        if (sessao) {
          set({ sessoes: alternarExercicio(get().sessoes, sessao.id, exercicioId) });
        }
      },

      marcarExercicioDeHoje: (treinoId, exercicioId, data = new Date()) => {
        const hoje = chaveDoDia(data);
        const sessoes = marcarExercicioNoDia(get().sessoes, treinoId, exercicioId, hoje);

        set({ sessoes: limparSessoesAntigas(sessoes, hoje) });
      },

      finalizarTreino: (data = new Date()) => {
        const sessao = sessaoDeHoje(get().sessoes, chaveDoDia(data));

        if (!sessao) {
          return false;
        }

        const sessoes = finalizarSessao(get().sessoes, sessao.id);
        const finalizou = sessoes.some((item) => item.id === sessao.id && item.finalizada);

        set({ sessoes });

        return finalizou && !sessao.finalizada;
      },

      substituirTreinos: (dados) =>
        set(substituirTreinos(get().sessoes, dados, undefined, get().treinos)),

      registrarCongelados: (dias) => {
        const atuais = get().congelados;

        if (dias.every((dia) => atuais.includes(dia))) {
          return;
        }

        set({ congelados: juntarCongelados(atuais, dias) });
      },

      apagarTudo: () => set({ treinos: [], sessoes: [], congelados: [] }),
    }),
    {
      name: 'apexfit/treinos',
      storage: armazenamento,
      version: 2,
      partialize: (state) => ({
        treinos: state.treinos,
        sessoes: state.sessoes,
        congelados: state.congelados,
      }),
      migrate: migrarTreinos,
    },
  ),
);

/**
 * Versão 1 não tinha `congelados`. Versões futuras desconhecidas voltam como estão.
 * Exportada para teste.
 */
export function migrarTreinos(persistido: unknown, versao: number) {
  const estado = (persistido ?? {}) as Partial<
    Pick<TreinosState, 'treinos' | 'sessoes' | 'congelados'>
  >;

  if (versao < 2) {
    return { ...estado, congelados: [] };
  }

  return estado;
}

/** A regra da sequência inteira (dias, congeladores, marcas e risco de hoje), calculada uma vez. */
export function useResultadoSequencia(data: Date = new Date()) {
  const treinos = useTreinosStore((state) => state.treinos);
  const sessoes = useTreinosStore((state) => state.sessoes);
  const congelados = useTreinosStore((state) => state.congelados);
  const hoje = chaveDoDia(data);

  return useMemo(
    () => calcularSequencia(treinos, sessoes, hoje, congelados),
    [treinos, sessoes, hoje, congelados],
  );
}

/** Hook da tela inicial: os 7 dias coloridos, a sequência de dias e o nome de hoje. */
export function useSemanaDeTreinos(data: Date = new Date()) {
  const treinos = useTreinosStore((state) => state.treinos);
  const sessoes = useTreinosStore((state) => state.sessoes);
  const hoje = chaveDoDia(data);
  const resultado = useResultadoSequencia(data);

  return useMemo(() => {
    const dias = diasDaSemana(treinos, sessoes, hoje, resultado.marcas);

    return {
      hoje,
      dias,
      /** Só a semana atual, de domingo a sábado (rola para o lado se não couber). */
      faixa: dias,
      resumo: resumoDaSemana(dias),
      sequencia: resultado.atual,
      nomeDeHoje: nomeDoDia(hoje),
    };
  }, [treinos, sessoes, hoje, resultado]);
}

/** O que mostrar para o dia escolhido no calendário (hoje, passado ou futuro). */
export function useVisaoDoDia(dia: string, hoje: Date) {
  const treinos = useTreinosStore((state) => state.treinos);
  const sessoes = useTreinosStore((state) => state.sessoes);

  return visaoDoDia(treinos, sessoes, dia, chaveDoDia(hoje));
}

/** Hook para as telas: a situação do treino de hoje e quantos treinos na semana. */
export function useTreinoDoDia(data: Date = new Date()) {
  const treinos = useTreinosStore((state) => state.treinos);
  const sessoes = useTreinosStore((state) => state.sessoes);
  const hoje = chaveDoDia(data);

  return {
    situacao: situacaoDoDia(treinos, sessoes, hoje),
    naSemana: treinosNaSemana(sessoes, hoje),
  };
}

/** Tela "minha semana": as 7 linhas, o resumo e se ainda está no rodízio. */
export function usePlanoDaSemana() {
  const treinos = useTreinosStore((state) => state.treinos);
  const plano = planoDaSemana(treinos);

  return {
    plano,
    resumo: resumoDoPlano(plano),
    semPlano: semPlano(treinos),
    temTreinos: treinos.length > 0,
  };
}
