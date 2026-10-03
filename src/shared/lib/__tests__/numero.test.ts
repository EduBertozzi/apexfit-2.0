import { formatarNumero, paraDecimal, paraInteiro } from '../numero';

describe('paraDecimal', () => {
  it('aceita número com ponto', () => {
    expect(paraDecimal('70.5')).toBe(70.5);
  });

  it('aceita número com vírgula (bug que fechava o app na v1)', () => {
    expect(paraDecimal('1,75')).toBe(1.75);
  });

  it('ignora espaços nas pontas', () => {
    expect(paraDecimal('  80 ')).toBe(80);
  });

  it.each(['', '.', ',', 'abc', '70kg', '-5', '1e3', '1,2,3', 'NaN', 'Infinity'])(
    'recusa "%s"',
    (texto) => {
      expect(paraDecimal(texto)).toBeNull();
    },
  );
});

describe('paraInteiro', () => {
  it('aceita inteiro', () => {
    expect(paraInteiro('16')).toBe(16);
  });

  it('recusa decimal', () => {
    expect(paraInteiro('16,5')).toBeNull();
  });

  it('recusa vazio', () => {
    expect(paraInteiro('')).toBeNull();
  });
});

describe('formatarNumero', () => {
  it('usa vírgula decimal e ponto de milhar', () => {
    expect(formatarNumero(2450.5, 1)).toBe('2.450,5');
  });
});
