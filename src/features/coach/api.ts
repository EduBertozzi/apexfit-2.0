import { CODIGO_SEM_IA, SemIa } from '@/shared/lib/semIa';

import type { EventoCoach, PedidoCoach } from './contrato';
import { lerEventos } from './eventos';

/**
 * Manda a conversa para o NOSSO servidor (/api/coach) e entrega cada evento
 * conforme chega. No celular o `fetch` global é o do Expo, que lê streaming.
 */
export async function conversarComCoach(
  pedido: PedidoCoach,
  aoReceber: (evento: EventoCoach) => void,
): Promise<void> {
  let resposta: Response;

  try {
    resposta = await fetch('/api/coach', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', Accept: 'application/x-ndjson' },
      body: JSON.stringify(pedido),
    });
  } catch {
    // Sem conexão com o servidor: o app responde no modo demonstração
    throw new SemIa('Sem conexão com o servidor.');
  }

  if (!resposta.ok) {
    const corpo = (await resposta.json().catch(() => null)) as {
      erro?: unknown;
      codigo?: unknown;
    } | null;

    if (corpo?.codigo === CODIGO_SEM_IA) {
      throw new SemIa();
    }

    throw new Error(
      typeof corpo?.erro === 'string' ? corpo.erro : 'O coach não respondeu. Tente de novo.',
    );
  }

  const leitor = resposta.body?.getReader();

  // Sem streaming disponível: lê tudo de uma vez (a resposta só aparece no fim)
  if (!leitor) {
    lerEventos(`${await resposta.text()}\n`).eventos.forEach(aoReceber);
    return;
  }

  const decodificador = new TextDecoder();
  let resto = '';

  while (true) {
    const { done, value } = await leitor.read();

    if (done) {
      break;
    }

    const lido = lerEventos(resto + decodificador.decode(value, { stream: true }));
    resto = lido.resto;
    lido.eventos.forEach(aoReceber);
  }

  lerEventos(`${resto}${decodificador.decode()}\n`).eventos.forEach(aoReceber);
}
