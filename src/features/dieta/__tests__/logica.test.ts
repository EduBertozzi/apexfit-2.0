import { planoDesatualizado } from '../logica';

describe('planoDesatualizado', () => {
  it('aceita a pequena diferença de arredondamento da IA', () => {
    expect(planoDesatualizado(2800, 2830)).toBe(false);
    expect(planoDesatualizado(2960, 2830)).toBe(false); // +4,6%
  });

  it('marca quando a meta mudou mais de 5%', () => {
    expect(planoDesatualizado(2830, 2260)).toBe(true); // mudou para "perder gordura"
    expect(planoDesatualizado(2260, 2830)).toBe(true);
  });

  it('não marca quando não há meta para comparar', () => {
    expect(planoDesatualizado(2830, null)).toBe(false);
    expect(planoDesatualizado(2830, 0)).toBe(false);
  });
});
