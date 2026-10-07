import { acaoTreinoHoje, podeMarcarNoInicio, situacaoDoDia } from '../logica';
import { diasDaSemana, resumoDoDia, rotuloDoDia, sequenciaDeDias } from '../semana';
import type { Sessao, Treino } from '../types';

// Quarta, 7 de outubro de 2026. Plano: treino A na segunda (1) e quarta (3).
const HOJE = '2026-10-07';
const A: Treino = {
  id: 'a',
  nome: 'Treino A',
  dias: [1, 3],
  exercicios: [
    { id: 'e1', nome: 'Supino reto', series: 3, repeticoes: '12', grupo: 'peito' },
    { id: 'e2', nome: 'Remada baixa', series: 3, repeticoes: '12', grupo: 'costas' },
  ],
};

function sessao(data: string, concluidos: string[]): Sessao {
  return { id: data, treinoId: 'a', data, concluidos, finalizada: true };
}

describe('dia de descanso no plano semanal', () => {
  it('dias passados sem treino no plano ficam como descanso, não como falta', () => {
    const dias = diasDaSemana([A], [sessao('2026-10-05', ['e1', 'e2'])], HOJE);

    expect(dias.map((dia) => dia.estado)).toEqual([
      'descanso', // domingo
      'completo', // segunda (dia do plano, feito)
      'descanso', // terça
      'hoje',
      'futuro',
      'futuro',
      'futuro',
    ]);
    expect(resumoDoDia(dias[2])).toBe('terça: descanso');
    expect(rotuloDoDia(dias[2])).toBe('terça, 6, dia de descanso');
  });

  it('dia do plano que passou sem treino continua vermelho', () => {
    const quinta = '2026-10-08';
    const dias = diasDaSemana([A], [], quinta);

    expect(dias[3].estado).toBe('fraco'); // quarta era dia de treino
    expect(resumoDoDia(dias[3])).toBe('quarta: sem treino');
  });

  it('a sequência atravessa dias de descanso sem quebrar', () => {
    // segunda feita, terça descanso, quarta (hoje) feita
    const sessoes = [sessao('2026-10-05', ['e1', 'e2']), sessao(HOJE, ['e1', 'e2'])];

    expect(sequenciaDeDias([A], sessoes, HOJE)).toBe(2);
  });

  it('no dia de descanso, a tela inicial não marca e o botão oferece treinar mesmo assim', () => {
    const terca = '2026-10-06';
    const situacao = situacaoDoDia([A], [], terca);

    expect(situacao).toMatchObject({ tipo: 'sugerido', descanso: true });
    expect(podeMarcarNoInicio(situacao)).toBe(false);
    expect(acaoTreinoHoje(situacao)?.texto).toBe('treinar mesmo assim');
  });
});
