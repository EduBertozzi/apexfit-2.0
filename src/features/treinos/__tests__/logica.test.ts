import {
  adicionarExercicio,
  adicionarTreino,
  alternarExercicio,
  aplicarModelo,
  criarTreino,
  descartarSessoesAbertas,
  editarExercicio,
  editarTreino,
  finalizarSessao,
  concluidosDeHoje,
  inicioDaSemana,
  iniciarSessao,
  legendaTreinoDoDia,
  limparSessoesAntigas,
  mover,
  moverExercicio,
  moverTreino,
  novoId,
  podeFinalizar,
  progressoDaSessao,
  proximoNomeDeTreino,
  proximoTreino,
  removerExercicio,
  removerTreino,
  resumoExercicio,
  resumoExercicioAcessivel,
  resumoTreino,
  sequenciaDeTreinos,
  sessaoDeHoje,
  situacaoDoDia,
  textoTreinosNaSemana,
  treinosNaSemana,
} from '../logica';
import { MODELOS } from '../modelos';
import { exercicioParaFormulario, exercicioSchema } from '../schema';
import type { DadosExercicio, Sessao, Treino } from '../types';

// Ids previsíveis: "id-1", "id-2"...
function contador() {
  let n = 0;
  return () => `id-${++n}`;
}

// Sábado, 3 de outubro de 2026. A semana começou na segunda, 28 de setembro.
const HOJE = '2026-10-03';

const SUPINO: DadosExercicio = { nome: 'Supino', series: 3, repeticoes: '10', cargaKg: 40 };
const REMADA: DadosExercicio = { nome: 'Remada', series: 4, repeticoes: '8 a 12' };

function treino(id: string, exercicios: string[] = []): Treino {
  return {
    id,
    nome: `Treino ${id.toUpperCase()}`,
    exercicios: exercicios.map((ex) => ({ id: ex, nome: ex, series: 3, repeticoes: '10' })),
  };
}

function sessao(dados: Partial<Sessao> & Pick<Sessao, 'treinoId' | 'data'>): Sessao {
  return { id: `s-${dados.treinoId}-${dados.data}`, concluidos: [], finalizada: true, ...dados };
}

const A = treino('a', ['a1', 'a2']);
const B = treino('b', ['b1']);
const C = treino('c', ['c1', 'c2', 'c3']);

describe('novoId', () => {
  it('gera ids diferentes a cada chamada', () => {
    const ids = new Set(Array.from({ length: 50 }, () => novoId()));

    expect(ids.size).toBe(50);
  });
});

describe('mover', () => {
  const lista = [{ id: '1' }, { id: '2' }, { id: '3' }];

  it('sobe e desce trocando com o vizinho', () => {
    expect(mover(lista, '2', 'cima').map((i) => i.id)).toEqual(['2', '1', '3']);
    expect(mover(lista, '2', 'baixo').map((i) => i.id)).toEqual(['1', '3', '2']);
  });

  it('não faz nada nas pontas nem com id que não existe', () => {
    expect(mover(lista, '1', 'cima')).toEqual(lista);
    expect(mover(lista, '3', 'baixo')).toEqual(lista);
    expect(mover(lista, 'x', 'cima')).toEqual(lista);
  });

  it('não altera a lista original', () => {
    mover(lista, '2', 'cima');

    expect(lista.map((i) => i.id)).toEqual(['1', '2', '3']);
  });
});

describe('treinos', () => {
  it('cria treino com ids para ele e cada exercício', () => {
    const novo = criarTreino({ nome: 'Treino A', foco: 'Peito', exercicios: [SUPINO] }, contador());

    expect(novo).toEqual({
      id: 'id-1',
      nome: 'Treino A',
      foco: 'Peito',
      exercicios: [{ ...SUPINO, id: 'id-2' }],
    });
  });

  it('sugere o próximo nome livre', () => {
    expect(proximoNomeDeTreino([])).toBe('Treino A');
    expect(proximoNomeDeTreino([A, B])).toBe('Treino C');
    // Pula letras já usadas, sem ligar para maiúsculas e espaços
    expect(
      proximoNomeDeTreino([
        { ...A, nome: ' treino a ' },
        { ...C, nome: 'Treino C' },
      ]),
    ).toBe('Treino B');
  });

  it('depois do Z, numera', () => {
    const muitos = Array.from({ length: 26 }, (_, i) => ({
      ...A,
      id: String(i),
      nome: `Treino ${String.fromCharCode(65 + i)}`,
    }));

    expect(proximoNomeDeTreino(muitos)).toBe('Treino 27');
  });

  it('adiciona, edita e remove', () => {
    let lista = adicionarTreino([A], B);
    expect(lista.map((t) => t.id)).toEqual(['a', 'b']);

    lista = editarTreino(lista, 'b', { nome: 'Costas', foco: 'Dorsal' });
    expect(lista[1]).toMatchObject({ nome: 'Costas', foco: 'Dorsal', exercicios: B.exercicios });

    lista = editarTreino(lista, 'b', { nome: 'Costas', foco: undefined });
    expect(lista[1].foco).toBeUndefined();

    lista = removerTreino(lista, 'a');
    expect(lista.map((t) => t.id)).toEqual(['b']);
  });

  it('reordena', () => {
    expect(moverTreino([A, B, C], 'c', 'cima').map((t) => t.id)).toEqual(['a', 'c', 'b']);
  });
});

describe('exercícios', () => {
  it('adiciona no fim do treino certo', () => {
    const lista = adicionarExercicio([A, B], 'b', SUPINO, contador());

    expect(lista[1].exercicios.map((e) => e.id)).toEqual(['b1', 'id-1']);
    expect(lista[1].exercicios[1]).toMatchObject(SUPINO);
    expect(lista[0]).toBe(A);
  });

  it('edita mantendo o id e apaga campo opcional que ficou vazio', () => {
    const comSupino = adicionarExercicio([A], 'a', SUPINO, contador());
    const editado = editarExercicio(comSupino, 'a', 'id-1', { ...REMADA });

    expect(editado[0].exercicios[2]).toEqual({ ...REMADA, id: 'id-1' });
    expect(editado[0].exercicios[2].cargaKg).toBeUndefined();
  });

  it('remove e reordena', () => {
    expect(removerExercicio([A], 'a', 'a1')[0].exercicios.map((e) => e.id)).toEqual(['a2']);
    expect(moverExercicio([C], 'c', 'c3', 'cima')[0].exercicios.map((e) => e.id)).toEqual([
      'c1',
      'c3',
      'c2',
    ]);
  });
});

describe('aplicarModelo', () => {
  it('adiciona os treinos do modelo com nomes em sequência', () => {
    const lista = aplicarModelo([], MODELOS[0], contador());

    expect(lista.map((t) => t.nome)).toEqual(['Treino A', 'Treino B', 'Treino C']);
    expect(lista[0].foco).toBe(MODELOS[0].treinos[0].foco);
    expect(lista[0].exercicios.length).toBe(MODELOS[0].treinos[0].exercicios?.length);
  });

  it('não repete nomes que já existem', () => {
    const lista = aplicarModelo([A], MODELOS[2], contador());

    expect(lista.map((t) => t.nome)).toEqual(['Treino A', 'Treino B', 'Treino C']);
  });

  it('todos os ids são únicos', () => {
    const lista = aplicarModelo([], MODELOS[0], contador());
    const ids = lista.flatMap((t) => [t.id, ...t.exercicios.map((e) => e.id)]);

    expect(new Set(ids).size).toBe(ids.length);
  });
});

describe('proximoTreino (rodízio)', () => {
  it('sem treinos, não há próximo', () => {
    expect(proximoTreino([], [])).toBeNull();
  });

  it('sem histórico, começa pelo primeiro', () => {
    expect(proximoTreino([A, B, C], [])).toBe(A);
  });

  it('segue A, B, C e volta para A', () => {
    const treinos = [A, B, C];

    expect(proximoTreino(treinos, [sessao({ treinoId: 'a', data: '2026-10-01' })])).toBe(B);
    expect(proximoTreino(treinos, [sessao({ treinoId: 'b', data: '2026-10-01' })])).toBe(C);
    expect(proximoTreino(treinos, [sessao({ treinoId: 'c', data: '2026-10-01' })])).toBe(A);
  });

  it('usa a sessão finalizada mais recente, não a última da lista', () => {
    const sessoes = [
      sessao({ treinoId: 'b', data: '2026-10-02' }),
      sessao({ treinoId: 'a', data: '2026-09-30' }),
    ];

    expect(proximoTreino([A, B, C], sessoes)).toBe(C);
  });

  it('ignora sessão que não foi finalizada', () => {
    const sessoes = [
      sessao({ treinoId: 'a', data: '2026-10-01' }),
      sessao({ treinoId: 'b', data: '2026-10-02', finalizada: false }),
    ];

    expect(proximoTreino([A, B, C], sessoes)).toBe(B);
  });

  it('se o último treino foi apagado, volta para o primeiro', () => {
    expect(proximoTreino([A, C], [sessao({ treinoId: 'b', data: '2026-10-02' })])).toBe(A);
  });
});

describe('sessões', () => {
  it('sessaoDeHoje devolve a mais recente do dia', () => {
    const sessoes = [
      sessao({ id: '1', treinoId: 'a', data: HOJE }),
      sessao({ id: '2', treinoId: 'b', data: HOJE, finalizada: false }),
      sessao({ id: '3', treinoId: 'c', data: '2026-10-02' }),
    ];

    expect(sessaoDeHoje(sessoes, HOJE)?.id).toBe('2');
    expect(sessaoDeHoje(sessoes, '2026-10-04')).toBeNull();
  });

  it('iniciarSessao cria uma sessão aberta', () => {
    const { sessoes, sessao: nova } = iniciarSessao([], 'a', HOJE, contador());

    expect(nova).toEqual({
      id: 'id-1',
      treinoId: 'a',
      data: HOJE,
      concluidos: [],
      finalizada: false,
    });
    expect(sessoes).toEqual([nova]);
  });

  it('iniciarSessao retoma a aberta do mesmo treino sem perder as marcações', () => {
    const aberta = sessao({ treinoId: 'a', data: HOJE, finalizada: false, concluidos: ['a1'] });
    const { sessoes, sessao: retomada } = iniciarSessao([aberta], 'a', HOJE, contador());

    expect(retomada).toBe(aberta);
    expect(sessoes).toHaveLength(1);
  });

  it('iniciarSessao troca de treino e zera as marcações', () => {
    const aberta = sessao({ treinoId: 'a', data: HOJE, finalizada: false, concluidos: ['a1'] });
    const { sessoes, sessao: trocada } = iniciarSessao([aberta], 'b', HOJE, contador());

    expect(sessoes).toHaveLength(1);
    expect(trocada).toMatchObject({ id: aberta.id, treinoId: 'b', concluidos: [] });
  });

  it('iniciarSessao depois de finalizar cria outra sessão no mesmo dia', () => {
    const feita = sessao({ treinoId: 'a', data: HOJE });
    const { sessoes } = iniciarSessao([feita], 'b', HOJE, contador());

    expect(sessoes).toHaveLength(2);
  });

  it('marca e desmarca exercícios', () => {
    const aberta = sessao({ id: 's', treinoId: 'a', data: HOJE, finalizada: false });

    let sessoes = alternarExercicio([aberta], 's', 'a1');
    sessoes = alternarExercicio(sessoes, 's', 'a2');
    expect(sessoes[0].concluidos).toEqual(['a1', 'a2']);

    sessoes = alternarExercicio(sessoes, 's', 'a1');
    expect(sessoes[0].concluidos).toEqual(['a2']);
  });

  it('sessão finalizada não muda mais', () => {
    const feita = sessao({ id: 's', treinoId: 'a', data: HOJE, concluidos: ['a1'] });

    expect(alternarExercicio([feita], 's', 'a2')[0].concluidos).toEqual(['a1']);
  });

  it('só finaliza com pelo menos um exercício feito', () => {
    const vazia = sessao({ id: 's', treinoId: 'a', data: HOJE, finalizada: false });
    const comUm = { ...vazia, concluidos: ['a1'] };

    expect(podeFinalizar(vazia)).toBe(false);
    expect(podeFinalizar(comUm)).toBe(true);
    expect(podeFinalizar(null)).toBe(false);
    expect(finalizarSessao([vazia], 's')[0].finalizada).toBe(false);
    expect(finalizarSessao([comUm], 's')[0].finalizada).toBe(true);
  });

  it('descarta só as sessões abertas do treino apagado', () => {
    const sessoes = [
      sessao({ id: '1', treinoId: 'a', data: '2026-10-01' }),
      sessao({ id: '2', treinoId: 'a', data: HOJE, finalizada: false }),
      sessao({ id: '3', treinoId: 'b', data: HOJE, finalizada: false }),
    ];

    expect(descartarSessoesAbertas(sessoes, 'a').map((s) => s.id)).toEqual(['1', '3']);
  });

  it('limpa sessões com mais de um ano', () => {
    const sessoes = [
      sessao({ id: 'velha', treinoId: 'a', data: '2025-10-03' }),
      sessao({ id: 'nova', treinoId: 'a', data: '2025-10-04' }),
    ];

    expect(limparSessoesAntigas(sessoes, HOJE).map((s) => s.id)).toEqual(['nova']);
  });
});

describe('progressoDaSessao', () => {
  it('conta feitos, total e fração', () => {
    const aberta = sessao({ treinoId: 'c', data: HOJE, finalizada: false, concluidos: ['c1'] });

    expect(progressoDaSessao(aberta, C)).toEqual({
      feitos: 1,
      total: 3,
      fracao: 1 / 3,
      completo: false,
    });
  });

  it('ignora exercício marcado que foi apagado do treino', () => {
    const aberta = sessao({ treinoId: 'a', data: HOJE, concluidos: ['a1', 'a2', 'apagado'] });

    expect(progressoDaSessao(aberta, A)).toMatchObject({ feitos: 2, completo: true, fracao: 1 });
  });

  it('treino sem exercícios não divide por zero', () => {
    const aberta = sessao({ treinoId: 'x', data: HOJE });

    expect(progressoDaSessao(aberta, treino('x'))).toMatchObject({ fracao: 0, completo: false });
  });
});

describe('situacaoDoDia', () => {
  it('sem treinos', () => {
    expect(situacaoDoDia([], [], HOJE)).toEqual({ tipo: 'sem-treinos' });
  });

  it('sugere o próximo do rodízio quando não treinou hoje', () => {
    const sessoes = [sessao({ treinoId: 'a', data: '2026-10-01' })];

    expect(situacaoDoDia([A, B], sessoes, HOJE)).toEqual({ tipo: 'sugerido', treino: B });
  });

  it('mostra o treino em andamento', () => {
    const aberta = sessao({ treinoId: 'b', data: HOJE, finalizada: false });

    expect(situacaoDoDia([A, B], [aberta], HOJE)).toEqual({
      tipo: 'em-andamento',
      treino: B,
      sessao: aberta,
    });
  });

  it('mostra concluído e o próximo da fila', () => {
    const feita = sessao({ treinoId: 'a', data: HOJE });

    expect(situacaoDoDia([A, B], [feita], HOJE)).toEqual({
      tipo: 'concluido',
      treino: A,
      sessao: feita,
      proximo: B,
    });
  });

  it('se o treino da sessão foi apagado, volta a sugerir', () => {
    const aberta = sessao({ treinoId: 'apagado', data: HOJE, finalizada: false });

    expect(situacaoDoDia([A], [aberta], HOJE)).toEqual({ tipo: 'sugerido', treino: A });
  });
});

describe('semana', () => {
  it('a semana começa na segunda', () => {
    expect(inicioDaSemana('2026-10-03')).toBe('2026-09-28'); // sábado
    expect(inicioDaSemana('2026-10-04')).toBe('2026-09-28'); // domingo
    expect(inicioDaSemana('2026-09-28')).toBe('2026-09-28'); // segunda
    expect(inicioDaSemana('2026-01-01')).toBe('2025-12-29'); // vira o ano
  });

  it('conta treinos finalizados de segunda até hoje', () => {
    const sessoes = [
      sessao({ treinoId: 'a', data: '2026-09-27' }), // domingo da semana passada
      sessao({ treinoId: 'a', data: '2026-09-28' }),
      sessao({ treinoId: 'b', data: '2026-09-30' }),
      sessao({ treinoId: 'c', data: HOJE, finalizada: false }),
    ];

    expect(treinosNaSemana(sessoes, HOJE)).toBe(2);
  });

  it('sequência de semanas seguidas treinando', () => {
    const sessoes = [
      sessao({ treinoId: 'a', data: '2026-09-07' }),
      // semana de 14/09 sem treino: quebra a sequência
      sessao({ treinoId: 'a', data: '2026-09-21' }),
      sessao({ treinoId: 'a', data: '2026-09-29' }),
    ];

    expect(sequenciaDeTreinos(sessoes, HOJE)).toBe(2);
  });

  it('semana atual sem treino ainda não zera a sequência', () => {
    const sessoes = [
      sessao({ treinoId: 'a', data: '2026-09-15' }),
      sessao({ treinoId: 'a', data: '2026-09-22' }),
    ];

    expect(sequenciaDeTreinos(sessoes, '2026-09-28')).toBe(2);
    expect(sequenciaDeTreinos([], HOJE)).toBe(0);
  });
});

describe('textos', () => {
  it('treinos na semana', () => {
    expect(textoTreinosNaSemana(0)).toBe('Nenhum treino nesta semana ainda');
    expect(textoTreinosNaSemana(1)).toBe('1 treino nesta semana');
    expect(textoTreinosNaSemana(3)).toBe('3 treinos nesta semana');
  });

  it('resumo do exercício', () => {
    expect(resumoExercicio(SUPINO)).toBe('3 x 10, 40 kg');
    expect(resumoExercicio({ ...SUPINO, cargaKg: 22.5 })).toBe('3 x 10, 22,5 kg');
    expect(resumoExercicio(REMADA)).toBe('4 x 8 a 12');
    expect(resumoExercicioAcessivel(SUPINO)).toBe('3 séries de 10 repetições, 40 quilos');
    expect(resumoExercicioAcessivel({ series: 1, repeticoes: '12' })).toBe(
      '1 série de 12 repetições',
    );
    expect(resumoExercicioAcessivel({ series: 1, repeticoes: '10 min' })).toBe('10 minutos');
    expect(resumoExercicioAcessivel({ series: 2, repeticoes: '5 min' })).toBe(
      '2 séries de 5 minutos',
    );
  });

  it('resumo do treino', () => {
    expect(resumoTreino({ ...A, foco: 'Peito' })).toBe('Peito, 2 exercícios');
    expect(resumoTreino(B)).toBe('1 exercício');
  });
});

describe('modelos', () => {
  it('todos têm treinos com exercícios válidos', () => {
    for (const modelo of MODELOS) {
      expect(modelo.treinos.length).toBeGreaterThanOrEqual(2);

      for (const dados of modelo.treinos) {
        expect(dados.exercicios?.length).toBeGreaterThanOrEqual(4);

        for (const exercicio of dados.exercicios ?? []) {
          expect(exercicio.series).toBeGreaterThan(0);
          expect(exercicio.repeticoes).toMatch(/^\d+( a \d+| min)?$/);
          // Grupo explícito: o card da tela inicial não depende de adivinhar pelo nome
          expect(exercicio.grupo).toBeDefined();
          // E o formulário de edição aceita o modelo como está
          expect(
            exercicioSchema.safeParse({
              ...exercicioParaFormulario({ ...exercicio, id: 'x' }),
            }).success,
          ).toBe(true);
        }
      }
    }
  });

  it('todo treino de modelo começa com aquecimento e termina com cardio', () => {
    for (const modelo of MODELOS) {
      for (const dados of modelo.treinos) {
        const grupos = (dados.exercicios ?? []).map((exercicio) => exercicio.grupo);

        expect(grupos[0]).toBe('aquecimento');
        expect(grupos[grupos.length - 1]).toBe('cardio');
      }
    }
  });

  it('ids dos modelos são únicos', () => {
    const ids = MODELOS.map((m) => m.id);

    expect(new Set(ids).size).toBe(ids.length);
  });
});

describe('legendaTreinoDoDia e concluidosDeHoje', () => {
  const emAndamento = sessao({ treinoId: 'a', data: HOJE, concluidos: ['a1'], finalizada: false });

  it('descreve cada situação', () => {
    expect(legendaTreinoDoDia({ tipo: 'sem-treinos' })).toBe('nenhum treino montado ainda');
    expect(legendaTreinoDoDia({ tipo: 'sugerido', treino: { ...A, foco: 'Peito' } })).toBe(
      'Treino A, Peito',
    );
    expect(legendaTreinoDoDia({ tipo: 'sugerido', treino: A })).toBe('Treino A');
    expect(legendaTreinoDoDia({ tipo: 'em-andamento', treino: A, sessao: emAndamento })).toBe(
      'Treino A, 1 de 2 feitos',
    );
    expect(
      legendaTreinoDoDia({ tipo: 'concluido', treino: A, sessao: emAndamento, proximo: B }),
    ).toBe('Treino A feito. Próximo: Treino B');
    expect(
      legendaTreinoDoDia({ tipo: 'concluido', treino: A, sessao: emAndamento, proximo: null }),
    ).toBe('Treino A feito');
  });

  it('só há marcados quando existe sessão hoje', () => {
    expect(concluidosDeHoje({ tipo: 'sugerido', treino: A })).toEqual([]);
    expect(concluidosDeHoje({ tipo: 'em-andamento', treino: A, sessao: emAndamento })).toEqual([
      'a1',
    ]);
  });
});
