import { CODIGO_SEM_IA } from '@/shared/lib/semIa';

import { ErroServidor } from './claude';
import { ollamaDisponivel } from './ollama';

/**
 * Qual IA o servidor usa agora, nesta ordem:
 * 1. Claude, só se existir ANTHROPIC_API_KEY (pago, nunca é chamado sem chave);
 * 2. IA local (Ollama), grátis, se estiver ligada neste computador;
 * 3. nenhuma: a rota responde SEM_IA e o app usa o modo demonstração offline.
 */
export type Provedor = 'claude' | 'local' | 'nenhum';

export async function escolherProvedor(): Promise<Provedor> {
  if (process.env.ANTHROPIC_API_KEY) {
    return 'claude';
  }

  return (await ollamaDisponivel()) ? 'local' : 'nenhum';
}

export function erroSemIa(): ErroServidor {
  return new ErroServidor('Nenhuma IA disponível neste servidor.', 503, CODIGO_SEM_IA);
}
