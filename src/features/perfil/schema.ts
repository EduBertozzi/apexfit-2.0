import { z } from 'zod';

import { paraDecimal, paraInteiro } from '@/shared/lib/numero';

import type { NivelAtividade, Objetivo, Perfil, Sexo } from './types';

export const SEXOS = ['masculino', 'feminino'] as const satisfies readonly Sexo[];
export const NIVEIS_ATIVIDADE = [
  'sedentario',
  'leve',
  'moderado',
  'alto',
  'atleta',
] as const satisfies readonly NivelAtividade[];
export const OBJETIVOS = ['perder', 'manter', 'ganhar'] as const satisfies readonly Objetivo[];

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
      ctx.addIssue({ code: 'custom', message: `informe ${opcoes.rotulo}` });
      return z.NEVER;
    }

    const valor = opcoes.inteiro ? paraInteiro(texto) : paraDecimal(texto);

    if (valor === null) {
      const formato = opcoes.inteiro ? 'um número inteiro' : 'um número';
      ctx.addIssue({ code: 'custom', message: `digite ${formato}, ex: ${opcoes.exemplo}` });
      return z.NEVER;
    }

    if (valor < opcoes.min || valor > opcoes.max) {
      ctx.addIssue({
        code: 'custom',
        message: `deve estar entre ${opcoes.min} e ${opcoes.max} ${opcoes.unidade}`,
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

/** Campo de múltipla escolha: o formulário guarda '' até o usuário tocar numa opção. */
function campoEscolha<T extends string>(valores: readonly T[], mensagem: string) {
  return z.string().transform((texto, ctx) => {
    if (!(valores as readonly string[]).includes(texto)) {
      ctx.addIssue({ code: 'custom', message: mensagem });
      return z.NEVER;
    }

    return texto as T;
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
    .min(LIMITES.nome.min, 'informe seu nome')
    .max(LIMITES.nome.max, `use no máximo ${LIMITES.nome.max} caracteres`),

  idade: campoNumerico({
    rotulo: 'sua idade',
    ...LIMITES.idade,
    unidade: 'anos',
    inteiro: true,
    exemplo: '17',
  }),

  sexo: campoEscolha(SEXOS, 'escolha uma opção'),

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
    .max(LIMITES.restricoes.max, `use no máximo ${LIMITES.restricoes.max} caracteres`)
    .transform((texto) => (texto === '' ? undefined : texto)),

  nivelAtividade: campoEscolha(NIVEIS_ATIVIDADE, 'escolha seu nível de atividade'),

  objetivo: campoEscolha(OBJETIVOS, 'escolha seu objetivo'),
}) satisfies z.ZodType<Perfil, FormularioPerfilValores>;

/** O que o formulário guarda enquanto o usuário digita (tudo texto). */
export type FormularioPerfilValores = {
  nome: string;
  idade: string;
  alturaCm: string;
  pesoKg: string;
  percentualGordura: string;
  restricoes: string;
  sexo: string;
  nivelAtividade: string;
  objetivo: string;
};

export const FORMULARIO_VAZIO: FormularioPerfilValores = {
  nome: '',
  idade: '',
  alturaCm: '',
  pesoKg: '',
  percentualGordura: '',
  restricoes: '',
  sexo: '',
  nivelAtividade: '',
  objetivo: '',
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
    sexo: perfil.sexo ?? '',
    nivelAtividade: perfil.nivelAtividade ?? '',
    objetivo: perfil.objetivo ?? '',
  };
}
