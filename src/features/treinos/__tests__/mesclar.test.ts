import { chaveDoDia } from '@/shared/lib/data';
import {
  mesclarTreinos,
  restringirAosDias,
  resumoMudancas,
  sessoesValidas,
  treinosNosDias,
} from '../mesclar';
import type { DadosTreino, Sessao, Treino } from '../types';

// Sessão aberta precisa ser de hoje de verdade: de dias passados ela vira histórico
const HOJE_DE_VERDADE = chaveDoDia(new Date());

function contador() {
  let n = 0;

  return () => {
    n += 1;
    return `novo-${n}`;
  };
}

const ATUAIS: Treino[] = [
  {
    id: 't1',
    nome: 'Treino A',
    foco: 'Perna',
    dias: [1, 4],
    exercicios: [
      {
        id: 'e1',
        nome: 'Agachamento livre',
        grupo: 'perna',
        series: 3,
        repeticoes: '10',
        cargaKg: 60,
      },
      { id: 'e2', nome: 'Leg press 45', grupo: 'perna', series: 3, repeticoes: '12' },
      { id: 'e3', nome: 'Cadeira extensora', grupo: 'perna', series: 3, repeticoes: '12' },
    ],
  },
  {
    id: 't2',
    nome: 'Treino B',
    foco: 'Peito',
    exercicios: [
      { id: 'e4', nome: 'Supino reto com barra', grupo: 'peito', series: 3, repeticoes: '10' },
    ],
  },
];

/** O que a IA devolve: sem ids. */
function semIds(treinos: Treino[]): DadosTreino[] {
  return treinos.map(({ nome, foco, exercicios }) => ({
    nome,
    foco,
    exercicios: exercicios.map(({ id: _id, cargaKg: _carga, ...resto }) => resto),
  }));
}

describe('mesclarTreinos', () => {
  it('sem mudança, devolve os mesmos ids, dias e cargas', () => {
    expect(mesclarTreinos(ATUAIS, semIds(ATUAIS), contador())).toEqual(ATUAIS);
  });

  it('troca de um exercício: os outros mantêm o id; o novo ganha id novo', () => {
    const propostos = semIds(ATUAIS);
    propostos[0].exercicios![1] = {
      nome: 'Agachamento hack',
      grupo: 'perna',
      series: 3,
      repeticoes: '12',
    };

    const [a, b] = mesclarTreinos(ATUAIS, propostos, contador());

    expect(a.exercicios.map((exercicio) => exercicio.id)).toEqual(['e1', 'novo-1', 'e3']);
    expect(a.id).toBe('t1');
    expect(a.dias).toEqual([1, 4]);
    expect(b).toEqual(ATUAIS[1]);
  });

  it('acha pelo nome sem ligar para maiúscula, acento e espaços', () => {
    const propostos = semIds(ATUAIS);
    propostos[0].nome = '  treino a ';
    propostos[0].exercicios![0].nome = 'AGACHAMENTO  LIVRE';

    const [a] = mesclarTreinos(ATUAIS, propostos, contador());

    expect(a.id).toBe('t1');
    expect(a.exercicios[0]).toMatchObject({ id: 'e1', cargaKg: 60 });
  });

  it('exercício repetido no mesmo treino não reaproveita o mesmo id duas vezes', () => {
    const propostos: DadosTreino[] = [
      {
        nome: 'Treino B',
        exercicios: [
          { nome: 'Supino reto com barra', series: 3, repeticoes: '10' },
          { nome: 'Supino reto com barra', series: 3, repeticoes: '8' },
        ],
      },
    ];

    const [b] = mesclarTreinos(ATUAIS, propostos, contador());

    expect(b.exercicios.map((exercicio) => exercicio.id)).toEqual(['e4', 'novo-1']);
  });

  it('dias propostos substituem os atuais; treino novo ganha id novo', () => {
    const propostos: DadosTreino[] = [
      { ...semIds(ATUAIS)[0], dias: [2] },
      { nome: 'Treino C', exercicios: [{ nome: 'Remada baixa', series: 3, repeticoes: '10' }] },
    ];

    const [a, c] = mesclarTreinos(ATUAIS, propostos, contador());

    expect(a.dias).toEqual([2]);
    expect(c.id).toBe('novo-1');
    expect(c.dias).toBeUndefined();
  });
});

describe('resumoMudancas', () => {
  it('troca vira "X trocado por Y" no treino certo', () => {
    const propostos = semIds(ATUAIS);
    propostos[0].exercicios![1] = {
      nome: 'Agachamento livre com pausa',
      series: 3,
      repeticoes: '12',
    };
    const novos = mesclarTreinos(ATUAIS, propostos, contador());

    expect(resumoMudancas(ATUAIS, novos)).toEqual([
      'treino A: leg press 45 trocado por agachamento livre com pausa',
    ]);
  });

  it('sem mudança, lista vazia', () => {
    expect(resumoMudancas(ATUAIS, mesclarTreinos(ATUAIS, semIds(ATUAIS)))).toEqual([]);
  });

  it('entra, sai, séries, dias, treino novo e treino removido', () => {
    const novos: Treino[] = [
      {
        ...ATUAIS[0],
        dias: [2, 5],
        exercicios: [
          { ...ATUAIS[0].exercicios[0], series: 4 },
          ATUAIS[0].exercicios[1],
          ATUAIS[0].exercicios[2],
          { id: 'x', nome: 'Panturrilha em pé', series: 3, repeticoes: '15' },
        ],
      },
      {
        id: 't3',
        nome: 'Treino C',
        exercicios: [{ id: 'y', nome: 'Remada baixa', series: 3, repeticoes: '10' }],
      },
    ];

    expect(resumoMudancas(ATUAIS, novos)).toEqual([
      'treino A: entra panturrilha em pé; agachamento livre agora 4 x 10, 60 kg; agora terça e sexta',
      'treino C: novo, 1 exercício',
      'treino B: removido',
    ]);
  });

  it('sem emoji nem travessão', () => {
    const texto = resumoMudancas(ATUAIS, []).join(' ');

    expect(texto).not.toMatch(/[–—]|\p{Extended_Pictographic}/u);
  });
});

describe('sessoesValidas', () => {
  const sessoes: Sessao[] = [
    { id: 's0', treinoId: 'apagado', data: '2026-10-01', concluidos: ['z'], finalizada: true },
    {
      id: 's1',
      treinoId: 't1',
      data: HOJE_DE_VERDADE,
      concluidos: ['e1', 'e2'],
      finalizada: false,
    },
    { id: 's2', treinoId: 'apagado', data: HOJE_DE_VERDADE, concluidos: [], finalizada: false },
  ];

  it('histórico fica; sessão aberta continua só com marcas que ainda existem', () => {
    const treinos = [{ ...ATUAIS[0], exercicios: [ATUAIS[0].exercicios[0]] }];

    expect(sessoesValidas(sessoes, treinos)).toEqual([
      sessoes[0],
      { ...sessoes[1], concluidos: ['e1'] },
    ]);
  });

  it('nada mudou: devolve a mesma sessão', () => {
    expect(sessoesValidas([sessoes[1]], ATUAIS)[0]).toBe(sessoes[1]);
  });
});

describe('pedido com dia da semana', () => {
  const SEMANA: Treino[] = [
    { ...ATUAIS[0], dias: [1, 4] },
    { ...ATUAIS[1], dias: [5] },
  ];

  it('treinosNosDias acha o treino do dia', () => {
    expect(treinosNosDias(SEMANA, [5]).map((t) => t.id)).toEqual(['t2']);
    expect(treinosNosDias(SEMANA, [0])).toEqual([]);
  });

  it('só o treino do dia muda; os outros voltam iguais', () => {
    const propostos = semIds(SEMANA);
    // A IA trocou o supino (sexta) e, sem pedir, mexeu no treino A
    propostos[1].exercicios![0] = {
      nome: 'Supino inclinado',
      grupo: 'peito',
      series: 3,
      repeticoes: '10',
    };
    propostos[0].exercicios!.pop();
    propostos.push({ nome: 'Treino C', exercicios: [] });

    const mesclados = mesclarTreinos(SEMANA, propostos, contador());
    const final = restringirAosDias(SEMANA, mesclados, [5]);

    expect(final[0]).toBe(SEMANA[0]);
    expect(final[1].exercicios[0].nome).toBe('Supino inclinado');
    expect(final).toHaveLength(2);
    expect(resumoMudancas(SEMANA, final, { diasAlvo: [5] })).toEqual([
      'sexta: supino reto com barra trocado por supino inclinado',
    ]);
  });

  it('treino que cai em outros dias avisa que muda lá também', () => {
    const propostos = semIds(SEMANA);
    propostos[0].exercicios![1] = {
      nome: 'Agachamento hack',
      grupo: 'perna',
      series: 3,
      repeticoes: '12',
    };
    const final = restringirAosDias(SEMANA, mesclarTreinos(SEMANA, propostos, contador()), [4]);

    expect(resumoMudancas(SEMANA, final, { diasAlvo: [4] })).toEqual([
      'quinta: leg press 45 trocado por agachamento hack (treino A, vale também para segunda)',
    ]);
  });

  it('sem dias, não restringe nada', () => {
    const mesclados = mesclarTreinos(SEMANA, semIds(SEMANA), contador());

    expect(restringirAosDias(SEMANA, mesclados, [])).toEqual(mesclados);
  });
});
