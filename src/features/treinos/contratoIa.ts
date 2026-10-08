import { z } from 'zod';

import { pedidoDietaSchema } from '@/features/dieta/contrato';
import { PROVEDORES_IA } from '@/shared/lib/semIa';

import type { GrupoMuscular } from './types';

/**
 * Contrato entre o app e a rota /api/treino (treinos montados pela IA).
 * Os dois lados validam com estes schemas.
 */

export const GRUPOS_MUSCULARES = [
  'aquecimento',
  'peito',
  'costas',
  'ombro',
  'braco',
  'perna',
  'abdominal',
  'cardio',
  'outro',
] as const satisfies readonly GrupoMuscular[];

export const DIAS_POR_SEMANA = [2, 3, 4, 5, 6] as const;
export const LOCAIS_TREINO = ['academia', 'casa'] as const;
export const MINUTOS_TREINO = [30, 45, 60, 90] as const;

export type LocalTreino = (typeof LOCAIS_TREINO)[number];
export type MinutosTreino = (typeof MINUTOS_TREINO)[number];

export const preferenciasTreinoSchema = z.object({
  diasPorSemana: z.number().int().min(2).max(6),
  local: z.enum(LOCAIS_TREINO),
  minutos: z.literal(MINUTOS_TREINO),
  /** Pedido livre, ex: "mais glúteo" ou "quero correr uma prova de 5 km". */
  foco: z.string().trim().max(120).optional(),
});

export type PreferenciasTreino = z.infer<typeof preferenciasTreinoSchema>;

// ---------------------------------------------------------------------------
// Montador da semana (central de IA): dias, áreas, regiões e personalização
// ---------------------------------------------------------------------------

/** Áreas que a pessoa escolhe para cada dia (aquecimento é à parte). */
export const AREAS_TREINO = [
  'peito',
  'costas',
  'ombro',
  'braco',
  'perna',
  'abdominal',
  'cardio',
] as const satisfies readonly GrupoMuscular[];

export const NIVEIS_TREINO = ['iniciante', 'intermediario', 'avancado'] as const;
export const EQUIPAMENTOS_TREINO = ['academia', 'halteres', 'corpo'] as const;
export const MEDIDAS_AQUECIMENTO = ['repeticoes', 'tempo'] as const;

export type AreaTreino = (typeof AREAS_TREINO)[number];
export type NivelTreino = (typeof NIVEIS_TREINO)[number];
export type EquipamentoTreino = (typeof EQUIPAMENTOS_TREINO)[number];
export type MedidaAquecimento = (typeof MEDIDAS_AQUECIMENTO)[number];

/** Limites do montador: os mesmos na tela, na validação e no servidor. */
export const LIMITES_MONTADOR = {
  evitar: 200,
  livre: 300,
  itensAquecimento: 6,
  repeticoesAquecimento: { min: 1, max: 100 },
  minutosAquecimento: { min: 1, max: 30 },
  /** Exercícios por dia, sem contar o aquecimento. */
  exerciciosPorDia: { min: 2, max: 12 },
  /** Cardio em circuito: exercícios, segundos de cada um e voltas. */
  circuito: {
    exercicios: { min: 2, max: 8 },
    segundos: { min: 20, max: 90 },
    voltas: { min: 2, max: 6 },
  },
} as const;

export const itemAquecimentoSchema = z.object({
  nome: z.string().trim().min(2).max(60),
  medida: z.enum(MEDIDAS_AQUECIMENTO),
  /** Repetições ou minutos, conforme a medida. */
  valor: z.number().int(),
});

export const areaEscolhidaSchema = z.object({
  area: z.enum(AREAS_TREINO),
  /** Ids de `REGIOES` no catálogo. Vazio: o grupo todo, misturado. */
  regioes: z.array(z.string().trim().min(1).max(20)).max(6),
});

/** Cardio em circuito. Sem o campo no dia, o cardio é contínuo (um aparelho só). */
export const circuitoCardioSchema = z.object({
  exercicios: z
    .number()
    .int()
    .min(LIMITES_MONTADOR.circuito.exercicios.min)
    .max(LIMITES_MONTADOR.circuito.exercicios.max),
  segundos: z
    .number()
    .int()
    .min(LIMITES_MONTADOR.circuito.segundos.min)
    .max(LIMITES_MONTADOR.circuito.segundos.max),
  voltas: z
    .number()
    .int()
    .min(LIMITES_MONTADOR.circuito.voltas.min)
    .max(LIMITES_MONTADOR.circuito.voltas.max),
});

export const diaMontadoSchema = z.object({
  /** 0 = domingo, 6 = sábado. */
  dia: z.number().int().min(0).max(6),
  areas: z.array(areaEscolhidaSchema).max(AREAS_TREINO.length),
  /**
   * Quantos exercícios no dia, sem o aquecimento. Sem o campo: o padrão do
   * nível (`EXERCICIOS_POR_NIVEL` em `montadorIa`), que muda junto com o nível.
   */
  exercicios: z
    .number()
    .int()
    // 1 vale para o dia só de cardio (um aparelho); a força tem o próprio mínimo no montador
    .min(1)
    .max(LIMITES_MONTADOR.exerciciosPorDia.max)
    .optional(),
  /** Cardio em circuito (só vale se o dia tem cardio). Sem o campo: contínuo. */
  circuito: circuitoCardioSchema.optional(),
});

const escolhasSemanaBaseSchema = z.object({
  dias: z.array(diaMontadoSchema).max(7),
  nivel: z.enum(NIVEIS_TREINO),
  equipamento: z.enum(EQUIPAMENTOS_TREINO),
  /** Lesões ou exercícios para evitar, texto livre. */
  evitar: z.string().trim().max(LIMITES_MONTADOR.evitar),
  /** Qualquer outro pedido, texto livre. */
  livre: z.string().trim().max(LIMITES_MONTADOR.livre),
  aquecimento: z.object({
    ativo: z.boolean(),
    itens: z.array(itemAquecimentoSchema).max(LIMITES_MONTADOR.itensAquecimento),
  }),
});

export type ItemAquecimento = z.infer<typeof itemAquecimentoSchema>;
export type AreaEscolhida = z.infer<typeof areaEscolhidaSchema>;
export type DiaMontado = z.infer<typeof diaMontadoSchema>;
export type CircuitoCardio = z.infer<typeof circuitoCardioSchema>;
export type EscolhasSemana = z.infer<typeof escolhasSemanaBaseSchema>;

/**
 * Regras que o formato sozinho não pega (dia repetido, dia sem área, minutos
 * demais). Devolve a mensagem para a tela ou null quando está tudo certo.
 */
export function primeiroErroEscolhas(escolhas: EscolhasSemana): string | null {
  if (escolhas.dias.length === 0) {
    return 'escolha pelo menos um dia de treino.';
  }

  if (new Set(escolhas.dias.map((dia) => dia.dia)).size !== escolhas.dias.length) {
    return 'cada dia da semana só pode aparecer uma vez.';
  }

  if (escolhas.dias.some((dia) => dia.areas.length === 0)) {
    return 'escolha o que treinar em cada dia marcado.';
  }

  if (
    escolhas.dias.some(
      (dia) => new Set(dia.areas.map((area) => area.area)).size !== dia.areas.length,
    )
  ) {
    return 'cada área só pode aparecer uma vez no mesmo dia.';
  }

  const { ativo, itens } = escolhas.aquecimento;

  if (ativo && itens.length === 0) {
    return 'escolha pelo menos um exercício de aquecimento ou desligue o aquecimento.';
  }

  for (const item of itens) {
    const limite =
      item.medida === 'tempo'
        ? LIMITES_MONTADOR.minutosAquecimento
        : LIMITES_MONTADOR.repeticoesAquecimento;

    if (item.valor < limite.min || item.valor > limite.max) {
      return item.medida === 'tempo'
        ? `aquecimento por tempo: de ${limite.min} a ${limite.max} minutos.`
        : `aquecimento por repetições: de ${limite.min} a ${limite.max}.`;
    }
  }

  return null;
}

export const escolhasSemanaSchema = escolhasSemanaBaseSchema.superRefine((escolhas, ctx) => {
  const erro = primeiroErroEscolhas(escolhas);

  if (erro) {
    ctx.addIssue({ code: 'custom', message: erro });
  }
});

/** Pedido do montador da semana para a rota /api/treino. */
export const pedidoSemanaIaSchema = z.object({
  perfil: pedidoDietaSchema.shape.perfil,
  escolhas: escolhasSemanaSchema,
});

export type PedidoSemanaIa = z.infer<typeof pedidoSemanaIaSchema>;

/**
 * O que a IA devolve. Sem limites numéricos aqui (nem todo provedor aceita
 * no formato travado); o app normaliza em `paraDadosTreino`.
 */
export const exercicioIaSchema = z.object({
  nome: z.string().describe('Nome do exercício como se fala em academia no Brasil.'),
  grupo: z
    .enum(GRUPOS_MUSCULARES)
    .describe('Grupo do exercício. Aquecimento e cardio também são grupos.'),
  series: z.number().int().describe('Número de séries, de 1 a 6.'),
  repeticoes: z
    .string()
    .describe(
      'Só número ou faixa: "10" ou "8 a 12". Por tempo (cardio, bike, esteira ou aquecimento por tempo), os minutos com a unidade: "5 min". No circuito de cardio, os segundos com a unidade: "40 s".',
    ),
  observacao: z
    .string()
    .optional()
    .describe('Dica curta de execução ou a duração, ex: "10 minutos em ritmo leve".'),
});

export const treinoIaSchema = z.object({
  nome: z.string().describe('Nome do treino, ex: treino de segunda ou Treino A.'),
  foco: z.string().describe('Ex: Peito, ombro e tríceps'),
  exercicios: z.array(exercicioIaSchema),
});

export const respostaTreinosIaSchema = z.object({
  resumo: z.string().describe('Duas ou três frases explicando a divisão dos treinos.'),
  treinos: z.array(treinoIaSchema),
});

export type ExercicioIa = z.infer<typeof exercicioIaSchema>;
export type TreinoIa = z.infer<typeof treinoIaSchema>;
export type RespostaTreinosIa = z.infer<typeof respostaTreinosIaSchema>;

/** Resposta da rota: os treinos e qual IA montou. */
export const respostaRotaTreinoSchema = z.object({
  resultado: respostaTreinosIaSchema,
  provedor: z.enum(PROVEDORES_IA),
});
