import { calcularSequencia } from '../regraSequencia';
import { diasDaFaixa, resumoDaSemana, resumoDoDia, rotuloDoDia, somarDias } from '../semana';
import {
  diasDoMes,
  mesesDoCalendario,
  rotuloDaBolinha,
  rotuloDoDiaDoCalendario,
  semanaDaSequencia,
} from '../sequencia';
import { juntarCongelados, migrarTreinos, useTreinosStore } from '../store';
import type { Sessao, Treino } from '../types';
import {
  HORA_AVISO_ULTIMA_CHANCE,
  ID_AVISO_ULTIMA_CHANCE,
  planejarAvisoUltimaChance,
} from '../ultimaChance';

// Quarta, 7 de outubro de 2026
const HOJE = '2026-10-07';
const IDS = ['e1', 'e2', 'e3', 'e4'];
const RODIZIO: Treino = {
  id: 't',
  nome: 'Treino A',
  exercicios: IDS.map((id) => ({ id, nome: id, series: 3, repeticoes: '10' })),
};

function sessao(data: string, feitos = 4): Sessao {
  return {
    id: `s-${data}`,
    treinoId: 't',
    data,
    concluidos: IDS.slice(0, feitos),
    finalizada: true,
  };
}

// 7 dias seguidos até sexta, 2/10 (ganha 1 congelador), sábado 3/10 folga,
// domingo 4/10 congelado, segunda 5/10 treino pela metade, terça 6/10 sem treino (folga)
const SESSOES = [
  ...Array.from({ length: 7 }, (_, n) => sessao(somarDias('2026-10-02', -n))),
  sessao('2026-10-05', 2),
];

describe('dias congelados no calendário', () => {
  const { marcas } = calcularSequencia([RODIZIO], SESSOES, HOJE);

  it('a faixa da semana mostra folga como descanso e o congelado', () => {
    const faixa = diasDaFaixa([RODIZIO], SESSOES, HOJE, 0, 0, marcas);

    expect(faixa.map((dia) => dia.estado)).toEqual([
      'congelado', // domingo 4
      'parcial', // segunda 5
      'descanso', // terça 6: folga, hoje decide
      'hoje',
      'futuro',
      'futuro',
      'futuro',
    ]);
    expect(rotuloDoDia(faixa[0])).toBe('domingo, 4, congelado, a sequência seguiu');
    expect(rotuloDoDia(faixa[1])).toBe('segunda, 5, 50% do treino feito');
    expect(resumoDoDia(faixa[0])).toBe('domingo: congelado, a sequência seguiu');
    expect(resumoDaSemana(faixa)).toContain('1 congelado');
  });

  it('sem as marcas, dia sem nada registrado no rodízio fica neutro', () => {
    expect(diasDaFaixa([RODIZIO], SESSOES, HOJE, 0, 0)[0].estado).toBe('descanso');
  });

  it('o mês do calendário pinta o congelado e guarda a fração para o anel', () => {
    const mes = diasDoMes(2026, 9, [RODIZIO], SESSOES, HOJE, marcas);

    expect(mes.dias[3]).toMatchObject({ estado: 'congelado', fracao: null });
    expect(mes.dias[4]).toMatchObject({ estado: 'parcial', fracao: 0.5 });
    expect(mes.dias[2]).toMatchObject({ estado: 'descanso' }); // sábado 3: folga
    expect(mes.dias[9]).toMatchObject({ estado: 'futuro', fracao: null });
    expect(rotuloDoDiaDoCalendario(mes.dias[3], 9)).toBe(
      '4 de outubro, congelado, a sequência seguiu',
    );
    expect(rotuloDoDiaDoCalendario(mes.dias[4], 9)).toBe(
      '5 de outubro, treino parcial, 50% do treino feito',
    );
  });

  it('as bolinhas da semana mostram o floco de neve', () => {
    const bolinhas = semanaDaSequencia([RODIZIO], SESSOES, HOJE, marcas);

    expect(bolinhas[0].estado).toBe('congelado');
    expect(rotuloDaBolinha(bolinhas[0])).toBe('domingo, congelado, a sequência seguiu');
    expect(bolinhas[2].estado).toBe('descanso');
    expect(bolinhas[3].estado).toBe('pendente');
  });
});

describe('mesesDoCalendario', () => {
  it('do mês do primeiro treino até o de hoje, virando o ano', () => {
    expect(mesesDoCalendario([sessao('2025-11-20')], '2026-02-03')).toEqual([
      { ano: 2025, mes: 10 },
      { ano: 2025, mes: 11 },
      { ano: 2026, mes: 0 },
      { ano: 2026, mes: 1 },
    ]);
  });

  it('sem histórico, só o mês de hoje', () => {
    expect(mesesDoCalendario([], HOJE)).toEqual([{ ano: 2026, mes: 9 }]);
  });
});

describe('planejarAvisoUltimaChance', () => {
  const manha = new Date(2026, 9, 7, 9, 30);

  it('em risco: agenda para as 20:00 de hoje', () => {
    const plano = planejarAvisoUltimaChance({
      emRisco: true,
      atual: 12,
      risco: 'quebra',
      agora: manha,
    });

    expect(plano).toEqual({
      acao: 'agendar',
      id: ID_AVISO_ULTIMA_CHANCE,
      titulo: 'Última chance de hoje',
      corpo: 'Treine hoje para manter sua sequência de 12 dias.',
      quando: new Date(2026, 9, 7, HORA_AVISO_ULTIMA_CHANCE, 0),
    });
  });

  it('sem risco (já treinou): cancela', () => {
    expect(
      planejarAvisoUltimaChance({ emRisco: false, atual: 12, risco: 'nenhum', agora: manha }),
    ).toEqual({ acao: 'cancelar', id: ID_AVISO_ULTIMA_CHANCE });
  });

  it('depois das 20:00 não agenda para o passado', () => {
    const noite = new Date(2026, 9, 7, 20, 0);

    expect(
      planejarAvisoUltimaChance({ emRisco: true, atual: 3, risco: 'quebra', agora: noite }).acao,
    ).toBe('cancelar');
  });

  it('o texto avisa quando é o último congelador', () => {
    const plano = planejarAvisoUltimaChance({
      emRisco: true,
      atual: 8,
      risco: 'ultimo-congelador',
      agora: manha,
    });

    expect(plano.acao === 'agendar' && plano.corpo).toBe(
      'Treine hoje para manter sua sequência de 8 dias sem gastar seu último congelador.',
    );
  });
});

describe('store: congelados salvos', () => {
  beforeEach(() => {
    useTreinosStore.setState({ treinos: [], sessoes: [], congelados: [] });
  });

  it('registra sem repetir e em ordem', () => {
    useTreinosStore.getState().registrarCongelados(['2026-10-04']);
    useTreinosStore.getState().registrarCongelados(['2026-10-01', '2026-10-04']);

    expect(useTreinosStore.getState().congelados).toEqual(['2026-10-01', '2026-10-04']);
  });

  it('não troca o estado à toa quando nada é novo', () => {
    useTreinosStore.getState().registrarCongelados(['2026-10-04']);
    const antes = useTreinosStore.getState().congelados;

    useTreinosStore.getState().registrarCongelados(['2026-10-04']);

    expect(useTreinosStore.getState().congelados).toBe(antes);
  });

  it('guarda no máximo 400 dias', () => {
    const muitos = Array.from({ length: 450 }, (_, n) => somarDias('2025-01-01', n));

    expect(juntarCongelados([], muitos)).toHaveLength(400);
    expect(juntarCongelados([], muitos)[0]).toBe(somarDias('2025-01-01', 50));
  });

  it('apagar tudo limpa os congelados', () => {
    useTreinosStore.getState().registrarCongelados(['2026-10-04']);
    useTreinosStore.getState().apagarTudo();

    expect(useTreinosStore.getState().congelados).toEqual([]);
  });

  it('migração da versão 1 começa sem congelados e mantém o resto', () => {
    const v1 = { treinos: [RODIZIO], sessoes: [sessao(HOJE)] };

    expect(migrarTreinos(v1, 1)).toEqual({ ...v1, congelados: [] });
    expect(migrarTreinos(undefined, 0)).toEqual({ congelados: [] });
  });
});
