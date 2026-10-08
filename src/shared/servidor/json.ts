import { z } from 'zod';

import { esquemaEstrito } from './esquemaEstrito';
import { chatOllama } from './ollama';
import { chatOpenAI } from './openai';

/**
 * Pede uma resposta em JSON, com o formato travado pelo schema, para a IA
 * que usa HTTP simples (OpenAI ou Ollama). Roda SÓ no servidor.
 * O Claude tem o próprio caminho (SDK com zod), em cada feature.
 */

export type ProvedorJson = 'openai' | 'local';

export type MensagemJson = { role: 'system' | 'user' | 'assistant'; content: string };

const cacheEstrito = new WeakMap<z.ZodType, Record<string, unknown>>();
const cacheOllama = new WeakMap<z.ZodType, Record<string, unknown>>();

function memorizar(
  cache: WeakMap<z.ZodType, Record<string, unknown>>,
  schema: z.ZodType,
  gerar: () => Record<string, unknown>,
) {
  const salvo = cache.get(schema);

  if (salvo) {
    return salvo;
  }

  const novo = gerar();
  cache.set(schema, novo);

  return novo;
}

/** Devolve o texto (JSON) da resposta. Quem chama lê e valida com `lerJson`. */
export async function responderJson(
  provedor: ProvedorJson,
  pedido: { mensagens: MensagemJson[]; nome: string; schema: z.ZodType; maxTokens?: number },
): Promise<string> {
  if (provedor === 'openai') {
    const { texto } = await chatOpenAI({
      messages: pedido.mensagens,
      formato: {
        nome: pedido.nome,
        schema: memorizar(cacheEstrito, pedido.schema, () => esquemaEstrito(pedido.schema)),
      },
      maxTokens: pedido.maxTokens,
    });

    return texto;
  }

  const resposta = await chatOllama({
    messages: pedido.mensagens,
    format: memorizar(
      cacheOllama,
      pedido.schema,
      () => z.toJSONSchema(pedido.schema) as Record<string, unknown>,
    ),
    temperatura: 0.3,
  });

  return resposta.content;
}
