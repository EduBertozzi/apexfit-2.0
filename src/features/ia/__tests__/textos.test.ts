import type { PlanoDieta } from '@/features/dieta/contrato';

import { resumoDieta, resumoTreinosGerados, textoOrigem, textoOrigemDieta } from '../textos';

const PLANO: PlanoDieta = {
  resumo: 'x',
  caloriasDia: 2830,
  macros: { proteinaG: 120, carboidratoG: 400, gorduraG: 70 },
  refeicoes: [
    { nome: 'Almoço', horario: '12:00', calorias: 1400, itens: [], substituicoes: [] },
    { nome: 'Jantar', horario: '20:00', calorias: 1430, itens: [], substituicoes: [] },
  ],
  dicas: [],
  aviso: 'x',
};

describe('textos da central de IA', () => {
  it('diz qual IA respondeu', () => {
    expect(textoOrigem('openai')).toBe('feito pelo ChatGPT');
    expect(textoOrigem('demo')).toBe('modo demonstração');
    expect(textoOrigem(null)).toBeNull();
  });

  it('origem da dieta: demo, IA conhecida ou IA sem nome', () => {
    expect(textoOrigemDieta('demo', null)).toBe('modo demonstração');
    expect(textoOrigemDieta('ia', 'claude')).toBe('feito pelo Claude');
    expect(textoOrigemDieta('ia', undefined)).toBe('feito pela IA');
    expect(textoOrigemDieta(null, null)).toBeNull();
  });

  it('resume a dieta e os treinos', () => {
    expect(resumoDieta(PLANO)).toBe('2.830 kcal em 2 refeições');
    expect(resumoDieta(null)).toMatch(/^ainda sem plano/);
    expect(resumoTreinosGerados(1)).toBe('1 treino pronto na tela inicial');
    expect(resumoTreinosGerados(4)).toBe('4 treinos prontos na tela inicial');
  });
});
