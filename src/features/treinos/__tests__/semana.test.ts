import {
  diasDaSemana,
  estadoPelaFracao,
  fracaoDoDia,
  nomeDoDia,
  resumoDaSemana,
  resumoDoDia,
  rotuloDoDia,
  sequenciaDeDias,
  sessaoQueVale,
  textoSequencia,
} from '../semana';
import type { Sessao, Treino } from '../types';

// Quarta, 7 de outubro de 2026. A semana vai de domingo, 4, a sábado, 10.
const HOJE = '2026-10-07';

// Treino com 4 exercícios: 2 feitos = 50%, 3 = 75%, 4 = 100%
const TREINO: Treino = {
  id: 't',
  nome: 'Treino A',
  exercicios: ['e1', 'e2', 'e3', 'e4'].map((id) => ({
    id,
    nome: id,
    series: 3,
    repeticoes: '10',
  })),
};

function sessao(data: string, feitos: number, extra: Partial<Sessao> = {}): Sessao {
  return {
    id: `s-${data}-${feitos}`,
    treinoId: 't',
    data,
    concluidos: ['e1', 'e2', 'e3', 'e4'].slice(0, feitos),
    finalizada: true,
    ...extra,
  };
}

describe('sessaoQueVale', () => {
  it('prefere a última finalizada do dia', () => {
    const finalizada = sessao(HOJE, 4);
    const aberta = sessao(HOJE, 1, { id: 'aberta', finalizada: false });

    expect(sessaoQueVale([finalizada, aberta], HOJE)).toBe(finalizada);
  });

  it('sem finalizada, vale a última do dia (em andamento)', () => {
    const aberta = sessao(HOJE, 1, { finalizada: false });

    expect(sessaoQueVale([sessao('2026-10-06', 4), aberta], HOJE)).toBe(aberta);
  });

  it('dia sem sessão', () => {
    expect(sessaoQueVale([], HOJE)).toBeNull();
  });
});

describe('fracaoDoDia', () => {
  it('feitos dividido pelos exercícios do treino', () => {
    expect(fracaoDoDia([TREINO], [sessao(HOJE, 3)], HOJE)).toBe(0.75);
  });

  it('sem sessão é null', () => {
    expect(fracaoDoDia([TREINO], [], HOJE)).toBeNull();
  });

  it('treino apagado: finalizada conta como completa, aberta como zero', () => {
    expect(fracaoDoDia([], [sessao(HOJE, 1)], HOJE)).toBe(1);
    expect(fracaoDoDia([], [sessao(HOJE, 1, { finalizada: false })], HOJE)).toBe(0);
  });
});

describe('estadoPelaFracao', () => {
  it.each([
    [null, 'fraco'],
    [0, 'fraco'],
    [0.49, 'fraco'],
    [0.5, 'parcial'],
    [0.99, 'parcial'],
    [1, 'completo'],
  ] as const)('%s vira %s', (fracao, estado) => {
    expect(estadoPelaFracao(fracao)).toBe(estado);
  });
});

describe('diasDaSemana', () => {
  const sessoes = [
    sessao('2026-10-04', 4), // domingo: completo
    sessao('2026-10-05', 2), // segunda: 50%, parcial
    sessao('2026-10-06', 1), // terça: 25%, fraco
    sessao(HOJE, 4), // quarta: hoje
    sessao('2026-10-08', 4), // quinta: futuro (não deveria existir, mas não muda a cor)
  ];

  it('vai de domingo a sábado com sigla e dia do mês', () => {
    const dias = diasDaSemana([TREINO], sessoes, HOJE);

    expect(dias.map((dia) => dia.sigla)).toEqual(['dom', 'seg', 'ter', 'qua', 'qui', 'sex', 'sáb']);
    expect(dias.map((dia) => dia.dia)).toEqual([4, 5, 6, 7, 8, 9, 10]);
    expect(dias[0].chave).toBe('2026-10-04');
  });

  it('pinta cada dia pela regra', () => {
    const dias = diasDaSemana([TREINO], sessoes, HOJE);

    expect(dias.map((dia) => dia.estado)).toEqual([
      'completo',
      'parcial',
      'fraco',
      'hoje',
      'futuro',
      'futuro',
      'futuro',
    ]);
    expect(dias[3].fracao).toBe(1);
    expect(dias[4].fracao).toBeNull();
  });

  it('dia passado sem treino é fraco', () => {
    expect(diasDaSemana([TREINO], [], HOJE)[0].estado).toBe('fraco');
  });

  it('no domingo, a semana começa hoje; no sábado, termina hoje', () => {
    expect(diasDaSemana([], [], '2026-10-04')[0].estado).toBe('hoje');
    expect(diasDaSemana([], [], '2026-10-10')[6].estado).toBe('hoje');
  });

  it('atravessa a virada do mês', () => {
    const dias = diasDaSemana([], [], '2026-10-01');

    expect(dias.map((dia) => dia.dia)).toEqual([27, 28, 29, 30, 1, 2, 3]);
  });
});

describe('sequenciaDeDias', () => {
  it('conta os dias seguidos com pelo menos 50%', () => {
    const sessoes = [sessao('2026-10-04', 1), sessao('2026-10-05', 2), sessao('2026-10-06', 4)];

    // Hoje ainda sem treino: não zera, conta segunda e terça
    expect(sequenciaDeDias([TREINO], sessoes, HOJE)).toBe(2);
  });

  it('hoje entra quando já passou de 50%', () => {
    const sessoes = [sessao('2026-10-06', 4), sessao(HOJE, 2, { finalizada: false })];

    expect(sequenciaDeDias([TREINO], sessoes, HOJE)).toBe(2);
  });

  it('hoje abaixo de 50% não conta, mas não quebra a de ontem', () => {
    const sessoes = [sessao('2026-10-06', 4), sessao(HOJE, 1, { finalizada: false })];

    expect(sequenciaDeDias([TREINO], sessoes, HOJE)).toBe(1);
  });

  it('um dia sem treino quebra a sequência', () => {
    const sessoes = [sessao('2026-10-04', 4), sessao('2026-10-06', 4)];

    expect(sequenciaDeDias([TREINO], sessoes, HOJE)).toBe(1);
  });

  it('sem histórico é zero', () => {
    expect(sequenciaDeDias([TREINO], [], HOJE)).toBe(0);
  });
});

describe('textos', () => {
  it('nome do dia', () => {
    expect(nomeDoDia(HOJE)).toBe('quarta');
    expect(nomeDoDia('2026-10-10')).toBe('sábado');
  });

  it('resumo da semana para o leitor de tela', () => {
    const dias = diasDaSemana([TREINO], [sessao('2026-10-04', 4), sessao('2026-10-05', 3)], HOJE);
    const resumo = resumoDaSemana(dias);

    expect(resumo).toMatch(
      /^Sua semana: 1 com treino completo, 1 com treino parcial, 1 sem treino\./,
    );
    expect(resumo).toContain('domingo 4, treino completo');
    expect(resumo).toContain('quarta 7, hoje');
    expect(resumo).toContain('sábado 10, ainda não chegou');
  });

  it('texto da sequência', () => {
    expect(textoSequencia(0)).toBe('nenhum dia seguido treinando ainda');
    expect(textoSequencia(1)).toBe('1 dia seguido treinando');
    expect(textoSequencia(5)).toBe('5 dias seguidos treinando');
  });
});

describe('toque e leitor de tela em cada dia', () => {
  const dias = diasDaSemana(
    [TREINO],
    [sessao('2026-10-05', 2), sessao(HOJE, 1, { finalizada: false })],
    HOJE,
  );
  const [domingo, segunda, , quarta, quinta] = dias;

  it('traz o treino e a contagem do dia', () => {
    expect(segunda.detalhe).toEqual({ treino: 'Treino A', feitos: 2, total: 4 });
    expect(domingo.detalhe).toBeNull();
    expect(quinta.detalhe).toBeNull();
  });

  it('rótulo de cada pílula', () => {
    expect(rotuloDoDia(segunda)).toBe('segunda, 5, 50% do treino feito');
    expect(rotuloDoDia(domingo)).toBe('domingo, 4, sem treino');
    expect(rotuloDoDia(quarta)).toBe('quarta, 7, hoje, 25% do treino feito');
    expect(rotuloDoDia(quinta)).toBe('quinta, 8, ainda não chegou');
  });

  it('resumo ao tocar', () => {
    expect(resumoDoDia(segunda)).toBe('segunda: Treino A, 2 de 4 exercícios');
    expect(resumoDoDia(domingo)).toBe('domingo: descanso');
    expect(resumoDoDia(quarta)).toBe('hoje: Treino A, 1 de 4 exercícios');
    expect(resumoDoDia(quinta)).toBe('quinta: ainda não chegou');
    expect(resumoDoDia(diasDaSemana([], [], HOJE)[3])).toBe('hoje: ainda sem treino');
  });

  it('treino apagado ainda mostra quantos foram feitos', () => {
    const [dia] = diasDaSemana([], [sessao('2026-10-04', 3)], HOJE);

    expect(resumoDoDia(dia)).toBe('domingo: treino apagado, 3 exercícios');
  });
});
