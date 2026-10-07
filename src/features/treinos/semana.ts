import { chaveDoDia } from '@/shared/lib/data';

import { progressoDaSessao } from './logica';
import type { Sessao, Treino } from './types';

/**
 * Cor de cada dia na faixa da semana (regra do dono do produto):
 * - completo: fez 100% dos exercícios (verde)
 * - parcial: de 50% a menos de 100% (amarelo)
 * - fraco: não treinou ou fez menos de 50% (vermelho)
 * - hoje: o dia de hoje (branco), qualquer que seja o progresso
 * - futuro: dias que ainda não chegaram (cinza)
 */
export type EstadoDia = 'completo' | 'parcial' | 'fraco' | 'hoje' | 'futuro';

export type SiglaDia = 'dom' | 'seg' | 'ter' | 'qua' | 'qui' | 'sex' | 'sáb';

export const SIGLAS_DIA: readonly SiglaDia[] = ['dom', 'seg', 'ter', 'qua', 'qui', 'sex', 'sáb'];

/** Nome do dia como aparece no título ("quarta") e no leitor de tela. */
export const NOME_DIA: readonly string[] = [
  'domingo',
  'segunda',
  'terça',
  'quarta',
  'quinta',
  'sexta',
  'sábado',
];

/** A partir de quanto feito o dia conta (amarelo e sequência). */
export const MINIMO_PARCIAL = 0.5;

export type DiaDaSemana = {
  /** AAAA-MM-DD */
  chave: string;
  sigla: SiglaDia;
  /** Dia do mês. */
  dia: number;
  estado: EstadoDia;
  /** De 0 a 1; `null` quando não houve treino nesse dia. */
  fracao: number | null;
  /** O treino do dia, para o resumo ao tocar no dia. `null` sem sessão. */
  detalhe: DetalheDoDia | null;
};

export type DetalheDoDia = {
  treino: string;
  feitos: number;
  /** 0 quando o treino foi apagado depois (sem como saber o total). */
  total: number;
};

function paraData(chave: string): Date {
  return new Date(Number(chave.slice(0, 4)), Number(chave.slice(5, 7)) - 1, Number(chave.slice(8)));
}

function somarDias(chave: string, dias: number): string {
  const data = paraData(chave);

  return chaveDoDia(new Date(data.getFullYear(), data.getMonth(), data.getDate() + dias));
}

/** Índice do dia da semana (0 = domingo). */
export function diaDaSemana(chave: string): number {
  return paraData(chave).getDay();
}

/**
 * A sessão que vale para o dia: a última finalizada; se nenhuma foi finalizada,
 * a última registrada (treino em andamento também conta).
 */
export function sessaoQueVale(sessoes: readonly Sessao[], chave: string): Sessao | null {
  let finalizada: Sessao | null = null;
  let ultima: Sessao | null = null;

  for (const sessao of sessoes) {
    if (sessao.data !== chave) {
      continue;
    }

    ultima = sessao;

    if (sessao.finalizada) {
      finalizada = sessao;
    }
  }

  return finalizada ?? ultima;
}

/**
 * Quanto do treino foi feito no dia, de 0 a 1. `null` se não teve sessão.
 * Se o treino foi apagado depois, a sessão finalizada conta como completa
 * (o histórico não pode piorar por arrumar a ficha).
 */
export function fracaoDoDia(
  treinos: readonly Treino[],
  sessoes: readonly Sessao[],
  chave: string,
): number | null {
  const sessao = sessaoQueVale(sessoes, chave);

  if (!sessao) {
    return null;
  }

  const treino = treinos.find((item) => item.id === sessao.treinoId);

  if (!treino) {
    return sessao.finalizada ? 1 : 0;
  }

  return progressoDaSessao(sessao, treino).fracao;
}

/** Qual treino foi feito no dia e quantos exercícios. */
export function detalheDoDia(
  treinos: readonly Treino[],
  sessoes: readonly Sessao[],
  chave: string,
): DetalheDoDia | null {
  const sessao = sessaoQueVale(sessoes, chave);

  if (!sessao) {
    return null;
  }

  const treino = treinos.find((item) => item.id === sessao.treinoId);

  if (!treino) {
    return { treino: 'treino apagado', feitos: sessao.concluidos.length, total: 0 };
  }

  const { feitos, total } = progressoDaSessao(sessao, treino);

  return { treino: treino.nome, feitos, total };
}

/** Cor de um dia que já passou, pelo quanto foi feito. */
export function estadoPelaFracao(fracao: number | null): 'completo' | 'parcial' | 'fraco' {
  if (fracao === null || fracao < MINIMO_PARCIAL) {
    return 'fraco';
  }

  return fracao >= 1 ? 'completo' : 'parcial';
}

/** Os 7 dias da semana atual, de domingo a sábado. */
export function diasDaSemana(
  treinos: readonly Treino[],
  sessoes: readonly Sessao[],
  hoje: string,
): DiaDaSemana[] {
  const domingo = somarDias(hoje, -diaDaSemana(hoje));

  return SIGLAS_DIA.map((sigla, indice) => {
    const chave = somarDias(domingo, indice);
    const futuro = chave > hoje;
    const fracao = futuro ? null : fracaoDoDia(treinos, sessoes, chave);
    const detalhe = futuro ? null : detalheDoDia(treinos, sessoes, chave);
    const estado: EstadoDia =
      chave === hoje ? 'hoje' : futuro ? 'futuro' : estadoPelaFracao(fracao);

    return { chave, sigla, dia: Number(chave.slice(8)), estado, fracao, detalhe };
  });
}

/**
 * Dias seguidos treinando (pelo menos 50% do treino), contando para trás até hoje.
 * Hoje só entra se já passou de 50%: de manhã, antes do treino, a sequência não zera.
 */
export function sequenciaDeDias(
  treinos: readonly Treino[],
  sessoes: readonly Sessao[],
  hoje: string,
): number {
  const contou = (chave: string) => (fracaoDoDia(treinos, sessoes, chave) ?? 0) >= MINIMO_PARCIAL;

  let total = contou(hoje) ? 1 : 0;
  let dia = somarDias(hoje, -1);

  // Limite de segurança: o histórico guarda no máximo um ano
  for (let n = 0; n < 400 && contou(dia); n++) {
    total++;
    dia = somarDias(dia, -1);
  }

  return total;
}

const DESCRICAO_ESTADO: Record<EstadoDia, string> = {
  completo: 'treino completo',
  parcial: 'treino parcial',
  fraco: 'pouco ou nada feito',
  hoje: 'hoje',
  futuro: 'ainda não chegou',
};

/** "quarta" */
export function nomeDoDia(chave: string): string {
  return NOME_DIA[diaDaSemana(chave)];
}

/** Resumo para o leitor de tela: a faixa colorida vira uma frase. */
export function resumoDaSemana(dias: readonly DiaDaSemana[]): string {
  const passados = dias.filter((dia) => dia.estado !== 'futuro' && dia.estado !== 'hoje');
  const contar = (estado: EstadoDia) => passados.filter((dia) => dia.estado === estado).length;
  const partes = [
    `${contar('completo')} com treino completo`,
    `${contar('parcial')} com treino parcial`,
    `${contar('fraco')} com pouco ou nada feito`,
  ];
  const detalhe = dias
    .map(
      (dia) =>
        `${NOME_DIA[SIGLAS_DIA.indexOf(dia.sigla)]} ${dia.dia}, ${DESCRICAO_ESTADO[dia.estado]}`,
    )
    .join('; ');

  return `Sua semana: ${partes.join(', ')}. ${detalhe}.`;
}

/** "sequência de 3 dias treinando" */
export function textoSequencia(dias: number): string {
  if (dias === 0) {
    return 'nenhum dia seguido treinando ainda';
  }

  return dias === 1 ? '1 dia seguido treinando' : `${dias} dias seguidos treinando`;
}

function porcentagem(fracao: number | null): number {
  return Math.round((fracao ?? 0) * 100);
}

/** Nome do dia por extenso a partir da sigla ("seg" vira "segunda"). */
export function nomePorSigla(sigla: SiglaDia): string {
  return NOME_DIA[SIGLAS_DIA.indexOf(sigla)];
}

/**
 * Rótulo de cada pílula para o leitor de tela:
 * "segunda, 12, 50% do treino feito", "terça, 13, sem treino", "quinta, 15, ainda não chegou".
 */
export function rotuloDoDia(dia: DiaDaSemana): string {
  const inicio = `${nomePorSigla(dia.sigla)}, ${dia.dia}`;

  if (dia.estado === 'futuro') {
    return `${inicio}, ainda não chegou`;
  }

  const prefixo = dia.estado === 'hoje' ? `${inicio}, hoje` : inicio;

  return dia.detalhe
    ? `${prefixo}, ${porcentagem(dia.fracao)}% do treino feito`
    : `${prefixo}, sem treino`;
}

/**
 * Linha que aparece embaixo da faixa ao tocar num dia:
 * "segunda: Treino A, 3 de 6 exercícios", "segunda: descanso".
 */
export function resumoDoDia(dia: DiaDaSemana): string {
  const nome = dia.estado === 'hoje' ? 'hoje' : nomePorSigla(dia.sigla);

  if (dia.estado === 'futuro') {
    return `${nome}: ainda não chegou`;
  }

  if (!dia.detalhe) {
    return dia.estado === 'hoje' ? `${nome}: ainda sem treino` : `${nome}: descanso`;
  }

  const { treino, feitos, total } = dia.detalhe;
  const exercicios = total > 0 ? `${feitos} de ${total} exercícios` : `${feitos} exercícios`;

  return `${nome}: ${treino}, ${exercicios}`;
}
