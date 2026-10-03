import type Anthropic from '@anthropic-ai/sdk';

import type { MensagemCoach } from './contrato';

/** O histórico do app vira mensagens da API. A primeira precisa ser do usuário. */
export function paraMensagensApi(mensagens: MensagemCoach[]): Anthropic.Beta.BetaMessageParam[] {
  const primeiraDoUsuario = mensagens.findIndex((mensagem) => mensagem.papel === 'usuario');

  if (primeiraDoUsuario === -1) {
    return [];
  }

  return mensagens.slice(primeiraDoUsuario).map((mensagem) => ({
    role: mensagem.papel === 'usuario' ? 'user' : 'assistant',
    content: mensagem.texto,
  }));
}
