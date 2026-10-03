import { calcularImc, calcularMetaAguaMl, classificarImc, primeiroNome } from '../calculos';

describe('calcularMetaAguaMl', () => {
  it('usa 35 ml por kg', () => {
    expect(calcularMetaAguaMl(70)).toBe(2450);
  });

  it('arredonda para múltiplos de 50 ml', () => {
    // 72,3 × 35 = 2530,5 → 2550
    expect(calcularMetaAguaMl(72.3)).toBe(2550);
  });
});

describe('calcularImc', () => {
  it('calcula com uma casa decimal', () => {
    // 70 / 1,75² = 22,857...
    expect(calcularImc(70, 175)).toBe(22.9);
  });
});

describe('classificarImc', () => {
  it.each([
    [18.4, 'abaixo'],
    [18.5, 'normal'],
    [24.9, 'normal'],
    [25, 'sobrepeso'],
    [29.9, 'sobrepeso'],
    [30, 'obesidade'],
  ] as const)('IMC %s em adulto é "%s"', (imc, faixa) => {
    expect(classificarImc(imc, 30)).toBe(faixa);
  });

  it('não classifica menores de 18 anos', () => {
    expect(classificarImc(22, 17)).toBeNull();
  });
});

describe('primeiroNome', () => {
  it('pega só o primeiro nome', () => {
    expect(primeiroNome('  Luiz   Henrique Silva ')).toBe('Luiz');
  });
});
