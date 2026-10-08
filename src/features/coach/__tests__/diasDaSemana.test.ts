import type { PlanoDieta } from '@/features/dieta/contrato';

import { alvoDaDieta, alvoDoTreino, comPrefixoDias, semanaDoPedido } from '../alvos';
import { linhasDietaPorDia } from '../contexto';
import type { PedidoCoach } from '../contrato';
import {
  citaExercicio,
  diasCitados,
  diasDoAjusteDeTreino,
  modoDoTreino,
  pedeMudancaDeDieta,
  pedeMudancaDeTreino,
} from '../intencao';
import { ORIENTACAO_FERRAMENTA_TREINOS, SISTEMA_COACH, SISTEMA_COACH_PEDIDOS } from '../prompt';
import { propostaDeDieta } from '../proposta';

/** O coach entende dias da semana: "o supino da sexta", "o almoço de quarta". */

function plano(almoco: string): PlanoDieta {
  return {
    resumo: 'Plano.',
    caloriasDia: 1000,
    macros: { proteinaG: 80, carboidratoG: 100, gorduraG: 30 },
    refeicoes: [
      {
        nome: 'Almoço',
        horario: '12:00',
        calorias: 600,
        itens: [{ alimento: almoco, quantidade: '100 g' }],
        substituicoes: [],
      },
      {
        nome: 'Jantar',
        horario: '20:00',
        calorias: 400,
        itens: [{ alimento: 'Frango', quantidade: '100 g' }],
        substituicoes: [],
      },
    ],
    dicas: [],
    aviso: 'Consulte um nutricionista.',
  };
}

describe('diasCitados', () => {
  it.each([
    ['troque o supino da sexta', [5]],
    ['muda o almoço de quarta', [3]],
    ['tira cardio de segunda', [1]],
    ['dieta de segunda e sexta', [1, 5]],
    ['troca o leg press por agachamento', []],
  ])('"%s"', (texto, dias) => {
    expect(diasCitados(texto)).toEqual(dias);
  });

  it('"segunda série" não é dia', () => {
    expect(diasCitados('muda a segunda série do supino para 8 repetições')).toEqual([]);
  });
});

describe('diasDoAjusteDeTreino', () => {
  it('dia citado delimita o ajuste', () => {
    expect(diasDoAjusteDeTreino('troca o supino da sexta')).toEqual([5]);
  });

  it('treino nomeado ou mudança de dia não filtra', () => {
    expect(diasDoAjusteDeTreino('troca o supino do treino B de sexta')).toEqual([]);
    expect(diasDoAjusteDeTreino('passa o treino de pernas para sexta')).toEqual([]);
  });
});

describe('intenção com dia da semana', () => {
  it.each([
    'troque o supino da sexta',
    'tira cardio de segunda',
    'troca o leg press por agachamento',
  ])('"%s" é ajuste de treino', (texto) => {
    expect(pedeMudancaDeTreino(texto)).toBe(true);
    expect(modoDoTreino(texto, true)).toBe('ajuste');
  });

  it('"muda o almoço de quarta" é pedido de dieta, não de treino', () => {
    expect(pedeMudancaDeDieta('muda o almoço de quarta')).toBe(true);
    expect(pedeMudancaDeTreino('muda o almoço de quarta')).toBe(false);
  });

  it('cita exercício conhecido', () => {
    expect(citaExercicio('tira o cardio')).toBe(true);
    expect(citaExercicio('tira o arroz')).toBe(false);
  });
});

describe('alvos no servidor', () => {
  const SEMANA = plano('Arroz');
  const QUARTA = plano('Peixe');
  const pedido: PedidoCoach = {
    mensagens: [{ papel: 'usuario', texto: 'x' }],
    contexto: '',
    planoAtual: SEMANA,
    dietaPorDia: [{ dia: 3, plano: QUARTA }],
    treinosAtuais: [
      { id: 'a', nome: 'Treino A', dias: [1], exercicios: [] },
      { id: 'b', nome: 'Treino B', dias: [5], exercicios: [] },
    ],
  };

  it('semana do pedido', () => {
    expect(semanaDoPedido(pedido)).toEqual({ plano: SEMANA, porDia: { 3: QUARTA } });
  });

  it('"muda o almoço de quarta" mira o plano de quarta', () => {
    expect(alvoDaDieta(pedido, 'muda o almoço de quarta')).toEqual({
      modo: 'ajuste',
      alvos: ['almoco'],
      dias: [3],
      atual: QUARTA,
    });
  });

  it('dia que só aparece na mensagem também conta', () => {
    expect(alvoDaDieta(pedido, 'trocar o almoço', 'troca o almoço de segunda').dias).toEqual([1]);
  });

  it('sem dia, o plano da semana', () => {
    expect(alvoDaDieta(pedido, 'troca o almoço').atual).toBe(SEMANA);
  });

  it('"troca o supino da sexta" acha o treino de sexta', () => {
    expect(alvoDoTreino(pedido, 'troca o supino da sexta')).toMatchObject({
      modo: 'ajuste',
      diasAlvo: [5],
      doDia: [{ id: 'b' }],
    });
  });

  it('prefixo com os dias', () => {
    expect(comPrefixoDias(['almoço trocado'], [3])).toEqual(['quarta: almoço trocado']);
    expect(comPrefixoDias(['almoço trocado'], [])).toEqual(['almoço trocado']);
  });
});

describe('propostaDeDieta com dias', () => {
  it('ajuste de um dia: linhas começam pelo dia e guardam dias e refeições', () => {
    const proposta = propostaDeDieta(plano('Peixe'), plano('Macarrão'), {
      modo: 'ajuste',
      alvos: ['almoco'],
      origem: 'ia',
      dias: [3],
    });

    expect(proposta).toMatchObject({
      modo: 'ajuste',
      dias: [3],
      alvos: ['almoco'],
      resumo: { titulo: 'quarta: 1.000 kcal em 2 refeições', mudancas: ['quarta: almoço trocado'] },
    });
  });

  it('plano novo para um dia', () => {
    const proposta = propostaDeDieta(plano('Arroz'), plano('Peixe'), {
      modo: 'novo',
      alvos: [],
      origem: 'demo',
      dias: [6],
    });

    expect(proposta?.resumo.mudancas).toEqual(['sábado: plano novo só para esse dia']);
  });
});

describe('contexto da dieta por dia', () => {
  it('só as refeições que mudam em relação à semana', () => {
    const linhas = linhasDietaPorDia(plano('Arroz'), { 5: plano('Pizza') });

    expect(linhas).toEqual([
      'sexta (1.000 kcal), diferente do plano da semana em:',
      '- 12:00 Almoço, 600 kcal: Pizza (100 g)',
    ]);
  });

  it('sem dias próprios, nada', () => {
    expect(linhasDietaPorDia(plano('Arroz'), {})).toEqual([]);
  });
});

describe('prompt do coach', () => {
  it('pede para não mudar o que não foi pedido e respeitar o dia citado', () => {
    for (const texto of [SISTEMA_COACH, SISTEMA_COACH_PEDIDOS]) {
      expect(texto).toContain('Reaproveite os alimentos, refeições e exercícios');
      expect(texto).toContain('vale só para aquele dia');
      expect(texto).not.toMatch(/[—–]/);
    }

    expect(SISTEMA_COACH).toContain('atualizar_treinos: mande TODOS os treinos');
    expect(SISTEMA_COACH_PEDIDOS).toContain('use ajustar_treino');
    expect(SISTEMA_COACH_PEDIDOS).toContain('descreva em uma frase o que a pessoa quer');
    expect(ORIENTACAO_FERRAMENTA_TREINOS).toContain('troca o supino da sexta');
  });
});
