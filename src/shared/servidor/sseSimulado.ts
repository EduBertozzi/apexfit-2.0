/**
 * SÓ PARA TESTES: simula a resposta em streaming (SSE) da API de Chat
 * Completions da OpenAI, cortando as linhas no meio de propósito.
 */

export type PedacoSimulado = {
  texto?: string;
  ferramenta?: { indice: number; nome?: string; argumentos?: string };
  recusa?: string;
};

export function linhasSse(pedacos: PedacoSimulado[]): string {
  const linhas = pedacos.map((pedaco) => {
    const delta: Record<string, unknown> = {};

    if (pedaco.texto !== undefined) {
      delta.content = pedaco.texto;
    }

    if (pedaco.recusa !== undefined) {
      delta.refusal = pedaco.recusa;
    }

    if (pedaco.ferramenta) {
      delta.tool_calls = [
        {
          index: pedaco.ferramenta.indice,
          ...(pedaco.ferramenta.nome
            ? { id: `call_${pedaco.ferramenta.indice}`, type: 'function' }
            : {}),
          function: {
            ...(pedaco.ferramenta.nome ? { name: pedaco.ferramenta.nome } : {}),
            arguments: pedaco.ferramenta.argumentos ?? '',
          },
        },
      ];
    }

    return `data: ${JSON.stringify({ choices: [{ index: 0, delta, finish_reason: null }] })}\n\n`;
  });

  return `${linhas.join('')}data: [DONE]\n\n`;
}

/** Objeto parecido com `Response`, com o corpo chegando em pedaços de `tamanho` bytes. */
export function respostaSse(pedacos: PedacoSimulado[], tamanho = 11) {
  const bytes = new TextEncoder().encode(linhasSse(pedacos));
  let posicao = 0;

  return {
    ok: true,
    status: 200,
    body: {
      getReader: () => ({
        read: async () => {
          if (posicao >= bytes.length) {
            return { done: true, value: undefined };
          }

          const value = bytes.slice(posicao, posicao + tamanho);
          posicao += tamanho;

          return { done: false, value };
        },
      }),
    },
    json: async () => ({}),
  };
}

/** Resposta de erro HTTP da OpenAI. */
export function respostaErro(status: number) {
  return {
    ok: false,
    status,
    body: null,
    json: async () => ({ error: { message: `erro ${status}` } }),
  };
}
