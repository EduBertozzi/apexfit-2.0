import { calcularNecessidades } from '@/features/nutricao/calculos';
import type { NivelAtividade, Objetivo, Perfil, Sexo } from '@/features/perfil/types';

import { ALIMENTOS, type Alimento } from '../alimentos';
import { planoDietaSchema, type PlanoDieta } from '../contrato';
import { montarDietaPorRegras, quantidadeDeRefeicoes } from '../regras';
import { alimentoPermitido, lerRestricoes } from '../restricoes';

const PERFIL: Perfil = {
  nome: 'Eduardo Bertozzi',
  idade: 21,
  alturaCm: 188,
  pesoKg: 75,
  sexo: 'masculino',
  nivelAtividade: 'moderado',
  objetivo: 'manter',
};

const POR_NOME = new Map<string, Alimento>(Object.values(ALIMENTOS).map((a) => [a.nome, a]));

function plano(perfil: Perfil, opcoes?: Parameters<typeof montarDietaPorRegras>[1]): PlanoDieta {
  const resultado = montarDietaPorRegras(perfil, opcoes);

  if (!resultado) {
    throw new Error('plano nulo');
  }

  return resultado;
}

function textos(p: PlanoDieta): string[] {
  return [
    p.resumo,
    p.aviso,
    ...p.dicas,
    ...p.refeicoes.flatMap((r) => [
      r.nome,
      r.horario,
      ...r.substituicoes,
      ...r.itens.flatMap((i) => [i.alimento, i.quantidade]),
    ]),
  ];
}

function alimentosDoPlano(p: PlanoDieta): Alimento[] {
  return p.refeicoes.flatMap((r) =>
    r.itens.map((item) => {
      const alimento = POR_NOME.get(item.alimento);

      if (!alimento) {
        throw new Error(`fora da tabela: ${item.alimento}`);
      }

      return alimento;
    }),
  );
}

/** Alimento sugerido em "Troque X por Y: ..." */
function alimentosDasTrocas(p: PlanoDieta): Alimento[] {
  return p.refeicoes.flatMap((r) =>
    r.substituicoes.map((texto) => {
      const nome = /por (.+?): /.exec(texto)?.[1] ?? '';
      const alimento = Object.values(ALIMENTOS).find(
        (a) => a.nome.toLowerCase() === nome.toLowerCase(),
      );

      if (!alimento) {
        throw new Error(`troca desconhecida: ${texto}`);
      }

      return alimento;
    }),
  );
}

type Caso = { perfil: Perfil; semente: number };

function grade(): Caso[] {
  const casos: Caso[] = [];
  const sexos: Sexo[] = ['masculino', 'feminino'];
  const niveis: NivelAtividade[] = ['sedentario', 'leve', 'moderado', 'alto', 'atleta'];
  const objetivos: Objetivo[] = ['perder', 'manter', 'ganhar'];
  const restricoes = [
    undefined,
    'vegano',
    'vegetariano e celíaco',
    'intolerância à lactose, alergia a amendoim e castanhas',
  ];

  for (const sexo of sexos)
    for (const pesoKg of [45, 62, 80, 110])
      for (const idade of [15, 34])
        for (const nivelAtividade of niveis)
          for (const objetivo of objetivos)
            for (const restricao of restricoes)
              casos.push({
                perfil: {
                  nome: 'Teste',
                  idade,
                  alturaCm: 170,
                  pesoKg,
                  sexo,
                  nivelAtividade,
                  objetivo,
                  restricoes: restricao,
                },
                semente: (pesoKg + idade + casos.length) % 7,
              });

  return casos;
}

describe('montarDietaPorRegras', () => {
  it('retorna null quando o perfil não tem sexo, atividade ou objetivo', () => {
    expect(montarDietaPorRegras({ ...PERFIL, sexo: undefined })).toBeNull();
    expect(montarDietaPorRegras({ ...PERFIL, objetivo: undefined })).toBeNull();
  });

  it('devolve um plano válido pelo contrato da IA', () => {
    expect(() => planoDietaSchema.parse(plano(PERFIL))).not.toThrow();
  });

  it('caloriasDia é a soma real das refeições e bate com os macros', () => {
    const p = plano(PERFIL);
    const soma = p.refeicoes.reduce((total, r) => total + r.calorias, 0);
    const pelosMacros = p.macros.proteinaG * 4 + p.macros.carboidratoG * 4 + p.macros.gorduraG * 9;

    expect(p.caloriasDia).toBe(soma);
    expect(Math.abs(pelosMacros - p.caloriasDia) / p.caloriasDia).toBeLessThan(0.04);
  });

  it('tem 4 refeições até 2.600 kcal e ganha ceia acima disso', () => {
    expect(quantidadeDeRefeicoes(2600)).toBe(4);
    expect(quantidadeDeRefeicoes(2610)).toBe(5);

    const leve = plano({ ...PERFIL, nivelAtividade: 'sedentario', objetivo: 'perder' });

    expect(leve.refeicoes.map((r) => `${r.horario} ${r.nome}`)).toEqual([
      '07:00 Café da manhã',
      '12:00 Almoço',
      '16:00 Lanche da tarde',
      '20:00 Jantar',
    ]);

    const pesado = plano({ ...PERFIL, nivelAtividade: 'atleta', objetivo: 'ganhar' });

    expect(pesado.refeicoes).toHaveLength(5);
    expect(pesado.refeicoes[4]).toMatchObject({ nome: 'Ceia', horario: '22:00' });
  });

  it('fica a até 5% da meta de calorias em toda a grade de perfis', () => {
    for (const { perfil, semente } of grade()) {
      const meta = calcularNecessidades(perfil)!.metaCalorias;
      const p = plano(perfil, { semente });

      expect({ perfil, erro: Math.abs(p.caloriasDia - meta) / meta < 0.05 }).toEqual({
        perfil,
        erro: true,
      });
    }
  });

  it('chega perto da meta de proteína em perfis comuns', () => {
    for (const objetivo of ['perder', 'manter', 'ganhar'] as const) {
      for (const semente of [0, 1, 2, 3]) {
        for (const restricoes of [undefined, 'lactose', 'vegetariano']) {
          const perfil = { ...PERFIL, objetivo, restricoes };
          const meta = calcularNecessidades(perfil)!.macros.proteinaG;
          const p = plano(perfil, { semente });

          expect(p.macros.proteinaG).toBeGreaterThanOrEqual(meta * 0.85);
          expect(p.macros.proteinaG).toBeLessThanOrEqual(meta * 1.35);
        }
      }
    }
  });

  it('é determinístico: mesma entrada, mesmo plano', () => {
    expect(plano(PERFIL, { semente: 3 })).toEqual(plano(PERFIL, { semente: 3 }));
    expect(plano(PERFIL)).toEqual(plano(PERFIL, { semente: 0 }));
  });

  it('a semente varia os cardápios', () => {
    const nomes = (p: PlanoDieta) => p.refeicoes.map((r) => r.itens.map((i) => i.alimento).join());
    const variacoes = new Set(
      [0, 1, 2, 3].map((semente) => nomes(plano(PERFIL, { semente })).join('|')),
    );

    expect(variacoes.size).toBe(4);
  });

  it('usa só alimentos da tabela com porções arredondadas', () => {
    for (const semente of [0, 1, 2, 3]) {
      const p = plano(PERFIL, { semente });

      for (const item of p.refeicoes.flatMap((r) => r.itens)) {
        const alimento = POR_NOME.get(item.alimento)!;
        const numero = Number(/^(\d+)/.exec(item.quantidade)?.[1] ?? 0);

        if (alimento.tipo !== 'livre') {
          expect(numero % alimento.passo).toBe(0);
          expect(numero).toBeGreaterThanOrEqual(alimento.min);
        }
      }
    }
  });

  it.each([
    ['vegano', 'vegano'],
    ['vegetariano', 'vegetariano'],
    ['intolerância à lactose', 'sem lactose'],
    ['doença celíaca', 'sem glúten'],
    ['alergia a amendoim', 'sem amendoim'],
    ['alergia a castanha', 'sem castanhas'],
    ['vegano e sem glúten', 'sem glúten'],
  ])('respeita a restrição "%s" nos itens e nas trocas', (restricoes, rotulo) => {
    const regras = lerRestricoes(restricoes);

    for (const semente of [0, 1, 2, 3]) {
      for (const nivelAtividade of ['sedentario', 'atleta'] as const) {
        const p = plano({ ...PERFIL, restricoes, nivelAtividade }, { semente });

        alimentosDoPlano(p).forEach((a) =>
          expect([a.id, alimentoPermitido(a, regras)]).toEqual([a.id, true]),
        );
        alimentosDasTrocas(p).forEach((a) =>
          expect([a.id, alimentoPermitido(a, regras)]).toEqual([a.id, true]),
        );
        expect(p.resumo).toContain(rotulo);
      }
    }
  });

  it('vegano não tem carne, peixe, ovo nem laticínio', () => {
    const p = plano({ ...PERFIL, restricoes: 'Sou VEGANO' });
    const nomes = p.refeicoes.flatMap((r) => r.itens.map((i) => i.alimento)).join(' ');

    expect(nomes).not.toMatch(
      /frango|patinho|tilápia|atum|ovo|leite desnatado|iogurte natural|queijo/i,
    );
  });

  it('cada refeição traz 1 ou 2 substituições', () => {
    for (const { perfil, semente } of grade().filter((_, i) => i % 5 === 0)) {
      for (const r of plano(perfil, { semente }).refeicoes) {
        expect(r.substituicoes.length).toBeGreaterThanOrEqual(1);
        expect(r.substituicoes.length).toBeLessThanOrEqual(2);
      }
    }
  });

  it('resumo tem 2 ou 3 frases com os números reais', () => {
    const p = plano(PERFIL);
    const frases = p.resumo.split(/(?<=\.)\s+/);

    expect(frases.length).toBeGreaterThanOrEqual(2);
    expect(frases.length).toBeLessThanOrEqual(3);
    expect(p.resumo).toContain(`${p.caloriasDia.toLocaleString('pt-BR')} kcal`);
    expect(p.resumo).toContain(`${p.macros.proteinaG} g de proteína`);
  });

  it('dicas (3 a 5) seguem o objetivo', () => {
    const perder = plano({ ...PERFIL, objetivo: 'perder' });
    const ganhar = plano({ ...PERFIL, objetivo: 'ganhar' });

    for (const p of [perder, ganhar, plano(PERFIL)]) {
      expect(p.dicas.length).toBeGreaterThanOrEqual(3);
      expect(p.dicas.length).toBeLessThanOrEqual(5);
    }

    expect(perder.dicas.join(' ')).toContain('salada');
    expect(ganhar.dicas.join(' ')).toContain('Depois do treino');
    expect(plano(PERFIL).dicas[0]).toContain('2.650 ml');
  });

  it('sempre avisa para procurar nutricionista ou médico', () => {
    const p = plano(PERFIL);

    expect(p.aviso).toMatch(/nutricionista/);
    expect(p.aviso).toMatch(/médico/);
  });

  it('menor de idade: linguagem leve e aviso para os responsáveis', () => {
    const p = plano({ ...PERFIL, idade: 15, objetivo: 'perder' });
    const tudo = textos(p).join(' ');

    expect(p.aviso).toContain('responsáveis');
    expect(p.resumo).toContain('ainda está crescendo');
    expect(tudo).not.toMatch(/déficit|secar|cortar|jejum|abaixo do seu gasto/i);
    expect(p.dicas.join(' ')).toContain('Não pule refeições');
  });

  it('nunca recomenda suplemento, remédio ou jejum', () => {
    for (const { perfil, semente } of grade().filter((_, i) => i % 7 === 0)) {
      expect(textos(plano(perfil, { semente })).join(' ')).not.toMatch(
        /suplement|whey|creatina|remédio|jejum/i,
      );
    }
  });

  it('não usa travessão nem emoji em nenhum texto', () => {
    for (const { perfil, semente } of grade().filter((_, i) => i % 3 === 0)) {
      for (const texto of textos(plano(perfil, { semente }))) {
        expect(texto).not.toMatch(/[—–]/);
        expect(texto).not.toMatch(/\p{Extended_Pictographic}/u);
      }
    }
  });
});

describe('montarDietaPorRegras: trocar uma refeição', () => {
  const atual = plano(PERFIL, { semente: 1 });

  it.each(['cafe', 'almoco', 'lanche', 'jantar'] as const)(
    'troca só o %s e mantém o resto do plano',
    (slot) => {
      const indice = ['cafe', 'almoco', 'lanche', 'jantar'].indexOf(slot);
      const novo = plano(PERFIL, { semente: 1, trocarRefeicao: slot, planoAtual: atual });

      novo.refeicoes.forEach((r, i) => {
        if (i === indice) {
          expect(r.itens).not.toEqual(atual.refeicoes[i].itens);
          expect(r.nome).toBe(atual.refeicoes[i].nome);
          expect(Math.abs(r.calorias - atual.refeicoes[i].calorias)).toBeLessThan(
            atual.refeicoes[i].calorias * 0.06,
          );
        } else {
          expect(r).toEqual(atual.refeicoes[i]);
        }
      });

      expect(novo.caloriasDia).toBe(novo.refeicoes.reduce((t, r) => t + r.calorias, 0));
      expect(novo.dicas).toEqual(atual.dicas);
      expect(planoDietaSchema.parse(novo)).toEqual(novo);
    },
  );

  it('recalcula os macros do dia somando a refeição nova', () => {
    const novo = plano(PERFIL, { semente: 1, trocarRefeicao: 'almoco', planoAtual: atual });
    const pelosMacros =
      novo.macros.proteinaG * 4 + novo.macros.carboidratoG * 4 + novo.macros.gorduraG * 9;
    const meta = calcularNecessidades(PERFIL)!.metaCalorias;

    expect(Math.abs(pelosMacros - novo.caloriasDia) / novo.caloriasDia).toBeLessThan(0.04);
    expect(Math.abs(novo.caloriasDia - meta) / meta).toBeLessThan(0.05);
  });

  it('trocar de novo a partir do plano trocado dá outra opção', () => {
    const uma = plano(PERFIL, { trocarRefeicao: 'jantar', planoAtual: atual });
    const duas = plano(PERFIL, { trocarRefeicao: 'jantar', planoAtual: uma });

    expect(duas.refeicoes[3].itens).not.toEqual(uma.refeicoes[3].itens);
  });

  it('funciona com um plano feito pela IA (alimentos fora da tabela)', () => {
    const daIa: PlanoDieta = {
      ...atual,
      refeicoes: atual.refeicoes.map((r) =>
        r.nome === 'Almoço'
          ? { ...r, itens: [{ alimento: 'Escondidinho de carne seca', quantidade: '1 prato' }] }
          : r,
      ),
    };
    const novo = plano(PERFIL, { trocarRefeicao: 'almoco', planoAtual: daIa });

    expect(novo.refeicoes[1].itens[0].alimento).not.toBe('Escondidinho de carne seca');
    expect(novo.macros.proteinaG).toBeGreaterThan(0);
    expect(novo.refeicoes[0]).toEqual(atual.refeicoes[0]);
  });

  it('sem plano atual, monta o plano todo variando só a refeição pedida', () => {
    const base = plano(PERFIL, { semente: 2 });
    const trocado = plano(PERFIL, { semente: 2, trocarRefeicao: 'lanche' });

    expect(trocado.refeicoes[2].itens).not.toEqual(base.refeicoes[2].itens);
    expect(trocado.refeicoes[1].itens).toEqual(base.refeicoes[1].itens);
  });

  it('se o plano atual não tem a refeição, monta um plano novo', () => {
    const semJantar = { ...atual, refeicoes: atual.refeicoes.slice(0, 3) };
    const novo = plano(PERFIL, { trocarRefeicao: 'jantar', planoAtual: semJantar });

    expect(novo.refeicoes.map((r) => r.nome)).toContain('Jantar');
  });
});
