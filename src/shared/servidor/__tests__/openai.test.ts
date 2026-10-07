import { ErroServidor } from '../claude';
import {
  chatOpenAI,
  chatOpenAIStream,
  corpoOpenAI,
  esforcoDoPedido,
  esforcoOpenAI,
  MODELO_OPENAI_PADRAO,
  OPENAI_URL,
  openaiDisponivel,
} from '../openai';
import { respostaErro, respostaSse } from '../sseSimulado';

const AMBIENTE = { ...process.env };

beforeEach(() => {
  process.env = { ...AMBIENTE, OPENAI_API_KEY: 'sk-teste' };
  delete process.env.OPENAI_MODELO;
  delete process.env.OPENAI_ESFORCO;
});

afterAll(() => {
  process.env = AMBIENTE;
});

function pedidoFeito(): { url: string; init: RequestInit; corpo: Record<string, unknown> } {
  const [url, init] = jest.mocked(global.fetch).mock.calls[0] as [string, RequestInit];

  return { url, init, corpo: JSON.parse(init.body as string) };
}

describe('openaiDisponivel', () => {
  it('só existe com chave', () => {
    expect(openaiDisponivel()).toBe(true);
    process.env.OPENAI_API_KEY = '  ';
    expect(openaiDisponivel()).toBe(false);
    delete process.env.OPENAI_API_KEY;
    expect(openaiDisponivel()).toBe(false);
  });
});

describe('corpoOpenAI', () => {
  it('usa o modelo padrão, streaming e formato estrito', () => {
    const corpo = corpoOpenAI({
      messages: [{ role: 'user', content: 'oi' }],
      formato: { nome: 'plano', schema: { type: 'object' } },
    });

    expect(corpo).toMatchObject({
      model: MODELO_OPENAI_PADRAO,
      stream: true,
      response_format: {
        type: 'json_schema',
        json_schema: { name: 'plano', strict: true, schema: { type: 'object' } },
      },
    });
    expect(corpo).not.toHaveProperty('tools');
  });

  it('modelo e esforço vêm do ambiente', () => {
    process.env.OPENAI_MODELO = 'gpt-4o-mini';

    expect(corpoOpenAI({ messages: [] })).not.toHaveProperty('reasoning_effort');
    expect(corpoOpenAI({ messages: [] }).model).toBe('gpt-4o-mini');

    process.env.OPENAI_ESFORCO = 'low';
    expect(esforcoOpenAI()).toBe('low');
  });

  it('família gpt-6 vai sem raciocínio (necessário para ferramentas na Chat Completions)', () => {
    expect(esforcoOpenAI('gpt-6-luna')).toBe('none');
    process.env.OPENAI_ESFORCO = '';
    expect(esforcoOpenAI('gpt-6-luna')).toBeUndefined();
  });
});

describe('chatOpenAIStream', () => {
  it('manda a chave só no cabeçalho e entrega o texto em pedaços', async () => {
    global.fetch = jest
      .fn()
      .mockResolvedValue(
        respostaSse([{ texto: 'Bora ' }, { texto: 'treinar, ' }, { texto: 'Edu!' }]),
      );

    const textos: string[] = [];

    for await (const pedaco of chatOpenAIStream({ messages: [{ role: 'user', content: 'oi' }] })) {
      if ('texto' in pedaco) {
        textos.push(pedaco.texto);
      }
    }

    const { url, init, corpo } = pedidoFeito();

    expect(url).toBe(OPENAI_URL);
    expect((init.headers as Record<string, string>).Authorization).toBe('Bearer sk-teste');
    expect(JSON.stringify(corpo)).not.toContain('sk-teste');
    expect(textos.join('')).toBe('Bora treinar, Edu!');
  });

  it('junta os argumentos da ferramenta que chegam em pedaços', async () => {
    global.fetch = jest
      .fn()
      .mockResolvedValue(
        respostaSse([
          { texto: 'Já vou montar.' },
          { ferramenta: { indice: 0, nome: 'atualizar_treinos', argumentos: '{"ped' } },
          { ferramenta: { indice: 0, argumentos: 'ido":"treino em casa"}' } },
        ]),
      );

    const resposta = await chatOpenAI({ messages: [{ role: 'user', content: 'oi' }] });

    expect(resposta.texto).toBe('Já vou montar.');
    expect(resposta.ferramentas).toEqual([
      { nome: 'atualizar_treinos', argumentos: { pedido: 'treino em casa' } },
    ]);
  });

  it('sem chave não chama a rede', async () => {
    delete process.env.OPENAI_API_KEY;
    global.fetch = jest.fn();

    await expect(chatOpenAI({ messages: [] })).rejects.toBeInstanceOf(ErroServidor);
    expect(global.fetch).not.toHaveBeenCalled();
  });

  it.each([
    [401, 503],
    [429, 429],
    [500, 502],
  ])('HTTP %i vira erro %i para o app', async (status, esperado) => {
    global.fetch = jest.fn().mockResolvedValue(respostaErro(status));
    jest.spyOn(console, 'error').mockImplementation(() => {});

    await expect(chatOpenAI({ messages: [] })).rejects.toMatchObject({ status: esperado });
  });

  it('recusa sem texto vira erro 422', async () => {
    global.fetch = jest.fn().mockResolvedValue(respostaSse([{ recusa: 'Não posso.' }]));

    await expect(chatOpenAI({ messages: [] })).rejects.toMatchObject({ status: 422 });
  });
});

describe('esforcoDoPedido', () => {
  const salvo = process.env.OPENAI_ESFORCO;

  beforeEach(() => {
    delete process.env.OPENAI_ESFORCO;
  });

  afterAll(() => {
    if (salvo === undefined) {
      delete process.env.OPENAI_ESFORCO;
    } else {
      process.env.OPENAI_ESFORCO = salvo;
    }
  });

  it('desliga o raciocínio no gpt-5.x só quando há ferramentas (chat do coach)', () => {
    expect(esforcoDoPedido('gpt-5.6-luna', true)).toBe('none');
    expect(esforcoDoPedido('gpt-5.6-luna', false)).toBeUndefined();
  });

  it('modelos antigos não recebem o campo', () => {
    expect(esforcoDoPedido('gpt-4o-mini', true)).toBeUndefined();
  });

  it('OPENAI_ESFORCO manda mais que a regra', () => {
    process.env.OPENAI_ESFORCO = 'low';
    expect(esforcoDoPedido('gpt-5.6-luna', true)).toBe('low');
  });
});
