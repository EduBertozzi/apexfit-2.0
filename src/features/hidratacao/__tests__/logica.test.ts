import {
  adicionarPorcao,
  bateuMetaAgora,
  desfazerUltimaPorcao,
  limparHistoricoAntigo,
  progresso,
  totalDoDia,
} from '../logica';

describe('totalDoDia', () => {
  it('soma as porções', () => {
    expect(totalDoDia([250, 250, 500])).toBe(1000);
  });

  it('dia sem registro é zero', () => {
    expect(totalDoDia(undefined)).toBe(0);
  });
});

describe('progresso', () => {
  it('é a fração da meta', () => {
    expect(progresso(1225, 2450)).toBe(0.5);
  });

  it('não passa de 100%', () => {
    expect(progresso(3000, 2450)).toBe(1);
  });

  it('meta zero não divide por zero', () => {
    expect(progresso(500, 0)).toBe(0);
  });
});

describe('bateuMetaAgora', () => {
  it('detecta quando passa da meta sem cair exatamente nela (bug da v1)', () => {
    expect(bateuMetaAgora(2250, 2500, 2450)).toBe(true);
  });

  it('detecta quando cai exatamente na meta', () => {
    expect(bateuMetaAgora(2200, 2450, 2450)).toBe(true);
  });

  it('não repete o parabéns depois que já bateu', () => {
    expect(bateuMetaAgora(2500, 2750, 2450)).toBe(false);
  });

  it('não dispara antes da meta', () => {
    expect(bateuMetaAgora(1000, 1250, 2450)).toBe(false);
  });
});

describe('adicionarPorcao', () => {
  it('adiciona no dia certo sem mexer nos outros', () => {
    const antes = { '2026-10-01': [500] };

    const depois = adicionarPorcao(antes, '2026-10-02', 250);

    expect(depois).toEqual({ '2026-10-01': [500], '2026-10-02': [250] });
  });

  it('não altera o objeto original (imutável)', () => {
    const antes = { '2026-10-02': [250] };

    adicionarPorcao(antes, '2026-10-02', 250);

    expect(antes).toEqual({ '2026-10-02': [250] });
  });

  it.each([0, -250, Number.NaN])('ignora porção inválida (%s)', (ml) => {
    const antes = { '2026-10-02': [250] };

    expect(adicionarPorcao(antes, '2026-10-02', ml)).toBe(antes);
  });
});

describe('desfazerUltimaPorcao', () => {
  it('remove só a última', () => {
    const depois = desfazerUltimaPorcao({ '2026-10-02': [250, 500] }, '2026-10-02');

    expect(depois['2026-10-02']).toEqual([250]);
  });

  it('não faz nada em dia vazio', () => {
    const antes = {};

    expect(desfazerUltimaPorcao(antes, '2026-10-02')).toBe(antes);
  });
});

describe('limparHistoricoAntigo', () => {
  it('mantém os últimos 90 dias e remove o resto', () => {
    const registros = {
      '2026-10-02': [250],
      '2026-07-05': [250], // 89 dias antes
      '2026-07-04': [250], // 90 dias antes
    };

    expect(Object.keys(limparHistoricoAntigo(registros, '2026-10-02'))).toEqual([
      '2026-10-02',
      '2026-07-05',
    ]);
  });
});
