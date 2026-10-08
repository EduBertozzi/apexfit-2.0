import { chaveDoDia } from '@/shared/lib/data';

import { progressoDaSessao, treinoDaSessao, treinoDoDia } from './logica';
import type { Sessao, Treino } from './types';
import { minusculaInicial } from '@/shared/lib/texto';

/**
 * Cor de cada dia na faixa da semana (regra do dono do produto):
 * - completo: fez 100% dos exercícios (verde)
 * - parcial: de 50% a menos de 100% (amarelo)
 * - fraco: não treinou ou fez menos de 50% (vermelho)
 * - hoje: o dia de hoje (branco), qualquer que seja o progresso
 * - futuro: dias que ainda não chegaram (cinza)
 * - descanso: dia que já passou e foi descanso (do plano ou folga do rodízio, neutro)
 * - congelado: falta coberta por um congelador (azul gelo), a sequência seguiu
 */
export type EstadoDia =
  'completo' | 'parcial' | 'fraco' | 'hoje' | 'futuro' | 'descanso' | 'congelado';

/** Marca que a regra da sequência (`regraSequencia.ts`) põe num dia que já passou. */
export type MarcaDoDia = 'descanso' | 'congelado';

/** Marcas por dia (AAAA-MM-DD). */
export type MarcasDosDias = Readonly<Record<string, MarcaDoDia>>;

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

export function somarDias(chave: string, dias: number): string {
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

  const treino = treinoDaSessao(treinos, sessao);

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

  const treino = treinoDaSessao(treinos, sessao);

  if (!treino) {
    return { treino: 'treino apagado', feitos: sessao.concluidos.length, total: 0 };
  }

  const { feitos, total } = progressoDaSessao(sessao, treino);

  return { treino: minusculaInicial(treino.nome), feitos, total };
}

/** Cor de um dia que já passou, pelo quanto foi feito. */
export function estadoPelaFracao(fracao: number | null): 'completo' | 'parcial' | 'fraco' {
  if (fracao === null || fracao < MINIMO_PARCIAL) {
    return 'fraco';
  }

  return fracao >= 1 ? 'completo' : 'parcial';
}

/** O plano semanal manda descansar neste dia? (sem plano, nunca é descanso) */
export function ehDescanso(
  treinos: readonly Treino[],
  sessoes: readonly Sessao[],
  chave: string,
): boolean {
  return treinoDoDia(treinos, sessoes, chave).descanso;
}

/** Algum treino tem esse dia da semana marcado no plano? */
function temTreinoMarcado(treinos: readonly Treino[], chave: string): boolean {
  const dia = diaDaSemana(chave);

  return treinos.some((treino) => treino.dias?.includes(dia));
}

/**
 * Como um dia passado aparece: a marca da regra da sequência (descanso ou
 * congelado) vale primeiro; sem marca, descanso do plano sem treino. Dia sem
 * nada registrado só fica vermelho se tinha treino marcado para ele; senão a
 * cor é pelo quanto foi feito.
 */
export function estadoDoDiaPassado(
  treinos: readonly Treino[],
  chave: string,
  fracao: number | null,
  marca: MarcaDoDia | undefined,
): 'completo' | 'parcial' | 'fraco' | 'descanso' | 'congelado' {
  if (marca === 'congelado') {
    return 'congelado';
  }

  if ((fracao ?? 0) < MINIMO_PARCIAL && (marca === 'descanso' || ehDescanso(treinos, [], chave))) {
    return 'descanso';
  }

  if (fracao === null && !temTreinoMarcado(treinos, chave)) {
    return 'descanso';
  }

  return estadoPelaFracao(fracao);
}

/** Como um dia aparece na faixa: cor pelo quanto foi feito, hoje, futuro, descanso ou congelado. */
function diaDaFaixa(
  treinos: readonly Treino[],
  sessoes: readonly Sessao[],
  chave: string,
  hoje: string,
  marcas: MarcasDosDias,
): DiaDaSemana {
  const futuro = chave > hoje;
  const fracao = futuro ? null : fracaoDoDia(treinos, sessoes, chave);
  const detalhe = futuro ? null : detalheDoDia(treinos, sessoes, chave);
  const estado: EstadoDia =
    chave === hoje
      ? 'hoje'
      : futuro
        ? 'futuro'
        : estadoDoDiaPassado(treinos, chave, fracao, marcas[chave]);

  return {
    chave,
    sigla: SIGLAS_DIA[diaDaSemana(chave)],
    dia: Number(chave.slice(8)),
    estado,
    fracao,
    detalhe,
  };
}

/** Os 7 dias da semana atual, de domingo a sábado. */
export function diasDaSemana(
  treinos: readonly Treino[],
  sessoes: readonly Sessao[],
  hoje: string,
  marcas: MarcasDosDias = {},
): DiaDaSemana[] {
  return diasDaFaixa(treinos, sessoes, hoje, 0, 0, marcas);
}

/**
 * Dias da faixa rolável: a semana atual mais `antes` semanas para trás e
 * `depois` para frente, sempre de domingo a sábado.
 */
export function diasDaFaixa(
  treinos: readonly Treino[],
  sessoes: readonly Sessao[],
  hoje: string,
  antes = 1,
  depois = 1,
  marcas: MarcasDosDias = {},
): DiaDaSemana[] {
  const domingo = somarDias(hoje, -diaDaSemana(hoje) - 7 * antes);
  const total = 7 * (antes + 1 + depois);

  return Array.from({ length: total }, (_, indice) =>
    diaDaFaixa(treinos, sessoes, somarDias(domingo, indice), hoje, marcas),
  );
}

const DESCRICAO_ESTADO: Record<EstadoDia, string> = {
  completo: 'treino completo',
  parcial: 'treino parcial',
  fraco: 'pouco ou nada feito',
  hoje: 'hoje',
  futuro: 'ainda não chegou',
  descanso: 'dia de descanso',
  congelado: 'congelado, a sequência seguiu',
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
    ...(contar('descanso') > 0 ? [`${contar('descanso')} de descanso`] : []),
    ...(contar('congelado') > 0 ? [`${contar('congelado')} congelado`] : []),
  ];
  const detalhe = dias
    .map(
      (dia) =>
        `${NOME_DIA[SIGLAS_DIA.indexOf(dia.sigla)]} ${dia.dia}, ${DESCRICAO_ESTADO[dia.estado]}`,
    )
    .join('; ');

  return `Sua semana: ${partes.join(', ')}. ${detalhe}.`;
}

/** "3 dias de sequência" (treinos e descansos contam; ver `regraSequencia.ts`). */
export function textoSequencia(dias: number): string {
  if (dias === 0) {
    return 'nenhum dia de sequência ainda';
  }

  return dias === 1 ? '1 dia de sequência' : `${dias} dias de sequência`;
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

  const feito = dia.detalhe ? `, ${porcentagem(dia.fracao)}% do treino feito` : '';

  if (dia.estado === 'descanso') {
    return `${inicio}, dia de descanso${feito}`;
  }

  if (dia.estado === 'congelado') {
    return `${inicio}, congelado, a sequência seguiu${feito}`;
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

  if (dia.estado === 'descanso') {
    return `${nome}: descanso`;
  }

  if (dia.estado === 'congelado') {
    return `${nome}: congelado, a sequência seguiu`;
  }

  if (!dia.detalhe) {
    return dia.estado === 'hoje' ? `${nome}: ainda sem treino` : `${nome}: sem treino`;
  }

  const { treino, feitos, total } = dia.detalhe;
  const exercicios = total > 0 ? `${feitos} de ${total} exercícios` : `${feitos} exercícios`;

  return `${nome}: ${treino}, ${exercicios}`;
}
