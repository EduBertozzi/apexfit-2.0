import { msAteMeiaNoite } from '../useHoje';

describe('msAteMeiaNoite', () => {
  it('conta até a meia-noite local, com meio segundo de folga', () => {
    expect(msAteMeiaNoite(new Date(2026, 9, 7, 23, 59, 0))).toBe(60_000 + 500);
    expect(msAteMeiaNoite(new Date(2026, 9, 7, 0, 0, 0))).toBe(24 * 60 * 60 * 1000 + 500);
  });

  it('atravessa a virada do mês', () => {
    expect(msAteMeiaNoite(new Date(2026, 9, 31, 23, 0, 0))).toBe(60 * 60 * 1000 + 500);
  });
});
