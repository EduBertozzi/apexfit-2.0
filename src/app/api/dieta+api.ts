import Anthropic from '@anthropic-ai/sdk';

import { pedidoDietaSchema } from '@/features/dieta/contrato';
import { calcularNecessidades } from '@/features/nutricao/calculos';
import { montarPromptDieta } from '@/features/dieta/prompt';
import { gerarDieta } from '@/features/dieta/servidor/gerarDieta';
import { gerarPlanoComIa } from '@/features/dieta/servidor/gerarDietaLocal';
import { ErroServidor } from '@/shared/servidor/claude';
import { erroSemIa, escolherProvedor } from '@/shared/servidor/provedor';

/** POST /api/dieta: recebe o perfil (e o dia, se for o plano de um dia só), devolve { plano, provedor }. Só repassa; a lógica fica na feature. */
export async function POST(request: Request) {
  const pedido = pedidoDietaSchema.safeParse(await request.json().catch(() => null));

  if (!pedido.success) {
    return Response.json({ erro: 'perfil incompleto ou inválido.' }, { status: 400 });
  }

  try {
    const provedor = await escolherProvedor();

    if (provedor === 'nenhum') {
      throw erroSemIa();
    }

    const plano =
      provedor === 'claude'
        ? await gerarDieta(pedido.data)
        : await gerarPlanoComIa(
            provedor,
            montarPromptDieta(pedido.data.perfil, pedido.data),
            calcularNecessidades(pedido.data.perfil)?.metaCalorias,
          );

    return Response.json({ plano, provedor });
  } catch (erro) {
    if (erro instanceof ErroServidor) {
      return erro.paraResposta();
    }

    if (erro instanceof Anthropic.RateLimitError) {
      return Response.json({ erro: 'muitos pedidos agora. tente em um minuto.' }, { status: 429 });
    }

    console.error('[api/dieta]', erro);

    return Response.json({ erro: 'não deu para gerar a dieta agora.' }, { status: 502 });
  }
}
