import type { Perfil } from '@/features/perfil/types';

import { distribuirRefeicoes, montarPromptDieta, SISTEMA_DIETA } from '../prompt';

const ADULTO: Perfil = { nome: 'Ana', idade: 25, alturaCm: 165, pesoKg: 58.5 };

const COMPLETO: Perfil = {
  ...ADULTO,
  sexo: 'feminino',
  nivelAtividade: 'moderado',
  objetivo: 'perder',
};

describe('montarPromptDieta', () => {
  it('sem dia, o plano vale para a semana toda', () => {
    expect(montarPromptDieta(ADULTO)).toContain('vale para todos os dias da semana');
  });

  it('com dia, pede o plano só daquele dia e cita o treino', () => {
    const prompt = montarPromptDieta(ADULTO, { dia: 5, treinoDoDia: 'Treino B, pernas' });

    expect(prompt).toContain('plano alimentar de sexta');
    expect(prompt).toContain('Treino B, pernas');
    expect(montarPromptDieta(ADULTO, { dia: 0 })).toContain('não tenho treino marcado');
  });

  it('pede texto puro, sem markdown', () => {
    expect(SISTEMA_DIETA).toContain('nada de markdown');
  });

  it('inclui os dados formatados em pt-BR', () => {
    const prompt = montarPromptDieta(ADULTO);

    expect(prompt).toContain('Peso: 58,5 kg');
    expect(prompt).toContain('Altura: 165 cm');
  });

  it('marca campos opcionais vazios como "não informado"', () => {
    const prompt = montarPromptDieta(ADULTO);

    expect(prompt).toContain('Gordura corporal: não informado');
    expect(prompt).toContain('Restrições/Saúde: não informado');
  });

  it('adiciona cuidado extra para menores de idade', () => {
    expect(montarPromptDieta({ ...ADULTO, idade: 16 })).toContain('menor de idade');
    expect(montarPromptDieta(ADULTO)).not.toContain('menor de idade');
  });

  it('manda as metas calculadas pelo app quando o perfil está completo', () => {
    const prompt = montarPromptDieta(COMPLETO);

    expect(prompt).toContain('Objetivo: Perder gordura');
    expect(prompt).toContain('Calorias: ');
    expect(prompt).toContain('Proteína: 117 g'); // 2 g/kg × 58,5
  });

  it('não manda metas quando faltam dados para calcular', () => {
    expect(montarPromptDieta(ADULTO)).not.toContain('Metas do dia');
  });
});

describe('SISTEMA_DIETA', () => {
  it('sempre pede o aviso de procurar um profissional', () => {
    expect(SISTEMA_DIETA).toContain('nutricionista');
  });

  it('proíbe emoji e travessão no texto gerado', () => {
    expect(SISTEMA_DIETA).toContain('Nunca use emoji');
    expect(SISTEMA_DIETA).toContain('Nunca use travessão');
  });
});

describe('distribuirRefeicoes', () => {
  it('usa 4 refeições até 2600 kcal e 5 acima disso', () => {
    expect(distribuirRefeicoes(2000)).toHaveLength(4);
    expect(distribuirRefeicoes(2830)).toHaveLength(5);
  });

  it('a soma bate com a meta (± arredondamento)', () => {
    for (const meta of [1500, 2260, 2830, 3400]) {
      const soma = distribuirRefeicoes(meta).reduce((total, refeicao) => total + refeicao.kcal, 0);

      expect(Math.abs(soma - meta)).toBeLessThanOrEqual(25);
    }
  });

  it('entra no prompt quando o perfil está completo', () => {
    expect(montarPromptDieta(COMPLETO)).toContain('Divisão das refeições');
  });
});
