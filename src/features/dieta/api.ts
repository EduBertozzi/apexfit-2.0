import type { Perfil } from '@/features/perfil/types';

import { pedidoDietaSchema, respostaDietaSchema, type PlanoDieta } from './contrato';

/**
 * Pede a dieta para o NOSSO servidor (rota /api/dieta), nunca direto para a IA.
 * Em desenvolvimento, o Expo resolve "/api/..." para o servidor do `expo start`.
 */
export async function pedirDieta(perfil: Perfil): Promise<PlanoDieta> {
  const pedido = pedidoDietaSchema.safeParse({ perfil });

  if (!pedido.success) {
    throw new Error('Complete seu perfil (sexo, atividade e objetivo) para gerar a dieta.');
  }

  let resposta: Response;

  try {
    resposta = await fetch('/api/dieta', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(pedido.data),
    });
  } catch {
    throw new Error('Sem conexão com o servidor. Confira sua internet e tente de novo.');
  }

  const corpo: unknown = await resposta.json().catch(() => null);

  if (!resposta.ok) {
    const erro = (corpo as { erro?: unknown } | null)?.erro;

    throw new Error(typeof erro === 'string' ? erro : 'Não deu para gerar a dieta agora.');
  }

  const validado = respostaDietaSchema.safeParse(corpo);

  if (!validado.success) {
    throw new Error('O servidor devolveu um plano em formato inesperado.');
  }

  return validado.data.plano;
}
