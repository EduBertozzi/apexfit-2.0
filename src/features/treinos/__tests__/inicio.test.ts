import { rotuloMarcarExercicio, rotuloTituloDoBloco, agruparPorGrupo } from '../grupos';
import { acaoTreinoHoje, marcarExercicioNoDia, podeMarcarNoInicio } from '../logica';
import { useTreinosStore } from '../store';
import type { Sessao, Treino } from '../types';

const HOJE = '2026-10-07';

function contador() {
  let n = 0;
  return () => `id-${++n}`;
}

function treino(id: string, exercicios: string[] = [], foco?: string): Treino {
  return {
    id,
    nome: `Treino ${id.toUpperCase()}`,
    foco,
    exercicios: exercicios.map((ex) => ({ id: ex, nome: ex, series: 3, repeticoes: '10' })),
  };
}

function sessao(dados: Partial<Sessao> & Pick<Sessao, 'treinoId'>): Sessao {
  return { id: 's1', data: HOJE, concluidos: [], finalizada: false, ...dados };
}

const A = treino('a', ['a1', 'a2', 'a3'], 'Pernas');

describe('marcarExercicioNoDia', () => {
  it('sem sessão hoje: começa o treino e já marca o exercício', () => {
    const sessoes = marcarExercicioNoDia([], 'a', 'a1', HOJE, contador());

    expect(sessoes).toEqual([
      { id: 'id-1', treinoId: 'a', data: HOJE, concluidos: ['a1'], finalizada: false },
    ]);
  });

  it('com o treino em andamento: marca e desmarca na mesma sessão', () => {
    const inicio = [sessao({ treinoId: 'a', concluidos: ['a1'] })];

    const marcado = marcarExercicioNoDia(inicio, 'a', 'a2', HOJE);
    expect(marcado).toHaveLength(1);
    expect(marcado[0].concluidos).toEqual(['a1', 'a2']);

    const desmarcado = marcarExercicioNoDia(marcado, 'a', 'a1', HOJE);
    expect(desmarcado[0].concluidos).toEqual(['a2']);
  });

  it('treino de hoje já finalizado não muda nem abre outra sessão', () => {
    const inicio = [sessao({ treinoId: 'a', concluidos: ['a1'], finalizada: true })];

    expect(marcarExercicioNoDia(inicio, 'a', 'a2', HOJE)).toEqual(inicio);
  });

  it('sessão de ontem não conta: hoje começa uma nova', () => {
    const ontem = sessao({ treinoId: 'a', data: '2026-10-06', concluidos: ['a1'] });
    const sessoes = marcarExercicioNoDia([ontem], 'a', 'a3', HOJE, contador());

    expect(sessoes).toHaveLength(2);
    expect(sessoes[1]).toMatchObject({ data: HOJE, concluidos: ['a3'] });
  });
});

describe('podeMarcarNoInicio', () => {
  it('só antes de finalizar', () => {
    const aberta = sessao({ treinoId: 'a' });

    expect(podeMarcarNoInicio({ tipo: 'sem-treinos' })).toBe(false);
    expect(podeMarcarNoInicio({ tipo: 'sugerido', treino: A })).toBe(true);
    expect(podeMarcarNoInicio({ tipo: 'em-andamento', treino: A, sessao: aberta })).toBe(true);
    expect(
      podeMarcarNoInicio({ tipo: 'concluido', treino: A, sessao: aberta, proximo: null }),
    ).toBe(false);
  });
});

describe('acaoTreinoHoje', () => {
  it('sem treino ou treino vazio: nenhum botão (a grade mostra o convite)', () => {
    expect(acaoTreinoHoje({ tipo: 'sem-treinos' })).toBeNull();
    expect(acaoTreinoHoje({ tipo: 'sugerido', treino: treino('b') })).toBeNull();
  });

  it('nada feito: começar treino', () => {
    expect(acaoTreinoHoje({ tipo: 'sugerido', treino: A })).toEqual({
      tipo: 'comecar',
      texto: 'começar treino',
      acessivel: 'começar treino, pernas, 3 exercícios',
    });
    expect(
      acaoTreinoHoje({ tipo: 'em-andamento', treino: A, sessao: sessao({ treinoId: 'a' }) }),
    ).toMatchObject({ tipo: 'comecar' });
  });

  it('em andamento: continuar com quantos já foram', () => {
    expect(
      acaoTreinoHoje({
        tipo: 'em-andamento',
        treino: A,
        sessao: sessao({ treinoId: 'a', concluidos: ['a1'] }),
      }),
    ).toEqual({
      tipo: 'continuar',
      texto: 'continuar treino · 1 de 3',
      acessivel: 'continuar treino, 1 de 3 exercícios feitos',
    });
  });

  it('100% feito ou finalizado: treino concluído', () => {
    const tudo = sessao({ treinoId: 'a', concluidos: ['a1', 'a2', 'a3'] });

    expect(acaoTreinoHoje({ tipo: 'em-andamento', treino: A, sessao: tudo })?.tipo).toBe(
      'concluido',
    );
    expect(
      acaoTreinoHoje({
        tipo: 'concluido',
        treino: A,
        sessao: sessao({ treinoId: 'a', concluidos: ['a1'], finalizada: true }),
        proximo: null,
      }),
    ).toEqual({
      tipo: 'concluido',
      texto: 'treino concluído',
      acessivel: 'treino concluído, ver o treino de hoje',
    });
  });

  it('nunca usa travessão', () => {
    const textos = [
      acaoTreinoHoje({ tipo: 'sugerido', treino: A }),
      acaoTreinoHoje({
        tipo: 'em-andamento',
        treino: A,
        sessao: sessao({ treinoId: 'a', concluidos: ['a2'] }),
      }),
    ].flatMap((acao) => [acao?.texto, acao?.acessivel]);

    for (const texto of textos) {
      expect(texto).not.toMatch(/[–—]/);
    }
  });
});

describe('rótulos do card de grupo', () => {
  it('cada exercício é uma caixa de marcar com o estado na frase', () => {
    expect(rotuloMarcarExercicio('Agachamento', true)).toBe('agachamento, feito');
    expect(rotuloMarcarExercicio('Agachamento', false)).toBe('agachamento, marcar como feito');
    expect(rotuloMarcarExercicio('Agachamento', false, false)).toBe('agachamento, não feito');
  });

  it('o título diz quanto do grupo já foi feito', () => {
    const [bloco] = agruparPorGrupo([
      { id: 'r', nome: 'Rosca direta', grupo: 'braco', series: 3, repeticoes: '12' },
      { id: 't', nome: 'Tríceps testa', grupo: 'braco', series: 3, repeticoes: '12' },
    ]);

    expect(rotuloTituloDoBloco(bloco, ['r'])).toBe('braço, 3 séries de 12, 1 de 2 feitos');
    expect(rotuloTituloDoBloco(bloco, ['r', 't'])).toBe('braço, 3 séries de 12, tudo feito');
  });
});

describe('useTreinosStore.marcarExercicioDeHoje', () => {
  beforeEach(() => {
    useTreinosStore.setState({ treinos: [], sessoes: [] });
  });

  it('marca da tela inicial começando o treino sozinho', () => {
    const data = new Date(2026, 9, 7, 9, 0);
    const id = useTreinosStore.getState().novoTreino();
    useTreinosStore
      .getState()
      .adicionarExercicio(id, { nome: 'Agachamento', series: 3, repeticoes: '10' });
    const exercicioId = useTreinosStore.getState().treinos[0].exercicios[0].id;

    useTreinosStore.getState().marcarExercicioDeHoje(id, exercicioId, data);

    expect(useTreinosStore.getState().sessoes).toEqual([
      expect.objectContaining({ treinoId: id, data: HOJE, concluidos: [exercicioId] }),
    ]);

    useTreinosStore.getState().marcarExercicioDeHoje(id, exercicioId, data);

    expect(useTreinosStore.getState().sessoes[0].concluidos).toEqual([]);
  });
});
