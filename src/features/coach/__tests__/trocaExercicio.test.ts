import type { Treino } from '@/features/treinos/types';

import { aplicarPedidoExercicio, lerPedidoExercicio, nomeBate } from '../trocaExercicio';

const TREINOS: Treino[] = [
  {
    id: 'a',
    nome: 'Treino A',
    foco: 'Perna',
    dias: [1, 4],
    exercicios: [
      { id: 'a1', nome: 'Leg press 45', grupo: 'perna', series: 4, repeticoes: '12', cargaKg: 100 },
      { id: 'a2', nome: 'Esteira', grupo: 'cardio', series: 1, repeticoes: '15' },
    ],
  },
  {
    id: 'b',
    nome: 'Treino B',
    foco: 'Peito',
    dias: [5],
    exercicios: [
      { id: 'b1', nome: 'Supino reto', grupo: 'peito', series: 3, repeticoes: '10' },
      { id: 'b2', nome: 'Crucifixo', grupo: 'peito', series: 3, repeticoes: '12' },
    ],
  },
];

describe('lerPedidoExercicio', () => {
  it('troca com dia da semana', () => {
    expect(lerPedidoExercicio('troca o supino da sexta por supino inclinado')).toEqual({
      tipo: 'trocar',
      de: 'supino',
      para: 'Supino inclinado',
      dias: [5],
    });
  });

  it('troca sem dia, mantendo acentos do novo exercício', () => {
    expect(lerPedidoExercicio('Troca o leg press por elevação pélvica.')).toEqual({
      tipo: 'trocar',
      de: 'leg press',
      para: 'Elevação pélvica',
      dias: [],
    });
  });

  it('dia no fim da frase e "do treino de"', () => {
    expect(lerPedidoExercicio('troque o supino por crossover na sexta')).toMatchObject({
      de: 'supino',
      para: 'Crossover',
      dias: [5],
    });
    expect(lerPedidoExercicio('troca o leg press do treino de segunda por hack')).toMatchObject({
      de: 'leg press',
      para: 'Hack',
      dias: [1],
    });
  });

  it('tirar exercício de um dia', () => {
    expect(lerPedidoExercicio('tira cardio de segunda')).toEqual({
      tipo: 'tirar',
      alvo: 'cardio',
      dias: [1],
    });
  });

  it('sem pedido claro, null', () => {
    expect(lerPedidoExercicio('como faço supino?')).toBeNull();
  });
});

describe('nomeBate', () => {
  it('acha pelo começo de uma palavra, sem acento', () => {
    expect(nomeBate('Supino reto', 'supino')).toBe(true);
    expect(nomeBate('Leg press 45', 'leg press')).toBe(true);
    expect(nomeBate('Elevação lateral', 'elevacao lateral')).toBe(true);
    expect(nomeBate('Crucifixo', 'supino')).toBe(false);
  });
});

describe('aplicarPedidoExercicio', () => {
  it('troca só no treino do dia citado, mantendo séries e repetições', () => {
    const pedido = lerPedidoExercicio('troca o supino da sexta por supino inclinado')!;
    const resultado = aplicarPedidoExercicio(TREINOS, pedido);

    expect(resultado.ok).toBe(true);

    if (resultado.ok) {
      expect(resultado.treinos[1].exercicios![0]).toEqual({
        nome: 'Supino inclinado',
        grupo: 'peito',
        series: 3,
        repeticoes: '10',
      });
      // O treino A volta igual (sem ids)
      expect(resultado.treinos[0].exercicios!.map((e) => e.nome)).toEqual([
        'Leg press 45',
        'Esteira',
      ]);
      expect(resultado.treinos[0].exercicios![0].cargaKg).toBe(100);
    }
  });

  it('sem dia, troca onde o exercício estiver', () => {
    const resultado = aplicarPedidoExercicio(
      TREINOS,
      lerPedidoExercicio('troca o leg press por agachamento')!,
    );

    expect(resultado.ok && resultado.treinos[0].exercicios![0].nome).toBe('Agachamento');
  });

  it('tira pelo grupo citado ("cardio")', () => {
    const resultado = aplicarPedidoExercicio(TREINOS, {
      tipo: 'tirar',
      alvo: 'cardio',
      dias: [1],
    });

    expect(resultado.ok && resultado.treinos[0].exercicios!.map((e) => e.nome)).toEqual([
      'Leg press 45',
    ]);
  });

  it('dia sem treino ou exercício que não existe', () => {
    expect(
      aplicarPedidoExercicio(TREINOS, { tipo: 'trocar', de: 'supino', para: 'X', dias: [0] }),
    ).toEqual({ ok: false, motivo: 'sem-treino-no-dia' });
    expect(
      aplicarPedidoExercicio(TREINOS, { tipo: 'trocar', de: 'remada', para: 'X', dias: [] }),
    ).toEqual({ ok: false, motivo: 'sem-exercicio' });
  });
});
