import {
  adicionarExercicios,
  definirDias,
  diaDaSemanaDe,
  editarTreino,
  legendaTreinoDoDia,
  normalizarDias,
  proximoTreino,
  situacaoDoDia,
  treinoDoDia,
} from '../logica';
import { useTreinosStore } from '../store';
import type { Sessao, Treino } from '../types';

// Segunda, 5 de outubro de 2026 (dia 1). Terça é 6, sábado é 3.
const SEGUNDA = '2026-10-05';
const TERCA = '2026-10-06';
const SABADO = '2026-10-03';

function treino(id: string, dias?: number[]): Treino {
  return {
    id,
    nome: `Treino ${id.toUpperCase()}`,
    exercicios: [{ id: `${id}1`, nome: 'Supino', series: 3, repeticoes: '10' }],
    ...(dias ? { dias } : {}),
  };
}

function feita(treinoId: string, data: string): Sessao {
  return {
    id: `s-${treinoId}-${data}`,
    treinoId,
    data,
    concluidos: [`${treinoId}1`],
    finalizada: true,
  };
}

describe('dias da semana', () => {
  it('lê o dia da semana da chave', () => {
    expect(diaDaSemanaDe(SEGUNDA)).toBe(1);
    expect(diaDaSemanaDe(SABADO)).toBe(6);
  });

  it('normaliza: sem repetição, em ordem, só 0 a 6, vazio vira undefined', () => {
    expect(normalizarDias([5, 1, 1, 9, -1, 3])).toEqual([1, 3, 5]);
    expect(normalizarDias([])).toBeUndefined();
  });

  it('definirDias grava e apaga o campo quando fica vazio', () => {
    const treinos = [treino('a'), treino('b')];
    const comDias = definirDias(treinos, 'a', [3, 1]);

    expect(comDias[0].dias).toEqual([1, 3]);
    expect(comDias[1]).toBe(treinos[1]);
    expect('dias' in definirDias(comDias, 'a', [])[0]).toBe(false);
  });

  it('editar nome e foco mantém os dias', () => {
    const treinos = definirDias([treino('a')], 'a', [2]);

    expect(editarTreino(treinos, 'a', { nome: 'Peito' })[0].dias).toEqual([2]);
  });
});

describe('treinoDoDia', () => {
  it('sem nenhum dia marcado, segue o rodízio de sempre', () => {
    const treinos = [treino('a'), treino('b')];

    expect(treinoDoDia(treinos, [feita('a', SABADO)], SEGUNDA)).toEqual({
      treino: treinos[1],
      descanso: false,
    });
    expect(proximoTreino(treinos, [feita('a', SABADO)], SEGUNDA)).toBe(treinos[1]);
  });

  it('o treino que marca o dia de hoje é o de hoje, mesmo fora da ordem do rodízio', () => {
    const treinos = [treino('a', [3]), treino('b', [1])];

    expect(treinoDoDia(treinos, [], SEGUNDA)).toEqual({ treino: treinos[1], descanso: false });
  });

  it('se dois marcam o mesmo dia, vale o primeiro da lista', () => {
    const treinos = [treino('a', [1]), treino('b', [1])];

    expect(treinoDoDia(treinos, [], SEGUNDA).treino).toBe(treinos[0]);
  });

  it('dia que ninguém marca, com todos tendo dias: descanso, apontando o próximo do plano', () => {
    const treinos = [treino('a', [1]), treino('b', [3])];

    expect(treinoDoDia(treinos, [], TERCA)).toEqual({ treino: treinos[1], descanso: true });
    // Sábado: o próximo dia marcado é segunda
    expect(treinoDoDia(treinos, [], SABADO)).toEqual({ treino: treinos[0], descanso: true });
  });

  it('dia livre com treinos sem dias: o rodízio só entre eles', () => {
    const treinos = [treino('a', [1]), treino('b'), treino('c')];
    // O A (de segunda) foi o último feito, mas não empurra o rodízio de B e C
    const sessoes = [feita('b', SABADO), feita('a', SEGUNDA)];

    expect(treinoDoDia(treinos, sessoes, TERCA)).toEqual({ treino: treinos[2], descanso: false });
  });

  it('sem treinos não tem nada', () => {
    expect(treinoDoDia([], [], SEGUNDA)).toEqual({ treino: null, descanso: false });
  });
});

describe('situacaoDoDia com plano semanal', () => {
  it('sugere o treino do dia', () => {
    const treinos = [treino('a', [3]), treino('b', [1])];

    expect(situacaoDoDia(treinos, [], SEGUNDA)).toEqual({ tipo: 'sugerido', treino: treinos[1] });
  });

  it('no descanso, sugere o próximo marcado e avisa', () => {
    const treinos = [treino('a', [1]), treino('b', [3])];
    const situacao = situacaoDoDia(treinos, [], TERCA);

    expect(situacao).toEqual({ tipo: 'sugerido', treino: treinos[1], descanso: true });
    expect(legendaTreinoDoDia(situacao)).toBe('dia de descanso. Próximo: Treino B');
  });

  it('depois de concluir, o próximo é o do dia seguinte no plano', () => {
    const treinos = [treino('a', [1]), treino('b', [2])];
    const situacao = situacaoDoDia(treinos, [feita('a', SEGUNDA)], SEGUNDA);

    expect(situacao.tipo).toBe('concluido');
    expect(situacao.tipo === 'concluido' && situacao.proximo).toBe(treinos[1]);
  });
});

describe('adicionarExercicios', () => {
  it('adiciona vários na ordem, com ids novos', () => {
    let n = 0;
    const gerar = () => `x${++n}`;
    const [resultado] = adicionarExercicios(
      [treino('a')],
      'a',
      [
        { nome: 'Rosca direta', grupo: 'braco', series: 3, repeticoes: '12' },
        { nome: 'Tríceps corda', grupo: 'braco', series: 3, repeticoes: '12' },
      ],
      gerar,
    );

    expect(resultado.exercicios.map((item) => [item.id, item.nome])).toEqual([
      ['a1', 'Supino'],
      ['x1', 'Rosca direta'],
      ['x2', 'Tríceps corda'],
    ]);
  });
});

describe('store: plano semanal e montar treino', () => {
  beforeEach(() => {
    useTreinosStore.setState({ treinos: [], sessoes: [] });
  });

  it('define dias, adiciona vários e reordena dentro do grupo', () => {
    const estado = () => useTreinosStore.getState();
    const id = estado().novoTreino();

    estado().definirDias(id, [5, 1]);
    estado().adicionarExercicios(id, [
      { nome: 'Rosca direta', grupo: 'braco', series: 3, repeticoes: '12' },
      { nome: 'Agachamento livre', grupo: 'perna', series: 4, repeticoes: '10' },
      { nome: 'Rosca martelo', grupo: 'braco', series: 3, repeticoes: '12' },
    ]);

    const [rosca, , martelo] = estado().treinos[0].exercicios;

    estado().reordenarNoGrupo(id, martelo.id, 0);
    expect(estado().treinos[0].exercicios.map((item) => item.nome)).toEqual([
      'Rosca martelo',
      'Agachamento livre',
      'Rosca direta',
    ]);

    estado().moverNoGrupo(id, rosca.id, 'cima');
    expect(estado().treinos[0].exercicios.map((item) => item.nome)).toEqual([
      'Rosca direta',
      'Agachamento livre',
      'Rosca martelo',
    ]);

    expect(estado().treinos[0].dias).toEqual([1, 5]);
  });
});
