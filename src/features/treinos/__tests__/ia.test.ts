import type { RespostaTreinosIa } from '../contratoIa';
import { normalizarRepeticoes, paraDadosTreino, substituirTreinos } from '../ia';
import { useTreinosStore } from '../store';
import type { Sessao } from '../types';

const RESPOSTA: RespostaTreinosIa = {
  resumo: 'ABC.',
  treinos: [
    {
      nome: 'Treino A',
      foco: 'Peito e tríceps',
      exercicios: [
        {
          nome: 'Esteira leve',
          grupo: 'aquecimento',
          series: 1,
          repeticoes: '5 min',
          observacao: '5 minutos',
        },
        { nome: 'Supino reto com barra', grupo: 'peito', series: 9, repeticoes: '8-12 reps' },
        { nome: 'Tríceps na polia', grupo: 'braco', series: 0, repeticoes: 'até a falha' },
        { nome: 'x', grupo: 'outro', series: 3, repeticoes: '10' },
      ],
    },
    { nome: '', foco: '', exercicios: [] },
  ],
};

describe('normalizarRepeticoes', () => {
  it.each([
    ['10', '10'],
    ['8 a 12', '8 a 12'],
    ['8-12 reps', '8 a 12'],
    ['30 s', '30'],
    ['12 cada perna', '12'],
    ['até a falha', '10'],
    ['500', '100'],
  ])('"%s" vira "%s"', (entrada, saida) => {
    expect(normalizarRepeticoes(entrada)).toBe(saida);
  });
});

describe('paraDadosTreino', () => {
  it('normaliza séries e repetições, mantém o grupo e descarta o que não serve', () => {
    const dados = paraDadosTreino(RESPOSTA);

    expect(dados).toHaveLength(1);
    expect(dados[0]).toEqual({
      nome: 'Treino A',
      foco: 'Peito e tríceps',
      exercicios: [
        {
          nome: 'Esteira leve',
          grupo: 'aquecimento',
          series: 1,
          repeticoes: '5',
          observacao: '5 minutos',
        },
        { nome: 'Supino reto com barra', grupo: 'peito', series: 9, repeticoes: '8 a 12' },
        { nome: 'Tríceps na polia', grupo: 'braco', series: 1, repeticoes: '10' },
      ],
    });
  });
});

describe('substituirTreinos', () => {
  const SESSOES: Sessao[] = [
    { id: 's1', treinoId: 'velho', data: '2026-10-01', concluidos: ['e1'], finalizada: true },
    { id: 's2', treinoId: 'velho', data: '2026-10-07', concluidos: [], finalizada: false },
  ];

  it('troca os treinos, guarda o histórico e descarta a sessão aberta', () => {
    let contador = 0;
    const { treinos, sessoes } = substituirTreinos(SESSOES, paraDadosTreino(RESPOSTA), () => {
      contador += 1;
      return `id${contador}`;
    });

    expect(treinos).toHaveLength(1);
    expect(treinos[0].exercicios.map((e) => e.grupo)).toEqual(['aquecimento', 'peito', 'braco']);
    expect(sessoes.map((sessao) => sessao.id)).toEqual(['s1']);
  });

  it('a ação da store troca tudo de uma vez', () => {
    useTreinosStore.setState({ treinos: [], sessoes: SESSOES });
    useTreinosStore.getState().novoTreino();

    useTreinosStore.getState().substituirTreinos(paraDadosTreino(RESPOSTA));

    const estado = useTreinosStore.getState();
    expect(estado.treinos.map((treino) => treino.nome)).toEqual(['Treino A']);
    expect(estado.treinos[0].exercicios[1].grupo).toBe('peito');
    expect(estado.sessoes).toHaveLength(1);
  });
});
