import {
  escolhasSemanaSchema,
  pedidoSemanaIaSchema,
  primeiroErroEscolhas,
  type EscolhasSemana,
} from '../contratoIa';
import {
  alternarArea,
  alternarDiaTreino,
  alternarRegiao,
  copiarDia,
  diasParaCopiar,
  ESCOLHAS_PADRAO,
  escolhasValidas,
  focoDoDia,
  nomeTreinoDoDia,
  prepararSemana,
  resumoDoDia,
  rotuloDoDia,
  textoBotaoGerar,
} from '../montadorIa';
import type { DadosTreino } from '../types';

const SEM_EMOJI_NEM_TRAVESSAO = /[–—]|\p{Extended_Pictographic}/u;

const BASE: EscolhasSemana = {
  ...ESCOLHAS_PADRAO,
  dias: [],
};

describe('escolhas do montador', () => {
  it('o padrão é válido e já vem com aquecimento ligado', () => {
    expect(escolhasSemanaSchema.safeParse(ESCOLHAS_PADRAO).success).toBe(true);
    expect(ESCOLHAS_PADRAO.aquecimento.ativo).toBe(true);
    expect(ESCOLHAS_PADRAO.aquecimento.itens.length).toBeGreaterThan(1);
  });

  it('marca dias na ordem da semana (segunda primeiro) e desmarca', () => {
    let escolhas = alternarDiaTreino(BASE, 0);
    escolhas = alternarDiaTreino(escolhas, 3);
    escolhas = alternarDiaTreino(escolhas, 1);

    expect(escolhas.dias.map((dia) => dia.dia)).toEqual([1, 3, 0]);
    expect(escolhas.dias.every((dia) => dia.areas.length === 0)).toBe(true);
    expect(alternarDiaTreino(escolhas, 3).dias.map((dia) => dia.dia)).toEqual([1, 0]);
  });

  it('áreas ficam na ordem fixa; desmarcar leva as regiões junto', () => {
    let escolhas = alternarDiaTreino(BASE, 1);
    escolhas = alternarArea(escolhas, 1, 'perna');
    escolhas = alternarArea(escolhas, 1, 'peito');
    escolhas = alternarRegiao(escolhas, 1, 'perna', 'gluteo');

    expect(escolhas.dias[0].areas).toEqual([
      { area: 'peito', regioes: [] },
      { area: 'perna', regioes: ['gluteo'] },
    ]);

    escolhas = alternarArea(escolhas, 1, 'perna');
    escolhas = alternarArea(escolhas, 1, 'perna');
    expect(escolhas.dias[0].areas[1]).toEqual({ area: 'perna', regioes: [] });
  });

  it('regiões: ordem do catálogo, inválida é ignorada, todas marcadas viram "a área toda"', () => {
    let escolhas = alternarArea(alternarDiaTreino(BASE, 1), 1, 'braco');
    escolhas = alternarRegiao(escolhas, 1, 'braco', 'triceps');
    escolhas = alternarRegiao(escolhas, 1, 'braco', 'biceps');
    expect(escolhas.dias[0].areas[0].regioes).toEqual(['biceps', 'triceps']);

    expect(alternarRegiao(escolhas, 1, 'braco', 'gluteo')).toBe(escolhas);

    escolhas = alternarRegiao(escolhas, 1, 'braco', 'antebraco');
    expect(escolhas.dias[0].areas[0].regioes).toEqual([]);

    escolhas = alternarRegiao(escolhas, 1, 'braco', 'biceps');
    escolhas = alternarRegiao(escolhas, 1, 'braco', 'biceps');
    expect(escolhas.dias[0].areas[0].regioes).toEqual([]);
  });

  it('copia as áreas de outro dia (cópia de verdade, não o mesmo objeto)', () => {
    const escolhas = copiarDia(alternarDiaTreino(ESCOLHAS_PADRAO, 6), 1, 6);
    const sabado = escolhas.dias.find((dia) => dia.dia === 6)!;
    const segunda = escolhas.dias.find((dia) => dia.dia === 1)!;

    expect(sabado.areas).toEqual(segunda.areas);
    expect(sabado.areas[1].regioes).not.toBe(segunda.areas[1].regioes);
    expect(copiarDia(escolhas, 2, 6)).toBe(escolhas);
    expect(diasParaCopiar(alternarDiaTreino(ESCOLHAS_PADRAO, 6), 6)).toEqual([1, 3, 5]);
  });

  it('dados salvos estragados voltam para o padrão', () => {
    expect(escolhasValidas(undefined)).toEqual(ESCOLHAS_PADRAO);
    expect(escolhasValidas({ nivel: 'avancado', dias: 'x' })).toMatchObject({
      nivel: 'avancado',
      dias: ESCOLHAS_PADRAO.dias,
    });
  });
});

describe('validação das escolhas', () => {
  it.each([
    [{ dias: [] }, 'escolha pelo menos um dia de treino.'],
    [{ dias: [{ dia: 1, areas: [] }] }, 'escolha o que treinar em cada dia marcado.'],
    [
      {
        dias: [
          { dia: 1, areas: [{ area: 'perna', regioes: [] }] },
          { dia: 1, areas: [{ area: 'peito', regioes: [] }] },
        ],
      },
      'cada dia da semana só pode aparecer uma vez.',
    ],
    [
      { aquecimento: { ativo: true, itens: [] } },
      'escolha pelo menos um exercício de aquecimento ou desligue o aquecimento.',
    ],
    [
      { aquecimento: { ativo: true, itens: [{ nome: 'bike leve', medida: 'tempo', valor: 90 }] } },
      'aquecimento por tempo: de 1 a 30 minutos.',
    ],
  ] as [Partial<EscolhasSemana>, string][])('%j: %s', (mudanca, erro) => {
    const escolhas = { ...ESCOLHAS_PADRAO, ...mudanca };

    expect(primeiroErroEscolhas(escolhas)).toBe(erro);
    expect(escolhasSemanaSchema.safeParse(escolhas).success).toBe(false);
  });

  it('aquecimento desligado e sem itens é válido', () => {
    expect(
      primeiroErroEscolhas({ ...ESCOLHAS_PADRAO, aquecimento: { ativo: false, itens: [] } }),
    ).toBeNull();
  });

  it('o pedido para a rota exige perfil completo e escolhas no formato', () => {
    const perfil = {
      nome: 'Ana',
      idade: 30,
      alturaCm: 165,
      pesoKg: 60,
      sexo: 'feminino',
      nivelAtividade: 'leve',
      objetivo: 'perder',
    };

    expect(pedidoSemanaIaSchema.safeParse({ perfil, escolhas: ESCOLHAS_PADRAO }).success).toBe(
      true,
    );
    expect(
      pedidoSemanaIaSchema.safeParse({
        perfil,
        escolhas: { ...ESCOLHAS_PADRAO, nivel: 'profissional' },
      }).success,
    ).toBe(false);
    expect(
      pedidoSemanaIaSchema.safeParse({
        perfil,
        escolhas: { ...ESCOLHAS_PADRAO, evitar: 'x'.repeat(201) },
      }).success,
    ).toBe(false);
  });
});

describe('textos do montador', () => {
  it('nomes, focos e rótulos em minúsculas, sem emoji nem travessão', () => {
    const [segunda] = ESCOLHAS_PADRAO.dias;

    expect(nomeTreinoDoDia(1)).toBe('treino de segunda');
    expect(nomeTreinoDoDia(6)).toBe('treino de sábado');
    expect(focoDoDia(segunda)).toBe('peito e braço (tríceps)');
    expect(resumoDoDia({ dia: 2, areas: [] })).toBe('toque para escolher o que treinar');
    expect(rotuloDoDia(segunda)).toBe('segunda, peito e braço (tríceps)');
    expect(textoBotaoGerar(ESCOLHAS_PADRAO)).toBe('gerar 3 treinos');
    expect(textoBotaoGerar({ ...ESCOLHAS_PADRAO, dias: [segunda] })).toBe('gerar 1 treino');

    for (const texto of [focoDoDia(segunda), rotuloDoDia(segunda), resumoDoDia(segunda)]) {
      expect(texto).not.toMatch(SEM_EMOJI_NEM_TRAVESSAO);
      expect(texto).toBe(texto.toLocaleLowerCase('pt-BR'));
    }
  });
});

describe('prepararSemana', () => {
  const ESCOLHAS: EscolhasSemana = {
    ...ESCOLHAS_PADRAO,
    dias: [
      { dia: 1, areas: [{ area: 'peito', regioes: [] }] },
      { dia: 3, areas: [{ area: 'perna', regioes: [] }] },
    ],
  };

  const supino = { nome: 'Supino reto', grupo: 'peito' as const, series: 3, repeticoes: '10' };
  const legPress = { nome: 'Leg press', grupo: 'perna' as const, series: 3, repeticoes: '12' };
  const rosca = { nome: 'Rosca direta', grupo: 'braco' as const, series: 3, repeticoes: '12' };
  const bikeIa = {
    nome: 'Bike',
    grupo: 'aquecimento' as const,
    series: 1,
    repeticoes: '8 min',
  };

  it('um treino por dia, com dia, nome e foco; só as áreas pedidas; aquecimento escolhido na frente', () => {
    const gerados: DadosTreino[] = [
      { nome: 'Treino A', exercicios: [bikeIa, supino, rosca] },
      { nome: 'Treino B', exercicios: [legPress] },
      { nome: 'Treino C', exercicios: [supino] },
    ];

    const semana = prepararSemana(gerados, ESCOLHAS);

    expect(semana.map((treino) => [treino.nome, treino.dias, treino.foco])).toEqual([
      ['treino de segunda', [1], 'peito'],
      ['treino de quarta', [3], 'perna'],
    ]);
    expect(semana[0].exercicios?.map((exercicio) => exercicio.nome)).toEqual([
      'polichinelo',
      'mobilidade de quadril',
      'Supino reto',
    ]);
  });

  it('casa pelo nome do dia quando a IA manda fora de ordem', () => {
    const semana = prepararSemana(
      [
        { nome: 'treino de quarta', exercicios: [legPress] },
        { nome: 'treino de segunda', exercicios: [supino] },
      ],
      ESCOLHAS,
    );

    expect(semana[0].exercicios?.at(-1)?.nome).toBe('Supino reto');
    expect(semana[1].exercicios?.at(-1)?.nome).toBe('Leg press');
  });

  it('aquecimento desligado: tira até o da IA', () => {
    const semana = prepararSemana(
      [
        { nome: 'a', exercicios: [bikeIa, supino] },
        { nome: 'b', exercicios: [legPress] },
      ],
      { ...ESCOLHAS, aquecimento: { ativo: false, itens: [] } },
    );

    expect(semana[0].exercicios?.map((exercicio) => exercicio.nome)).toEqual(['Supino reto']);
  });

  it('dia vazio ou só com áreas erradas usa a reserva offline', () => {
    const semana = prepararSemana([{ nome: 'treino de segunda', exercicios: [rosca] }], ESCOLHAS, [
      { nome: 'treino de segunda', exercicios: [supino] },
      { nome: 'treino de quarta', exercicios: [legPress] },
    ]);

    expect(semana).toHaveLength(2);
    expect(semana[0].exercicios?.at(-1)?.nome).toBe('Supino reto');
    expect(semana[1].exercicios?.at(-1)?.nome).toBe('Leg press');
  });
});
