import { z } from 'zod';

import { paraDecimal, paraInteiro } from '@/shared/lib/numero';

import type { Perfil } from './types';

// Limites aceitos. Ficam exportados para os testes e as telas usarem os mesmos números.
export const LIMITES = {
  idade: { min: 13, max: 100 },
  alturaCm: { min: 100, max: 250 },
  pesoKg: { min: 30, max: 300 },
  percentualGordura: { min: 3, max: 60 },
  nome: { min: 2, max: 60 },
  restricoes: { max: 500 },
} as const;

type OpcoesNumero = {
  rotulo: string;
  min: number;
  max: number;
  unidade: string;
  inteiro?: boolean;
  exemplo: string;
};

/**
 * Cria a regra de um campo numérico que chega como texto do formulário.
 * Converte, verifica se é número e se está dentro da faixa.
 */
function campoNumerico(opcoes: OpcoesNumero) {
  return z.string().transform((texto, ctx) => {
    if (texto.trim() === '') {
      ctx.addIssue({ code: 'custom', message: `Informe ${opcoes.rotulo}` });
      return z.NEVER;
    }

    const valor = opcoes.inteiro ? paraInteiro(texto) : paraDecimal(texto);

    if (valor === null) {
      const formato = opcoes.inteiro ? 'um número inteiro' : 'um número';
      ctx.addIssue({ code: 'custom', message: `Digite ${formato}, ex: ${opcoes.exemplo}` });
      return z.NEVER;
    }

    if (valor < opcoes.min || valor > opcoes.max) {
      ctx.addIssue({
        code: 'custom',
        message: `Deve estar entre ${opcoes.min} e ${opcoes.max} ${opcoes.unidade}`,
      });
      return z.NEVER;
    }

    return valor;
  });
}

/** Igual a `campoNumerico`, mas vazio é permitido e vira `undefined`. */
function campoNumericoOpcional(opcoes: OpcoesNumero) {
  const obrigatorio = campoNumerico(opcoes);

  return z.string().transform((texto, ctx) => {
    if (texto.trim() === '') {
      return undefined;
    }

    const resultado = obrigatorio.safeParse(texto);

    if (!resultado.success) {
      ctx.addIssue({ code: 'custom', message: resultado.error.issues[0].message });
      return z.NEVER;
    }

    return resultado.data;
  });
}

/**
 * Regras do formulário de perfil.
 * Entrada: textos digitados. Saída: um `Perfil` com números de verdade.
 */
export const perfilSchema = z.object({
  nome: z
    .string()
    .trim()
    .min(LIMITES.nome.min, 'Informe seu nome')
    .max(LIMITES.nome.max, `Use no máximo ${LIMITES.nome.max} caracteres`),

  idade: campoNumerico({
    rotulo: 'sua idade',
    ...LIMITES.idade,
    unidade: 'anos',
    inteiro: true,
    exemplo: '17',
  }),

  alturaCm: campoNumerico({
    rotulo: 'sua altura',
    ...LIMITES.alturaCm,
    unidade: 'cm',
    exemplo: '175',
  }),

  pesoKg: campoNumerico({
    rotulo: 'seu peso',
    ...LIMITES.pesoKg,
    unidade: 'kg',
    exemplo: '70,5',
  }),

  percentualGordura: campoNumericoOpcional({
    rotulo: 'o percentual de gordura',
    ...LIMITES.percentualGordura,
    unidade: '%',
    exemplo: '18',
  }),

  restricoes: z
    .string()
    .trim()
    .max(LIMITES.restricoes.max, `Use no máximo ${LIMITES.restricoes.max} caracteres`)
    .transform((texto) => (texto === '' ? undefined : texto)),
}) satisfies z.ZodType<Perfil, FormularioPerfilValores>;

/** O que o formulário guarda enquanto o usuário digita (tudo texto). */
export type FormularioPerfilValores = {
  nome: string;
  idade: string;
  alturaCm: string;
  pesoKg: string;
  percentualGordura: string;
  restricoes: string;
};

export const FORMULARIO_VAZIO: FormularioPerfilValores = {
  nome: '',
  idade: '',
  alturaCm: '',
  pesoKg: '',
  percentualGordura: '',
  restricoes: '',
};

/** Caminho inverso: transforma um perfil salvo em textos para preencher o formulário de edição. */
export function perfilParaFormulario(perfil: Perfil): FormularioPerfilValores {
  const texto = (valor: number | undefined) =>
    valor === undefined ? '' : String(valor).replace('.', ',');

  return {
    nome: perfil.nome,
    idade: String(perfil.idade),
    alturaCm: texto(perfil.alturaCm),
    pesoKg: texto(perfil.pesoKg),
    percentualGordura: texto(perfil.percentualGordura),
    restricoes: perfil.restricoes ?? '',
  };
}
