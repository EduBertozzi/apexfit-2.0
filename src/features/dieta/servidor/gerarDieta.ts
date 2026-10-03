import Anthropic from '@anthropic-ai/sdk';
import { betaZodOutputFormat } from '@anthropic-ai/sdk/helpers/beta/zod';

import { planoDietaSchema, type PedidoDieta, type PlanoDieta } from '../contrato';
import { montarPromptDieta, SISTEMA_DIETA } from '../prompt';

/**
 * Roda SÓ no servidor (rota /api/dieta). Nunca importe isto de uma tela:
 * a chave ANTHROPIC_API_KEY vem do ambiente do servidor e não pode ir para o app.
 */

export const MODELO_DIETA = 'claude-opus-5-5';

export class ErroDieta extends Error {
  constructor(
    message: string,
    /** Status HTTP que a rota deve devolver. */
    readonly status: number,
  ) {
    super(message);
  }
}

let cliente: Anthropic | null = null;

function obterCliente(): Anthropic {
  if (!process.env.ANTHROPIC_API_KEY) {
    throw new ErroDieta('Servidor sem ANTHROPIC_API_KEY configurada.', 503);
  }

  cliente ??= new Anthropic();

  return cliente;
}

export async function gerarDieta({ perfil }: PedidoDieta): Promise<PlanoDieta> {
  const resposta = await obterCliente().beta.messages.parse({
    model: MODELO_DIETA,
    max_tokens: 16000,
    // Se o modelo recusar por política, a API refaz o pedido num modelo reserva
    betas: ['server-side-fallback-2026-07-01'],
    fallbacks: 'default',
    system: SISTEMA_DIETA,
    messages: [{ role: 'user', content: montarPromptDieta(perfil) }],
    output_config: {
      effort: 'medium',
      format: betaZodOutputFormat(planoDietaSchema),
    },
  });

  if (resposta.stop_reason === 'refusal') {
    throw new ErroDieta('A IA não conseguiu montar este plano. Revise as restrições.', 422);
  }

  if (!resposta.parsed_output) {
    throw new ErroDieta('A IA devolveu um plano incompleto. Tente de novo.', 502);
  }

  return resposta.parsed_output;
}
