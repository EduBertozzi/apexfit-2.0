import { distribuirRefeicoes } from '@/features/dieta/prompt';
import { gerarPlanoLocal } from '@/features/dieta/servidor/gerarDietaLocal';
import {
  chatOllamaStream,
  type ChamadaFerramenta,
  type FerramentaOllama,
  type MensagemOllama,
} from '@/shared/servidor/ollama';

import type { EventoCoach, PedidoCoach } from '../contrato';
import { confirmarPlano, metaDoContexto, pedeMudancaDeDieta } from '../intencao';
import { SISTEMA_COACH } from '../prompt';

/**
 * Coach com IA local (Ollama), grátis. Roda SÓ no servidor.
 *
 * Diferença para o Claude: modelos pequenos erram ao escrever o plano inteiro
 * como argumento de ferramenta. Aqui a ferramenta recebe só o PEDIDO
 * ("trocar o café da manhã") e uma segunda chamada, com o formato JSON
 * travado, monta o plano.
 */

const SISTEMA_LOCAL = SISTEMA_COACH.replace(
  '- Sempre mande o plano COMPLETO na ferramenta, não só a parte que mudou. Mantenha o que a pessoa não pediu para mudar.',
  '- Na ferramenta, descreva em uma frase o que a pessoa quer criar ou mudar. O app monta o plano completo.',
);

const FERRAMENTA_DIETA: FerramentaOllama = {
  type: 'function',
  function: {
    name: 'atualizar_dieta',
    description:
      'Cria ou muda o plano alimentar salvo no app. Use só quando a pessoa pedir para criar ou mudar a dieta.',
    parameters: {
      type: 'object',
      properties: {
        pedido: {
          type: 'string',
          description:
            'O que criar ou mudar, em uma frase. Ex: "trocar o café da manhã por algo sem ovo".',
        },
      },
      required: ['pedido'],
    },
  },
};

function pedidoDaFerramenta(chamadas: ChamadaFerramenta[]): string | null {
  const chamada = chamadas.find((item) => item.function.name === 'atualizar_dieta');

  if (!chamada) {
    return null;
  }

  const pedido = chamada.function.arguments.pedido;

  return typeof pedido === 'string' && pedido.trim() !== '' ? pedido : 'montar um plano novo';
}

export async function* conversarLocal(pedido: PedidoCoach): AsyncGenerator<EventoCoach> {
  const mensagens: MensagemOllama[] = [
    {
      role: 'system',
      content: `${SISTEMA_LOCAL}\n\nDados do usuário, atualizados agora:\n\n${pedido.contexto}`,
    },
    ...pedido.mensagens.map((mensagem): MensagemOllama => ({
      role: mensagem.papel === 'usuario' ? 'user' : 'assistant',
      content: mensagem.texto,
    })),
  ];

  const ultima = pedido.mensagens[pedido.mensagens.length - 1].texto;

  // Pedido claro de dieta: monta direto, sem depender do modelo chamar a ferramenta
  if (pedeMudancaDeDieta(ultima)) {
    yield* montarDietaEConfirmar(pedido, mensagens, ultima, '');
    return;
  }

  let chamadas: ChamadaFerramenta[] = [];
  let textoAntes = '';

  for await (const pedaco of chatOllamaStream({ messages: mensagens, tools: [FERRAMENTA_DIETA] })) {
    if ('texto' in pedaco) {
      textoAntes += pedaco.texto;
      yield { tipo: 'texto', texto: pedaco.texto };
    } else {
      chamadas = pedaco.ferramentas;
    }
  }

  const pedidoDieta = pedidoDaFerramenta(chamadas);

  if (!pedidoDieta) {
    return;
  }

  yield* montarDietaEConfirmar(pedido, mensagens, pedidoDieta, textoAntes);
}

async function* montarDietaEConfirmar(
  pedido: PedidoCoach,
  mensagens: MensagemOllama[],
  pedidoDieta: string,
  textoAntes: string,
): AsyncGenerator<EventoCoach> {
  yield {
    tipo: 'texto',
    texto: `${textoAntes === '' ? '' : '\n\n'}Bora! Montando seu plano com as suas metas. Leva uns 40 segundos.\n\n`,
  };

  const meta = metaDoContexto(pedido.contexto);
  const divisao = meta
    ? '\nDivisão das refeições (siga estes horários e calorias):\n' +
      distribuirRefeicoes(meta)
        .map((refeicao) => `${refeicao.horario} ${refeicao.nome}: ${refeicao.kcal} kcal`)
        .join('\n')
    : '';

  const plano = await gerarPlanoLocal(
    `${pedido.contexto}\n${divisao}\n\nPedido do usuário para a dieta: ${pedidoDieta}\n` +
      'Se já existe uma dieta atual, mantenha o que não foi pedido para mudar.',
    meta,
  );

  yield { tipo: 'dieta', plano };

  // Confirmação montada a partir do plano salvo: rápida e nunca inventa alimento
  yield { tipo: 'texto', texto: confirmarPlano(plano) };
}
