import Anthropic from '@anthropic-ai/sdk';
import { betaZodTool } from '@anthropic-ai/sdk/helpers/beta/zod';

import { planoDietaSchema } from '@/features/dieta/contrato';
import { FALLBACK, MODELO_CLAUDE, obterCliente } from '@/shared/servidor/claude';

import type { EventoCoach, PedidoCoach } from '../contrato';
import { paraMensagensApi } from '../mensagens';
import { ORIENTACAO_FERRAMENTA_DIETA, SISTEMA_COACH } from '../prompt';

/** Roda SÓ no servidor (rota /api/coach). */

class EntradaCortada extends Error {}

/**
 * Conversa com o coach em streaming. Devolve eventos para a rota repassar:
 * pedaços de texto conforme chegam e, se o coach mexer na dieta, o plano novo.
 */
export async function* conversar(pedido: PedidoCoach): AsyncGenerator<EventoCoach> {
  const cliente = obterCliente();

  // A ferramenta roda dentro do loop do SDK; os eventos que ela gera esperam aqui
  const pendentes: EventoCoach[] = [];

  const atualizarDieta = {
    ...betaZodTool({
      name: 'atualizar_dieta',
      description: ORIENTACAO_FERRAMENTA_DIETA,
      inputSchema: planoDietaSchema,
      run: async (plano) => {
        pendentes.push({ tipo: 'dieta', plano });

        return 'Plano salvo no app do usuário. Agora explique em poucas frases o que mudou.';
      },
    }),
    eager_input_streaming: true,
  };

  let runner = cliente.beta.messages.toolRunner({
    model: MODELO_CLAUDE,
    max_tokens: 32000,
    ...FALLBACK,
    betas: [...FALLBACK.betas],
    output_config: { effort: 'medium' },
    // Cacheia o histórico entre mensagens da mesma conversa
    cache_control: { type: 'ephemeral' },
    system: [
      { type: 'text', text: SISTEMA_COACH, cache_control: { type: 'ephemeral' } },
      { type: 'text', text: `Dados do usuário, atualizados agora:\n\n${pedido.contexto}` },
    ],
    tools: [atualizarDieta],
    messages: paraMensagensApi(pedido.mensagens),
    stream: true,
  });

  for (let tentativa = 0; ; tentativa++) {
    try {
      for await (const mensagemStream of runner) {
        yield* pendentes.splice(0);

        for await (const evento of mensagemStream) {
          if (evento.type === 'content_block_delta' && evento.delta.type === 'text_delta') {
            yield { tipo: 'texto', texto: evento.delta.text };
          }
        }

        const mensagem = await mensagemStream.finalMessage();
        tentativa = 0;

        const temFerramenta = mensagem.content.some((bloco) => bloco.type === 'tool_use');

        if (mensagem.stop_reason === 'max_tokens' && temFerramenta) {
          throw new EntradaCortada();
        }

        if (mensagem.stop_reason === 'refusal') {
          yield {
            tipo: 'erro',
            mensagem: 'Não consigo ajudar com isso. Se for algo de saúde, procure um profissional.',
          };
          break;
        }
      }

      yield* pendentes.splice(0);
      return;
    } catch (erro) {
      if (erro instanceof EntradaCortada) {
        yield {
          tipo: 'erro',
          mensagem: 'O plano ficou grande demais. Peça uma versão mais simples.',
        };
        return;
      }

      // Só repete quando a IA mandou um JSON de ferramenta ilegível; erro de API sobe
      if (erro instanceof Anthropic.APIError || tentativa >= 2) {
        throw erro;
      }

      runner = cliente.beta.messages.toolRunner({ ...runner.params });
    }
  }
}
