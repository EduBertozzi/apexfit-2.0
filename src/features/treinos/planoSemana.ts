import { minusculaInicial } from '@/shared/lib/texto';

import { agruparPorGrupo } from './grupos';
import { normalizarDias, temDias } from './logica';
import { NOME_DIA, SIGLAS_DIA, type SiglaDia } from './semana';
import type { GrupoMuscular, Treino } from './types';

/**
 * Tela "minha semana": o plano semanal inteiro num lugar só, um treino por dia.
 * Segue a mesma regra de `treinoDoDia`: o dia é do primeiro treino que o marca;
 * dia sem treino é descanso, a não ser que ainda exista treino sem dia (aí o
 * rodízio A, B, C ocupa esse dia).
 */

/** Ordem das linhas na tela: domingo a sábado. */
export const DIAS_DA_SEMANA = [0, 1, 2, 3, 4, 5, 6] as const;

export type TipoDoDia = 'treino' | 'descanso' | 'rodizio';

export type DiaDoPlano = {
  /** 0 = domingo, 6 = sábado. */
  dia: number;
  nome: string;
  sigla: SiglaDia;
  tipo: TipoDoDia;
  treino: Treino | null;
  /** Grupos dos exercícios do treino, na ordem da tela (para as bolinhas de cor). */
  grupos: GrupoMuscular[];
};

function diaValido(dia: number): boolean {
  return Number.isInteger(dia) && dia >= 0 && dia <= 6;
}

/** Nenhum treino tem dia marcado: o app está usando o rodízio A, B, C. */
export function semPlano(treinos: readonly Treino[]): boolean {
  return !treinos.some(temDias);
}

/** Existe treino sem dia? Então os dias livres seguem o rodízio, não descanso. */
function temRodizio(treinos: readonly Treino[]): boolean {
  return treinos.some((treino) => !temDias(treino));
}

/** As 7 linhas da semana, de domingo a sábado. */
export function planoDaSemana(treinos: readonly Treino[]): DiaDoPlano[] {
  const rodizio = treinos.length > 0 && temRodizio(treinos);

  return DIAS_DA_SEMANA.map((dia) => {
    const treino = treinos.find((item) => item.dias?.includes(dia)) ?? null;

    return {
      dia,
      nome: NOME_DIA[dia],
      sigla: SIGLAS_DIA[dia],
      tipo: treino ? 'treino' : rodizio ? 'rodizio' : 'descanso',
      treino,
      grupos: treino ? agruparPorGrupo(treino.exercicios).map((bloco) => bloco.grupo) : [],
    };
  });
}

/**
 * Dá o dia da semana para um treino e tira esse dia de todos os outros
 * (um treino por dia). Com `treinoId` null, o dia fica sem treino (descanso).
 */
export function atribuirDia(
  treinos: readonly Treino[],
  dia: number,
  treinoId: string | null,
): Treino[] {
  if (!diaValido(dia)) {
    return [...treinos];
  }

  return treinos.map((treino) => {
    const atuais = treino.dias ?? [];
    const tinha = atuais.includes(dia);
    const escolhido = treino.id === treinoId;

    if (escolhido === tinha) {
      return treino;
    }

    const novos = normalizarDias(
      escolhido ? [...atuais, dia] : atuais.filter((item) => item !== dia),
    );
    const atualizado: Treino = { ...treino, dias: novos };

    if (!novos) {
      delete atualizado.dias;
    }

    return atualizado;
  });
}

/**
 * Dias padrão por quantidade de treinos (mesma tabela da montagem pela IA).
 * 1 treino repete em seg, qua e sex; de 2 a 6, um treino por dia.
 */
const PADRAO: Record<number, number[]> = {
  1: [1, 3, 5],
  2: [1, 4],
  3: [1, 3, 5],
  4: [1, 2, 4, 5],
  5: [1, 2, 3, 4, 5],
  6: [1, 2, 3, 4, 5, 6],
  7: [1, 2, 3, 4, 5, 6, 0],
};

/**
 * Espalha os treinos pela semana na ordem da lista, trocando os dias que já
 * existiam. Com mais de 7 treinos, os 7 primeiros ganham um dia cada e os
 * outros ficam sem dia.
 */
export function distribuirAutomatico(treinos: readonly Treino[]): Treino[] {
  if (treinos.length === 0) {
    return [];
  }

  const padrao = PADRAO[Math.min(treinos.length, 7)];

  return treinos.map((treino, indice) => {
    const dias =
      treinos.length === 1 ? padrao : padrao[indice] === undefined ? [] : [padrao[indice]];
    const novos = normalizarDias(dias);
    const atualizado: Treino = { ...treino, dias: novos };

    if (!novos) {
      delete atualizado.dias;
    }

    return atualizado;
  });
}

/** "4 dias de treino, 3 de descanso" (e o rodízio, quando ainda existe). */
export function resumoDoPlano(plano: readonly DiaDoPlano[]): string {
  const contar = (tipo: TipoDoDia) => plano.filter((dia) => dia.tipo === tipo).length;
  const treino = contar('treino');
  const descanso = contar('descanso');
  const rodizio = contar('rodizio');

  if (treino === 0) {
    return rodizio > 0 ? 'todos os dias seguem o rodízio A, B, C' : 'nenhum dia de treino ainda';
  }

  const partes = [`${treino} ${treino === 1 ? 'dia' : 'dias'} de treino`];

  if (rodizio > 0) {
    partes.push(`${rodizio} no rodízio`);
  }

  if (descanso > 0) {
    partes.push(`${descanso} de descanso`);
  } else if (rodizio === 0) {
    partes.push('sem descanso');
  }

  return partes.length > 2
    ? `${partes.slice(0, -1).join(', ')} e ${partes[partes.length - 1]}`
    : partes.join(', ');
}

/** O que a linha mostra embaixo do nome do dia. */
export function textoDoDia(entrada: DiaDoPlano): { titulo: string; detalhe?: string } {
  if (entrada.treino) {
    return {
      titulo: minusculaInicial(entrada.treino.nome),
      detalhe: entrada.treino.foco ? minusculaInicial(entrada.treino.foco) : undefined,
    };
  }

  return entrada.tipo === 'rodizio'
    ? { titulo: 'rodízio', detalhe: 'o próximo treino da fila' }
    : { titulo: 'descanso' };
}

/** Frase do leitor de tela: "segunda: treino A, peito e tríceps". */
export function rotuloDoDiaNoPlano(entrada: DiaDoPlano): string {
  const { titulo, detalhe } = textoDoDia(entrada);

  return detalhe ? `${entrada.nome}: ${titulo}, ${detalhe}` : `${entrada.nome}: ${titulo}`;
}

export type OpcaoDoDia = {
  /** null = descanso. */
  treinoId: string | null;
  titulo: string;
  detalhe?: string;
  marcado: boolean;
};

/** Opções da folha de escolher o treino do dia: cada treino e, no fim, descanso. */
export function opcoesDoDia(treinos: readonly Treino[], dia: number): OpcaoDoDia[] {
  const atual = treinos.find((treino) => treino.dias?.includes(dia)) ?? null;
  const rodizio = temRodizio(treinos);

  return [
    ...treinos.map((treino) => ({
      treinoId: treino.id,
      titulo: minusculaInicial(treino.nome),
      detalhe: treino.foco ? minusculaInicial(treino.foco) : undefined,
      marcado: atual?.id === treino.id,
    })),
    {
      treinoId: null,
      titulo: rodizio ? 'sem treino fixo' : 'descanso',
      detalhe: rodizio
        ? 'segue o rodízio enquanto houver treino sem dia'
        : 'dia livre para recuperar',
      marcado: atual === null,
    },
  ];
}

/** Título da folha: "treino de segunda". Dia inválido volta null. */
export function tituloDaFolha(dia: number): string | null {
  return diaValido(dia) ? `treino de ${NOME_DIA[dia]}` : null;
}

/** Lê o parâmetro `dia` da rota ("0" a "6"). */
export function lerDia(valor: unknown): number | null {
  const dia = typeof valor === 'string' && /^\d$/.test(valor) ? Number(valor) : NaN;

  return diaValido(dia) ? dia : null;
}
