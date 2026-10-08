import { diasDoTexto, diasPadrao, distribuirDias, textoDosDias } from '../diasIa';

describe('diasPadrao', () => {
  it.each([
    [0, []],
    [1, [1]],
    [2, [1, 4]],
    [3, [1, 3, 5]],
    [4, [1, 2, 4, 5]],
    [5, [1, 2, 3, 4, 5]],
    [6, [1, 2, 3, 4, 5, 6]],
    [7, [1, 2, 3, 4, 5, 6, 0]],
  ])('%i treinos: %j', (quantidade, dias) => {
    expect(diasPadrao(quantidade)).toEqual(dias);
  });

  it('mais de 7 usa a semana toda; negativo vira vazio', () => {
    expect(diasPadrao(9)).toHaveLength(7);
    expect(diasPadrao(-2)).toEqual([]);
  });
});

describe('diasDoTexto', () => {
  it.each([
    ['segunda, quarta e sexta', [1, 3, 5]],
    ['Treino na Terça e na Quinta-feira', [2, 4]],
    ['quero treinar sábado e domingo', [0, 6]],
    ['de segunda a sexta', [1, 2, 3, 4, 5]],
    ['seg a sex', [1, 2, 3, 4, 5]],
    ['seg, qua e sex', [1, 3]],
    ['sexta a segunda', [0, 1, 5, 6]],
    ['às segundas e quintas', [1, 4]],
  ])('"%s" vira %j', (texto, dias) => {
    expect(diasDoTexto(texto)).toEqual(dias);
  });

  it.each(['monta meu treino', 'quero ter mais força', 'treino de 45 minutos', ''])(
    'sem dia citado: "%s"',
    (texto) => {
      expect(diasDoTexto(texto)).toEqual([]);
    },
  );
});

describe('distribuirDias', () => {
  it('sem dias pedidos usa o padrão, um dia por treino', () => {
    expect(distribuirDias(3)).toEqual([[1], [3], [5]]);
    expect(distribuirDias(2, [])).toEqual([[1], [4]]);
  });

  it('com um dia pedido por treino, segue a ordem da semana (segunda primeiro)', () => {
    expect(distribuirDias(3, [5, 1, 3])).toEqual([[1], [3], [5]]);
    expect(distribuirDias(2, [0, 6])).toEqual([[6], [0]]);
  });

  it('mais dias que treinos: reparte em rodízio', () => {
    expect(distribuirDias(2, [1, 2, 4, 5])).toEqual([
      [1, 4],
      [2, 5],
    ]);
  });

  it('menos dias que treinos: ignora os pedidos e usa o padrão', () => {
    expect(distribuirDias(3, [1])).toEqual([[1], [3], [5]]);
  });

  it('treinos além de 7 ficam sem dia', () => {
    expect(distribuirDias(8).at(-1)).toEqual([]);
  });
});

describe('textoDosDias', () => {
  it('escreve por extenso, começando na segunda', () => {
    expect(textoDosDias([1, 4])).toBe('segunda e quinta');
    expect(textoDosDias([0, 1, 3])).toBe('segunda, quarta e domingo');
    expect(textoDosDias([6])).toBe('sábado');
    expect(textoDosDias([])).toBe('');
  });
});
