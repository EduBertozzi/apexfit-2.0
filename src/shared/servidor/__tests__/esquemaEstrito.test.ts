import { z } from 'zod';

import { planoDietaSchema } from '@/features/dieta/contrato';
import { respostaTreinosIaSchema } from '@/features/treinos/contratoIa';

import { esquemaEstrito, lerJson, semNulos } from '../esquemaEstrito';

type Objeto = {
  type?: unknown;
  properties?: Record<string, Objeto>;
  required?: string[];
  additionalProperties?: unknown;
  items?: Objeto;
  anyOf?: Objeto[];
};

/** Confere as regras do modo estrito em todos os objetos do schema. */
function conferirEstrito(esquema: Objeto) {
  if (esquema.type === 'object') {
    expect(esquema.additionalProperties).toBe(false);
    expect(esquema.required).toEqual(Object.keys(esquema.properties ?? {}));
  }

  Object.values(esquema.properties ?? {}).forEach(conferirEstrito);
  esquema.anyOf?.forEach(conferirEstrito);

  if (esquema.items) {
    conferirEstrito(esquema.items);
  }
}

describe('esquemaEstrito', () => {
  it('deixa os schemas do app no formato estrito da OpenAI', () => {
    conferirEstrito(esquemaEstrito(planoDietaSchema) as Objeto);
    conferirEstrito(esquemaEstrito(respostaTreinosIaSchema) as Objeto);
  });

  it('campo opcional vira obrigatório que aceita null', () => {
    const esquema = esquemaEstrito(
      z.object({ nome: z.string(), obs: z.string().optional().describe('dica') }),
    ) as Objeto;

    expect(esquema.required).toEqual(['nome', 'obs']);
    expect(esquema.properties?.obs).toEqual({ type: ['string', 'null'], description: 'dica' });
  });

  it('enum opcional usa anyOf com null', () => {
    const esquema = esquemaEstrito(z.object({ g: z.enum(['a', 'b']).optional() })) as Objeto;

    expect(esquema.properties?.g.anyOf).toEqual([
      { type: 'string', enum: ['a', 'b'] },
      { type: 'null' },
    ]);
  });

  it('tira $schema e os limites infinitos de inteiro', () => {
    const texto = JSON.stringify(esquemaEstrito(z.object({ n: z.number().int().min(2) })));

    expect(texto).not.toContain('$schema');
    expect(texto).not.toContain('9007199254740991');
    expect(texto).toContain('"minimum":2');
  });
});

describe('semNulos e lerJson', () => {
  const schema = z.object({ a: z.string(), b: z.string().optional(), l: z.array(z.number()) });

  it('remove chaves null, inclusive dentro de listas', () => {
    expect(semNulos({ a: 'x', b: null, l: [{ c: null, d: 1 }] })).toEqual({
      a: 'x',
      l: [{ d: 1 }],
    });
  });

  it('lê e valida, devolvendo null quando não bate', () => {
    expect(lerJson('{"a":"x","b":null,"l":[1]}', schema)).toEqual({ a: 'x', l: [1] });
    expect(lerJson('{"a":1}', schema)).toBeNull();
    expect(lerJson('não é json', schema)).toBeNull();
  });
});
