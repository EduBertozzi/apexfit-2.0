import type { Perfil } from '@/features/perfil/types';

import { pedidoDietaSchema } from '../contrato';
import {
  alternarSem,
  linhasPreferencias,
  PREFERENCIAS_DIETA_PADRAO,
  preferenciasValidas,
  quantidadeDeRefeicoesEscolhida,
  restricoesComPreferencias,
  resumoPreferencias,
  type PreferenciasDieta,
} from '../preferencias';
import { distribuirRefeicoes, montarPromptDieta } from '../prompt';
import { montarDietaPorRegras } from '../regras';

const PERFIL: Perfil = {
  nome: 'Lucas',
  idade: 20,
  alturaCm: 178,
  pesoKg: 72,
  sexo: 'masculino',
  nivelAtividade: 'moderado',
  objetivo: 'ganhar',
};

const ESCOLHIDAS: PreferenciasDieta = {
  refeicoes: '3',
  estilo: 'vegetariano',
  sem: ['lactose'],
  orcamento: 'economica',
  preparo: 'pratico',
  evitar: 'beterraba',
  observacoes: 'almoço no trabalho',
};

describe('preferências da dieta', () => {
  it('padrão não muda nada: sem linhas no prompt e sem restrições extras', () => {
    expect(linhasPreferencias(PREFERENCIAS_DIETA_PADRAO)).toEqual([]);
    expect(restricoesComPreferencias(undefined, PREFERENCIAS_DIETA_PADRAO)).toBeUndefined();
    expect(quantidadeDeRefeicoesEscolhida(PREFERENCIAS_DIETA_PADRAO)).toBeUndefined();
    expect(resumoPreferencias(PREFERENCIAS_DIETA_PADRAO)).toBe('refeições automáticas');
  });

  it('resume as escolhas numa linha', () => {
    expect(resumoPreferencias(ESCOLHIDAS)).toBe(
      '3 refeições · vegetariano · sem lactose · econômica · rápida de fazer · com observações',
    );
  });

  it('junta estilo e o que tirar às restrições do perfil, no texto que o modo offline entende', () => {
    expect(restricoesComPreferencias('diabetes', ESCOLHIDAS)).toBe(
      'diabetes, vegetariano, sem lactose, evitar: beterraba',
    );
  });

  it('alterna o que tirar mantendo a ordem fixa', () => {
    expect(alternarSem([], 'gluten')).toEqual(['gluten']);
    expect(alternarSem(['gluten'], 'lactose')).toEqual(['lactose', 'gluten']);
    expect(alternarSem(['lactose', 'gluten'], 'lactose')).toEqual(['gluten']);
  });

  it('dados salvos estragados voltam ao padrão; campos novos ganham o padrão', () => {
    expect(preferenciasValidas(null)).toEqual(PREFERENCIAS_DIETA_PADRAO);
    expect(preferenciasValidas({ refeicoes: '9' })).toEqual(PREFERENCIAS_DIETA_PADRAO);
    expect(preferenciasValidas({ estilo: 'vegano' })).toEqual({
      ...PREFERENCIAS_DIETA_PADRAO,
      estilo: 'vegano',
    });
  });
});

describe('preferências no pedido e no prompt', () => {
  it('o contrato aceita as preferências e recusa valores fora da lista', () => {
    expect(pedidoDietaSchema.safeParse({ perfil: PERFIL, preferencias: ESCOLHIDAS }).success).toBe(
      true,
    );
    expect(
      pedidoDietaSchema.safeParse({
        perfil: PERFIL,
        preferencias: { ...ESCOLHIDAS, estilo: 'carnivoro' },
      }).success,
    ).toBe(false);
  });

  it('o prompt leva as preferências e divide o dia nas refeições escolhidas', () => {
    const prompt = montarPromptDieta(PERFIL, { preferencias: ESCOLHIDAS });

    expect(prompt).toContain('Preferências do usuário (siga todas):');
    expect(prompt).toContain('Estilo: vegetariano');
    expect(prompt).toContain('Não colocar: beterraba.');
    expect(prompt).toContain('Observações do usuário: almoço no trabalho');
    expect(prompt).not.toContain('Lanche da tarde');
  });

  it('3 refeições: café, almoço e jantar somando a meta', () => {
    const divisao = distribuirRefeicoes(3000, 3);

    expect(divisao.map((refeicao) => refeicao.nome)).toEqual(['Café da manhã', 'Almoço', 'Jantar']);
    expect(divisao.reduce((soma, refeicao) => soma + refeicao.kcal, 0)).toBe(3000);
  });

  it('modo offline respeita a quantidade de refeições e o estilo', () => {
    const plano = montarDietaPorRegras(
      { ...PERFIL, restricoes: restricoesComPreferencias(undefined, ESCOLHIDAS) },
      { refeicoes: 3 },
    );

    expect(plano?.refeicoes).toHaveLength(3);
    expect(plano?.resumo).toMatch(/vegetarian/);
  });
});
