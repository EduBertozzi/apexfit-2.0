import { z } from 'zod';

import { NIVEIS_ATIVIDADE, OBJETIVOS, SEXOS } from '@/features/perfil/schema';
import { PROVEDORES_IA } from '@/shared/lib/semIa';

import { preferenciasDietaSchema } from './preferencias';

/**
 * Contrato entre o app e a rota /api/dieta. Os dois lados validam com estes
 * mesmos schemas: o servidor confere o que chega, o app confere o que volta.
 */

/** Perfil completo (com os campos novos obrigatórios) que o app envia. */
export const pedidoDietaSchema = z.object({
  perfil: z.object({
    nome: z.string().min(1).max(60),
    idade: z.number().int().min(13).max(100),
    alturaCm: z.number().min(100).max(250),
    pesoKg: z.number().min(30).max(300),
    percentualGordura: z.number().min(3).max(60).optional(),
    restricoes: z.string().max(500).optional(),
    sexo: z.enum(SEXOS),
    nivelAtividade: z.enum(NIVEIS_ATIVIDADE),
    objetivo: z.enum(OBJETIVOS),
  }),
  /**
   * Sem o campo, o plano vale para a semana toda. Com ele (0 = domingo a
   * 6 = sábado), é o plano só daquele dia ("dieta de sexta").
   */
  dia: z.number().int().min(0).max(6).optional(),
  /** Treino marcado para o dia, se houver (ex: "Treino A, pernas"). Ajuda a IA a ajustar o dia. */
  treinoDoDia: z.string().max(120).optional(),
  /** Plano para os dias de treino ou para os dias de descanso da semana. */
  tipoDia: z.enum(['treino', 'descanso']).optional(),
  /** Opções da central de IA: refeições, estilo, o que tirar, orçamento, preparo e observações. */
  preferencias: preferenciasDietaSchema.optional(),
});

export type PedidoDieta = z.infer<typeof pedidoDietaSchema>;

/** Formato do plano que a IA devolve (structured outputs garante esse JSON). */
export const planoDietaSchema = z.object({
  resumo: z.string().describe('Duas ou três frases explicando a estratégia do plano.'),
  caloriasDia: z.number().int(),
  macros: z.object({
    proteinaG: z.number().int(),
    carboidratoG: z.number().int(),
    gorduraG: z.number().int(),
  }),
  refeicoes: z.array(
    z.object({
      nome: z.string().describe('Ex: Café da manhã'),
      horario: z.string().describe('Horário sugerido no formato 07:00'),
      calorias: z.number().int(),
      itens: z.array(
        z.object({
          alimento: z.string(),
          quantidade: z.string().describe('Em gramas e medida caseira. Ex: 120 g (4 colheres)'),
        }),
      ),
      substituicoes: z
        .array(z.string())
        .describe('Trocas equivalentes para variar. Pode ser vazio.'),
    }),
  ),
  dicas: z.array(z.string()).describe('Três a cinco dicas práticas e curtas.'),
  aviso: z.string().describe('Aviso para consultar nutricionista ou médico.'),
});

export type PlanoDieta = z.infer<typeof planoDietaSchema>;

export const respostaDietaSchema = z.object({
  plano: planoDietaSchema,
  /** Qual IA montou o plano. Opcional: servidores antigos não mandam. */
  provedor: z.enum(PROVEDORES_IA).optional(),
});
