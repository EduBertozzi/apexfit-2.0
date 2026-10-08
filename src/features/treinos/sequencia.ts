/**
 * Página de sequência: recorde, calendário do mês, marcos e frases.
 * A regra de quem conta, descansa ou congela fica em `regraSequencia.ts`;
 * aqui só se monta o que a página mostra a partir dela.
 */
import { calcularSequencia } from './regraSequencia';
import {
  detalheDoDia,
  diaDaSemana,
  ehDescanso,
  estadoDoDiaPassado,
  fracaoDoDia,
  MINIMO_PARCIAL,
  NOME_DIA,
  SIGLAS_DIA,
  somarDias,
  type MarcasDosDias,
  type SiglaDia,
} from './semana';
import type { Sessao, Treino } from './types';

/** O dia entra na sequência (pelo menos 50% do treino feito)? */
export function diaContou(
  treinos: readonly Treino[],
  sessoes: readonly Sessao[],
  chave: string,
): boolean {
  return (fracaoDoDia(treinos, sessoes, chave) ?? 0) >= MINIMO_PARCIAL;
}

/** Descanso do plano sem treino feito (a regra completa, que também conta o descanso, está em `regraSequencia.ts`). */
export function diaPulavel(
  treinos: readonly Treino[],
  sessoes: readonly Sessao[],
  chave: string,
): boolean {
  return fracaoDoDia(treinos, sessoes, chave) === null && ehDescanso(treinos, sessoes, chave);
}

/** Primeiro dia com treino registrado (AAAA-MM-DD), ou `null` sem histórico. */
export function primeiroDiaRegistrado(sessoes: readonly Sessao[]): string | null {
  let primeiro: string | null = null;

  for (const sessao of sessoes) {
    if (primeiro === null || sessao.data < primeiro) {
      primeiro = sessao.data;
    }
  }

  return primeiro;
}

/**
 * Maior sequência do histórico (o recorde), com a mesma regra da chama
 * (`regraSequencia.ts`). Hoje sem treino ainda não quebra nada.
 */
export function maiorSequencia(
  treinos: readonly Treino[],
  sessoes: readonly Sessao[],
  hoje: string,
  salvos: readonly string[] = [],
): number {
  return calcularSequencia(treinos, sessoes, hoje, salvos).recorde;
}

/** Quantos dias contaram desde sempre ("dias de treino no total"). */
export function diasDeTreinoNoTotal(
  treinos: readonly Treino[],
  sessoes: readonly Sessao[],
  hoje: string,
): number {
  const datas = new Set(sessoes.map((sessao) => sessao.data).filter((data) => data <= hoje));

  return [...datas].filter((data) => diaContou(treinos, sessoes, data)).length;
}

// ---------------------------------------------------------------------------
// Semana da sequência (7 bolinhas, de domingo a sábado)
// ---------------------------------------------------------------------------

/**
 * - feito: o dia contou (check)
 * - descanso: descanso do plano ou folga do rodízio, neutro
 * - congelado: falta coberta por um congelador (floco de neve)
 * - perdido: já passou e não contou
 * - pendente: hoje, ainda sem os 50%
 * - futuro: ainda não chegou
 */
export type EstadoBolinha = 'feito' | 'descanso' | 'congelado' | 'perdido' | 'pendente' | 'futuro';

export type BolinhaDaSemana = {
  chave: string;
  sigla: SiglaDia;
  estado: EstadoBolinha;
  hoje: boolean;
};

export function semanaDaSequencia(
  treinos: readonly Treino[],
  sessoes: readonly Sessao[],
  hoje: string,
  marcas: MarcasDosDias = {},
): BolinhaDaSemana[] {
  const domingo = somarDias(hoje, -diaDaSemana(hoje));

  return Array.from({ length: 7 }, (_, indice) => {
    const chave = somarDias(domingo, indice);
    let estado: EstadoBolinha;

    if (chave > hoje) {
      estado = 'futuro';
    } else if (diaContou(treinos, sessoes, chave)) {
      estado = 'feito';
    } else if (marcas[chave] === 'congelado') {
      estado = 'congelado';
    } else if (marcas[chave] === 'descanso' || diaPulavel(treinos, sessoes, chave)) {
      estado = 'descanso';
    } else {
      estado = chave === hoje ? 'pendente' : 'perdido';
    }

    return { chave, sigla: SIGLAS_DIA[indice], estado, hoje: chave === hoje };
  });
}

const DESCRICAO_BOLINHA: Record<EstadoBolinha, string> = {
  feito: 'treinou',
  descanso: 'descanso',
  congelado: 'congelado, a sequência seguiu',
  perdido: 'não treinou',
  pendente: 'ainda sem treino',
  futuro: 'ainda não chegou',
};

/** "segunda, treinou" para o leitor de tela. */
export function rotuloDaBolinha(bolinha: BolinhaDaSemana): string {
  const nome = bolinha.hoje ? 'hoje' : NOME_DIA[SIGLAS_DIA.indexOf(bolinha.sigla)];

  return `${nome}, ${DESCRICAO_BOLINHA[bolinha.estado]}`;
}

// ---------------------------------------------------------------------------
// Calendário do mês
// ---------------------------------------------------------------------------

/**
 * Cor de cada dia no calendário (mesmas cores da faixa da semana):
 * - completo, parcial, fraco: pelo quanto foi feito
 * - descanso: descanso do plano ou folga do rodízio
 * - congelado: falta coberta por um congelador
 * - hoje: hoje ainda sem os 50% (neutro, só contornado)
 * - futuro: ainda não chegou
 * - vazio: antes do primeiro treino registrado (não pinta de vermelho)
 */
export type EstadoDoCalendario =
  'completo' | 'parcial' | 'fraco' | 'descanso' | 'congelado' | 'hoje' | 'futuro' | 'vazio';

export type DiaDoCalendario = {
  chave: string;
  dia: number;
  estado: EstadoDoCalendario;
  hoje: boolean;
  /** De 0 a 1 (o anel em volta do número); `null` sem treino ou no futuro. */
  fracao: number | null;
};

export type MesDoCalendario = {
  ano: number;
  /** 0 = janeiro. */
  mes: number;
  /** "outubro de 2026" */
  titulo: string;
  /** Quantas casas vazias antes do dia 1 (0 = o mês começa no domingo). */
  deslocamento: number;
  dias: DiaDoCalendario[];
  /** Dias do mês que contaram para a sequência ("treinos no mês"). */
  treinos: number;
  /** Dá para ir ao mês anterior (só até o mês do primeiro treino). */
  temAnterior: boolean;
  /** Dá para ir ao próximo (nunca passa do mês de hoje). */
  temProximo: boolean;
};

export const NOME_MES: readonly string[] = [
  'janeiro',
  'fevereiro',
  'março',
  'abril',
  'maio',
  'junho',
  'julho',
  'agosto',
  'setembro',
  'outubro',
  'novembro',
  'dezembro',
];

function chaveDe(ano: number, mes: number, dia: number): string {
  return `${ano}-${String(mes + 1).padStart(2, '0')}-${String(dia).padStart(2, '0')}`;
}

/** Ano e mês (0 a 11) de uma chave AAAA-MM-DD, como número comparável. */
function indiceDoMes(chave: string): number {
  return Number(chave.slice(0, 4)) * 12 + Number(chave.slice(5, 7)) - 1;
}

/** Mês vizinho: `delta` -1 volta um mês, 1 avança (vira o ano sozinho). */
export function mesVizinho(ano: number, mes: number, delta: number): { ano: number; mes: number } {
  const indice = ano * 12 + mes + delta;

  return { ano: Math.floor(indice / 12), mes: ((indice % 12) + 12) % 12 };
}

/** Todos os dias de um mês (`mes` de 0 a 11), pintados pela regra da sequência. */
export function diasDoMes(
  ano: number,
  mes: number,
  treinos: readonly Treino[],
  sessoes: readonly Sessao[],
  hoje: string,
  marcas: MarcasDosDias = {},
): MesDoCalendario {
  const totalDias = new Date(ano, mes + 1, 0).getDate();
  const primeiro = primeiroDiaRegistrado(sessoes);
  const dias: DiaDoCalendario[] = [];
  let treinosNoMes = 0;

  for (let dia = 1; dia <= totalDias; dia++) {
    const chave = chaveDe(ano, mes, dia);
    const ehHoje = chave === hoje;
    let estado: EstadoDoCalendario;
    const fracao = chave > hoje ? null : fracaoDoDia(treinos, sessoes, chave);

    if (chave > hoje) {
      estado = 'futuro';
    } else {
      if (fracao !== null && fracao >= MINIMO_PARCIAL) {
        treinosNoMes++;
      }

      if (fracao === null && !ehHoje && (primeiro === null || chave < primeiro)) {
        estado = 'vazio';
      } else if (ehHoje && (fracao ?? 0) < MINIMO_PARCIAL) {
        estado = ehDescanso(treinos, [], chave) ? 'descanso' : 'hoje';
      } else {
        estado = estadoDoDiaPassado(treinos, chave, fracao, marcas[chave]);
      }
    }

    dias.push({ chave, dia, estado, hoje: ehHoje, fracao });
  }

  const indice = ano * 12 + mes;

  return {
    ano,
    mes,
    titulo: `${NOME_MES[mes]} de ${ano}`,
    deslocamento: new Date(ano, mes, 1).getDay(),
    dias,
    treinos: treinosNoMes,
    temAnterior: primeiro !== null && indice > indiceDoMes(primeiro),
    temProximo: indice < indiceDoMes(hoje),
  };
}

/** "1 dia de treino neste mês", "12 dias de treino neste mês" */
export function textoTreinosNoMes(treinos: number): string {
  return treinos === 1 ? '1 dia de treino neste mês' : `${treinos} dias de treino neste mês`;
}

const DESCRICAO_CALENDARIO: Record<EstadoDoCalendario, string> = {
  completo: 'treino completo',
  parcial: 'treino parcial',
  fraco: 'pouco ou nada feito',
  descanso: 'descanso',
  congelado: 'congelado, a sequência seguiu',
  hoje: 'hoje, ainda sem treino',
  futuro: 'ainda não chegou',
  vazio: 'sem registro',
};

/** "7 de outubro, treino completo, 100% do treino feito" */
export function rotuloDoDiaDoCalendario(dia: DiaDoCalendario, mes: number): string {
  const descricao = DESCRICAO_CALENDARIO[dia.estado];
  const prefixo = dia.hoje && dia.estado !== 'hoje' ? 'hoje, ' : '';
  const feito = dia.fracao === null ? '' : `, ${Math.round(dia.fracao * 100)}% do treino feito`;

  return `${dia.dia} de ${NOME_MES[mes]}, ${prefixo}${descricao}${feito}`;
}

/**
 * Meses que o calendário mostra, do mês do primeiro treino até o de hoje
 * (só o de hoje sem histórico). Ordem do mais antigo para o mais novo.
 */
export function mesesDoCalendario(
  sessoes: readonly Sessao[],
  hoje: string,
): { ano: number; mes: number }[] {
  const primeiro = primeiroDiaRegistrado(sessoes);
  const fim = indiceDoMes(hoje);
  const inicio = primeiro === null || primeiro > hoje ? fim : indiceDoMes(primeiro);

  return Array.from({ length: fim - inicio + 1 }, (_, n) => ({
    ano: Math.floor((inicio + n) / 12),
    mes: (inicio + n) % 12,
  }));
}

// ---------------------------------------------------------------------------
// Marcos e frases
// ---------------------------------------------------------------------------

export const MARCOS = [7, 30, 100, 250, 365] as const;

export type Marco = {
  dias: number;
  /** Já chegou lá alguma vez (pelo recorde). */
  alcancado: boolean;
};

export type ProximoMarco = {
  dias: number;
  faltam: number;
  /** De 0 a 1: quanto da sequência atual já anda até ele. */
  fracao: number;
};

/** Os marcos (alcançados pelo recorde) e o próximo a partir da sequência atual. */
export function marcos(
  sequenciaAtual: number,
  recorde: number,
): { lista: Marco[]; proximo: ProximoMarco | null } {
  const melhor = Math.max(sequenciaAtual, recorde);
  const lista = MARCOS.map((dias) => ({ dias, alcancado: melhor >= dias }));
  const alvo = MARCOS.find((dias) => dias > sequenciaAtual);

  return {
    lista,
    proximo:
      alvo === undefined
        ? null
        : { dias: alvo, faltam: alvo - sequenciaAtual, fracao: sequenciaAtual / alvo },
  };
}

/** "faltam 12 dias para 30", "falta 1 dia para 7" */
export function textoDoProximoMarco(proximo: ProximoMarco): string {
  return proximo.faltam === 1
    ? `falta 1 dia para ${proximo.dias}`
    : `faltam ${proximo.faltam} dias para ${proximo.dias}`;
}

/** Frase de incentivo embaixo do número, muda com o tamanho da sequência. */
export function fraseDaSequencia(dias: number): string {
  if (dias <= 0) {
    return 'bora começar hoje';
  }

  if (dias === 1) {
    return 'começou bem';
  }

  if (dias < 7) {
    return 'pegando o ritmo';
  }

  if (dias < 14) {
    return 'uma semana inteira';
  }

  if (dias < 30) {
    return 'virou hábito';
  }

  if (dias < 100) {
    return 'mais de um mês sem parar';
  }

  if (dias < 365) {
    return 'ninguém te para';
  }

  return 'um ano inteiro, lenda';
}

/** "dia de sequência" ou "dias de sequência", embaixo do número. */
export function rotuloDiasSeguidos(dias: number): string {
  return dias === 1 ? 'dia de sequência' : 'dias de sequência';
}

/** Linha do treino de hoje no cartão de compartilhar: "treino A: 5 de 6 exercícios". */
export function resumoDoTreinoDeHoje(
  treinos: readonly Treino[],
  sessoes: readonly Sessao[],
  hoje: string,
): string | null {
  const detalhe = detalheDoDia(treinos, sessoes, hoje);

  if (!detalhe || detalhe.feitos === 0) {
    return null;
  }

  const exercicios =
    detalhe.total > 0
      ? `${detalhe.feitos} de ${detalhe.total} exercícios`
      : `${detalhe.feitos} exercícios`;

  return `${detalhe.treino}: ${exercicios}`;
}
