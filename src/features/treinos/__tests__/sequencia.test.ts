import { sequenciaDeDias } from '../regraSequencia';
import { somarDias } from '../semana';
import {
  diaContou,
  diaPulavel,
  diasDeTreinoNoTotal,
  diasDoMes,
  fraseDaSequencia,
  maiorSequencia,
  marcos,
  mesVizinho,
  primeiroDiaRegistrado,
  resumoDoTreinoDeHoje,
  rotuloDaBolinha,
  rotuloDiasSeguidos,
  rotuloDoDiaDoCalendario,
  semanaDaSequencia,
  textoDoProximoMarco,
  textoTreinosNoMes,
} from '../sequencia';
import type { Sessao, Treino } from '../types';

// Quarta, 7 de outubro de 2026. A semana vai de domingo, 4, a sábado, 10.
const HOJE = '2026-10-07';

const IDS = ['e1', 'e2', 'e3', 'e4'];

// Treino com 4 exercícios: 2 feitos = 50%, 4 = 100%. Sem dias: rodízio, nunca descansa
const TREINO: Treino = {
  id: 't',
  nome: 'Treino A',
  exercicios: IDS.map((id) => ({ id, nome: id, series: 3, repeticoes: '10' })),
};

// Plano semanal: segunda, quarta e sexta. O resto é descanso
const PLANO: Treino = { ...TREINO, dias: [1, 3, 5] };

function sessao(data: string, feitos: number, extra: Partial<Sessao> = {}): Sessao {
  return {
    id: `s-${data}-${feitos}`,
    treinoId: 't',
    data,
    concluidos: IDS.slice(0, feitos),
    finalizada: true,
    ...extra,
  };
}

/** `n` dias seguidos com treino completo terminando em `fim`. */
function seguidos(fim: string, n: number, feitos = 4): Sessao[] {
  return Array.from({ length: n }, (_, i) => sessao(somarDias(fim, -i), feitos));
}

describe('diaContou e diaPulavel', () => {
  it('conta com 50% ou mais', () => {
    expect(diaContou([TREINO], [sessao(HOJE, 2)], HOJE)).toBe(true);
    expect(diaContou([TREINO], [sessao(HOJE, 1)], HOJE)).toBe(false);
    expect(diaContou([TREINO], [], HOJE)).toBe(false);
  });

  it('descanso do plano sem treino é pulável; com treino feito, não', () => {
    // terça, 6: fora do plano
    expect(diaPulavel([PLANO], [], '2026-10-06')).toBe(true);
    expect(diaPulavel([PLANO], [sessao('2026-10-06', 4)], '2026-10-06')).toBe(false);
    expect(diaPulavel([TREINO], [], '2026-10-06')).toBe(false);
  });
});

describe('primeiroDiaRegistrado', () => {
  it('acha a menor data, sem depender da ordem', () => {
    expect(primeiroDiaRegistrado([sessao('2026-09-10', 4), sessao('2026-08-01', 1)])).toBe(
      '2026-08-01',
    );
    expect(primeiroDiaRegistrado([])).toBeNull();
  });
});

describe('maiorSequencia', () => {
  it('sem histórico é zero', () => {
    expect(maiorSequencia([TREINO], [], HOJE)).toBe(0);
  });

  it('acha a maior entre várias sequências', () => {
    const sessoes = [...seguidos('2026-09-10', 5), ...seguidos('2026-10-05', 3)];

    expect(maiorSequencia([TREINO], sessoes, HOJE)).toBe(5);
  });

  it('dia com menos de 50% quebra', () => {
    const sessoes = [...seguidos('2026-10-03', 3), sessao('2026-10-04', 1), sessao(HOJE, 4)];

    expect(maiorSequencia([TREINO], sessoes, HOJE)).toBe(3);
  });

  it('descanso do plano não quebra e conta', () => {
    // seg 28/9, qua 30/9, sex 2/10, seg 5/10, qua 7/10 (hoje): 10 dias, todos na sequência
    const datas = ['2026-09-28', '2026-09-30', '2026-10-02', '2026-10-05', HOJE];
    const sessoes = datas.map((data) => sessao(data, 4));

    expect(maiorSequencia([PLANO], sessoes, HOJE)).toBe(10);
    expect(maiorSequencia([PLANO], sessoes, HOJE)).toBe(sequenciaDeDias([PLANO], sessoes, HOJE));
  });

  it('atravessa a virada do mês e do ano', () => {
    const sessoes = seguidos('2026-01-02', 5);

    expect(maiorSequencia([TREINO], sessoes, HOJE)).toBe(5);
  });

  it('histórico longo: um ano inteiro seguido', () => {
    const sessoes = seguidos(HOJE, 365);

    expect(maiorSequencia([TREINO], sessoes, HOJE)).toBe(365);
    expect(sequenciaDeDias([TREINO], sessoes, HOJE)).toBe(365);
  });

  it('nunca é menor que a sequência atual', () => {
    const sessoes = seguidos('2026-10-06', 4);

    expect(maiorSequencia([TREINO], sessoes, HOJE)).toBeGreaterThanOrEqual(
      sequenciaDeDias([TREINO], sessoes, HOJE),
    );
  });
});

describe('diasDeTreinoNoTotal', () => {
  it('conta cada dia uma vez e só os que passaram de 50%', () => {
    const sessoes = [
      sessao('2026-09-01', 4),
      sessao('2026-09-01', 2, { id: 'outra' }),
      sessao('2026-09-02', 1),
      sessao('2026-09-03', 3),
    ];

    expect(diasDeTreinoNoTotal([TREINO], sessoes, HOJE)).toBe(2);
  });
});

describe('semanaDaSequencia', () => {
  it('7 bolinhas de domingo a sábado com o estado de cada dia', () => {
    const sessoes = [sessao('2026-10-05', 4), sessao('2026-10-06', 1)];
    const semana = semanaDaSequencia([TREINO], sessoes, HOJE);

    expect(semana.map((b) => b.sigla)).toEqual(['dom', 'seg', 'ter', 'qua', 'qui', 'sex', 'sáb']);
    expect(semana.map((b) => b.estado)).toEqual([
      'perdido',
      'feito',
      'perdido',
      'pendente',
      'futuro',
      'futuro',
      'futuro',
    ]);
    expect(semana[3].hoje).toBe(true);
  });

  it('descanso do plano aparece neutro', () => {
    const semana = semanaDaSequencia([PLANO], [sessao('2026-10-05', 4)], HOJE);

    expect(semana[0].estado).toBe('descanso');
    expect(semana[2].estado).toBe('descanso');
  });

  it('rótulo para o leitor de tela', () => {
    const semana = semanaDaSequencia([TREINO], [sessao('2026-10-05', 4)], HOJE);

    expect(rotuloDaBolinha(semana[1])).toBe('segunda, treinou');
    expect(rotuloDaBolinha(semana[3])).toBe('hoje, ainda sem treino');
  });
});

describe('mesVizinho', () => {
  it('vira o ano para os dois lados', () => {
    expect(mesVizinho(2026, 0, -1)).toEqual({ ano: 2025, mes: 11 });
    expect(mesVizinho(2025, 11, 1)).toEqual({ ano: 2026, mes: 0 });
    expect(mesVizinho(2026, 9, -1)).toEqual({ ano: 2026, mes: 8 });
  });
});

describe('diasDoMes', () => {
  it('outubro de 2026: 31 dias, começa na quinta', () => {
    const mes = diasDoMes(2026, 9, [TREINO], [], HOJE);

    expect(mes.titulo).toBe('outubro de 2026');
    expect(mes.dias).toHaveLength(31);
    expect(mes.deslocamento).toBe(4);
    expect(mes.dias[0].chave).toBe('2026-10-01');
    expect(mes.dias[30].chave).toBe('2026-10-31');
  });

  it('fevereiro bissexto e comum', () => {
    expect(diasDoMes(2028, 1, [TREINO], [], HOJE).dias).toHaveLength(29);
    expect(diasDoMes(2026, 1, [TREINO], [], HOJE).dias).toHaveLength(28);
  });

  it('pinta cada dia pela regra da faixa e conta os treinos do mês', () => {
    const sessoes = [
      sessao('2026-09-30', 4), // fora do mês
      sessao('2026-10-01', 4),
      sessao('2026-10-02', 3),
      sessao('2026-10-05', 1),
    ];
    const mes = diasDoMes(2026, 9, [TREINO], sessoes, HOJE);
    const estado = (dia: number) => mes.dias[dia - 1].estado;

    expect(estado(1)).toBe('completo');
    expect(estado(2)).toBe('parcial');
    // Sem nada registrado e sem treino marcado no dia: neutro, não vermelho
    expect(estado(3)).toBe('descanso');
    // Treinou pouco (menos de 50%): vermelho
    expect(estado(5)).toBe('fraco');
    expect(estado(7)).toBe('hoje');
    expect(estado(8)).toBe('futuro');
    expect(mes.dias[6].hoje).toBe(true);
    expect(mes.treinos).toBe(2);
  });

  it('hoje com 50% ou mais já aparece pintado', () => {
    const mes = diasDoMes(2026, 9, [TREINO], [sessao(HOJE, 4)], HOJE);

    expect(mes.dias[6]).toMatchObject({ estado: 'completo', hoje: true });
  });

  it('dias antes do primeiro treino ficam sem registro, não em vermelho', () => {
    const mes = diasDoMes(2026, 9, [TREINO], [sessao('2026-10-03', 4)], HOJE);

    expect(mes.dias[0].estado).toBe('vazio');
    expect(mes.dias[3].estado).toBe('descanso');
  });

  it('descanso do plano fica neutro', () => {
    const mes = diasDoMes(2026, 9, [PLANO], [sessao('2026-10-01', 4)], HOJE);

    // terça, 6
    expect(mes.dias[5].estado).toBe('descanso');
    // segunda, 5, sem treino: fraco
    expect(mes.dias[4].estado).toBe('fraco');
  });

  it('navega só até o mês do primeiro treino e até o mês de hoje', () => {
    const sessoes = [sessao('2026-08-15', 4)];

    expect(diasDoMes(2026, 9, [TREINO], sessoes, HOJE)).toMatchObject({
      temAnterior: true,
      temProximo: false,
    });
    expect(diasDoMes(2026, 7, [TREINO], sessoes, HOJE)).toMatchObject({
      temAnterior: false,
      temProximo: true,
    });
    expect(diasDoMes(2026, 9, [TREINO], [], HOJE).temAnterior).toBe(false);
  });

  it('texto dos treinos no mês, singular e plural', () => {
    expect(textoTreinosNoMes(1)).toBe('1 dia de treino neste mês');
    expect(textoTreinosNoMes(0)).toBe('0 dias de treino neste mês');
  });

  it('rótulo do dia', () => {
    const mes = diasDoMes(2026, 9, [TREINO], [sessao(HOJE, 4)], HOJE);

    expect(rotuloDoDiaDoCalendario(mes.dias[6], 9)).toBe(
      '7 de outubro, hoje, treino completo, 100% do treino feito',
    );
    expect(rotuloDoDiaDoCalendario(mes.dias[9], 9)).toBe('10 de outubro, ainda não chegou');
  });
});

describe('marcos', () => {
  it('sem sequência: nenhum alcançado e o próximo é 7', () => {
    const { lista, proximo } = marcos(0, 0);

    expect(lista.map((m) => m.dias)).toEqual([7, 30, 100, 250, 365]);
    expect(lista.every((m) => !m.alcancado)).toBe(true);
    expect(proximo).toEqual({ dias: 7, faltam: 7, fracao: 0 });
  });

  it('o recorde marca os alcançados; o próximo vem da sequência atual', () => {
    const { lista, proximo } = marcos(18, 40);

    expect(lista.filter((m) => m.alcancado).map((m) => m.dias)).toEqual([7, 30]);
    expect(proximo).toEqual({ dias: 30, faltam: 12, fracao: 0.6 });
    expect(textoDoProximoMarco(proximo!)).toBe('faltam 12 dias para 30');
  });

  it('no marco exato, o próximo já é o seguinte', () => {
    expect(marcos(7, 7).proximo?.dias).toBe(30);
  });

  it('depois de 365 não há próximo', () => {
    const { lista, proximo } = marcos(400, 400);

    expect(lista.every((m) => m.alcancado)).toBe(true);
    expect(proximo).toBeNull();
  });

  it('singular quando falta 1 dia', () => {
    expect(textoDoProximoMarco({ dias: 7, faltam: 1, fracao: 6 / 7 })).toBe('falta 1 dia para 7');
  });
});

describe('fraseDaSequencia', () => {
  it.each([
    [0, 'bora começar hoje'],
    [1, 'começou bem'],
    [3, 'pegando o ritmo'],
    [7, 'uma semana inteira'],
    [20, 'virou hábito'],
    [45, 'mais de um mês sem parar'],
    [150, 'ninguém te para'],
    [365, 'um ano inteiro, lenda'],
  ])('%i dias: "%s"', (dias, frase) => {
    expect(fraseDaSequencia(dias)).toBe(frase);
  });

  it('sem emoji nem travessão em nenhuma frase', () => {
    for (const dias of [0, 1, 3, 7, 20, 45, 150, 365]) {
      expect(fraseDaSequencia(dias)).toMatch(/^[a-zà-ú ,]+$/);
    }
  });

  it('singular e plural embaixo do número', () => {
    expect(rotuloDiasSeguidos(1)).toBe('dia de sequência');
    expect(rotuloDiasSeguidos(5)).toBe('dias de sequência');
  });
});

describe('resumoDoTreinoDeHoje', () => {
  it('nome do treino e exercícios feitos', () => {
    expect(resumoDoTreinoDeHoje([TREINO], [sessao(HOJE, 3)], HOJE)).toBe(
      'treino A: 3 de 4 exercícios',
    );
  });

  it('nada feito hoje: sem resumo', () => {
    expect(resumoDoTreinoDeHoje([TREINO], [], HOJE)).toBeNull();
    expect(resumoDoTreinoDeHoje([TREINO], [sessao(HOJE, 0)], HOJE)).toBeNull();
  });
});
