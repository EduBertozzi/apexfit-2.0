import { CODIGO_SEM_IA, type ProvedorIa } from '@/shared/lib/semIa';

import { ErroServidor } from './claude';
import { ollamaDisponivel } from './ollama';
import { openaiDisponivel } from './openai';

/**
 * Qual IA o servidor usa agora, nesta ordem:
 * 1. Claude, só se existir ANTHROPIC_API_KEY (pago, nunca é chamado sem chave);
 * 2. OpenAI, só se existir OPENAI_API_KEY (pago, funciona no servidor publicado);
 * 3. IA local (Ollama), grátis, se estiver ligada neste computador;
 * 4. nenhuma: a rota responde SEM_IA e o app usa o modo demonstração offline.
 */
export type Provedor = ProvedorIa | 'nenhum';

export async function escolherProvedor(): Promise<Provedor> {
  if (process.env.ANTHROPIC_API_KEY?.trim()) {
    return 'claude';
  }

  if (openaiDisponivel()) {
    return 'openai';
  }

  return (await ollamaDisponivel()) ? 'local' : 'nenhum';
}

export function erroSemIa(): ErroServidor {
  return new ErroServidor('Nenhuma IA disponível neste servidor.', 503, CODIGO_SEM_IA);
}
