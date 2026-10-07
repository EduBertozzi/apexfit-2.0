import { respostaSse } from '@/shared/servidor/sseSimulado';

import type { RespostaTreinosIa } from '../contratoIa';
import { gerarTreinos, treinosValidos } from '../servidor/gerarTreinos';

const AMBIENTE = { ...process.env };

const RESPOSTA: RespostaTreinosIa = {
  resumo: 'Divisão ABC.',
  treinos: [
    {
      nome: 'Treino A',
      foco: 'Peito',
      exercicios: [
        { nome: 'Supino reto com barra', grupo: 'peito', series: 3, repeticoes: '8 a 12' },
      ],
    },
  ],
};

/** A OpenAI manda campos opcionais como null (formato estrito). */
const COM_NULL = JSON.stringify({
  ...RESPOSTA,
  treinos: [
    {
      ...RESPOSTA.treinos[0],
      exercicios: [{ ...RESPOSTA.treinos[0].exercicios[0], observacao: null }],
    },
  ],
});

/** Corta o JSON em vários pedaços de texto, como chega pelo streaming. */
function emPedacos(texto: string) {
  return respostaSse(texto.match(/.{1,25}/gs)!.map((parte) => ({ texto: parte })));
}

beforeEach(() => {
  process.env = { ...AMBIENTE, OPENAI_API_KEY: 'sk-teste' };
});

afterAll(() => {
  process.env = AMBIENTE;
});

describe('gerarTreinos com OpenAI', () => {
  it('junta o JSON do streaming, tira os null e valida', async () => {
    global.fetch = jest.fn().mockResolvedValue(emPedacos(COM_NULL));

    await expect(gerarTreinos('openai', 'dados do usuário')).resolves.toEqual(RESPOSTA);

    const corpo = JSON.parse(jest.mocked(global.fetch).mock.calls[0][1]!.body as string);
    expect(corpo.response_format.json_schema.name).toBe('treinos');
    expect(corpo.messages[1].content).toBe('dados do usuário');
  });

  it('tenta de novo uma vez quando vem incompleto', async () => {
    global.fetch = jest
      .fn()
      .mockResolvedValueOnce(emPedacos('{"resumo":"x","treinos":[]}'))
      .mockResolvedValueOnce(emPedacos(COM_NULL));

    await expect(gerarTreinos('openai', 'x')).resolves.toEqual(RESPOSTA);
    expect(global.fetch).toHaveBeenCalledTimes(2);
  });

  it('desiste depois de duas respostas ruins', async () => {
    global.fetch = jest.fn().mockImplementation(async () => emPedacos('não é json'));

    await expect(gerarTreinos('openai', 'x')).rejects.toMatchObject({ status: 502 });
    expect(global.fetch).toHaveBeenCalledTimes(2);
  });
});

describe('treinosValidos', () => {
  it('exige treino e exercício', () => {
    expect(treinosValidos(RESPOSTA)).toBe(true);
    expect(treinosValidos(null)).toBe(false);
    expect(treinosValidos({ resumo: '', treinos: [] })).toBe(false);
    expect(treinosValidos({ resumo: '', treinos: [{ nome: 'A', foco: '', exercicios: [] }] })).toBe(
      false,
    );
  });
});
