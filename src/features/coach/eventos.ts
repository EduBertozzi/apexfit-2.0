import { eventoCoachSchema, type EventoCoach } from './contrato';

/**
 * Lê eventos NDJSON de um pedaço de texto que chegou pela rede.
 * A rede pode cortar uma linha no meio: o que sobrar sem "\n" volta em `resto`
 * e deve ser somado ao próximo pedaço.
 */
export function lerEventos(buffer: string): { eventos: EventoCoach[]; resto: string } {
  const linhas = buffer.split('\n');
  const resto = linhas.pop() ?? '';
  const eventos: EventoCoach[] = [];

  for (const linha of linhas) {
    if (linha.trim() === '') {
      continue;
    }

    try {
      const evento = eventoCoachSchema.safeParse(JSON.parse(linha));

      if (evento.success) {
        eventos.push(evento.data);
      }
    } catch {
      // Linha corrompida: ignora em vez de derrubar a conversa
    }
  }

  return { eventos, resto };
}

/** Serializa um evento para mandar pela rede (servidor). */
export function escreverEvento(evento: EventoCoach): string {
  return `${JSON.stringify(evento)}\n`;
}
