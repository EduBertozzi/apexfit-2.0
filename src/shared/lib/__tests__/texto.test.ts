import { minusculaInicial } from '../texto';

describe('minusculaInicial', () => {
  it('deixa a primeira letra minúscula', () => {
    expect(minusculaInicial('Treino A')).toBe('treino A');
    expect(minusculaInicial('Corpo todo')).toBe('corpo todo');
    expect(minusculaInicial('Ênfase em perna')).toBe('ênfase em perna');
  });

  it('mantém siglas e textos já minúsculos', () => {
    expect(minusculaInicial('HIIT na esteira')).toBe('HIIT na esteira');
    expect(minusculaInicial('treino B')).toBe('treino B');
    expect(minusculaInicial('')).toBe('');
  });
});
