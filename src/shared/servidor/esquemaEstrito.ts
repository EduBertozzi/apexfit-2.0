import { z } from 'zod';

/**
 * Structured outputs da OpenAI em modo estrito exigem um JSON Schema mais
 * rígido que o gerado pelo zod: todo objeto lista TODAS as propriedades em
 * `required` e tem `additionalProperties: false`. Campo opcional vira
 * "pode ser null", e o `semNulos` desfaz isso antes de validar com o zod.
 *
 * Funções puras: rodam no servidor e nos testes.
 */

type Esquema = Record<string, unknown>;

const LIMITE_INTEIRO = Number.MAX_SAFE_INTEGER;

function aceitarNull(esquema: Esquema): Esquema {
  const { description, ...resto } = esquema;
  const tipo = resto.type;

  if (typeof tipo === 'string' && !('enum' in resto)) {
    return { ...esquema, type: [tipo, 'null'] };
  }

  return {
    ...(description === undefined ? {} : { description }),
    anyOf: [resto, { type: 'null' }],
  };
}

function ajustar(esquema: unknown): unknown {
  if (Array.isArray(esquema)) {
    return esquema.map(ajustar);
  }

  if (esquema === null || typeof esquema !== 'object') {
    return esquema;
  }

  const saida: Esquema = {};

  for (const [chave, valor] of Object.entries(esquema as Esquema)) {
    // Metadados e os limites "infinitos" que o zod põe em .int() não ajudam a IA
    if (chave === '$schema') {
      continue;
    }

    if (
      (chave === 'minimum' || chave === 'maximum') &&
      Math.abs(valor as number) >= LIMITE_INTEIRO
    ) {
      continue;
    }

    saida[chave] = ajustar(valor);
  }

  if (saida.type === 'object' && saida.properties && typeof saida.properties === 'object') {
    const propriedades = saida.properties as Record<string, Esquema>;
    const obrigatorias = new Set((saida.required as string[] | undefined) ?? []);
    const todas = Object.keys(propriedades);

    saida.properties = Object.fromEntries(
      todas.map((nome) => [
        nome,
        obrigatorias.has(nome) ? propriedades[nome] : aceitarNull(propriedades[nome]),
      ]),
    );
    saida.required = todas;
    saida.additionalProperties = false;
  }

  return saida;
}

/** JSON Schema no formato estrito da OpenAI, a partir de um schema zod. */
export function esquemaEstrito(schema: z.ZodType): Esquema {
  return ajustar(z.toJSONSchema(schema)) as Esquema;
}

/** Tira as chaves com valor null (campos opcionais que a IA mandou vazios). */
export function semNulos(valor: unknown): unknown {
  if (Array.isArray(valor)) {
    return valor.map(semNulos);
  }

  if (valor === null || typeof valor !== 'object') {
    return valor;
  }

  return Object.fromEntries(
    Object.entries(valor as Record<string, unknown>)
      .filter(([, item]) => item !== null)
      .map(([chave, item]) => [chave, semNulos(item)]),
  );
}

/** Lê o texto da IA como JSON e valida. Devolve null se não for JSON ou não bater com o schema. */
export function lerJson<T>(texto: string, schema: z.ZodType<T>): T | null {
  try {
    const lido = schema.safeParse(semNulos(JSON.parse(texto)));

    return lido.success ? lido.data : null;
  } catch {
    return null;
  }
}
