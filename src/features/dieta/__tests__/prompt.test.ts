import type { Perfil } from '@/features/perfil/types';

import { montarPromptDieta } from '../prompt';

const ADULTO: Perfil = { nome: 'Ana', idade: 25, alturaCm: 165, pesoKg: 58.5 };

describe('montarPromptDieta', () => {
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

  it('sempre pede o aviso de procurar um profissional', () => {
    expect(montarPromptDieta(ADULTO)).toContain('nutricionista');
  });

  it('adiciona cuidado extra para menores de idade', () => {
    expect(montarPromptDieta({ ...ADULTO, idade: 16 })).toContain('menor de idade');
    expect(montarPromptDieta(ADULTO)).not.toContain('menor de idade');
  });
});
