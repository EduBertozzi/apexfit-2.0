import type { PlanoDieta } from '../contrato';
import {
  aplicarNaSemana,
  definirDias,
  diasDeDescanso,
  diasDoSeletor,
  diasPersonalizados,
  legendaDoDia,
  migrarDieta,
  planoDaSemanaToda,
  planoDoDia,
  semanaTreinoEDescanso,
  tituloPlanoDoDia,
  treinoNoDia,
  voltarAoPadrao,
  type DietaSemana,
} from '../semana';

type Refeicao = PlanoDieta['refeicoes'][number];

function refeicao(nome: string, calorias: number, alimento: string): Refeicao {
  return {
    nome,
    horario: '12:00',
    calorias,
    itens: [{ alimento, quantidade: '100 g' }],
    substituicoes: [],
  };
}

function plano(almoco: string, jantar = 'Frango'): PlanoDieta {
  return {
    resumo: 'Plano.',
    caloriasDia: 1200,
    macros: { proteinaG: 100, carboidratoG: 100, gorduraG: 40 },
    refeicoes: [refeicao('Almoço', 700, almoco), refeicao('Jantar', 500, jantar)],
    dicas: [],
    aviso: 'Consulte um nutricionista.',
  };
}

const BASE = plano('Arroz e feijão');
const SEXTA = plano('Pizza caseira');

describe('planoDoDia', () => {
  it('sem plano próprio, vale o padrão', () => {
    const semana: DietaSemana = { plano: BASE, porDia: { 5: SEXTA } };

    expect(planoDoDia(semana, 1)).toBe(BASE);
    expect(planoDoDia(semana, 5)).toBe(SEXTA);
  });

  it('sem nenhum plano, null', () => {
    expect(planoDoDia({ plano: null, porDia: {} }, 3)).toBeNull();
  });
});

describe('definirDias e voltarAoPadrao', () => {
  it('dá plano próprio só para os dias pedidos', () => {
    const semana = definirDias({ plano: BASE, porDia: {} }, [5, 6], SEXTA);

    expect(diasPersonalizados(semana)).toEqual([5, 6]);
    expect(planoDoDia(semana, 1)).toBe(BASE);
  });

  it('plano igual ao padrão não vira cópia', () => {
    const semana = definirDias({ plano: BASE, porDia: { 5: SEXTA } }, [5], plano('Arroz e feijão'));

    expect(diasPersonalizados(semana)).toEqual([]);
  });

  it('sem plano padrão, o primeiro plano vira o padrão', () => {
    const semana = definirDias({ plano: null, porDia: {} }, [5], SEXTA);

    expect(semana.plano).toBe(SEXTA);
    expect(diasPersonalizados(semana)).toEqual([]);
  });

  it('ignora dias inválidos', () => {
    expect(diasPersonalizados(definirDias({ plano: BASE, porDia: {} }, [9, -1], SEXTA))).toEqual(
      [],
    );
  });

  it('voltar ao padrão tira o plano próprio', () => {
    const semana = voltarAoPadrao({ plano: BASE, porDia: { 5: SEXTA } }, 5);

    expect(planoDoDia(semana, 5)).toBe(BASE);
  });
});

describe('aplicarNaSemana', () => {
  const semana: DietaSemana = { plano: BASE, porDia: { 5: SEXTA } };

  it('plano novo sem dia vale para a semana toda', () => {
    const nova = aplicarNaSemana(semana, plano('Peixe'), { modo: 'novo' });

    expect(nova).toEqual(planoDaSemanaToda(plano('Peixe')));
  });

  it('ajuste sem dia muda o padrão e mantém os dias próprios', () => {
    const nova = aplicarNaSemana(semana, plano('Peixe'), { modo: 'ajuste' });

    expect(nova.plano?.refeicoes[0].itens[0].alimento).toBe('Peixe');
    expect(nova.porDia[5]).toBe(SEXTA);
  });

  it('ajuste de um dia muda só a refeição pedida daquele dia', () => {
    const proposto = plano('Macarrão', 'Sopa');
    const nova = aplicarNaSemana(semana, proposto, {
      dias: [3],
      alvos: ['almoco'],
      modo: 'ajuste',
    });

    expect(planoDoDia(nova, 3)?.refeicoes.map((r) => r.itens[0].alimento)).toEqual([
      'Macarrão',
      'Frango',
    ]);
    expect(planoDoDia(nova, 1)).toBe(BASE);
    expect(nova.porDia[5]).toBe(SEXTA);
  });

  it('ajuste num dia que já tem plano próprio parte do plano do dia', () => {
    const nova = aplicarNaSemana(semana, plano('X', 'Omelete'), {
      dias: [5],
      alvos: ['jantar'],
      modo: 'ajuste',
    });

    expect(planoDoDia(nova, 5)?.refeicoes.map((r) => r.itens[0].alimento)).toEqual([
      'Pizza caseira',
      'Omelete',
    ]);
  });

  it('plano novo para um dia vira o plano daquele dia', () => {
    const nova = aplicarNaSemana(semana, plano('Peixe'), { dias: [0], modo: 'novo' });

    expect(planoDoDia(nova, 0)?.refeicoes[0].itens[0].alimento).toBe('Peixe');
    expect(nova.plano).toBe(BASE);
  });
});

describe('seletor', () => {
  it('vai de segunda a domingo, marca hoje e os dias próprios', () => {
    const dias = diasDoSeletor({ plano: BASE, porDia: { 5: SEXTA } }, 3);

    expect(dias.map((d) => d.sigla)).toEqual(['seg', 'ter', 'qua', 'qui', 'sex', 'sáb', 'dom']);
    expect(dias.find((d) => d.hoje)?.dia).toBe(3);
    expect(dias.filter((d) => d.proprio).map((d) => d.dia)).toEqual([5]);
  });

  it('legenda diz se o dia segue a semana', () => {
    const semana: DietaSemana = { plano: BASE, porDia: { 5: SEXTA } };

    expect(legendaDoDia(semana, 5, 1)).toBe('sexta: plano só deste dia');
    expect(legendaDoDia(semana, 1, 1)).toBe('hoje, segunda: mesmo plano da semana');
  });
});

describe('treinoNoDia', () => {
  const treinos = [
    { nome: 'Treino A', foco: 'Peito', dias: [1, 4] },
    { nome: 'Treino B', dias: [5] },
    { nome: 'Treino C' },
  ];

  it('acha o treino marcado para o dia', () => {
    expect(treinoNoDia(treinos, 4)).toBe('Treino A, Peito');
    expect(treinoNoDia(treinos, 5)).toBe('Treino B');
  });

  it('dia sem treino: undefined', () => {
    expect(treinoNoDia(treinos, 0)).toBeUndefined();
  });

  it('títulos dos botões do dia', () => {
    expect(tituloPlanoDoDia(6)).toBe('plano só para sábado');
  });
});

describe('migrarDieta', () => {
  it('versão 1: o plano único vira o padrão da semana', () => {
    expect(migrarDieta({ plano: BASE, origem: 'ia', geradoEm: 'x' }, 1)).toEqual({
      plano: BASE,
      origem: 'ia',
      geradoEm: 'x',
      porDia: {},
    });
  });

  it('dado vazio ou estranho não quebra', () => {
    expect(migrarDieta(undefined, 0)).toEqual({ plano: null, porDia: {} });
  });

  it('versão 2 fica como está', () => {
    const salvo = { plano: BASE, porDia: { 5: SEXTA } };

    expect(migrarDieta(salvo, 2)).toBe(salvo);
  });
});

describe('treino e descanso', () => {
  const PLANO_TREINO = plano('Arroz');

  it('dias de descanso são os sem treino marcado; no rodízio, nenhum', () => {
    expect(diasDeDescanso([[1, 3], [5], undefined])).toEqual([2, 4, 6, 0]);
    expect(diasDeDescanso([undefined, []])).toEqual([]);
  });

  it('legenda diz se o dia segue o plano de treino ou o de descanso', () => {
    const semana = { plano: PLANO_TREINO, porDia: { 0: PLANO_TREINO } };

    expect(legendaDoDia(semana, 1, 3, [0])).toBe('segunda: plano do dia de treino');
    expect(legendaDoDia(semana, 0, 0, [0])).toBe('hoje, domingo: plano do dia de descanso');
    expect(legendaDoDia(semana, 1, 3)).toBe('segunda: mesmo plano da semana');
  });

  it('sem plano de descanso, a semana toda fica com o de treino', () => {
    expect(semanaTreinoEDescanso(PLANO_TREINO, null, [0, 6])).toEqual({
      plano: PLANO_TREINO,
      porDia: {},
    });
  });
});
