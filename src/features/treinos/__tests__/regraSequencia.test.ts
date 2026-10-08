import {
  calcularSequencia,
  emUltimaChance,
  entradaDoDia,
  faltamParaCongelador,
  percorrerDias,
  sequenciaDeDias,
  textoCongeladores,
  textoProximoCongelador,
  textoUltimaChance,
  type EntradaDoDia,
} from '../regraSequencia';
import { somarDias } from '../semana';
import type { Sessao, Treino } from '../types';

// Quarta, 7 de outubro de 2026
const HOJE = '2026-10-07';
const IDS = ['e1', 'e2', 'e3', 'e4'];

// Rodízio: sem dias marcados
const RODIZIO: Treino = {
  id: 't',
  nome: 'Treino A',
  exercicios: IDS.map((id) => ({ id, nome: id, series: 3, repeticoes: '10' })),
};
// Plano: segunda, quarta e sexta; o resto é descanso
const PLANO: Treino = { ...RODIZIO, dias: [1, 3, 5] };

function sessao(data: string, feitos = 4): Sessao {
  return {
    id: `s-${data}`,
    treinoId: 't',
    data,
    concluidos: IDS.slice(0, feitos),
    finalizada: true,
  };
}

/**
 * Dias a partir de 2026-01-01 por letra:
 * T treino, D descanso do plano, F falta em dia livre (pode ser folga),
 * X falta em dia marcado do plano (nunca é folga).
 */
function dias(padrao: string, inicio = '2026-01-01'): EntradaDoDia[] {
  return [...padrao].map((letra, n) => {
    const chave = somarDias(inicio, n);

    if (letra === 'T') {
      return { chave, tipo: 'treino', folgaPermitida: false };
    }

    if (letra === 'D') {
      return { chave, tipo: 'descanso', folgaPermitida: false };
    }

    return { chave, tipo: 'falta', folgaPermitida: letra === 'F' };
  });
}

/** Separa o último dia como "hoje". */
function comHoje(padrao: string) {
  const lista = dias(padrao);

  return { passados: lista.slice(0, -1), hoje: lista[lista.length - 1] };
}

function rodar(padrao: string, salvos: string[] = []) {
  const { passados, hoje } = comHoje(padrao);

  return percorrerDias(passados, hoje, salvos);
}

describe('percorrerDias: treino e descanso', () => {
  it('sem nada, tudo zero', () => {
    expect(percorrerDias([], null)).toMatchObject({
      atual: 0,
      recorde: 0,
      congeladores: 0,
      risco: 'nenhum',
    });
  });

  it('cada treino soma um', () => {
    expect(rodar('TTT').atual).toBe(3);
  });

  it('descanso do plano conta e não quebra', () => {
    expect(rodar('TDTDT').atual).toBe(5);
  });

  it('descanso não começa uma sequência sozinho', () => {
    expect(rodar('DDT').atual).toBe(1);
    expect(rodar('DD').atual).toBe(0);
  });

  it('descanso de hoje já conta', () => {
    const resultado = rodar('TTD');

    expect(resultado.atual).toBe(3);
    expect(resultado.hojeContou).toBe(true);
    expect(resultado.risco).toBe('nenhum');
  });
});

describe('percorrerDias: folga do rodízio', () => {
  it('um dia sem treino entre dois treinos não quebra e conta', () => {
    const resultado = rodar('TFT');

    expect(resultado.atual).toBe(3);
    expect(resultado.marcas['2026-01-02']).toBe('descanso');
  });

  it('dois dias seguidos sem treino quebram', () => {
    const resultado = rodar('TTFFT');

    expect(resultado.atual).toBe(1);
    expect(resultado.recorde).toBe(2);
    // A folga que não valeu volta a ser falta (sem marca)
    expect(resultado.marcas['2026-01-03']).toBeUndefined();
  });

  it('folga só depois de um dia treinado: não emenda com descanso', () => {
    // descanso do plano e depois falta num dia livre (plano misto) quebra
    expect(rodar('TDFT').atual).toBe(1);
  });

  it('dia marcado no plano sem treino quebra (não é folga)', () => {
    expect(rodar('TXT').atual).toBe(1);
  });

  it('folga de ontem ainda não conta enquanto hoje não treinou', () => {
    const resultado = rodar('TTFF');

    expect(resultado.atual).toBe(2);
    expect(resultado.marcas['2026-01-03']).toBe('descanso');
    expect(resultado.risco).toBe('quebra');
  });

  it('ontem treinou: hoje em branco vira folga, sem risco', () => {
    expect(rodar('TTF').risco).toBe('nenhum');
  });

  it('folga atrás de folga não vale (treino, folga, treino, folga, folga)', () => {
    expect(rodar('TFTFFT').atual).toBe(1);
  });
});

describe('percorrerDias: congelador', () => {
  it('ganha um a cada 7 dias de sequência', () => {
    expect(rodar('TTTTTT').congeladores).toBe(0);
    expect(rodar('TTTTTTT').congeladores).toBe(1);
    expect(rodar('T'.repeat(14)).congeladores).toBe(2);
  });

  it('guarda no máximo 2', () => {
    expect(rodar('T'.repeat(30)).congeladores).toBe(2);
  });

  it('descanso também ajuda a ganhar', () => {
    expect(rodar('TDTDTDT').congeladores).toBe(1);
  });

  it('falta que quebraria gasta um congelador: o dia fica congelado e não soma', () => {
    // 7 treinos (ganha 1), falta em dia marcado, treino
    const resultado = rodar('TTTTTTTXT');

    expect(resultado.atual).toBe(8);
    expect(resultado.congeladores).toBe(0);
    expect(resultado.marcas['2026-01-08']).toBe('congelado');
    expect(resultado.congeladosNovos).toEqual(['2026-01-08']);
  });

  it('no rodízio, a folga vem antes e o congelador cobre o segundo dia', () => {
    const resultado = rodar('TTTTTTTFFT');

    expect(resultado.marcas['2026-01-08']).toBe('descanso');
    expect(resultado.marcas['2026-01-09']).toBe('congelado');
    // A folga seguida de congelado não soma: 7 + treino
    expect(resultado.atual).toBe(8);
  });

  it('depois de um dia congelado, outra falta precisa de outro congelador', () => {
    const doisCongeladores = 'T'.repeat(14);

    expect(rodar(`${doisCongeladores}XXT`).atual).toBe(15);
    expect(rodar(`${doisCongeladores}XXXT`).atual).toBe(1);
  });

  it('sem sequência, falta não gasta congelador', () => {
    const resultado = rodar(`${'T'.repeat(7)}XXX${'X'.repeat(3)}T`);

    // 7 treinos (1 congelador), gasta no primeiro X, quebra no segundo, e nada mais é gasto
    expect(resultado.congeladores).toBe(0);
    expect(resultado.atual).toBe(1);
    expect(resultado.recorde).toBe(7);
  });

  it('só quebra sem congelador; depois de gastar, volta a ganhar', () => {
    expect(rodar(`${'T'.repeat(7)}X${'T'.repeat(7)}`).congeladores).toBe(1);
  });

  it('não ganha de novo no mesmo marco depois de um dia congelado', () => {
    // 14 treinos com 2 guardados, congela um, volta a treinar: o próximo é no 21
    const resultado = rodar(`${'T'.repeat(14)}X${'T'.repeat(6)}`);

    expect(resultado.atual).toBe(20);
    expect(resultado.congeladores).toBe(1);
    expect(rodar(`${'T'.repeat(14)}X${'T'.repeat(7)}`).congeladores).toBe(2);
  });

  it('dia já salvo na store continua congelado mesmo sem congelador sobrando', () => {
    const salvo = '2026-01-03';
    const resultado = rodar('TTXT', [salvo]);

    expect(resultado.atual).toBe(3);
    expect(resultado.marcas[salvo]).toBe('congelado');
    expect(resultado.congeladosNovos).toEqual([]);
  });
});

describe('percorrerDias: risco de hoje (última chance)', () => {
  it('sem sequência não há risco', () => {
    expect(rodar('X').risco).toBe('nenhum');
  });

  it('já treinou hoje: sem risco', () => {
    const resultado = rodar('TXTT');

    expect(resultado.risco).toBe('nenhum');
    expect(resultado.hojeContou).toBe(true);
  });

  it('dia marcado sem congelador: quebra', () => {
    expect(rodar('TTX').risco).toBe('quebra');
  });

  it('com 1 congelador: gastaria o último', () => {
    expect(rodar(`${'T'.repeat(7)}X`).risco).toBe('ultimo-congelador');
  });

  it('com 2 congeladores: gasta um, mas não é última chance', () => {
    const resultado = rodar(`${'T'.repeat(14)}X`);

    expect(resultado.risco).toBe('congela');
    expect(emUltimaChance(resultado)).toBe(false);
  });

  it('hoje em branco não muda o resultado: nada é gasto antes da hora', () => {
    const resultado = rodar(`${'T'.repeat(7)}X`);

    expect(resultado.atual).toBe(7);
    expect(resultado.congeladores).toBe(1);
    expect(resultado.marcas['2026-01-08']).toBeUndefined();
  });
});

describe('emUltimaChance e textos', () => {
  it('só com sequência em jogo e risco de quebrar ou de gastar o último', () => {
    expect(emUltimaChance({ atual: 5, risco: 'quebra' })).toBe(true);
    expect(emUltimaChance({ atual: 5, risco: 'ultimo-congelador' })).toBe(true);
    expect(emUltimaChance({ atual: 5, risco: 'congela' })).toBe(false);
    expect(emUltimaChance({ atual: 0, risco: 'quebra' })).toBe(false);
  });

  it('texto da última chance', () => {
    expect(textoUltimaChance(12, 'quebra')).toBe(
      'treine hoje para manter sua sequência de 12 dias',
    );
    expect(textoUltimaChance(1, 'quebra')).toBe('treine hoje para manter sua sequência de 1 dia');
    expect(textoUltimaChance(8, 'ultimo-congelador')).toBe(
      'treine hoje para manter sua sequência de 8 dias sem gastar seu último congelador',
    );
  });

  it('congeladores guardados e o próximo', () => {
    expect(textoCongeladores(0)).toBe('nenhum congelador guardado');
    expect(textoCongeladores(1)).toBe('1 congelador guardado');
    expect(textoCongeladores(2)).toBe('2 congeladores guardados');
    expect(faltamParaCongelador(0, 0)).toBe(7);
    expect(faltamParaCongelador(6, 0)).toBe(1);
    expect(faltamParaCongelador(7, 1)).toBe(7);
    expect(faltamParaCongelador(9, 2)).toBeNull();
    expect(textoProximoCongelador(6, 0)).toBe('falta 1 dia de sequência para ganhar outro');
    expect(textoProximoCongelador(3, 1)).toBe('faltam 4 dias de sequência para ganhar outro');
    expect(textoProximoCongelador(3, 2)).toBe('você já guarda o máximo de 2');
  });

  it('textos sem travessão e sem maiúscula no começo', () => {
    for (const texto of [textoUltimaChance(3, 'quebra'), textoProximoCongelador(1, 0)]) {
      expect(texto).not.toMatch(/[—–]/);
      expect(texto[0]).toBe(texto[0].toLowerCase());
    }
  });
});

describe('entradaDoDia', () => {
  it('treino com 50% ou mais', () => {
    expect(entradaDoDia([RODIZIO], [sessao(HOJE, 2)], HOJE).tipo).toBe('treino');
    expect(entradaDoDia([RODIZIO], [sessao(HOJE, 1)], HOJE).tipo).toBe('falta');
  });

  it('descanso do plano, falta em dia marcado e falta livre no rodízio', () => {
    expect(entradaDoDia([PLANO], [], '2026-10-06')).toMatchObject({ tipo: 'descanso' }); // terça
    expect(entradaDoDia([PLANO], [], HOJE)).toMatchObject({ tipo: 'falta', folgaPermitida: false });
    expect(entradaDoDia([RODIZIO], [], HOJE)).toMatchObject({
      tipo: 'falta',
      folgaPermitida: true,
    });
  });

  it('pouco treino num dia de descanso continua descanso', () => {
    expect(entradaDoDia([PLANO], [sessao('2026-10-06', 1)], '2026-10-06').tipo).toBe('descanso');
  });
});

describe('calcularSequencia (com o histórico de verdade)', () => {
  it('sem histórico é zero', () => {
    expect(sequenciaDeDias([RODIZIO], [], HOJE)).toBe(0);
  });

  it('plano semanal: os descansos entre os treinos contam', () => {
    // seg 5/10 e qua 7/10 (hoje), terça é descanso
    const sessoes = [sessao('2026-10-05'), sessao(HOJE)];

    expect(sequenciaDeDias([PLANO], sessoes, HOJE)).toBe(3);
  });

  it('rodízio dia sim, dia não por duas semanas', () => {
    const sessoes = Array.from({ length: 8 }, (_, n) => sessao(somarDias(HOJE, -2 * n)));
    const resultado = calcularSequencia([RODIZIO], sessoes, HOJE);

    expect(resultado.atual).toBe(15);
    expect(resultado.congeladores).toBe(2);
  });

  it('dias salvos na store seguram a sequência depois de mudar o plano', () => {
    // Treinou 7 dias seguidos até 29/9 no rodízio, faltou 30/9 e 1/10 e voltou
    const sessoes = [
      ...Array.from({ length: 7 }, (_, n) => sessao(somarDias('2026-09-29', -n))),
      ...['2026-10-02', '2026-10-03', '2026-10-04', '2026-10-05', '2026-10-06'].map((d) =>
        sessao(d),
      ),
    ];
    const antes = calcularSequencia([RODIZIO], sessoes, HOJE);

    expect(antes.marcas['2026-09-30']).toBe('descanso');
    expect(antes.marcas['2026-10-01']).toBe('congelado');
    expect(antes.congeladosNovos).toEqual(['2026-10-01']);
    expect(antes.atual).toBe(12);

    // Salvo o dia, ele continua congelado e não aparece de novo como novo
    const depois = calcularSequencia([RODIZIO], sessoes, HOJE, antes.congeladosNovos);

    expect(depois.marcas['2026-10-01']).toBe('congelado');
    expect(depois.congeladosNovos).toEqual([]);
    expect(depois.atual).toBe(12);
  });

  it('um ano inteiro de treinos', () => {
    const sessoes = Array.from({ length: 365 }, (_, n) => sessao(somarDias(HOJE, -n)));

    expect(calcularSequencia([RODIZIO], sessoes, HOJE)).toMatchObject({
      atual: 365,
      recorde: 365,
      congeladores: 2,
    });
  });
});

describe('plano montado hoje não cobra os dias de antes', () => {
  // Treinou domingo e segunda; terça não. Hoje (quarta) montou um plano com terça marcada
  const sessoes = [sessao('2026-10-04'), sessao('2026-10-05')];
  const comTerca = (planoDesde?: string): Treino => ({ ...RODIZIO, dias: [2, 3], planoDesde });

  it('com o plano de hoje, a terça vira folga e a sequência segue', () => {
    // Domingo e segunda contam; a folga de terça só soma quando o próximo dia for treinado
    expect(calcularSequencia([comTerca(HOJE)], sessoes, HOJE).atual).toBe(2);
  });

  it('com o plano já valendo, faltar na terça marcada quebra', () => {
    expect(calcularSequencia([comTerca('2026-09-01')], sessoes, HOJE).atual).toBe(0);
  });
});
