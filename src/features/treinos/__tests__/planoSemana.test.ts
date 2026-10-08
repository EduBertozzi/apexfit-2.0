import { treinoDoDia } from '../logica';
import {
  atribuirDia,
  distribuirAutomatico,
  lerDia,
  opcoesDoDia,
  planoDaSemana,
  resumoDoPlano,
  rotuloDoDiaNoPlano,
  semPlano,
  textoDoDia,
  tituloDaFolha,
} from '../planoSemana';
import { useTreinosStore } from '../store';
import type { Treino } from '../types';

function treino(id: string, dias?: number[], foco?: string): Treino {
  return {
    id,
    nome: `Treino ${id.toUpperCase()}`,
    ...(foco ? { foco } : {}),
    exercicios: [
      { id: `${id}1`, nome: 'Supino', grupo: 'peito', series: 3, repeticoes: '10' },
      { id: `${id}2`, nome: 'Rosca', grupo: 'braco', series: 3, repeticoes: '12' },
    ],
    ...(dias ? { dias } : {}),
  };
}

function diasDe(treinos: readonly Treino[]) {
  return Object.fromEntries(treinos.map((t) => [t.id, t.dias]));
}

describe('planoDaSemana', () => {
  it('monta 7 linhas de domingo a sábado com treino, grupos e descanso', () => {
    const plano = planoDaSemana([treino('a', [1, 4], 'Peito e tríceps'), treino('b', [2])]);

    expect(plano).toHaveLength(7);
    expect(plano.map((d) => d.sigla)).toEqual(['dom', 'seg', 'ter', 'qua', 'qui', 'sex', 'sáb']);
    expect(plano[1]).toMatchObject({ nome: 'segunda', tipo: 'treino', grupos: ['peito', 'braco'] });
    expect(plano[1].treino?.id).toBe('a');
    expect(plano[2].treino?.id).toBe('b');
    expect(plano[0]).toMatchObject({ tipo: 'descanso', treino: null, grupos: [] });
  });

  it('dia livre com treino ainda sem dia segue o rodízio', () => {
    const plano = planoDaSemana([treino('a', [1]), treino('b')]);

    expect(plano[1].tipo).toBe('treino');
    expect(plano[3].tipo).toBe('rodizio');
  });

  it('sem treinos: tudo descanso', () => {
    expect(planoDaSemana([]).every((d) => d.tipo === 'descanso')).toBe(true);
  });

  it('com dois treinos no mesmo dia vale o primeiro, como no treinoDoDia', () => {
    const plano = planoDaSemana([treino('a', [1]), treino('b', [1])]);

    expect(plano[1].treino?.id).toBe('a');
  });
});

describe('atribuirDia', () => {
  it('dá o dia ao treino escolhido e tira dos outros', () => {
    const treinos = [treino('a', [1, 3]), treino('b', [5])];
    const novos = atribuirDia(treinos, 3, 'b');

    expect(diasDe(novos)).toEqual({ a: [1], b: [3, 5] });
  });

  it('descanso (null) tira o dia de todos e apaga o campo vazio', () => {
    const novos = atribuirDia([treino('a', [2]), treino('b', [2, 4])], 2, null);

    expect('dias' in novos[0]).toBe(false);
    expect(novos[1].dias).toEqual([4]);
  });

  it('não mexe em quem não muda e ignora dia inválido', () => {
    const treinos = [treino('a', [1]), treino('b', [2])];
    const novos = atribuirDia(treinos, 2, 'b');

    expect(novos[0]).toBe(treinos[0]);
    expect(novos[1]).toBe(treinos[1]);
    expect(atribuirDia(treinos, 9, 'a')).toEqual(treinos);
  });

  it('a tela inicial passa a seguir o novo plano', () => {
    // 2026-10-07 é quarta (3)
    const treinos = atribuirDia([treino('a', [1]), treino('b', [5])], 3, 'b');

    expect(treinoDoDia(treinos, [], '2026-10-07')).toEqual({ treino: treinos[1], descanso: false });
    const semQuarta = atribuirDia(treinos, 3, null);

    expect(treinoDoDia(semQuarta, [], '2026-10-07').descanso).toBe(true);
  });
});

describe('semPlano e distribuirAutomatico', () => {
  it('semPlano é true quando nenhum treino tem dia', () => {
    expect(semPlano([treino('a'), treino('b')])).toBe(true);
    expect(semPlano([treino('a', [1]), treino('b')])).toBe(false);
    expect(semPlano([])).toBe(true);
  });

  it.each([
    [2, [[1], [4]]],
    [3, [[1], [3], [5]]],
    [4, [[1], [2], [4], [5]]],
    [5, [[1], [2], [3], [4], [5]]],
    [6, [[1], [2], [3], [4], [5], [6]]],
  ])('%i treinos seguem o padrão', (quantidade, esperado) => {
    const treinos = Array.from({ length: quantidade }, (_, i) => treino(`t${i}`, [0]));

    expect(distribuirAutomatico(treinos).map((t) => t.dias)).toEqual(esperado);
  });

  it('1 treino repete em seg, qua e sex; mais de 7 deixa os extras sem dia', () => {
    expect(distribuirAutomatico([treino('a')])[0].dias).toEqual([1, 3, 5]);

    const oito = distribuirAutomatico(Array.from({ length: 8 }, (_, i) => treino(`t${i}`)));

    expect(oito.slice(0, 7).map((t) => t.dias)).toEqual([[1], [2], [3], [4], [5], [6], [0]]);
    expect('dias' in oito[7]).toBe(false);
    expect(distribuirAutomatico([])).toEqual([]);
  });
});

describe('textos', () => {
  it('resume os dias', () => {
    expect(
      resumoDoPlano(planoDaSemana(distribuirAutomatico([1, 2, 3, 4].map((n) => treino(`${n}`))))),
    ).toBe('4 dias de treino, 3 de descanso');
    expect(resumoDoPlano(planoDaSemana([treino('a', [1])]))).toBe('1 dia de treino, 6 de descanso');
    expect(resumoDoPlano(planoDaSemana([treino('a', [1]), treino('b')]))).toBe(
      '1 dia de treino, 6 no rodízio',
    );
    expect(resumoDoPlano(planoDaSemana([treino('a', [0, 1, 2, 3, 4, 5, 6])]))).toBe(
      '7 dias de treino, sem descanso',
    );
    expect(resumoDoPlano(planoDaSemana([treino('a')]))).toBe(
      'todos os dias seguem o rodízio A, B, C',
    );
    expect(resumoDoPlano(planoDaSemana([]))).toBe('nenhum dia de treino ainda');
  });

  it('texto e rótulo de cada linha, sem travessão', () => {
    const plano = planoDaSemana([treino('a', [1], 'Peito e tríceps')]);

    expect(textoDoDia(plano[1])).toEqual({ titulo: 'treino A', detalhe: 'peito e tríceps' });
    expect(textoDoDia(plano[0])).toEqual({ titulo: 'descanso' });
    expect(rotuloDoDiaNoPlano(plano[1])).toBe('segunda: treino A, peito e tríceps');
    expect(rotuloDoDiaNoPlano(plano[0])).toBe('domingo: descanso');
    expect(rotuloDoDiaNoPlano(plano[1])).not.toMatch(/[–—]/);
  });

  it('opções da folha: os treinos e descanso, com o atual marcado', () => {
    const opcoes = opcoesDoDia([treino('a', [1]), treino('b', [2])], 1);

    expect(opcoes.map((o) => [o.treinoId, o.titulo, o.marcado])).toEqual([
      ['a', 'treino A', true],
      ['b', 'treino B', false],
      [null, 'descanso', false],
    ]);
    expect(opcoesDoDia([treino('a', [1]), treino('b')], 3).at(-1)).toMatchObject({
      titulo: 'sem treino fixo',
      marcado: true,
    });
  });

  it('título da folha e leitura do parâmetro', () => {
    expect(tituloDaFolha(6)).toBe('treino de sábado');
    expect(tituloDaFolha(7)).toBeNull();
    expect(lerDia('0')).toBe(0);
    expect(lerDia('7')).toBeNull();
    expect(lerDia('x')).toBeNull();
    expect(lerDia(undefined)).toBeNull();
  });
});

describe('store: minha semana', () => {
  beforeEach(() => {
    useTreinosStore.setState({ treinos: [], sessoes: [] });
  });

  it('atribuirDia e distribuirAutomatico atualizam os treinos', () => {
    const estado = () => useTreinosStore.getState();
    const idA = estado().novoTreino();
    const idB = estado().novoTreino();

    estado().distribuirAutomatico();
    expect(diasDe(estado().treinos)).toEqual({ [idA]: [1], [idB]: [4] });

    estado().atribuirDia(4, idA);
    expect(diasDe(estado().treinos)).toEqual({ [idA]: [1, 4], [idB]: undefined });

    estado().atribuirDia(1, null);
    expect(diasDe(estado().treinos)).toEqual({ [idA]: [4], [idB]: undefined });
  });
});
