import type { Perfil } from '@/features/perfil/types';
import { CODIGO_SEM_IA, SemIa, type ProvedorIa } from '@/shared/lib/semIa';

import {
  pedidoTreinoIaSchema,
  respostaRotaTreinoSchema,
  type PreferenciasTreino,
  type RespostaTreinosIa,
} from './contratoIa';

/**
 * Pede os treinos para o NOSSO servidor (rota /api/treino), nunca direto para a IA.
 * Sem IA no servidor ou sem conexão: lança `SemIa` e o app monta offline.
 */
export async function pedirTreinosIa(
  perfil: Perfil,
  preferencias: PreferenciasTreino,
): Promise<{ resultado: RespostaTreinosIa; provedor: ProvedorIa }> {
  const pedido = pedidoTreinoIaSchema.safeParse({ perfil, preferencias });

  if (!pedido.success) {
    throw new Error('Complete seu perfil (sexo, atividade e objetivo) para montar os treinos.');
  }

  let resposta: Response;

  try {
    resposta = await fetch('/api/treino', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(pedido.data),
    });
  } catch {
    throw new SemIa('Sem conexão com o servidor.');
  }

  const corpo: unknown = await resposta.json().catch(() => null);

  if (!resposta.ok) {
    const { erro, codigo } = (corpo ?? {}) as { erro?: unknown; codigo?: unknown };

    if (codigo === CODIGO_SEM_IA) {
      throw new SemIa();
    }

    throw new Error(typeof erro === 'string' ? erro : 'Não deu para montar os treinos agora.');
  }

  const validado = respostaRotaTreinoSchema.safeParse(corpo);

  if (!validado.success) {
    throw new Error('O servidor devolveu os treinos em formato inesperado.');
  }

  return validado.data;
}
