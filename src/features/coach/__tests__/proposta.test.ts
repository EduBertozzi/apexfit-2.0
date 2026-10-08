import type { PlanoDieta } from '@/features/dieta/contrato';
import type { DadosTreino, Treino } from '@/features/treinos/types';

import {
  aplicarProposta,
  desfazerProposta,
  esquecerAnteriores,
  podeDesfazer,
  propostaDeDieta,
  propostaDeTreinos,
  recusarProposta,
  type Proposta,
} from '../proposta';

function contador() {
  let n = 0;

  return () => {
    n += 1;
    return `id-${n}`;
  };
}

const PLANO: PlanoDieta = {
  resumo: 'Plano.',
  caloriasDia: 2830,
  macros: { proteinaG: 120, carboidratoG: 446, gorduraG: 63 },
  refeicoes: [
    {
      nome: 'Café da manhã',
      horario: '07:00',
      calorias: 830,
      itens: [{ alimento: 'Pão', quantidade: '2 fatias' }],
      substituicoes: [],
    },
    {
      nome: 'Almoço',
      horario: '12:00',
      calorias: 2000,
      itens: [{ alimento: 'Arroz', quantidade: '200 g' }],
      substituicoes: [],
    },
  ],
  dicas: [],
  aviso: 'Consulte um nutricionista.',
};

const NOVO_CAFE: PlanoDieta = {
  ...PLANO,
  refeicoes: [
    { ...PLANO.refeicoes[0], itens: [{ alimento: 'Tapioca', quantidade: '1' }] },
    PLANO.refeicoes[1],
  ],
};

describe('propostaDeDieta', () => {
  it('plano novo sem nada antes: título com kcal e refeições, sem mudanças', () => {
    const proposta = propostaDeDieta(null, PLANO, { modo: 'novo', alvos: [], origem: 'ia' });

    expect(proposta).toMatchObject({
      tipo: 'dieta',
      estado: 'pendente',
      origem: 'ia',
      resumo: {
        titulo: '2.830 kcal em 2 refeições',
        mudancas: [],
        linhas: ['07:00 café da manhã: 830 kcal', '12:00 almoço: 2.000 kcal'],
      },
    });
  });

  it('plano novo no lugar de outro avisa que substitui', () => {
    expect(
      propostaDeDieta(PLANO, NOVO_CAFE, { modo: 'novo', alvos: [], origem: 'ia' })?.resumo.mudancas,
    ).toEqual(['plano novo no lugar do atual']);
  });

  it('ajuste: diz o que mudou', () => {
    const proposta = propostaDeDieta(PLANO, NOVO_CAFE, {
      modo: 'ajuste',
      alvos: ['cafe'],
      origem: 'demo',
    });

    expect(proposta?.resumo.mudancas).toEqual(['café da manhã trocado']);
    expect(proposta?.plano.refeicoes[1]).toBe(PLANO.refeicoes[1]);
  });

  it('ajuste que não mudou nada não vira proposta', () => {
    expect(propostaDeDieta(PLANO, PLANO, { modo: 'ajuste', alvos: [], origem: 'ia' })).toBeNull();
  });
});

const ATUAIS: Treino[] = [
  {
    id: 't1',
    nome: 'Treino A',
    dias: [2],
    exercicios: [
      { id: 'e1', nome: 'Leg press 45', series: 3, repeticoes: '12' },
      { id: 'e2', nome: 'Cadeira extensora', series: 3, repeticoes: '12' },
    ],
  },
];

describe('propostaDeTreinos', () => {
  const TRES: DadosTreino[] = ['A', 'B', 'C'].map((letra) => ({
    nome: `Treino ${letra}`,
    exercicios: [{ nome: 'Prancha', series: 3, repeticoes: '30' }],
  }));

  it('conjunto novo ganha os dias padrão e cita os dias no resumo', () => {
    const proposta = propostaDeTreinos([], TRES, { modo: 'novo' }, contador());

    expect(proposta?.treinos.map((treino) => treino.dias)).toEqual([[1], [3], [5]]);
    expect(proposta?.resumo).toEqual({
      titulo: '3 treinos',
      mudancas: [],
      linhas: [
        'treino A: segunda, 1 exercício',
        'treino B: quarta, 1 exercício',
        'treino C: sexta, 1 exercício',
      ],
    });
  });

  it('conjunto novo usa os dias pedidos e avisa que substitui os atuais', () => {
    const proposta = propostaDeTreinos(
      ATUAIS,
      TRES.slice(0, 2),
      { modo: 'novo', diasPedidos: [2, 4] },
      contador(),
    );

    expect(proposta?.resumo.linhas).toEqual([
      'treino A: terça, 1 exercício',
      'treino B: quinta, 1 exercício',
    ]);
    expect(proposta?.resumo.mudancas).toEqual(['substitui 1 treino atual']);
    // Mesmo nome: o treino A continua com o mesmo id
    expect(proposta?.treinos[0].id).toBe('t1');
  });

  it('ajuste mantém dias e ids e lista só a mudança', () => {
    const proposta = propostaDeTreinos(
      ATUAIS,
      [
        {
          nome: 'Treino A',
          exercicios: [
            { nome: 'Agachamento livre', series: 3, repeticoes: '12' },
            { nome: 'Cadeira extensora', series: 3, repeticoes: '12' },
          ],
        },
      ],
      { modo: 'ajuste', diasPedidos: [5] },
      contador(),
    );

    expect(proposta?.treinos[0]).toMatchObject({ id: 't1', dias: [2] });
    expect(proposta?.treinos[0].exercicios[1].id).toBe('e2');
    expect(proposta?.resumo.mudancas).toEqual([
      'treino A: leg press 45 trocado por agachamento livre',
    ]);
    expect(proposta?.resumo.linhas).toEqual(['treino A: terça, 2 exercícios']);
  });

  it('ajuste sem mudança ou sem treinos não vira proposta', () => {
    const iguais = ATUAIS.map(({ nome, exercicios }) => ({
      nome,
      exercicios: exercicios.map(({ nome: n, series, repeticoes }) => ({
        nome: n,
        series,
        repeticoes,
      })),
    }));

    expect(propostaDeTreinos(ATUAIS, iguais, { modo: 'ajuste' })).toBeNull();
    expect(propostaDeTreinos(ATUAIS, [], { modo: 'novo' })).toBeNull();
  });
});

describe('estados da proposta', () => {
  const pendente = propostaDeDieta(null, PLANO, { modo: 'novo', alvos: [], origem: 'ia' })!;
  const anterior = { plano: null, origem: null, geradoEm: null };

  it('aplicar guarda o antes e permite desfazer', () => {
    const aplicada = aplicarProposta(pendente, anterior);

    expect(aplicada.estado).toBe('aplicado');
    expect(aplicada.anterior).toEqual(anterior);
    expect(podeDesfazer(aplicada)).toBe(true);
  });

  it('desfazer volta para pendente, sem o antes', () => {
    const desfeita = desfazerProposta(aplicarProposta(pendente, anterior));

    expect(desfeita.estado).toBe('pendente');
    expect('anterior' in desfeita).toBe(false);
    expect(podeDesfazer(desfeita)).toBe(false);
  });

  it('recusar marca como descartada', () => {
    expect(recusarProposta(pendente).estado).toBe('descartado');
    expect(podeDesfazer(recusarProposta(pendente))).toBe(false);
  });

  it('esquecerAnteriores tira o "desfazer" das outras do mesmo tipo', () => {
    const aplicada: Proposta = aplicarProposta(pendente, anterior);
    const treinos: Proposta = aplicarProposta(
      propostaDeTreinos([], [{ nome: 'Treino A', exercicios: [] }], { modo: 'novo' }, contador())!,
      { treinos: [] },
    );
    const mensagens = [
      { id: '1', proposta: aplicada },
      { id: '2', proposta: treinos },
      { id: '3', proposta: aplicada },
      { id: '4' },
    ];

    const resultado = esquecerAnteriores(mensagens, 'dieta', '3');

    expect(resultado[0].proposta?.anterior).toBeUndefined();
    expect(resultado[0].proposta?.estado).toBe('aplicado');
    expect(resultado[1]).toBe(mensagens[1]);
    expect(resultado[2]).toBe(mensagens[2]);
    expect(resultado[3]).toBe(mensagens[3]);
  });
});
