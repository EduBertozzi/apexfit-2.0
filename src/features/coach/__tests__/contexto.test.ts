import { calcularNecessidades } from '@/features/nutricao/calculos';
import type { Perfil } from '@/features/perfil/types';

import { montarContextoCoach, type DadosContexto } from '../contexto';
import { LIMITES_COACH } from '../contrato';

const PERFIL: Perfil = {
  nome: 'Eduardo',
  idade: 21,
  alturaCm: 188,
  pesoKg: 75,
  sexo: 'masculino',
  nivelAtividade: 'moderado',
  objetivo: 'manter',
};

const BASE: DadosContexto = {
  perfil: PERFIL,
  necessidades: calcularNecessidades(PERFIL),
  agua: { hojeMl: 1750, metaMl: 2650, diasBatidosNaSemana: 3, sequencia: 2 },
  plano: null,
  hoje: 'Sábado, 3 de outubro',
};

describe('montarContextoCoach', () => {
  it('inclui perfil, metas e água com números em pt-BR', () => {
    const texto = montarContextoCoach(BASE);

    expect(texto).toContain('Peso: 75,0 kg');
    expect(texto).toContain('Meta de calorias: 2.830 kcal');
    expect(texto).toContain('Hoje: 1.750 de 2.650 ml');
    expect(texto).toContain('Nenhum plano salvo ainda.');
  });

  it('marca menor de idade e perfil sem metas', () => {
    const texto = montarContextoCoach({
      ...BASE,
      perfil: { ...PERFIL, idade: 16, objetivo: undefined },
      necessidades: null,
    });

    expect(texto).toContain('MENOR DE IDADE');
    expect(texto).toContain('Sem metas');
  });

  it('descreve cada refeição da dieta salva', () => {
    const texto = montarContextoCoach({
      ...BASE,
      plano: {
        resumo: 'x',
        caloriasDia: 2800,
        macros: { proteinaG: 120, carboidratoG: 440, gorduraG: 65 },
        refeicoes: [
          {
            nome: 'Café da manhã',
            horario: '07:00',
            calorias: 600,
            itens: [{ alimento: 'Ovos', quantidade: '3 unidades' }],
            substituicoes: [],
          },
        ],
        dicas: [],
        aviso: 'x',
      },
    });

    expect(texto).toContain('07:00 Café da manhã, 600 kcal: Ovos (3 unidades)');
  });

  it('adiciona blocos extras e respeita o limite de tamanho', () => {
    expect(montarContextoCoach({ ...BASE, extras: ['## Treinos\nTreino A'] })).toContain(
      '## Treinos',
    );

    const enorme = montarContextoCoach({ ...BASE, extras: ['x'.repeat(20000)] });
    expect(enorme.length).toBeLessThanOrEqual(LIMITES_COACH.contexto);
    expect(enorme).toContain('[contexto cortado]');
  });
});
