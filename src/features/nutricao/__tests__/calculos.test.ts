import type { Perfil } from '@/features/perfil/types';

import { calcularNecessidades, calcularTmb } from '../calculos';

const EDUARDO: Perfil = {
  nome: 'Eduardo',
  idade: 21,
  alturaCm: 188,
  pesoKg: 75,
  sexo: 'masculino',
  nivelAtividade: 'moderado',
  objetivo: 'manter',
};

describe('calcularTmb', () => {
  it('usa Mifflin-St Jeor para homens', () => {
    // 10×75 + 6,25×188 − 5×21 + 5 = 1825
    expect(calcularTmb({ ...EDUARDO, sexo: 'masculino' })).toBe(1825);
  });

  it('usa Mifflin-St Jeor para mulheres', () => {
    // 10×60 + 6,25×165 − 5×30 − 161 = 1320,25
    expect(
      calcularTmb({ nome: 'Ana', idade: 30, alturaCm: 165, pesoKg: 60, sexo: 'feminino' }),
    ).toBe(1320);
  });

  it('usa Katch-McArdle quando tem % de gordura', () => {
    // massa magra = 75 × 0,85 = 63,75 kg → 370 + 21,6 × 63,75 = 1747
    expect(calcularTmb({ ...EDUARDO, sexo: 'masculino', percentualGordura: 15 })).toBe(1747);
  });
});

describe('calcularNecessidades', () => {
  it('retorna null em perfis antigos sem sexo, atividade ou objetivo', () => {
    expect(calcularNecessidades({ ...EDUARDO, sexo: undefined })).toBeNull();
    expect(calcularNecessidades({ ...EDUARDO, nivelAtividade: undefined })).toBeNull();
    expect(calcularNecessidades({ ...EDUARDO, objetivo: undefined })).toBeNull();
  });

  it('calcula gasto, meta e macros para manter o peso', () => {
    expect(calcularNecessidades(EDUARDO)).toEqual({
      tmb: 1825,
      gastoDiario: 2830, // 1825 × 1,55
      metaCalorias: 2830,
      macros: {
        proteinaG: 120, // 1,6 g/kg
        gorduraG: 63, // 20% das calorias passa de 0,8 g/kg
        carboidratoG: 446, // o resto das calorias
      },
    });
  });

  it('aplica déficit de 20% para perder gordura e sobe a proteína', () => {
    const resultado = calcularNecessidades({ ...EDUARDO, objetivo: 'perder' });

    expect(resultado?.metaCalorias).toBe(2260);
    expect(resultado?.macros.proteinaG).toBe(150); // 2 g/kg
  });

  it('aplica superávit de 10% para ganhar massa', () => {
    expect(calcularNecessidades({ ...EDUARDO, objetivo: 'ganhar' })?.metaCalorias).toBe(3110);
  });

  it('usa ajustes mais leves para menores de 18', () => {
    const resultado = calcularNecessidades({ ...EDUARDO, idade: 16, objetivo: 'perder' });
    // TMB 1850 × 1,55 = 2867,5 → 2870; déficit de 10% → 2583 → 2580
    expect(resultado?.metaCalorias).toBe(2580);
  });

  it('nunca recomenda menos que o mínimo seguro', () => {
    const resultado = calcularNecessidades({
      nome: 'Bia',
      idade: 40,
      alturaCm: 150,
      pesoKg: 45,
      sexo: 'feminino',
      nivelAtividade: 'sedentario',
      objetivo: 'perder',
    });

    expect(resultado?.metaCalorias).toBe(1200);
  });

  it('macros sempre fecham com a meta de calorias (± arredondamento)', () => {
    const r = calcularNecessidades({ ...EDUARDO, objetivo: 'ganhar', nivelAtividade: 'alto' })!;
    const kcal = r.macros.proteinaG * 4 + r.macros.carboidratoG * 4 + r.macros.gorduraG * 9;

    expect(Math.abs(kcal - r.metaCalorias)).toBeLessThanOrEqual(4);
  });
});
