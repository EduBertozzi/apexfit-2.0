import { z } from 'zod';

import { planoDietaSchema } from '@/features/dieta/contrato';
import { SLOTS_REFEICAO } from '@/features/dieta/mesclar';
import { GRUPOS_MUSCULARES, respostaTreinosIaSchema } from '@/features/treinos/contratoIa';

/**
 * Contrato entre o app e a rota /api/coach.
 * O app manda o histórico e um resumo do contexto; o servidor responde em
 * streaming, uma linha JSON por evento (NDJSON).
 */

export const LIMITES_COACH = {
  /** Mensagens do histórico enviadas por pedido. */
  historico: 30,
  texto: 2000,
  contexto: 8000,
  treinos: 12,
  exercicios: 40,
} as const;

export const mensagemCoachSchema = z.object({
  papel: z.enum(['usuario', 'coach']),
  texto: z
    .string()
    .min(1)
    .max(LIMITES_COACH.texto * 4),
});

export type MensagemCoach = z.infer<typeof mensagemCoachSchema>;

const diaSchema = z.number().int().min(0).max(6);

/** Treino como está salvo no aparelho (com ids), para o servidor ajustar só o pedido. */
export const treinoAtualSchema = z.object({
  id: z.string().min(1).max(64),
  nome: z.string().min(1).max(60),
  foco: z.string().max(120).optional(),
  dias: z.array(diaSchema).max(7).optional(),
  exercicios: z
    .array(
      z.object({
        id: z.string().min(1).max(64),
        nome: z.string().min(1).max(80),
        grupo: z.enum(GRUPOS_MUSCULARES).optional(),
        series: z.number().int().min(1).max(50),
        repeticoes: z.string().min(1).max(30),
        cargaKg: z.number().min(0).max(1000).optional(),
        observacao: z.string().max(200).optional(),
      }),
    )
    .max(LIMITES_COACH.exercicios),
});

export type TreinoAtual = z.infer<typeof treinoAtualSchema>;

export const pedidoCoachSchema = z.object({
  mensagens: z
    .array(mensagemCoachSchema)
    .min(1)
    .max(LIMITES_COACH.historico)
    .refine((lista) => lista[lista.length - 1].papel === 'usuario', {
      message: 'A última mensagem precisa ser do usuário.',
    }),
  contexto: z.string().max(LIMITES_COACH.contexto),
  /**
   * Plano da semana salvo hoje (vale em todo dia sem plano próprio): o
   * servidor muda só a refeição pedida ("troca o café da manhã").
   */
  planoAtual: planoDietaSchema.optional(),
  /** Dias com plano próprio ("dieta de sexta"), 0 = domingo. Vai em todo pedido. */
  dietaPorDia: z
    .array(z.object({ dia: diaSchema, plano: planoDietaSchema }))
    .max(7)
    .optional(),
  /** Treinos salvos hoje: o servidor muda só o exercício ou treino pedido. */
  treinosAtuais: z.array(treinoAtualSchema).max(LIMITES_COACH.treinos).optional(),
});

export type PedidoCoach = z.infer<typeof pedidoCoachSchema>;

const modoSchema = z.enum(['novo', 'ajuste']);

export const eventoCoachSchema = z.discriminatedUnion('tipo', [
  z.object({ tipo: z.literal('texto'), texto: z.string() }),
  /**
   * O coach montou uma dieta: o app mostra a proposta e só salva se a pessoa
   * aplicar. `refeicoes`: num ajuste, as únicas refeições que podem mudar.
   */
  z.object({
    tipo: z.literal('dieta'),
    plano: planoDietaSchema,
    modo: modoSchema.optional(),
    refeicoes: z.array(z.enum(SLOTS_REFEICAO)).optional(),
    /** Dias da semana citados ("muda o almoço de quarta"): só eles mudam. Sem o campo, a semana. */
    dias: z.array(diaSchema).max(7).optional(),
  }),
  /**
   * O coach montou ou ajustou treinos: o app mostra a proposta. `diasPedidos`:
   * dias da semana citados no pedido (num conjunto novo).
   */
  z.object({
    tipo: z.literal('treinos'),
    resultado: respostaTreinosIaSchema,
    modo: modoSchema.optional(),
    diasPedidos: z.array(diaSchema).max(7).optional(),
    /** Num ajuste: dias citados ("troca o supino da sexta"). Só o treino desses dias muda. */
    diasAlvo: z.array(diaSchema).max(7).optional(),
  }),
  z.object({ tipo: z.literal('erro'), mensagem: z.string() }),
  z.object({ tipo: z.literal('fim') }),
]);

export type EventoCoach = z.infer<typeof eventoCoachSchema>;
