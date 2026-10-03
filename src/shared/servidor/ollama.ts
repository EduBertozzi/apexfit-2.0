/**
 * IA local e gratuita: Ollama rodando no próprio computador (https://ollama.com).
 * Roda SÓ no servidor. Sem SDK: a API do Ollama é HTTP simples.
 *
 * Para usar: `brew install ollama`, `brew services start ollama`,
 * `ollama pull qwen2.5:7b`. Endereço e modelo podem mudar pelo .env.
 */

export const OLLAMA_URL = process.env.OLLAMA_URL ?? 'http://127.0.0.1:11434';
export const MODELO_LOCAL = process.env.OLLAMA_MODELO ?? 'qwen2.5:7b';

/** Mantém o modelo carregado na memória entre mensagens (apresentação sem engasgo). */
const MANTER_CARREGADO = '30m';

export type MensagemOllama = {
  role: 'system' | 'user' | 'assistant' | 'tool';
  content: string;
  tool_calls?: ChamadaFerramenta[];
  tool_name?: string;
};

export type ChamadaFerramenta = {
  function: { name: string; arguments: Record<string, unknown> };
};

export type FerramentaOllama = {
  type: 'function';
  function: {
    name: string;
    description: string;
    parameters: Record<string, unknown>;
  };
};

type PedidoChat = {
  messages: MensagemOllama[];
  tools?: FerramentaOllama[];
  /** JSON Schema: força a resposta a seguir este formato. */
  format?: Record<string, unknown>;
  temperatura?: number;
};

type PedacoChat = {
  message?: { content?: string; tool_calls?: ChamadaFerramenta[] };
  done?: boolean;
  error?: string;
};

/** O Ollama está ligado e com o modelo baixado? Responde rápido para não travar a rota. */
export async function ollamaDisponivel(tempoMs = 800): Promise<boolean> {
  try {
    const resposta = await fetch(`${OLLAMA_URL}/api/tags`, {
      signal: AbortSignal.timeout(tempoMs),
    });

    if (!resposta.ok) {
      return false;
    }

    const { models } = (await resposta.json()) as { models?: { name: string }[] };

    return (models ?? []).some((modelo) => modelo.name === MODELO_LOCAL);
  } catch {
    return false;
  }
}

function corpo(pedido: PedidoChat, stream: boolean) {
  return JSON.stringify({
    model: MODELO_LOCAL,
    messages: pedido.messages,
    tools: pedido.tools,
    format: pedido.format,
    stream,
    keep_alive: MANTER_CARREGADO,
    options: { temperature: pedido.temperatura ?? 0.6 },
  });
}

/**
 * Uma resposta inteira (usada para JSON estruturado). Por baixo usa streaming:
 * o fetch do servidor do Expo derruba conexões paradas por ~30 s, e um plano
 * longo demora mais que isso para ficar pronto.
 */
export async function chatOllama(pedido: PedidoChat): Promise<MensagemOllama> {
  let content = '';
  let tool_calls: ChamadaFerramenta[] | undefined;

  for await (const pedaco of chatOllamaStream(pedido)) {
    if ('texto' in pedaco) {
      content += pedaco.texto;
    } else {
      tool_calls = pedaco.ferramentas;
    }
  }

  return { role: 'assistant', content, tool_calls };
}

/** Resposta em streaming: devolve pedaços de texto e, no fim, as chamadas de ferramenta. */
export async function* chatOllamaStream(
  pedido: PedidoChat,
): AsyncGenerator<{ texto: string } | { ferramentas: ChamadaFerramenta[] }> {
  const resposta = await fetch(`${OLLAMA_URL}/api/chat`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: corpo(pedido, true),
  });

  if (!resposta.ok || !resposta.body) {
    throw new Error(`Ollama respondeu ${resposta.status}`);
  }

  const leitor = resposta.body.getReader();
  const decodificador = new TextDecoder();
  const ferramentas: ChamadaFerramenta[] = [];
  let resto = '';

  while (true) {
    const { done, value } = await leitor.read();

    if (done) {
      break;
    }

    const linhas = (resto + decodificador.decode(value, { stream: true })).split('\n');
    resto = linhas.pop() ?? '';

    for (const linha of linhas) {
      if (linha.trim() === '') {
        continue;
      }

      const pedaco = JSON.parse(linha) as PedacoChat;

      if (pedaco.error) {
        throw new Error(pedaco.error);
      }

      if (pedaco.message?.content) {
        yield { texto: pedaco.message.content };
      }

      if (pedaco.message?.tool_calls) {
        ferramentas.push(...pedaco.message.tool_calls);
      }
    }
  }

  if (ferramentas.length > 0) {
    yield { ferramentas };
  }
}
