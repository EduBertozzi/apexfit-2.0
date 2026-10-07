import { formatarLitros, textoAguaCartao } from '../formato';

describe('formatarLitros', () => {
  it.each([
    [0, '0'],
    [250, '0,3'],
    [1200, '1,2'],
    [2450, '2,5'],
    [3000, '3'],
    [12500, '12,5'],
    [-100, '0'],
  ])('%d ml vira "%s"', (ml, texto) => {
    expect(formatarLitros(ml)).toBe(texto);
  });

  it('nunca mostra ",0"', () => {
    expect(formatarLitros(1990)).toBe('2');
  });
});

describe('textoAguaCartao', () => {
  it('monta o "1,2 /3L" e a frase do leitor de tela', () => {
    expect(textoAguaCartao(1200, 3000)).toEqual({
      total: '1,2',
      meta: '/3L',
      acessivel: 'água, 1,2 de 3 litros hoje',
    });
  });
});
