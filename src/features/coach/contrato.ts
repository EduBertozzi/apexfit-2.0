import { z } from 'zod';

import { planoDietaSchema } from '@/features/dieta/contrato';
import { respostaTreinosIaSchema } from '@/features/treinos/contratoIa';

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
} as const;

export const mensagemCoachSchema = z.object({
  papel: z.enum(['usuario', 'coach']),
  texto: z
    .string()
    .min(1)
    .max(LIMITES_COACH.texto * 4),
});

export type MensagemCoach = z.infer<typeof mensagemCoachSchema>;

export const pedidoCoachSchema = z.object({
  mensagens: z
    .array(mensagemCoachSchema)
    .min(1)
    .max(LIMITES_COACH.historico)
    .refine((lista) => lista[lista.length - 1].papel === 'usuario', {
      message: 'A última mensagem precisa ser do usuário.',
    }),
  contexto: z.string().max(LIMITES_COACH.contexto),
});

export type PedidoCoach = z.infer<typeof pedidoCoachSchema>;

export const eventoCoachSchema = z.discriminatedUnion('tipo', [
  z.object({ tipo: z.literal('texto'), texto: z.string() }),
  z.object({ tipo: z.literal('dieta'), plano: planoDietaSchema }),
  /** O coach montou treinos novos: o app troca os treinos salvos. */
  z.object({ tipo: z.literal('treinos'), resultado: respostaTreinosIaSchema }),
  z.object({ tipo: z.literal('erro'), mensagem: z.string() }),
  z.object({ tipo: z.literal('fim') }),
]);

export type EventoCoach = z.infer<typeof eventoCoachSchema>;
