import Anthropic from '@anthropic-ai/sdk';

import { pedidoTreinoIaSchema } from '@/features/treinos/contratoIa';
import { montarPromptTreinos } from '@/features/treinos/promptIa';
import { gerarTreinos } from '@/features/treinos/servidor/gerarTreinos';
import { ErroServidor } from '@/shared/servidor/claude';
import { erroSemIa, escolherProvedor } from '@/shared/servidor/provedor';

/** POST /api/treino: perfil + preferências, devolve { resultado, provedor }. Só repassa. */
export async function POST(request: Request) {
  const pedido = pedidoTreinoIaSchema.safeParse(await request.json().catch(() => null));

  if (!pedido.success) {
    return Response.json({ erro: 'Perfil ou preferências inválidos.' }, { status: 400 });
  }

  try {
    const provedor = await escolherProvedor();

    if (provedor === 'nenhum') {
      throw erroSemIa();
    }

    const resultado = await gerarTreinos(
      provedor,
      montarPromptTreinos(pedido.data.perfil, pedido.data.preferencias),
    );

    return Response.json({ resultado, provedor });
  } catch (erro) {
    if (erro instanceof ErroServidor) {
      return erro.paraResposta();
    }

    if (erro instanceof Anthropic.RateLimitError) {
      return Response.json({ erro: 'Muitos pedidos agora. Tente em um minuto.' }, { status: 429 });
    }

    console.error('[api/treino]', erro);

    return Response.json({ erro: 'Não deu para montar os treinos agora.' }, { status: 502 });
  }
}
