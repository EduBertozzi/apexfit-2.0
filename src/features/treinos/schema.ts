import { z } from 'zod';

import { paraDecimal, paraInteiro } from '@/shared/lib/numero';

import type { DadosExercicio, Exercicio, Treino } from './types';

// Limites aceitos. Ficam exportados para os testes e as telas usarem os mesmos números.
export const LIMITES = {
  nomeTreino: { max: 30 },
  foco: { max: 60 },
  nomeExercicio: { min: 2, max: 60 },
  series: { min: 1, max: 20 },
  repeticoes: { min: 1, max: 100 },
  cargaKg: { min: 0, max: 500 },
  observacao: { max: 140 },
} as const;

/** Texto opcional: espaços nas pontas saem e vazio vira `undefined`. */
function textoOpcional(max: number) {
  return z
    .string()
    .trim()
    .max(max, `Use no máximo ${max} caracteres`)
    .transform((texto) => (texto === '' ? undefined : texto));
}

// "10", "8 a 12", "8-12" ou "8 até 12". O traço longo do teclado do iPhone também vale.
const PADRAO_REPETICOES = /^(\d+)(?:\s*(?:a|até|ate|-|\u2013|\u2014)\s*(\d+))?$/i;

/**
 * Repetições como texto padronizado: "10" ou "8 a 12".
 * Aceita faixa porque é assim que a maioria das fichas de academia escreve.
 */
const campoRepeticoes = z.string().transform((texto, ctx) => {
  const limpo = texto.trim();

  if (limpo === '') {
    ctx.addIssue({ code: 'custom', message: 'Informe as repetições' });
    return z.NEVER;
  }

  const partes = PADRAO_REPETICOES.exec(limpo);

  if (!partes) {
    ctx.addIssue({ code: 'custom', message: 'Use um número ou uma faixa, ex: 10 ou 8 a 12' });
    return z.NEVER;
  }

  const minimo = Number(partes[1]);
  const maximo = partes[2] === undefined ? undefined : Number(partes[2]);
  const { min, max } = LIMITES.repeticoes;

  if ([minimo, maximo ?? minimo].some((valor) => valor < min || valor > max)) {
    ctx.addIssue({ code: 'custom', message: `Deve estar entre ${min} e ${max} repetições` });
    return z.NEVER;
  }

  if (maximo !== undefined && maximo <= minimo) {
    ctx.addIssue({ code: 'custom', message: 'Na faixa, o segundo número é o maior, ex: 8 a 12' });
    return z.NEVER;
  }

  return maximo === undefined ? String(minimo) : `${minimo} a ${maximo}`;
});

const campoSeries = z.string().transform((texto, ctx) => {
  if (texto.trim() === '') {
    ctx.addIssue({ code: 'custom', message: 'Informe as séries' });
    return z.NEVER;
  }

  const valor = paraInteiro(texto);

  if (valor === null) {
    ctx.addIssue({ code: 'custom', message: 'Digite um número inteiro, ex: 3' });
    return z.NEVER;
  }

  const { min, max } = LIMITES.series;

  if (valor < min || valor > max) {
    ctx.addIssue({ code: 'custom', message: `Deve estar entre ${min} e ${max} séries` });
    return z.NEVER;
  }

  return valor;
});

/** Carga é opcional: exercício com peso do corpo fica em branco. */
const campoCarga = z.string().transform((texto, ctx) => {
  if (texto.trim() === '') {
    return undefined;
  }

  const valor = paraDecimal(texto);

  if (valor === null) {
    ctx.addIssue({ code: 'custom', message: 'Digite um número, ex: 22,5' });
    return z.NEVER;
  }

  const { min, max } = LIMITES.cargaKg;

  if (valor < min || valor > max) {
    ctx.addIssue({ code: 'custom', message: `Deve estar entre ${min} e ${max} kg` });
    return z.NEVER;
  }

  return valor;
});

// ---------------------------------------------------------------------------
// Treino (nome e foco)
// ---------------------------------------------------------------------------

export const treinoSchema = z.object({
  nome: z
    .string()
    .trim()
    .min(1, 'Dê um nome ao treino, ex: Treino A')
    .max(LIMITES.nomeTreino.max, `Use no máximo ${LIMITES.nomeTreino.max} caracteres`),
  foco: textoOpcional(LIMITES.foco.max),
}) satisfies z.ZodType<Pick<Treino, 'nome' | 'foco'>, FormularioTreinoValores>;

export type FormularioTreinoValores = {
  nome: string;
  foco: string;
};

export type DadosFormularioTreino = z.output<typeof treinoSchema>;

export function treinoParaFormulario(treino: Treino): FormularioTreinoValores {
  return { nome: treino.nome, foco: treino.foco ?? '' };
}

// ---------------------------------------------------------------------------
// Exercício
// ---------------------------------------------------------------------------

export const exercicioSchema = z.object({
  nome: z
    .string()
    .trim()
    .min(LIMITES.nomeExercicio.min, 'Informe o nome do exercício')
    .max(LIMITES.nomeExercicio.max, `Use no máximo ${LIMITES.nomeExercicio.max} caracteres`),
  series: campoSeries,
  repeticoes: campoRepeticoes,
  cargaKg: campoCarga,
  observacao: textoOpcional(LIMITES.observacao.max),
}) satisfies z.ZodType<DadosExercicio, FormularioExercicioValores>;

/** O que o formulário guarda enquanto o usuário digita (tudo texto). */
export type FormularioExercicioValores = {
  nome: string;
  series: string;
  repeticoes: string;
  cargaKg: string;
  observacao: string;
};

export const EXERCICIO_VAZIO: FormularioExercicioValores = {
  nome: '',
  series: '3',
  repeticoes: '10',
  cargaKg: '',
  observacao: '',
};

/** Caminho inverso: exercício salvo vira texto para preencher a edição. */
export function exercicioParaFormulario(exercicio: Exercicio): FormularioExercicioValores {
  return {
    nome: exercicio.nome,
    series: String(exercicio.series),
    repeticoes: exercicio.repeticoes,
    cargaKg: exercicio.cargaKg === undefined ? '' : String(exercicio.cargaKg).replace('.', ','),
    observacao: exercicio.observacao ?? '',
  };
}
