import { posicaoDaAba } from '../posicaoAba';

describe('posicaoDaAba', () => {
  it('divide a barra em abas iguais com respiro e vão', () => {
    // 3 abas: 360 - 12 - 12 = 336 úteis, 112 cada
    expect(posicaoDaAba(360, 3, 0, 6, 6)).toEqual({ x: 6, largura: 112 });
    expect(posicaoDaAba(360, 3, 1, 6, 6)).toEqual({ x: 124, largura: 112 });
    expect(posicaoDaAba(360, 3, 2, 6, 6)).toEqual({ x: 242, largura: 112 });
  });

  it('antes de medir a barra não desenha nada', () => {
    expect(posicaoDaAba(0, 3, 1, 6, 6)).toEqual({ x: 0, largura: 0 });
    expect(posicaoDaAba(360, 0, 0, 6, 6)).toEqual({ x: 0, largura: 0 });
  });

  it('índice fora da faixa fica na ponta', () => {
    expect(posicaoDaAba(360, 3, 9, 6, 6).x).toBe(242);
    expect(posicaoDaAba(360, 3, -1, 6, 6).x).toBe(6);
  });
});
