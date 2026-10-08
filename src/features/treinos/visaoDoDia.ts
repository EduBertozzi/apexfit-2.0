import { minusculaInicial } from '@/shared/lib/texto';

import {
  concluidosDeHoje,
  legendaTreinoDoDia,
  podeMarcarNoInicio,
  progressoDaSessao,
  situacaoDoDia,
  temDias,
  treinoDaSessao,
  treinoDoDia,
} from './logica';
import { ehDescanso, nomeDoDia, sessaoQueVale, somarDias } from './semana';
import type { Sessao, Treino } from './types';

/**
 * O que a tela inicial mostra para o dia escolhido no calendário.
 * Só hoje dá para marcar exercício; os outros dias são para consulta.
 */
export type VisaoDoDia = {
  chave: string;
  quando: 'passado' | 'hoje' | 'futuro';
  /** "quarta" */
  nomeDoDia: string;
  /** "treino de hoje", "treino de amanhã", "treino de sexta"... */
  titulo: string;
  /** Linha embaixo do título: "treino A, 3 de 11 feitos" */
  legenda: string;
  treino: Treino | null;
  /** Exercícios já feitos nesse dia. */
  concluidos: string[];
  podeMarcar: boolean;
  descanso: boolean;
};

function tituloDoDia(dia: string, hoje: string): string {
  if (dia === hoje) {
    return 'treino de hoje';
  }

  if (dia === somarDias(hoje, 1)) {
    return 'treino de amanhã';
  }

  if (dia === somarDias(hoje, -1)) {
    return 'treino de ontem';
  }

  return `treino de ${nomeDoDia(dia)}`;
}

export function visaoDoDia(
  treinos: readonly Treino[],
  sessoes: readonly Sessao[],
  dia: string,
  hoje: string,
): VisaoDoDia {
  const base = { chave: dia, nomeDoDia: nomeDoDia(dia), titulo: tituloDoDia(dia, hoje) };

  if (dia === hoje) {
    const situacao = situacaoDoDia(treinos, sessoes, hoje);

    return {
      ...base,
      quando: 'hoje',
      legenda: legendaTreinoDoDia(situacao),
      treino: situacao.tipo === 'sem-treinos' ? null : situacao.treino,
      concluidos: concluidosDeHoje(situacao),
      podeMarcar: podeMarcarNoInicio(situacao),
      descanso: situacao.tipo === 'sugerido' && situacao.descanso === true,
    };
  }

  const somenteLeitura = { podeMarcar: false, concluidos: [] as string[] };

  if (dia < hoje) {
    const sessao = sessaoQueVale(sessoes, dia);
    const treino = sessao ? treinoDaSessao(treinos, sessao) : null;

    if (sessao && treino) {
      const { feitos, total } = progressoDaSessao(sessao, treino);

      return {
        ...base,
        ...somenteLeitura,
        quando: 'passado',
        legenda: `${minusculaInicial(treino.nome)}, ${feitos} de ${total} feitos`,
        treino,
        concluidos: sessao.concluidos,
        descanso: false,
      };
    }

    const descanso = ehDescanso(treinos, sessoes, dia);

    return {
      ...base,
      ...somenteLeitura,
      quando: 'passado',
      legenda: descanso ? 'dia de descanso' : 'nenhum treino registrado nesse dia',
      treino: null,
      descanso,
    };
  }

  if (treinos.length === 0) {
    return {
      ...base,
      ...somenteLeitura,
      quando: 'futuro',
      legenda: 'nenhum treino montado ainda',
      treino: null,
      descanso: false,
    };
  }

  const planejado = treinoDoDia(treinos, sessoes, dia);

  if (planejado.descanso) {
    return {
      ...base,
      ...somenteLeitura,
      quando: 'futuro',
      legenda: 'dia de descanso',
      treino: null,
      descanso: true,
    };
  }

  const treino = planejado.treino;
  // Com plano semanal o dia é certo; sem plano, é só o próximo da fila
  const comPlano = treinos.some(temDias);

  return {
    ...base,
    ...somenteLeitura,
    quando: 'futuro',
    legenda: treino
      ? comPlano
        ? `${minusculaInicial(treino.nome)}, planejado para esse dia`
        : `${minusculaInicial(treino.nome)}, próximo do rodízio`
      : 'nenhum treino planejado',
    treino,
    descanso: false,
  };
}
