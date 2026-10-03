import { historicoDeDias, sequenciaAtual } from '../historico';

// Sábado, 3 de outubro de 2026, às 9h (horário local)
const HOJE = new Date(2026, 9, 3, 9, 0);
const META = 2000;

describe('historicoDeDias', () => {
  it('devolve 7 dias, do mais antigo até hoje', () => {
    const dias = historicoDeDias({}, HOJE, META);

    expect(dias).toHaveLength(7);
    expect(dias[0].chave).toBe('2026-09-27');
    expect(dias[6].chave).toBe('2026-10-03');
    expect(dias[6].hoje).toBe(true);
    expect(dias.filter((dia) => dia.hoje)).toHaveLength(1);
  });

  it('marca o dia da semana certo', () => {
    const dias = historicoDeDias({}, HOJE, META);

    expect(dias[6]).toMatchObject({ inicial: 'S', nome: 'sábado' });
    expect(dias[0]).toMatchObject({ inicial: 'D', nome: 'domingo' });
  });

  it('calcula total, fração e se bateu a meta', () => {
    const dias = historicoDeDias(
      { '2026-10-02': [1000, 1000, 500], '2026-10-01': [500, 500] },
      HOJE,
      META,
    );

    expect(dias[5]).toMatchObject({ totalMl: 2500, fracao: 1, bateu: true });
    expect(dias[4]).toMatchObject({ totalMl: 1000, fracao: 0.5, bateu: false });
    expect(dias[6]).toMatchObject({ totalMl: 0, fracao: 0, bateu: false });
  });

  it('atravessa a virada de mês sem pular dia', () => {
    const chaves = historicoDeDias({}, new Date(2026, 2, 2), META).map((dia) => dia.chave);

    expect(chaves).toEqual([
      '2026-02-24',
      '2026-02-25',
      '2026-02-26',
      '2026-02-27',
      '2026-02-28',
      '2026-03-01',
      '2026-03-02',
    ]);
  });
});

describe('sequenciaAtual', () => {
  it('conta dias seguidos batendo a meta até ontem quando hoje ainda não bateu', () => {
    const registros = {
      '2026-10-02': [2000],
      '2026-10-01': [2500],
      '2026-09-30': [500], // quebrou aqui
      '2026-09-29': [2000],
    };

    expect(sequenciaAtual(registros, HOJE, META)).toBe(2);
  });

  it('inclui hoje quando já bateu', () => {
    expect(sequenciaAtual({ '2026-10-03': [2000], '2026-10-02': [2000] }, HOJE, META)).toBe(2);
  });

  it('é zero sem histórico ou com meta zero', () => {
    expect(sequenciaAtual({}, HOJE, META)).toBe(0);
    expect(sequenciaAtual({ '2026-10-03': [2000] }, HOJE, 0)).toBe(0);
  });
});
