import {
  ajustarPeso,
  arredondarKg,
  descreverGrafico,
  DIAS_DE_HISTORICO,
  limparHistoricoAntigo,
  mediaMovel,
  ordenar,
  pesoInicial,
  pesoValido,
  podeAjustarPeso,
  pontosGrafico,
  registrarPeso,
  registrosRecentes,
  removerRegistro,
  resumoPeso,
  rotuloData,
  rotuloDia,
  somarDias,
  textoVariacao,
  ultimoRegistro,
  variacao,
  variacaoPorExtenso,
  type RegistroPeso,
} from '../logica';

const HOJE = '2026-10-03';

describe('somarDias', () => {
  it('atravessa virada de mês e de ano', () => {
    expect(somarDias('2026-03-01', -1)).toBe('2026-02-28');
    expect(somarDias('2028-03-01', -1)).toBe('2028-02-29');
    expect(somarDias('2026-12-31', 1)).toBe('2027-01-01');
    expect(somarDias('2026-10-03', -29)).toBe('2026-09-04');
  });
});

describe('validação e arredondamento', () => {
  it('aceita só pesos dentro dos limites do perfil', () => {
    expect(pesoValido(70)).toBe(true);
    expect(pesoValido(30)).toBe(true);
    expect(pesoValido(300)).toBe(true);
    expect(pesoValido(29.9)).toBe(false);
    expect(pesoValido(300.1)).toBe(false);
    expect(pesoValido(Number.NaN)).toBe(false);
  });

  it('arredonda para 100 g', () => {
    expect(arredondarKg(74.30000000000001)).toBe(74.3);
    expect(arredondarKg(74.26)).toBe(74.3);
  });
});

describe('registrarPeso', () => {
  it('adiciona e mantém em ordem de data', () => {
    let registros = registrarPeso([], '2026-10-03', 75);
    registros = registrarPeso(registros, '2026-09-30', 76);

    expect(registros).toEqual([
      { data: '2026-09-30', kg: 76 },
      { data: '2026-10-03', kg: 75 },
    ]);
  });

  it('substitui o registro do mesmo dia (vale o último)', () => {
    let registros = registrarPeso([], HOJE, 75);
    registros = registrarPeso(registros, HOJE, 74.6);

    expect(registros).toEqual([{ data: HOJE, kg: 74.6 }]);
  });

  it('ignora peso inválido', () => {
    const registros = [{ data: HOJE, kg: 75 }];

    expect(registrarPeso(registros, HOJE, 10)).toEqual(registros);
  });

  it('remove pelo dia', () => {
    const registros = registrarPeso(registrarPeso([], '2026-10-01', 75), HOJE, 74);

    expect(removerRegistro(registros, '2026-10-01')).toEqual([{ data: HOJE, kg: 74 }]);
  });
});

describe('histórico', () => {
  it(`guarda só os últimos ${DIAS_DE_HISTORICO} dias`, () => {
    const registros = [
      { data: somarDias(HOJE, -DIAS_DE_HISTORICO), kg: 80 },
      { data: somarDias(HOJE, -(DIAS_DE_HISTORICO - 1)), kg: 79 },
      { data: HOJE, kg: 75 },
    ];

    expect(limparHistoricoAntigo(registros, HOJE).map((r) => r.kg)).toEqual([79, 75]);
  });

  it('ordena, acha o último e lista os recentes do mais novo para o mais antigo', () => {
    const registros = [
      { data: '2026-10-02', kg: 75 },
      { data: '2026-09-28', kg: 76 },
      { data: HOJE, kg: 74.8 },
    ];

    expect(ordenar(registros).map((r) => r.data)).toEqual(['2026-09-28', '2026-10-02', HOJE]);
    expect(ultimoRegistro(registros)).toEqual({ data: HOJE, kg: 74.8 });
    expect(ultimoRegistro([])).toBeNull();
    expect(registrosRecentes(registros, 2).map((r) => r.data)).toEqual([HOJE, '2026-10-02']);
  });
});

describe('contador', () => {
  it('começa do último peso ou do perfil', () => {
    expect(pesoInicial([], 72.34)).toBe(72.3);
    expect(pesoInicial([{ data: HOJE, kg: 74.5 }], 72)).toBe(74.5);
  });

  it('anda de 0,1 em 0,1 kg sem sair dos limites', () => {
    expect(ajustarPeso(74.5, 1)).toBe(74.6);
    expect(ajustarPeso(74.5, -1)).toBe(74.4);
    expect(ajustarPeso(30, -1)).toBe(30);
    expect(ajustarPeso(300, 1)).toBe(300);
    expect(podeAjustarPeso(30, -1)).toBe(false);
    expect(podeAjustarPeso(30, 1)).toBe(true);
    expect(podeAjustarPeso(300, 1)).toBe(false);
  });
});

describe('variacao', () => {
  const registros: RegistroPeso[] = [
    { data: '2026-08-20', kg: 80 },
    { data: '2026-09-01', kg: 78 },
    { data: '2026-09-10', kg: 77 },
    { data: '2026-10-03', kg: 76.5 },
  ];

  it('compara o mais recente com o último peso de antes do período', () => {
    // 30 dias antes de 03/10 é 03/09: a base é o registro de 01/09
    expect(variacao(registros, HOJE, 30)).toBe(-1.5);
    expect(variacao(registros, HOJE, 90)).toBe(-3.5);
  });

  it('usa o primeiro registro do período quando não há nada antes', () => {
    const recentes = [
      { data: '2026-09-25', kg: 70 },
      { data: '2026-10-02', kg: 70.4 },
    ];

    expect(variacao(recentes, HOJE, 30)).toBe(0.4);
  });

  it('é null com um registro só ou sem registros', () => {
    expect(variacao([], HOJE, 30)).toBeNull();
    expect(variacao([{ data: HOJE, kg: 70 }], HOJE, 30)).toBeNull();
  });

  it('ignora registros depois de hoje', () => {
    const comFuturo = [...registros, { data: '2026-10-10', kg: 60 }];

    expect(variacao(comFuturo, HOJE, 30)).toBe(-1.5);
  });
});

describe('mediaMovel', () => {
  it('faz a média dos registros dos últimos 7 dias de cada ponto', () => {
    const registros = [
      { data: '2026-09-25', kg: 80 },
      { data: '2026-09-28', kg: 79 },
      { data: '2026-10-01', kg: 78 },
      { data: '2026-10-03', kg: 77 },
    ];

    expect(mediaMovel(registros)).toEqual([
      { data: '2026-09-25', kg: 80 },
      { data: '2026-09-28', kg: 79.5 },
      { data: '2026-10-01', kg: 79 },
      // 27/09 a 03/10: 79, 78, 77
      { data: '2026-10-03', kg: 78 },
    ]);
  });

  it('atravessa a virada de mês', () => {
    const registros = [
      { data: '2026-02-26', kg: 70 },
      { data: '2026-03-02', kg: 72 },
    ];

    expect(mediaMovel(registros)[1]).toEqual({ data: '2026-03-02', kg: 71 });
  });
});

describe('pontosGrafico', () => {
  it('normaliza x pelo período e y pela escala com folga', () => {
    const registros = [
      { data: '2026-09-04', kg: 76 },
      { data: '2026-10-03', kg: 74 },
    ];
    const dados = pontosGrafico(registros, HOJE, 30);

    expect(dados.inicio).toBe('2026-09-04');
    expect(dados.fim).toBe(HOJE);
    expect(dados.minKg).toBeLessThan(74);
    expect(dados.maxKg).toBeGreaterThan(76);
    expect(dados.pontos.map((p) => p.x)).toEqual([0, 1]);

    for (const ponto of [...dados.pontos, ...dados.tendencia]) {
      expect(ponto.y).toBeGreaterThan(0);
      expect(ponto.y).toBeLessThan(1);
    }

    expect(dados.pontos[0].y).toBeGreaterThan(dados.pontos[1].y);
  });

  it('deixa de fora o que é antigo, mas usa para começar a tendência', () => {
    const registros = [
      { data: '2026-09-02', kg: 80 },
      { data: '2026-09-05', kg: 76 },
    ];
    const dados = pontosGrafico(registros, HOJE, 30);

    expect(dados.pontos).toHaveLength(1);
    expect(dados.tendencia).toEqual([expect.objectContaining({ data: '2026-09-05', kg: 78 })]);
  });

  it('com um registro só fica no meio da escala', () => {
    const dados = pontosGrafico([{ data: HOJE, kg: 70 }], HOJE, 30);

    expect(dados.minKg).toBeLessThan(70);
    expect(dados.maxKg).toBeGreaterThan(70);
    expect(dados.pontos[0]).toMatchObject({ x: 1, y: 0.5 });
  });

  it('sem registros devolve listas vazias', () => {
    const dados = pontosGrafico([], HOJE, 90);

    expect(dados.pontos).toEqual([]);
    expect(dados.tendencia).toEqual([]);
    expect(dados.inicio).toBe('2026-07-06');
  });
});

describe('textos', () => {
  it('formata datas curtas e relativas', () => {
    expect(rotuloData('2026-10-03')).toBe('3 out');
    expect(rotuloData('2026-01-15')).toBe('15 jan');
    expect(rotuloDia(HOJE, HOJE)).toBe('hoje');
    expect(rotuloDia('2026-10-02', HOJE)).toBe('ontem');
    expect(rotuloDia('2026-09-30', '2026-10-01')).toBe('ontem');
    expect(rotuloDia('2026-09-28', HOJE)).toBe('28 set');
  });

  it('escreve a variação com sinal e por extenso', () => {
    expect(textoVariacao(-0.8)).toBe('-0,8 kg');
    expect(textoVariacao(1.5)).toBe('+1,5 kg');
    expect(textoVariacao(0)).toBe('0,0 kg');
    expect(variacaoPorExtenso(-0.8, 30)).toBe('queda de 0,8 kg nos últimos 30 dias.');
    expect(variacaoPorExtenso(0, 30)).toBe('peso estável nos últimos 30 dias.');
    expect(variacaoPorExtenso(null, 30)).toContain('sem registros suficientes');
  });

  it('descreve o gráfico para o leitor de tela', () => {
    expect(descreverGrafico([], HOJE, 30)).toBe(
      'Gráfico de peso: nenhum registro nos últimos 30 dias.',
    );

    const texto = descreverGrafico(
      [
        { data: '2026-09-10', kg: 76 },
        { data: HOJE, kg: 75.2 },
      ],
      HOJE,
      30,
    );

    expect(texto).toContain('2 registros');
    expect(texto).toContain('de 76,0 kg em 10 set para 75,2 kg em 3 out');
    expect(texto).toContain('queda de 0,8 kg');
    expect(texto).not.toMatch(new RegExp('[\\u2013\\u2014]'));
  });
});

describe('resumoPeso', () => {
  it('usa o peso do perfil enquanto não há registro', () => {
    expect(resumoPeso([], HOJE, 72)).toEqual({
      atualKg: 72,
      temRegistros: false,
      variacao30: null,
      registrouHoje: false,
    });
  });

  it('mostra o último peso e se já registrou hoje', () => {
    const resumo = resumoPeso(
      [
        { data: '2026-09-20', kg: 75 },
        { data: HOJE, kg: 74.5 },
      ],
      HOJE,
      80,
    );

    expect(resumo).toEqual({
      atualKg: 74.5,
      temRegistros: true,
      variacao30: -0.5,
      registrouHoje: true,
    });
  });
});
