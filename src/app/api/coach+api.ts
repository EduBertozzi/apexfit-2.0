import Anthropic from '@anthropic-ai/sdk';

import { pedidoCoachSchema } from '@/features/coach/contrato';
import { escreverEvento } from '@/features/coach/eventos';
import { conversar } from '@/features/coach/servidor/conversar';
import { conversarLocal } from '@/features/coach/servidor/conversarLocal';
import { erroSemIa, escolherProvedor } from '@/shared/servidor/provedor';

/** POST /api/coach: conversa com o coach. Responde em streaming, uma linha JSON por evento. */
export async function POST(request: Request) {
  const pedido = pedidoCoachSchema.safeParse(await request.json().catch(() => null));

  if (!pedido.success) {
    return Response.json({ erro: 'Mensagem inválida.' }, { status: 400 });
  }

  // Decide a IA antes de abrir o stream, para o app receber o erro certo
  const provedor = await escolherProvedor();

  if (provedor === 'nenhum') {
    return erroSemIa().paraResposta();
  }

  const conversa = provedor === 'claude' ? conversar : conversarLocal;

  const codificador = new TextEncoder();

  const corpo = new ReadableStream<Uint8Array>({
    async start(controle) {
      const enviar = (texto: string) => controle.enqueue(codificador.encode(texto));

      try {
        for await (const evento of conversa(pedido.data)) {
          enviar(escreverEvento(evento));
        }
      } catch (erro) {
        const mensagem =
          erro instanceof Anthropic.RateLimitError
            ? 'Muita gente falando com o coach agora. Tente em um minuto.'
            : 'O coach caiu no meio da resposta. Tente de novo.';

        console.error('[api/coach]', erro);
        enviar(escreverEvento({ tipo: 'erro', mensagem }));
      } finally {
        enviar(escreverEvento({ tipo: 'fim' }));
        controle.close();
      }
    },
  });

  return new Response(corpo, {
    headers: {
      'Content-Type': 'application/x-ndjson; charset=utf-8',
      'Cache-Control': 'no-cache',
    },
  });
}
