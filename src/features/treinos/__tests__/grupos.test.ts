import {
  agruparPorGrupo,
  blocoCompleto,
  emDuasColunas,
  limitarLista,
  esquemaAcessivel,
  inferirGrupo,
  nomeNoCard,
  rotuloDoBloco,
  textoEsquema,
} from '../grupos';
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

describe('textos dos cards', () => {
  it('esquema visível: séries x repetições, ou minutos no cardio', () => {
    expect(textoEsquema('3x12')).toBe('3x12');
    expect(textoEsquema('4x8 a 12')).toBe('4x8 a 12');
    expect(textoEsquema('1x5 min')).toBe('5 min');
    expect(textoEsquema('2x5 min')).toBe('2x 5 min');
  });

  it('esquema falado', () => {
    expect(esquemaAcessivel('3x12')).toBe('3 séries de 12');
    expect(esquemaAcessivel('1x10')).toBe('1 série de 10');
    expect(esquemaAcessivel('1x5 min')).toBe('5 minutos');
    expect(esquemaAcessivel('2x5 min')).toBe('2 séries de 5 minutos');
  });

  it('nome em minúsculas', () => {
    expect(nomeNoCard(' Remada Alta ')).toBe('remada alta');
  });

  it('rótulo completo do card, com o que já foi feito', () => {
    const [bloco] = agruparPorGrupo([
      ex('Remada alta', 3, '12', 'braco'),
      ex('Rosca direta', 3, '12'),
    ]);

    expect(rotuloDoBloco(bloco)).toBe('braço, 3 séries de 12, remada alta e rosca direta');
    expect(rotuloDoBloco(bloco, ['Remada alta'])).toBe(
      'braço, 3 séries de 12, remada alta feito e rosca direta',
    );
    expect(rotuloDoBloco(bloco, ['Remada alta', 'Rosca direta'])).toBe(
      'braço, 3 séries de 12, remada alta feito e rosca direta feito, tudo feito',
    );
    expect(blocoCompleto(bloco, ['Remada alta'])).toBe(false);
    expect(blocoCompleto(bloco, ['Remada alta', 'Rosca direta'])).toBe(true);
    expect(blocoCompleto({ ...bloco, exercicios: [] }, [])).toBe(false);
  });

  it('duas colunas: a esquerda fica com o item a mais', () => {
    expect(emDuasColunas([1, 2, 3, 4])).toEqual([
      [1, 2],
      [3, 4],
    ]);
    expect(emDuasColunas([1, 2, 3])).toEqual([[1, 2], [3]]);
    expect(emDuasColunas([])).toEqual([[], []]);
  });
});

describe('limitarLista', () => {
  it('cabe tudo: nada cortado', () => {
    expect(limitarLista([1, 2, 3], 3)).toEqual({ visiveis: [1, 2, 3], resto: 0 });
  });

  it('não cabe: guarda uma linha para o "+N"', () => {
    expect(limitarLista([1, 2, 3, 4, 5], 3)).toEqual({ visiveis: [1, 2], resto: 3 });
  });
});
