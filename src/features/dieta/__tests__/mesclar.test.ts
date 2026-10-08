import type { PlanoDieta } from '../contrato';
import { mesclarPlano, resumoMudancasDieta, slotDaRefeicao } from '../mesclar';

type Refeicao = PlanoDieta['refeicoes'][number];

function refeicao(nome: string, horario: string, calorias: number, alimento: string): Refeicao {
  return {
    nome,
    horario,
    calorias,
    itens: [{ alimento, quantidade: '100 g' }],
    substituicoes: [],
  };
}

const ATUAL: PlanoDieta = {
  resumo: 'Plano atual.',
  caloriasDia: 2000,
  macros: { proteinaG: 120, carboidratoG: 250, gorduraG: 60 },
  refeicoes: [
    refeicao('Café da manhã', '07:00', 500, 'Pão com ovo'),
    refeicao('Almoço', '12:00', 700, 'Arroz e feijão'),
    refeicao('Lanche da tarde', '16:00', 300, 'Iogurte'),
    refeicao('Jantar', '20:00', 500, 'Frango'),
  ],
  dicas: ['Beba água.'],
  aviso: 'Consulte um nutricionista.',
};

/** A IA trocou o café, mas também mexeu no jantar sem ninguém pedir. */
const DA_IA: PlanoDieta = {
  ...ATUAL,
  resumo: 'Troquei o café.',
  macros: { proteinaG: 118, carboidratoG: 255, gorduraG: 58 },
  refeicoes: [
    refeicao('Café da manhã', '07:00', 450, 'Tapioca com queijo'),
    refeicao('Almoço', '12:00', 700, 'Arroz e feijão'),
    refeicao('Lanche da tarde', '16:00', 300, 'Iogurte'),
    refeicao('Jantar', '20:00', 520, 'Peixe'),
  ],
};

describe('slotDaRefeicao', () => {
  it.each([
    ['Café da manhã', 'cafe'],
    ['Almoço', 'almoco'],
    ['Lanche da tarde', 'lanche'],
    ['Jantar', 'jantar'],
    ['Ceia', 'ceia'],
    ['Pré-treino', null],
  ])('"%s" é %s', (nome, slot) => {
    expect(slotDaRefeicao(nome)).toBe(slot);
  });
});

describe('mesclarPlano', () => {
  it('muda só a refeição pedida; as outras ficam idênticas (o mesmo objeto)', () => {
    const plano = mesclarPlano(ATUAL, DA_IA, ['cafe']);

    expect(plano.refeicoes[0]).toBe(DA_IA.refeicoes[0]);
    expect(plano.refeicoes[1]).toBe(ATUAL.refeicoes[1]);
    expect(plano.refeicoes[2]).toBe(ATUAL.refeicoes[2]);
    expect(plano.refeicoes[3]).toBe(ATUAL.refeicoes[3]);
    expect(JSON.stringify(plano.refeicoes.slice(1))).toBe(JSON.stringify(ATUAL.refeicoes.slice(1)));
  });

  it('recalcula o total do dia pela soma das refeições', () => {
    expect(mesclarPlano(ATUAL, DA_IA, ['cafe']).caloriasDia).toBe(1950);
  });

  it('se a IA esqueceu a refeição pedida, mantém a atual', () => {
    const semCafe = { ...DA_IA, refeicoes: DA_IA.refeicoes.slice(1) };

    expect(mesclarPlano(ATUAL, semCafe, ['cafe']).refeicoes).toEqual(ATUAL.refeicoes);
  });

  it('sem alvos ou sem plano atual, vale o proposto', () => {
    expect(mesclarPlano(ATUAL, DA_IA, [])).toBe(DA_IA);
    expect(mesclarPlano(null, DA_IA, ['cafe'])).toBe(DA_IA);
  });
});

describe('resumoMudancasDieta', () => {
  it('"café da manhã trocado" só para o que mudou', () => {
    expect(resumoMudancasDieta(ATUAL, mesclarPlano(ATUAL, DA_IA, ['cafe']))).toEqual([
      'café da manhã trocado',
    ]);
  });

  it('refeição nova, horário novo e refeição que sai', () => {
    const novo: PlanoDieta = {
      ...ATUAL,
      refeicoes: [
        { ...ATUAL.refeicoes[0], horario: '08:00' },
        ATUAL.refeicoes[1],
        ATUAL.refeicoes[3],
        refeicao('Ceia', '22:00', 200, 'Leite'),
      ],
    };

    expect(resumoMudancasDieta(ATUAL, novo)).toEqual([
      'café da manhã agora às 08:00',
      'ceia nova',
      'lanche da tarde sai do plano',
    ]);
  });

  it('sem plano antes, nada a comparar', () => {
    expect(resumoMudancasDieta(null, ATUAL)).toEqual([]);
  });
});
