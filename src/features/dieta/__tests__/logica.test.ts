import { planoDesatualizado, textoDietaInicio } from '../logica';

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

describe('textoDietaInicio', () => {
  const plano = (refeicoes: number, caloriasDia: number) => ({
    refeicoes: Array.from({ length: refeicoes }, () => ({})),
    caloriasDia,
  });

  it('com plano: refeições e calorias, e abre a dieta', () => {
    expect(textoDietaInicio(plano(5, 2970), 2970)).toEqual({
      linha: '5 refeições · 2.970 kcal',
      dica: null,
      acessivel: 'dieta: 5 refeições, 2.970 quilocalorias por dia',
      dicaToque: 'abre a dieta',
      destino: '/dieta',
    });
    expect(textoDietaInicio(plano(1, 800), null).linha).toBe('1 refeição · 800 kcal');
  });

  it('sem plano: a meta do dia e o convite para montar', () => {
    expect(textoDietaInicio(null, 2970)).toMatchObject({
      linha: 'meta do dia 2.970 kcal',
      dica: 'montar dieta',
      destino: '/dieta',
    });
  });

  it('sem plano e sem meta: leva para completar o perfil', () => {
    expect(textoDietaInicio(null, null)).toMatchObject({
      linha: 'complete o perfil',
      destino: '/editar-perfil',
    });
  });

  it('com plano, abre a dieta mesmo sem meta no perfil', () => {
    expect(textoDietaInicio(plano(4, 2000), null).destino).toBe('/dieta');
  });
});
