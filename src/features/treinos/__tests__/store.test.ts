import { chaveDoDia } from '@/shared/lib/data';

import { MODELOS } from '../modelos';
import { migrarTreinos, useTreinosStore } from '../store';

const HOJE = new Date(2026, 9, 3, 10, 0);
const AMANHA = new Date(2026, 9, 4, 10, 0);

const SUPINO = { nome: 'Supino', series: 3, repeticoes: '10', cargaKg: 40 };

beforeEach(() => {
  useTreinosStore.setState({ treinos: [], sessoes: [] });
});

function estado() {
  return useTreinosStore.getState();
}

describe('useTreinosStore', () => {
  it('cria treinos vazios com nomes em sequência', () => {
    const idA = estado().novoTreino();
    estado().novoTreino();

    expect(estado().treinos.map((t) => t.nome)).toEqual(['Treino A', 'Treino B']);
    expect(estado().treinos[0].id).toBe(idA);
  });

  it('usa um modelo pronto', () => {
    estado().usarModelo(MODELOS[0]);

    expect(estado().treinos).toHaveLength(3);
    expect(estado().treinos[2].foco).toBe('Pernas e abdômen');
  });

  it('edita, reordena e remove treinos', () => {
    const idA = estado().novoTreino();
    const idB = estado().novoTreino();

    estado().editarTreino(idA, { nome: 'Peito', foco: 'Empurrar' });
    estado().moverTreino(idB, 'cima');

    expect(estado().treinos.map((t) => t.nome)).toEqual(['Treino B', 'Peito']);

    estado().removerTreino(idB);
    expect(estado().treinos.map((t) => t.id)).toEqual([idA]);
  });

  it('gerencia exercícios de um treino', () => {
    const id = estado().novoTreino();

    estado().adicionarExercicio(id, SUPINO);
    estado().adicionarExercicio(id, { ...SUPINO, nome: 'Crucifixo' });

    const [supino, crucifixo] = estado().treinos[0].exercicios;

    estado().editarExercicio(id, supino.id, { ...SUPINO, cargaKg: 45 });
    estado().moverExercicio(id, crucifixo.id, 'cima');

    expect(estado().treinos[0].exercicios.map((e) => e.nome)).toEqual(['Crucifixo', 'Supino']);
    expect(estado().treinos[0].exercicios[1].cargaKg).toBe(45);

    estado().removerExercicio(id, crucifixo.id);
    expect(estado().treinos[0].exercicios.map((e) => e.nome)).toEqual(['Supino']);
  });

  it('roda a sessão do dia: começa, marca e finaliza', () => {
    const id = estado().novoTreino();
    estado().adicionarExercicio(id, SUPINO);
    const exercicioId = estado().treinos[0].exercicios[0].id;

    estado().comecarTreino(id, HOJE);
    expect(estado().sessoes).toHaveLength(1);
    expect(estado().sessoes[0]).toMatchObject({ treinoId: id, data: '2026-10-03' });

    // Sem nada marcado, não finaliza
    expect(estado().finalizarTreino(HOJE)).toBe(false);

    estado().alternarExercicio(exercicioId, HOJE);
    expect(estado().sessoes[0].concluidos).toEqual([exercicioId]);

    expect(estado().finalizarTreino(HOJE)).toBe(true);
    expect(estado().sessoes[0].finalizada).toBe(true);

    // Finalizar de novo não "conta" outra vez
    expect(estado().finalizarTreino(HOJE)).toBe(false);
  });

  it('começar de novo no mesmo dia retoma a sessão aberta', () => {
    const id = estado().novoTreino();

    estado().comecarTreino(id, HOJE);
    estado().comecarTreino(id, HOJE);

    expect(estado().sessoes).toHaveLength(1);
  });

  it('a sessão de hoje não vale para amanhã', () => {
    const id = estado().novoTreino();

    estado().comecarTreino(id, HOJE);
    estado().alternarExercicio('qualquer', AMANHA);

    expect(estado().finalizarTreino(AMANHA)).toBe(false);
    expect(estado().sessoes[0].concluidos).toEqual([]);
  });

  it('apagar treino descarta a sessão aberta de hoje', () => {
    const id = estado().novoTreino();

    // A sessão aberta precisa ser de hoje de verdade: de dias passados ela fica no histórico
    estado().comecarTreino(id, new Date());
    estado().removerTreino(id);

    expect(estado().sessoes).toEqual([]);
  });

  it('apaga tudo', () => {
    const id = estado().novoTreino();
    estado().comecarTreino(id, HOJE);

    estado().apagarTudo();

    expect(estado().treinos).toEqual([]);
    expect(estado().sessoes).toEqual([]);
  });
});

describe('migração da data do plano', () => {
  it('treinos salvos com dias ganham a data de hoje; sem dias, ficam iguais', () => {
    const salvo = {
      treinos: [
        { id: 'a', nome: 'treino A', exercicios: [], dias: [1] },
        { id: 'b', nome: 'treino B', exercicios: [] },
      ],
      sessoes: [],
      congelados: [],
    };
    const migrado = migrarTreinos(salvo, 2) as typeof salvo & {
      treinos: { planoDesde?: string }[];
    };

    expect(migrado.treinos[0].planoDesde).toBe(chaveDoDia(new Date()));
    expect(migrado.treinos[1]).toBe(salvo.treinos[1]);
  });

  it('trocar os dias de um treino na store carimba a data sozinho', () => {
    const id = estado().novoTreino();

    estado().definirDias(id, [2, 4]);

    expect(estado().treinos[0].planoDesde).toBe(chaveDoDia(new Date()));
  });
});
