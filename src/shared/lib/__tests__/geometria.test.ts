import { pontosEmCirculo } from '../geometria';

describe('pontosEmCirculo', () => {
  it('devolve a quantidade pedida', () => {
    expect(pontosEmCirculo(8, 40)).toHaveLength(8);
  });

  it('começa no topo e segue no sentido horário', () => {
    const [topo, direita, baixo, esquerda] = pontosEmCirculo(4, 10);

    expect(topo).toEqual({ x: 0, y: -10 });
    expect(direita).toEqual({ x: 10, y: 0 });
    expect(baixo).toEqual({ x: 0, y: 10 });
    expect(esquerda).toEqual({ x: -10, y: 0 });
  });

  it('todos os pontos ficam na mesma distância do centro', () => {
    for (const { x, y } of pontosEmCirculo(7, 50)) {
      expect(Math.hypot(x, y)).toBeCloseTo(50, 2);
    }
  });

  it('quantidade zero, negativa ou inválida não gera pontos', () => {
    expect(pontosEmCirculo(0, 10)).toEqual([]);
    expect(pontosEmCirculo(-3, 10)).toEqual([]);
    expect(pontosEmCirculo(Number.NaN, 10)).toEqual([]);
  });
});
