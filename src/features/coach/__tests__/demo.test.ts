import { montarDietaPorRegras } from '@/features/dieta/regras';
import { calcularNecessidades } from '@/features/nutricao/calculos';
import type { Perfil } from '@/features/perfil/types';

import {
  alimentoEvitado,
  detectarIntencao,
  responderModoDemo,
  type DadosDemo,
  type Intencao,
} from '../demo';

const PERFIL: Perfil = {
  nome: 'Eduardo Bertozzi',
  idade: 21,
  alturaCm: 188,
  pesoKg: 75,
  sexo: 'masculino',
  nivelAtividade: 'moderado',
  objetivo: 'manter',
};

const PLANO = montarDietaPorRegras(PERFIL)!;

const DADOS: DadosDemo = {
  perfil: PERFIL,
  necessidades: calcularNecessidades(PERFIL),
  agua: { hojeMl: 1750, metaMl: 2650, diasBatidosNaSemana: 3, sequencia: 2 },
  plano: PLANO,
  hoje: 'Sábado, 3 de outubro',
  treinos: { proximo: 'Treino B', naSemana: 2, sequenciaSemanas: 4 },
  peso: { variacao30Dias: -1.2, ultimoKg: 74.3 },
};

const SEM_METAS: DadosDemo = {
  ...DADOS,
  perfil: { ...PERFIL, objetivo: undefined },
  necessidades: null,
  plano: null,
};

const MENOR_PERFIL: Perfil = {
  ...PERFIL,
  nome: 'Lia',
  idade: 15,
  sexo: 'feminino',
  objetivo: 'perder',
};

const MENOR: DadosDemo = {
  ...DADOS,
  perfil: MENOR_PERFIL,
  necessidades: calcularNecessidades(MENOR_PERFIL),
};

const PERGUNTAS: [string, Intencao][] = [
  ['Oi!', 'saudacao'],
  ['bom dia coach', 'saudacao'],
  ['Quanto de água falta hoje?', 'agua'],
  ['Monta uma dieta pra mim', 'montarDieta'],
  ['quero um plano alimentar novo', 'montarDieta'],
  ['Troca meu almoço', 'trocarRefeicao'],
  ['quero mudar o café da manhã', 'trocarRefeicao'],
  ['Me dá outra opção de jantar', 'trocarRefeicao'],
  ['Não gosto de peixe', 'evitarAlimento'],
  ['faz uma dieta sem lactose', 'evitarAlimento'],
  ['O que comer no pré-treino?', 'preTreino'],
  ['e depois do treino?', 'posTreino'],
  ['Quanta proteína eu preciso?', 'proteina'],
  ['Qual minha meta de calorias?', 'calorias'],
  ['Quero emagrecer', 'peso'],
  ['Como faço pra ganhar massa?', 'peso'],
  ['Qual meu próximo treino?', 'treino'],
  ['Tô com preguiça hoje', 'motivacao'],
  ['Estou muito cansado', 'motivacao'],
  ['Meu joelho dói quando agacho', 'dor'],
  ['Tenho uma lesão no ombro', 'dor'],
  ['Posso tomar creatina?', 'seguranca'],
  ['jejum intermitente funciona?', 'seguranca'],
  ['Quem ganhou o jogo ontem?', 'desconhecida'],
];

const SEMENTES = [0, 1, 2, 3, 4, 5];

function todasAsRespostas(): string[] {
  const textos: string[] = [];

  for (const dados of [
    DADOS,
    SEM_METAS,
    MENOR,
    { ...DADOS, treinos: undefined, peso: undefined },
  ]) {
    for (const [pergunta] of PERGUNTAS) {
      for (const semente of SEMENTES) {
        textos.push(responderModoDemo(pergunta, dados, semente).texto);
      }
    }
  }

  return textos;
}

describe('detectarIntencao', () => {
  it.each(PERGUNTAS)('"%s" → %s', (pergunta, intencao) => {
    expect(detectarIntencao(pergunta)).toBe(intencao);
  });

  it('ignora acentos e maiúsculas', () => {
    expect(detectarIntencao('ÁGUA')).toBe('agua');
    expect(detectarIntencao('PROTEÍNA')).toBe('proteina');
  });
});

describe('alimentoEvitado', () => {
  it('extrai o alimento com os acentos originais', () => {
    expect(alimentoEvitado('Não gosto de feijão')).toBe('feijão');
    expect(alimentoEvitado('não como carne vermelha')).toBe('carne vermelha');
    expect(alimentoEvitado('Odeio brócolis, sério')).toBe('brócolis');
    expect(alimentoEvitado('uma dieta sem lactose por favor')).toBe('lactose');
  });

  it('não confunde com outros assuntos', () => {
    expect(alimentoEvitado('estou sem energia')).toBeNull();
    expect(alimentoEvitado('não gosto de treinar cedo')).toBeNull();
    expect(alimentoEvitado('qual minha meta?')).toBeNull();
  });
});

describe('responderModoDemo', () => {
  it('saudação usa o primeiro nome e a água de hoje', () => {
    const { texto, acao } = responderModoDemo('Oi', DADOS);

    expect(texto).toContain('Eduardo');
    expect(texto).not.toContain('Bertozzi');
    expect(texto).toContain('1.750 ml de 2.650 ml');
    expect(texto).toContain('Treino B');
    expect(acao).toBeUndefined();
  });

  it('água: quanto bebeu, quanto falta e a sequência', () => {
    const { texto } = responderModoDemo('quanto de água?', DADOS);

    expect(texto).toContain('1.750 ml');
    expect(texto).toContain('2.650 ml');
    expect(texto).toContain('Faltam 900 ml');
    expect(texto).toContain('4 copos');
    expect(texto).toContain('sequência de 2 dias');
  });

  it('água: comemora a meta batida', () => {
    const dados = { ...DADOS, agua: { ...DADOS.agua, hojeMl: 2800 } };

    expect(responderModoDemo('água', dados).texto).toMatch(/meta de água batida/i);
  });

  it('montar dieta pede a ação de plano novo com os números da meta', () => {
    const { texto, acao } = responderModoDemo('Monta minha dieta', DADOS);

    expect(acao).toEqual({ tipo: 'dieta', novo: true });
    expect(texto).toContain('2.830 kcal');
    expect(texto).toContain('120 g de proteína');
    expect(texto).toContain('5 refeições');
  });

  it.each([
    ['troca o café da manhã', 'cafe', 'café da manhã'],
    ['muda meu almoço', 'almoco', 'almoço'],
    ['quero outro lanche', 'lanche', 'lanche'],
    ['troca a janta', 'jantar', 'jantar'],
  ] as const)('"%s" pede para trocar só essa refeição', (pergunta, slot, nome) => {
    const { texto, acao } = responderModoDemo(pergunta, DADOS);
    const refeicao = PLANO.refeicoes.find((r) =>
      r.nome.toLowerCase().startsWith(nome.split(' ')[0]),
    )!;

    expect(acao).toEqual({ tipo: 'dieta', trocarRefeicao: slot });
    expect(texto).toContain(nome);
    expect(texto).toContain(`${refeicao.calorias.toLocaleString('pt-BR')} kcal`);
    expect(texto).toContain(refeicao.itens[0].alimento.toLowerCase());
  });

  it('trocar sem plano salvo monta um plano novo', () => {
    const { acao, texto } = responderModoDemo('troca o almoço', { ...DADOS, plano: null });

    expect(acao).toEqual({ tipo: 'dieta', novo: true });
    expect(texto).toContain('ainda não tem um plano');
  });

  it('trocar e não gostar de algo na mesma frase', () => {
    const { texto, acao } = responderModoDemo('troca o jantar, não gosto de ovo', DADOS);

    expect(acao).toEqual({ tipo: 'dieta', trocarRefeicao: 'jantar' });
    expect(texto).toContain('sem ovo');
  });

  it('"não gosto de X" pede plano novo e cita o alimento', () => {
    const { texto, acao } = responderModoDemo('Não gosto de feijão', DADOS);

    expect(acao).toEqual({ tipo: 'dieta', novo: true });
    expect(texto).toContain('feijão');
    expect(texto).toContain('restrições');
  });

  it('pré-treino traz opções que respeitam a restrição e o próximo treino', () => {
    const vegano = { ...DADOS, perfil: { ...PERFIL, restricoes: 'vegano' } };
    const { texto } = responderModoDemo('o que comer antes do treino?', vegano);

    expect(texto).toContain('Treino B');
    expect(texto).not.toMatch(/queijo|ovo|frango/);
    expect(texto).toMatch(/Lanche da tarde|lanche da tarde/);
  });

  it('pós-treino diz quanta proteína por refeição', () => {
    const { texto } = responderModoDemo('pós-treino', DADOS);

    expect(texto).toContain('24 g de proteína');
  });

  it('proteína: meta, divisão por refeição e exemplos com números', () => {
    const { texto } = responderModoDemo('quanta proteína?', DADOS);

    expect(texto).toContain('120 g');
    expect(texto).toContain('24 g em cada');
    expect(texto).toContain('uns 32 g em 100 g de frango grelhado');
    expect(texto).toContain(`Seu plano atual entrega ${PLANO.macros.proteinaG} g`);
  });

  it('calorias: meta, macros e o plano salvo', () => {
    const { texto } = responderModoDemo('qual minha meta de calorias?', DADOS);
    const { proteinaG, carboidratoG, gorduraG } = DADOS.necessidades!.macros;

    expect(texto).toContain('2.830 kcal');
    expect(texto).toContain(
      `${proteinaG} g de proteína, ${carboidratoG} g de carboidrato e ${gorduraG} g de gordura`,
    );
    expect(texto).toContain(`${PLANO.caloriasDia.toLocaleString('pt-BR')} kcal em 5 refeições`);
  });

  it('calorias para quem quer perder mostra a diferença para o gasto', () => {
    const perfil = { ...PERFIL, objetivo: 'perder' as const };
    const necessidades = calcularNecessidades(perfil)!;
    const { texto } = responderModoDemo('calorias', { ...DADOS, perfil, necessidades });
    const diferenca = necessidades.gastoDiario - necessidades.metaCalorias;

    expect(texto).toContain(`${diferenca.toLocaleString('pt-BR')} kcal a menos`);
  });

  it('peso: atual, variação de 30 dias e ritmo saudável', () => {
    const { texto } = responderModoDemo('quero emagrecer', {
      ...DADOS,
      perfil: { ...PERFIL, objetivo: 'perder' },
    });

    expect(texto).toContain('74,3 kg');
    expect(texto).toContain('perdeu 1,2 kg');
    expect(texto).toContain('meio a 1 kg por semana');
  });

  it('peso sem registros pede para registrar', () => {
    const { texto } = responderModoDemo('meu peso', { ...DADOS, peso: undefined });

    expect(texto).toContain('75,0 kg');
    expect(texto).toContain('Registre seu peso');
  });

  it('treino: semana, próximo e sequência', () => {
    const { texto } = responderModoDemo('como está meu treino?', DADOS);

    expect(texto).toContain('2 vezes');
    expect(texto).toContain('Treino B');
    expect(texto).toContain('4 semanas');
  });

  it('treino sem nada montado sugere os modelos prontos', () => {
    const { texto } = responderModoDemo('academia', {
      ...DADOS,
      treinos: { naSemana: 0, sequenciaSemanas: 0 },
    });

    expect(texto).toContain('modelos prontos');
  });

  it('motivação lembra a sequência real', () => {
    expect(responderModoDemo('tô sem vontade', DADOS).texto).toContain('4 semanas seguidas');
    expect(responderModoDemo('preguiça', { ...DADOS, treinos: undefined }).texto).toContain(
      '2 dias batendo a meta de água',
    );
  });

  it('dor ou lesão manda procurar um profissional, sem ação', () => {
    const { texto, acao } = responderModoDemo('machuquei o joelho', DADOS);

    expect(texto).toMatch(/médico|fisioterapeuta/);
    expect(acao).toBeUndefined();
  });

  it('não indica suplemento, remédio ou jejum', () => {
    for (const pergunta of [
      'posso tomar whey?',
      'creatina ajuda?',
      'jejum emagrece?',
      'remédio pra emagrecer',
    ]) {
      const { texto } = responderModoDemo(pergunta, DADOS);

      expect(texto).toContain('não indico');
      expect(texto).toMatch(/nutricionista|médico/);
    }
  });

  it('pergunta desconhecida lista o que dá para fazer', () => {
    const { texto, acao } = responderModoDemo('qual a capital da França?', DADOS);

    expect(texto).toContain('modo demonstração');
    expect(texto).toContain('água');
    expect(texto).toContain('troca meu almoço');
    expect(acao).toBeUndefined();
  });

  it.each([
    'monta uma dieta',
    'troca o almoço',
    'quanta proteína?',
    'minhas calorias',
    'não gosto de peixe',
  ])('sem metas no perfil ("%s"), pede para completar o perfil', (pergunta) => {
    const { texto, acao } = responderModoDemo(pergunta, SEM_METAS);

    expect(texto).toContain('complete o perfil');
    expect(acao).toBeUndefined();
  });

  it('menor de idade: nada de linguagem de déficit agressivo', () => {
    for (const pergunta of [
      'quero emagrecer',
      'minhas calorias',
      'quero secar',
      'perder barriga',
    ]) {
      for (const semente of SEMENTES) {
        const { texto } = responderModoDemo(pergunta, MENOR, semente);

        expect(texto).not.toMatch(/déficit|a menos que seu gasto|por semana|cortar/i);
      }
    }

    expect(responderModoDemo('quero emagrecer', MENOR).texto).toContain('responsáveis');
  });

  it('sem nome no perfil, as frases continuam certas', () => {
    const dados = { ...DADOS, perfil: { ...PERFIL, nome: '   ' } };

    for (const semente of SEMENTES) {
      const { texto } = responderModoDemo('qual meu peso?', dados, semente);

      expect(texto).not.toMatch(/^,|, \.|\s,/);
      expect(texto.charAt(0)).toBe(texto.charAt(0).toUpperCase());
    }
  });

  it('é determinístico e varia com a semente', () => {
    for (const [pergunta] of PERGUNTAS) {
      expect(responderModoDemo(pergunta, DADOS, 2)).toEqual(responderModoDemo(pergunta, DADOS, 2));
    }

    const variacoes = new Set(
      SEMENTES.map((s) => responderModoDemo('quanto de água?', DADOS, s).texto),
    );

    expect(variacoes.size).toBeGreaterThanOrEqual(2);
  });

  it('respostas curtas: de 2 a 5 frases', () => {
    for (const [pergunta] of PERGUNTAS) {
      const { texto } = responderModoDemo(pergunta, DADOS);
      const frases = texto.split(/(?<=[.!?])\s+(?=[A-ZÀ-Ú])/).filter(Boolean);

      expect({ pergunta, ok: frases.length >= 2 && frases.length <= 5 }).toEqual({
        pergunta,
        ok: true,
      });
    }
  });

  it('nunca usa travessão nem emoji', () => {
    for (const texto of todasAsRespostas()) {
      expect(texto).not.toMatch(/[—–]/);
      expect(texto).not.toMatch(/\p{Extended_Pictographic}/u);
    }
  });
});
