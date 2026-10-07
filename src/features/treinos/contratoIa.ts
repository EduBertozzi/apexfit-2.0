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

export const pedidoTreinoIaSchema = z.object({
  perfil: pedidoDietaSchema.shape.perfil,
  preferencias: preferenciasTreinoSchema,
});

export type PedidoTreinoIa = z.infer<typeof pedidoTreinoIaSchema>;

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
    .describe('Só número ou faixa: "10" ou "8 a 12". Em aquecimento e cardio, os minutos: "10".'),
  observacao: z
    .string()
    .optional()
    .describe('Dica curta de execução ou a duração, ex: "10 minutos em ritmo leve".'),
});

export const treinoIaSchema = z.object({
  nome: z.string().describe('Treino A, Treino B, Treino C...'),
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
