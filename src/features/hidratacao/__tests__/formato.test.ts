import {
  anuncioAguaAdicionada,
  anuncioAguaDesfeita,
  dicaAguaCartao,
  formatarLitros,
  formatarLitrosFalado,
  textoAguaCartao,
} from '../formato';
import { ultimaPorcao } from '../logica';

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

describe('formatarLitrosFalado', () => {
  it.each([
    [0, '0'],
    [250, '0,25'],
    [1450, '1,45'],
    [1500, '1,5'],
    [2050, '2,05'],
    [3000, '3'],
    [10000, '10'],
    [12500, '12,5'],
    [-50, '0'],
  ])('%d ml vira "%s"', (ml, texto) => {
    expect(formatarLitrosFalado(ml)).toBe(texto);
  });
});

describe('anúncios do card de água', () => {
  it('diz quanto somou e quanto já foi', () => {
    expect(anuncioAguaAdicionada(250, 1450, 3000, false)).toBe('mais 250 ml, 1,45 de 3 litros');
  });

  it('comemora quando bate a meta', () => {
    expect(anuncioAguaAdicionada(250, 3000, 3000, true)).toBe(
      'mais 250 ml, 3 de 3 litros. meta de água batida, boa!',
    );
  });

  it('desfazer diz o que saiu, ou que não havia nada', () => {
    expect(anuncioAguaDesfeita(250, 1200, 3000)).toBe('desfeito, menos 250 ml, 1,2 de 3 litros');
    expect(anuncioAguaDesfeita(null, 0, 3000)).toBe('nada para desfazer hoje');
  });

  it('a dica explica o toque longo', () => {
    expect(dicaAguaCartao(250)).toBe(
      'toque para somar 250 ml. toque e segure para desfazer o último copo',
    );
  });

  it('nenhum texto tem travessão', () => {
    const textos = [
      anuncioAguaAdicionada(250, 3000, 3000, true),
      anuncioAguaDesfeita(500, 0, 2000),
      dicaAguaCartao(250),
    ];

    for (const texto of textos) {
      expect(texto).not.toMatch(/[–—]/);
    }
  });
});

describe('ultimaPorcao', () => {
  it('é o último copo do dia, ou nada', () => {
    expect(ultimaPorcao([250, 500])).toBe(500);
    expect(ultimaPorcao([])).toBeNull();
    expect(ultimaPorcao(undefined)).toBeNull();
  });
});
