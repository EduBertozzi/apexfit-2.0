import Anthropic from '@anthropic-ai/sdk';

import { pedidoSemanaIaSchema } from '@/features/treinos/contratoIa';
import { montarPromptSemana } from '@/features/treinos/promptIa';
import { gerarTreinos } from '@/features/treinos/servidor/gerarTreinos';
import { ErroServidor } from '@/shared/servidor/claude';
import { erroSemIa, escolherProvedor } from '@/shared/servidor/provedor';

/**
 * POST /api/treino: perfil + escolhas do montador da semana (dias, áreas, regiões,
 * nível, equipamento, evitar, aquecimento). Devolve { resultado, provedor }. Só repassa.
 */
export async function POST(request: Request) {
  const pedido = pedidoSemanaIaSchema.safeParse(await request.json().catch(() => null));

  if (!pedido.success) {
    return Response.json({ erro: 'perfil ou escolhas da semana inválidos.' }, { status: 400 });
  }

  try {
    const provedor = await escolherProvedor();

    if (provedor === 'nenhum') {
      throw erroSemIa();
    }

    const resultado = await gerarTreinos(
      provedor,
      montarPromptSemana(pedido.data.perfil, pedido.data.escolhas),
      'semana',
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
