import type { Sessao, Treino } from '../types';
import { visaoDoDia } from '../visaoDoDia';

// Quarta, 7 de outubro de 2026
const HOJE = '2026-10-07';

const ex = (id: string) => ({ id, nome: id, series: 3, repeticoes: '12', grupo: 'peito' as const });
const A: Treino = { id: 'a', nome: 'Treino A', exercicios: [ex('a1'), ex('a2')] };
const B: Treino = { id: 'b', nome: 'Treino B', exercicios: [ex('b1')] };

const sessao = (
  data: string,
  treinoId: string,
  concluidos: string[],
  finalizada = true,
): Sessao => ({
  id: data,
  treinoId,
  data,
  concluidos,
  finalizada,
});

describe('visaoDoDia', () => {
  it('hoje: treino do dia, marcável, com título "treino de hoje"', () => {
    const visao = visaoDoDia([A, B], [sessao(HOJE, 'a', ['a1'], false)], HOJE, HOJE);

    expect(visao).toMatchObject({
      quando: 'hoje',
      titulo: 'treino de hoje',
      nomeDoDia: 'quarta',
      podeMarcar: true,
      concluidos: ['a1'],
    });
    expect(visao.treino?.id).toBe('a');
  });

  it('dia que passou: mostra o que foi feito, só para consulta', () => {
    const visao = visaoDoDia([A, B], [sessao('2026-10-05', 'b', ['b1'])], '2026-10-05', HOJE);

    expect(visao).toMatchObject({
      quando: 'passado',
      titulo: 'treino de segunda',
      legenda: 'treino B, 1 de 1 feitos',
      podeMarcar: false,
      concluidos: ['b1'],
    });
    expect(visao.treino?.id).toBe('b');
  });

  it('ontem sem nada feito e sem plano: avisa que não tem registro', () => {
    const visao = visaoDoDia([A, B], [], '2026-10-06', HOJE);

    expect(visao).toMatchObject({
      titulo: 'treino de ontem',
      legenda: 'nenhum treino registrado nesse dia',
      treino: null,
      descanso: false,
    });
  });

  it('futuro com plano semanal: o treino planejado do dia, ou descanso', () => {
    const comPlano = [
      { ...A, dias: [4] }, // quinta
      { ...B, dias: [5] }, // sexta
    ];

    expect(visaoDoDia(comPlano, [], '2026-10-08', HOJE)).toMatchObject({
      titulo: 'treino de amanhã',
      legenda: 'treino A, planejado para esse dia',
      podeMarcar: false,
    });
    expect(visaoDoDia(comPlano, [], '2026-10-09', HOJE).treino?.id).toBe('b');
    expect(visaoDoDia(comPlano, [], '2026-10-10', HOJE)).toMatchObject({
      titulo: 'treino de sábado',
      legenda: 'dia de descanso',
      descanso: true,
      treino: null,
    });
  });

  it('futuro sem plano: o próximo do rodízio', () => {
    const visao = visaoDoDia([A, B], [sessao('2026-10-05', 'a', ['a1', 'a2'])], '2026-10-09', HOJE);

    expect(visao.legenda).toBe('treino B, próximo do rodízio');
  });
});
