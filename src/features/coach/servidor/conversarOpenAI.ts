import {
  chatOpenAIStream,
  type FerramentaOpenAI,
  type FerramentaPedida,
  type MensagemOpenAI,
} from '@/shared/servidor/openai';

import type { EventoCoach, PedidoCoach } from '../contrato';
import { pedeMudancaDeDieta, pedeMudancaDeTreino } from '../intencao';
import { SISTEMA_COACH_PEDIDOS } from '../prompt';
import {
  ehFerramentaCoach,
  FERRAMENTAS_COACH,
  montarDietaEConfirmar,
  montarTreinosEConfirmar,
  pedidoDosArgumentos,
} from './acoes';

/**
 * Coach com a OpenAI. Roda SÓ no servidor (rota /api/coach).
 *
 * O texto chega em streaming. As ferramentas recebem só o pedido em uma
 * frase; o plano ou os treinos saem de uma segunda chamada com structured
 * outputs (formato travado), igual ao modo local.
 */

export const FERRAMENTAS_OPENAI: FerramentaOpenAI[] = Object.entries(FERRAMENTAS_COACH).map(
  ([nome, ferramenta]) => ({
    type: 'function',
    function: {
      name: nome,
      description: ferramenta.descricao,
      strict: true,
      parameters: {
        type: 'object',
        properties: {
          pedido: {
            type: 'string',
            description: `O que criar ou mudar, em uma frase. ${ferramenta.exemplo}`,
          },
        },
        required: ['pedido'],
        additionalProperties: false,
      },
    },
  }),
);

function primeiraFerramenta(chamadas: FerramentaPedida[]) {
  const chamada = chamadas.find((item) => ehFerramentaCoach(item.nome));

  return chamada
    ? { nome: chamada.nome, pedido: pedidoDosArgumentos(chamada.argumentos, 'montar do zero') }
    : null;
}

export async function* conversarOpenAI(pedido: PedidoCoach): AsyncGenerator<EventoCoach> {
  const ultima = pedido.mensagens[pedido.mensagens.length - 1].texto;

  // Pedido claro: monta direto, sem gastar uma chamada só para decidir
  if (pedeMudancaDeDieta(ultima)) {
    yield* montarDietaEConfirmar('openai', pedido, ultima, '');
    return;
  }

  if (pedeMudancaDeTreino(ultima)) {
    yield* montarTreinosEConfirmar('openai', pedido, ultima, '');
    return;
  }

  const mensagens: MensagemOpenAI[] = [
    {
      role: 'system',
      content: `${SISTEMA_COACH_PEDIDOS}\n\nDados do usuário, atualizados agora:\n\n${pedido.contexto}`,
    },
    ...pedido.mensagens.map((mensagem): MensagemOpenAI =>
      mensagem.papel === 'usuario'
        ? { role: 'user', content: mensagem.texto }
        : { role: 'assistant', content: mensagem.texto },
    ),
  ];

  let chamadas: FerramentaPedida[] = [];
  let textoAntes = '';

  for await (const pedaco of chatOpenAIStream({
    messages: mensagens,
    tools: FERRAMENTAS_OPENAI,
    maxTokens: 2000,
  })) {
    if ('texto' in pedaco) {
      textoAntes += pedaco.texto;
      yield { tipo: 'texto', texto: pedaco.texto };
    } else {
      chamadas = pedaco.ferramentas;
    }
  }

  const ferramenta = primeiraFerramenta(chamadas);

  if (ferramenta?.nome === 'atualizar_dieta') {
    yield* montarDietaEConfirmar('openai', pedido, ferramenta.pedido, textoAntes);
  } else if (ferramenta?.nome === 'atualizar_treinos') {
    yield* montarTreinosEConfirmar('openai', pedido, ferramenta.pedido, textoAntes);
  }
}
