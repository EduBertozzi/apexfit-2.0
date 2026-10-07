import { agruparPorGrupo, inferirGrupo } from '../grupos';
import type { Exercicio } from '../types';

function ex(nome: string, series = 3, repeticoes = '12', grupo?: Exercicio['grupo']): Exercicio {
  return { id: nome, nome, series, repeticoes, grupo };
}

describe('inferirGrupo', () => {
  it.each([
    ['Agachamento livre', 'perna'],
    ['Leg 180°', 'perna'],
    ['Supino reto', 'peito'],
    ['Remada cavalinho', 'costas'],
    ['Rosca direta', 'braco'],
    ['Tríceps testa', 'braco'],
    ['Elevação lateral', 'ombro'],
    ['Abdominal infra', 'abdominal'],
    ['Prancha', 'abdominal'],
    ['Elíptico', 'cardio'],
    ['Polichinelo', 'aquecimento'],
    ['Algo inventado', 'outro'],
  ])('"%s" é %s', (nome, grupo) => {
    expect(inferirGrupo(nome)).toBe(grupo);
  });
});

describe('agruparPorGrupo', () => {
  it('agrupa na ordem da tela e respeita o grupo informado', () => {
    const blocos = agruparPorGrupo([
      ex('Elíptico', 1, '5 min'),
      ex('Leg 180°'),
      ex('Polichinelo', 2, '10'),
      ex('Remada alta', 3, '12', 'braco'),
    ]);

    expect(blocos.map((bloco) => bloco.grupo)).toEqual(['aquecimento', 'braco', 'perna', 'cardio']);
  });

  it('usa o esquema de séries mais comum do grupo', () => {
    const [bloco] = agruparPorGrupo([
      ex('Rosca direta', 3, '12'),
      ex('Rosca martelo', 4, '10'),
      ex('Tríceps testa', 4, '10'),
    ]);

    expect(bloco.esquema).toBe('4x10');
  });

  it('treino vazio não tem blocos', () => {
    expect(agruparPorGrupo([])).toEqual([]);
  });
});
