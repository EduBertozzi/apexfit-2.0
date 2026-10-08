import Anthropic from '@anthropic-ai/sdk';
import { betaZodTool } from '@anthropic-ai/sdk/helpers/beta/zod';

import { planoDietaSchema } from '@/features/dieta/contrato';
import { mesclarPlano } from '@/features/dieta/mesclar';
import { respostaTreinosIaSchema } from '@/features/treinos/contratoIa';
import { FALLBACK, MODELO_CLAUDE, obterCliente } from '@/shared/servidor/claude';

import type { EventoCoach, PedidoCoach } from '../contrato';
import { alvoDaDieta } from '../alvos';
import { diasCitados, diasDoAjusteDeTreino, modoDoTreino } from '../intencao';
import { paraMensagensApi } from '../mensagens';
import {
  ORIENTACAO_FERRAMENTA_DIETA,
  ORIENTACAO_FERRAMENTA_TREINOS,
  SISTEMA_COACH,
} from '../prompt';

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
  const ultima = pedido.mensagens[pedido.mensagens.length - 1].texto;

  const atualizarDieta = {
    ...betaZodTool({
      name: 'atualizar_dieta',
      description: ORIENTACAO_FERRAMENTA_DIETA,
      inputSchema: planoDietaSchema,
      run: async (plano) => {
        // Pedido pequeno ("troca o café da manhã", "o almoço de quarta"): o resto volta igual
        const { modo, alvos, dias, atual } = alvoDaDieta(pedido, ultima);

        pendentes.push({
          tipo: 'dieta',
          plano: modo === 'ajuste' ? mesclarPlano(atual, plano, alvos) : plano,
          modo,
          ...(alvos.length > 0 ? { refeicoes: alvos } : {}),
          ...(dias.length > 0 ? { dias } : {}),
        });

        return 'Proposta enviada ao app: a pessoa decide se aplica. Agora explique em poucas frases o que mudou, sem dizer que já salvou.';
      },
    }),
    eager_input_streaming: true,
  };

  const atualizarTreinos = {
    ...betaZodTool({
      name: 'atualizar_treinos',
      description: ORIENTACAO_FERRAMENTA_TREINOS,
      inputSchema: respostaTreinosIaSchema,
      run: async (resultado) => {
        // O app junta com os treinos salvos: no ajuste, só o pedido (e o dia citado) muda
        const modo = modoDoTreino(ultima, (pedido.treinosAtuais ?? []).length > 0);
        const diasAlvo = modo === 'ajuste' ? diasDoAjusteDeTreino(ultima) : [];
        const diasPedidos = modo === 'novo' ? diasCitados(ultima) : [];

        pendentes.push({
          tipo: 'treinos',
          resultado,
          modo,
          ...(diasAlvo.length > 0 ? { diasAlvo } : {}),
          ...(diasPedidos.length > 0 ? { diasPedidos } : {}),
        });

        return 'Proposta enviada ao app: a pessoa decide se aplica. Agora explique em poucas frases o que mudou, sem dizer que já salvou.';
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
    tools: [atualizarDieta, atualizarTreinos],
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
