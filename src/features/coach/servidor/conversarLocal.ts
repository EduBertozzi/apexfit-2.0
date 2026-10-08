import {
  chatOllamaStream,
  type ChamadaFerramenta,
  type FerramentaOllama,
  type MensagemOllama,
} from '@/shared/servidor/ollama';

import type { EventoCoach, PedidoCoach } from '../contrato';
import { SISTEMA_COACH_PEDIDOS } from '../prompt';
import {
  acaoPorIntencao,
  ehFerramentaCoach,
  executarFerramenta,
  FERRAMENTAS_COACH,
  pedidoDosArgumentos,
} from './acoes';

/**
 * Coach com IA local (Ollama), grátis. Roda SÓ no servidor.
 *
 * Diferença para o Claude: modelos pequenos erram ao escrever o plano inteiro
 * como argumento de ferramenta. Aqui a ferramenta recebe só o PEDIDO
 * ("trocar o café da manhã") e uma segunda chamada, com o formato JSON
 * travado, monta o plano ou os treinos.
 */

const FERRAMENTAS: FerramentaOllama[] = Object.entries(FERRAMENTAS_COACH).map(
  ([nome, ferramenta]) => ({
    type: 'function',
    function: {
      name: nome,
      description: ferramenta.descricao,
      parameters: {
        type: 'object',
        properties: {
          pedido: {
            type: 'string',
            description: `O que criar ou mudar, em uma frase. ${ferramenta.exemplo}`,
          },
        },
        required: ['pedido'],
      },
    },
  }),
);

function primeiraFerramenta(chamadas: ChamadaFerramenta[]) {
  const chamada = chamadas.find((item) => ehFerramentaCoach(item.function.name));

  return chamada
    ? {
        nome: chamada.function.name,
        pedido: pedidoDosArgumentos(chamada.function.arguments, 'montar do zero'),
      }
    : null;
}

export async function* conversarLocal(pedido: PedidoCoach): AsyncGenerator<EventoCoach> {
  const mensagens: MensagemOllama[] = [
    {
      role: 'system',
      content: `${SISTEMA_COACH_PEDIDOS}\n\nDados do usuário, atualizados agora:\n\n${pedido.contexto}`,
    },
    ...pedido.mensagens.map((mensagem): MensagemOllama => ({
      role: mensagem.papel === 'usuario' ? 'user' : 'assistant',
      content: mensagem.texto,
    })),
  ];

  // Pedido claro: monta direto, sem depender do modelo chamar a ferramenta
  const atalho = acaoPorIntencao('local', pedido);

  if (atalho) {
    yield* atalho;
    return;
  }

  let chamadas: ChamadaFerramenta[] = [];
  let textoAntes = '';

  for await (const pedaco of chatOllamaStream({ messages: mensagens, tools: FERRAMENTAS })) {
    if ('texto' in pedaco) {
      textoAntes += pedaco.texto;
      yield { tipo: 'texto', texto: pedaco.texto };
    } else {
      chamadas = pedaco.ferramentas;
    }
  }

  const ferramenta = primeiraFerramenta(chamadas);

  if (ferramenta && ehFerramentaCoach(ferramenta.nome)) {
    yield* executarFerramenta('local', pedido, ferramenta.nome, ferramenta.pedido, textoAntes);
  }
}
