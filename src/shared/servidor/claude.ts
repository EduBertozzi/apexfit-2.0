import Anthropic from '@anthropic-ai/sdk';

/**
 * Cliente do Claude para as rotas de servidor (src/app/api/*).
 * Roda SÓ no servidor: a chave ANTHROPIC_API_KEY vem do ambiente e nunca vai
 * para o app. Nunca importe isto de uma tela ou componente.
 */

export const MODELO_CLAUDE = 'claude-opus-5-5';

/** Se o modelo recusar por política, a API refaz o pedido num modelo reserva. */
export const FALLBACK = {
  betas: ['server-side-fallback-2026-07-01'],
  fallbacks: 'default',
} as const;

export class ErroServidor extends Error {
  constructor(
    message: string,
    /** Status HTTP que a rota deve devolver. */
    readonly status: number,
  ) {
    super(message);
  }
}

let cliente: Anthropic | null = null;

export function obterCliente(): Anthropic {
  if (!process.env.ANTHROPIC_API_KEY) {
    throw new ErroServidor('Servidor sem ANTHROPIC_API_KEY configurada.', 503);
  }

  cliente ??= new Anthropic();

  return cliente;
}
