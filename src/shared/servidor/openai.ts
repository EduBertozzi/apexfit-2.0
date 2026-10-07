import { ErroServidor } from './claude';

/**
 * OpenAI (API de Chat Completions) para as rotas de servidor.
 * Roda SÓ no servidor: a chave OPENAI_API_KEY vem do ambiente e nunca vai
 * para o app. Sem SDK: `fetch` simples, igual ao Ollama.
 *
 * Sempre em streaming: o fetch do servidor do Expo derruba conexões paradas
 * por ~30 s, e um plano ou uma ficha de treino demora mais que isso.
 */

export const OPENAI_URL = 'https://api.openai.com/v1/chat/completions';

/** Modelo pequeno e barato, com structured outputs e function calling. */
export const MODELO_OPENAI_PADRAO = 'gpt-6-luna';

export function modeloOpenAI(): string {
  return process.env.OPENAI_MODELO || MODELO_OPENAI_PADRAO;
}

/**
 * Esforço de raciocínio. Na família gpt-6, a Chat Completions só aceita
 * ferramentas com `reasoning_effort: "none"`, e para um chat de celular
 * resposta rápida vale mais. Modelos antigos (gpt-4o-mini) não aceitam o campo.
 * OPENAI_ESFORCO troca o valor; vazio ("OPENAI_ESFORCO=") não manda nada.
 */
export function esforcoOpenAI(modelo = modeloOpenAI()): string | undefined {
  const definido = process.env.OPENAI_ESFORCO;

  if (definido !== undefined) {
    return definido.trim() === '' ? undefined : definido.trim();
  }

  return /^gpt-6/.test(modelo) ? 'none' : undefined;
}

/** Só existe OpenAI se houver chave. Sem chave, nunca é chamada e nunca cobra. */
export function openaiDisponivel(): boolean {
  return Boolean(process.env.OPENAI_API_KEY?.trim());
}

export type ChamadaOpenAI = {
  id: string;
  type: 'function';
  function: { name: string; arguments: string };
};

export type MensagemOpenAI =
  | { role: 'system' | 'user'; content: string }
  | { role: 'assistant'; content: string | null; tool_calls?: ChamadaOpenAI[] }
  | { role: 'tool'; content: string; tool_call_id: string };

export type FerramentaOpenAI = {
  type: 'function';
  function: {
    name: string;
    description: string;
    parameters: Record<string, unknown>;
    strict?: boolean;
  };
};

export type PedidoOpenAI = {
  messages: MensagemOpenAI[];
  tools?: FerramentaOpenAI[];
  /** Structured outputs: a resposta segue este JSON Schema (formato estrito). */
  formato?: { nome: string; schema: Record<string, unknown> };
  maxTokens?: number;
};

/** Ferramenta pedida pela IA, com os argumentos já lidos do JSON. */
export type FerramentaPedida = { nome: string; argumentos: Record<string, unknown> };

type DeltaFerramenta = {
  index: number;
  id?: string;
  function?: { name?: string; arguments?: string };
};

type PedacoOpenAI = {
  choices?: {
    delta?: { content?: string | null; refusal?: string | null; tool_calls?: DeltaFerramenta[] };
    finish_reason?: string | null;
  }[];
  error?: { message?: string };
};

export function corpoOpenAI(pedido: PedidoOpenAI): Record<string, unknown> {
  const modelo = modeloOpenAI();
  const esforco = esforcoOpenAI(modelo);

  return {
    model: modelo,
    messages: pedido.messages,
    stream: true,
    max_completion_tokens: pedido.maxTokens ?? 8000,
    ...(esforco ? { reasoning_effort: esforco } : {}),
    ...(pedido.tools?.length ? { tools: pedido.tools } : {}),
    ...(pedido.formato
      ? {
          response_format: {
            type: 'json_schema',
            json_schema: { name: pedido.formato.nome, strict: true, schema: pedido.formato.schema },
          },
        }
      : {}),
  };
}

async function erroHttp(resposta: Response): Promise<ErroServidor> {
  const corpo = (await resposta.json().catch(() => null)) as {
    error?: { message?: string };
  } | null;

  console.error('[openai]', resposta.status, corpo?.error?.message);

  if (resposta.status === 401 || resposta.status === 403) {
    return new ErroServidor('A chave da OpenAI foi recusada. Confira OPENAI_API_KEY.', 503);
  }

  if (resposta.status === 429) {
    return new ErroServidor('Muitos pedidos agora. Tente em um minuto.', 429);
  }

  return new ErroServidor(`A OpenAI respondeu ${resposta.status}. Tente de novo.`, 502);
}

function lerArgumentos(texto: string): Record<string, unknown> {
  try {
    const lido: unknown = JSON.parse(texto || '{}');

    return lido && typeof lido === 'object' ? (lido as Record<string, unknown>) : {};
  } catch {
    return {};
  }
}

/**
 * Resposta em streaming (SSE): devolve pedaços de texto conforme chegam e,
 * no fim, as ferramentas que a IA pediu (os argumentos chegam em pedaços).
 */
export async function* chatOpenAIStream(
  pedido: PedidoOpenAI,
): AsyncGenerator<{ texto: string } | { ferramentas: FerramentaPedida[] }> {
  const chave = process.env.OPENAI_API_KEY?.trim();

  if (!chave) {
    throw new ErroServidor('Servidor sem OPENAI_API_KEY configurada.', 503);
  }

  const resposta = await fetch(OPENAI_URL, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${chave}` },
    body: JSON.stringify(corpoOpenAI(pedido)),
  });

  if (!resposta.ok || !resposta.body) {
    throw await erroHttp(resposta);
  }

  const leitor = resposta.body.getReader();
  const decodificador = new TextDecoder();
  const chamadas = new Map<number, { nome: string; argumentos: string }>();
  let recusa = '';
  let teveTexto = false;
  let resto = '';

  const processar = function* (linha: string): Generator<{ texto: string }> {
    const limpa = linha.trim();

    if (!limpa.startsWith('data:')) {
      return;
    }

    const dado = limpa.slice(5).trim();

    if (dado === '' || dado === '[DONE]') {
      return;
    }

    const pedaco = JSON.parse(dado) as PedacoOpenAI;

    if (pedaco.error) {
      throw new Error(pedaco.error.message ?? 'Erro da OpenAI no meio da resposta.');
    }

    for (const escolha of pedaco.choices ?? []) {
      const delta = escolha.delta;

      if (delta?.content) {
        teveTexto = true;
        yield { texto: delta.content };
      }

      if (delta?.refusal) {
        recusa += delta.refusal;
      }

      for (const parte of delta?.tool_calls ?? []) {
        const atual = chamadas.get(parte.index) ?? { nome: '', argumentos: '' };

        atual.nome += parte.function?.name ?? '';
        atual.argumentos += parte.function?.arguments ?? '';
        chamadas.set(parte.index, atual);
      }
    }
  };

  while (true) {
    const { done, value } = await leitor.read();

    if (done) {
      break;
    }

    const linhas = (resto + decodificador.decode(value, { stream: true })).split('\n');
    resto = linhas.pop() ?? '';

    for (const linha of linhas) {
      yield* processar(linha);
    }
  }

  yield* processar(resto + decodificador.decode());

  if (recusa !== '' && !teveTexto) {
    throw new ErroServidor('A IA não conseguiu responder este pedido. Revise as restrições.', 422);
  }

  if (chamadas.size > 0) {
    yield {
      ferramentas: [...chamadas.entries()]
        .sort(([a], [b]) => a - b)
        .map(([, chamada]) => ({
          nome: chamada.nome,
          argumentos: lerArgumentos(chamada.argumentos),
        })),
    };
  }
}

/** Uma resposta inteira (usada para JSON estruturado), lida por streaming por baixo. */
export async function chatOpenAI(
  pedido: PedidoOpenAI,
): Promise<{ texto: string; ferramentas: FerramentaPedida[] }> {
  let texto = '';
  let ferramentas: FerramentaPedida[] = [];

  for await (const pedaco of chatOpenAIStream(pedido)) {
    if ('texto' in pedaco) {
      texto += pedaco.texto;
    } else {
      ferramentas = pedaco.ferramentas;
    }
  }

  return { texto, ferramentas };
}
