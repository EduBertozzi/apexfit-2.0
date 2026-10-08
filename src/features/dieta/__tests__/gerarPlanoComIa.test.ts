import { respostaSse } from '@/shared/servidor/sseSimulado';

import type { PlanoDieta } from '../contrato';
import { gerarPlanoComIa } from '../servidor/gerarDietaLocal';

const AMBIENTE = { ...process.env };

function plano(kcalPorRefeicao: number[]): PlanoDieta {
  return {
    resumo: 'Plano.',
    caloriasDia: 9999,
    macros: { proteinaG: 120, carboidratoG: 300, gorduraG: 60 },
    refeicoes: kcalPorRefeicao.map((calorias, i) => ({
      nome: `Refeição ${i + 1}`,
      horario: '12:00',
      calorias,
      itens: [{ alimento: 'Arroz', quantidade: '100 g' }],
      substituicoes: [],
    })),
    dicas: [],
    aviso: 'Consulte um nutricionista.',
  };
}

function responderPlano(dados: PlanoDieta) {
  return respostaSse([{ texto: JSON.stringify(dados) }], 64);
}

beforeEach(() => {
  process.env = { ...AMBIENTE, OPENAI_API_KEY: 'sk-teste' };
});

afterAll(() => {
  process.env = AMBIENTE;
});

describe('gerarPlanoComIa (OpenAI)', () => {
  it('soma as refeições em vez de confiar no total da IA', async () => {
    global.fetch = jest.fn().mockResolvedValue(responderPlano(plano([1000, 1000])));

    const resultado = await gerarPlanoComIa('openai', 'dados', 2000);

    expect(resultado.caloriasDia).toBe(2000);
    expect(global.fetch).toHaveBeenCalledTimes(1);
  });

  it('fora da meta: pede correção mostrando a conta', async () => {
    global.fetch = jest
      .fn()
      .mockResolvedValueOnce(responderPlano(plano([500, 500])))
      .mockResolvedValueOnce(responderPlano(plano([1000, 1050])));

    const resultado = await gerarPlanoComIa('openai', 'dados', 2000);

    expect(resultado.caloriasDia).toBe(2050);
    const segunda = JSON.parse(jest.mocked(global.fetch).mock.calls[1][1]!.body as string);
    expect(segunda.messages.at(-1).content).toContain('deu 1000 kcal, mas a meta é 2000 kcal');
  });

  it('JSON ruim duas vezes vira erro 502', async () => {
    global.fetch = jest.fn().mockImplementation(async () => respostaSse([{ texto: '{"resumo":' }]));

    await expect(gerarPlanoComIa('openai', 'dados')).rejects.toMatchObject({ status: 502 });
  });
});
