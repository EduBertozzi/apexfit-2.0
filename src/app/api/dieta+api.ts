import Anthropic from '@anthropic-ai/sdk';

import { pedidoDietaSchema } from '@/features/dieta/contrato';
import { ErroDieta, gerarDieta } from '@/features/dieta/servidor/gerarDieta';

/** POST /api/dieta: recebe o perfil, devolve { plano }. Só repassa; a lógica fica na feature. */
export async function POST(request: Request) {
  const pedido = pedidoDietaSchema.safeParse(await request.json().catch(() => null));

  if (!pedido.success) {
    return Response.json({ erro: 'Perfil incompleto ou inválido.' }, { status: 400 });
  }

  try {
    const plano = await gerarDieta(pedido.data);

    return Response.json({ plano });
  } catch (erro) {
    if (erro instanceof ErroDieta) {
      return Response.json({ erro: erro.message }, { status: erro.status });
    }

    if (erro instanceof Anthropic.RateLimitError) {
      return Response.json({ erro: 'Muitos pedidos agora. Tente em um minuto.' }, { status: 429 });
    }

    console.error('[api/dieta]', erro);

    return Response.json({ erro: 'Não deu para gerar a dieta agora.' }, { status: 502 });
  }
}
