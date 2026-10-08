import type { PlanoDieta } from '@/features/dieta/contrato';
import type { RespostaTreinosIa } from '@/features/treinos/contratoIa';
import { respostaSse } from '@/shared/servidor/sseSimulado';

import type { EventoCoach, PedidoCoach } from '../contrato';
import { conversarOpenAI, FERRAMENTAS_OPENAI } from '../servidor/conversarOpenAI';

/** Servidor do coach (OpenAI): pedido pequeno muda só o que foi pedido. A rede é simulada. */

const AMBIENTE = { ...process.env };

const ATUAIS: NonNullable<PedidoCoach['treinosAtuais']> = [
  {
    id: 't1',
    nome: 'Treino A',
    foco: 'Perna',
    exercicios: [
      { id: 'e1', nome: 'Agachamento livre', grupo: 'perna', series: 3, repeticoes: '10' },
      { id: 'e2', nome: 'Leg press 45', grupo: 'perna', series: 3, repeticoes: '12' },
    ],
  },
  {
    id: 't2',
    nome: 'Treino B',
    foco: 'Peito',
    exercicios: [
      { id: 'e3', nome: 'Supino reto com barra', grupo: 'peito', series: 3, repeticoes: '10' },
    ],
  },
];

const EDITADO: RespostaTreinosIa = {
  resumo: 'Troquei o leg press.',
  treinos: [
    {
      nome: 'Treino A',
      foco: 'Perna',
      exercicios: [
        { nome: 'Agachamento livre', grupo: 'perna', series: 3, repeticoes: '10' },
        { nome: 'Afundo', grupo: 'perna', series: 3, repeticoes: '12' },
      ],
    },
    {
      nome: 'Treino B',
      foco: 'Peito',
      exercicios: [{ nome: 'Supino reto com barra', grupo: 'peito', series: 3, repeticoes: '10' }],
    },
  ],
};

const PLANO_ATUAL: PlanoDieta = {
  resumo: 'Plano.',
  caloriasDia: 1000,
  macros: { proteinaG: 80, carboidratoG: 120, gorduraG: 30 },
  refeicoes: [
    {
      nome: 'Café da manhã',
      horario: '07:00',
      calorias: 400,
      itens: [{ alimento: 'Pão com ovo', quantidade: '2 fatias' }],
      substituicoes: [],
    },
    {
      nome: 'Almoço',
      horario: '12:00',
      calorias: 600,
      itens: [{ alimento: 'Arroz e feijão', quantidade: '200 g' }],
      substituicoes: [],
    },
  ],
  dicas: [],
  aviso: 'Consulte um nutricionista.',
};

function pedido(texto: string, extra: Partial<PedidoCoach> = {}): PedidoCoach {
  return { mensagens: [{ papel: 'usuario', texto }], contexto: 'Nome: Eduardo', ...extra };
}

async function coletar(gerador: AsyncGenerator<EventoCoach>): Promise<EventoCoach[]> {
  const eventos: EventoCoach[] = [];

  for await (const evento of gerador) {
    eventos.push(evento);
  }

  return eventos;
}

function textoDos(eventos: EventoCoach[]): string {
  return eventos.map((evento) => (evento.tipo === 'texto' ? evento.texto : '')).join('');
}

function corpoDaChamada(indice: number) {
  return JSON.parse(jest.mocked(global.fetch).mock.calls[indice][1]!.body as string);
}

function iaResponde(conteudo: unknown) {
  global.fetch = jest.fn().mockResolvedValue(respostaSse([{ texto: JSON.stringify(conteudo) }]));
}

beforeEach(() => {
  process.env = { ...AMBIENTE, OPENAI_API_KEY: 'sk-teste' };
});

afterAll(() => {
  process.env = AMBIENTE;
});

describe('ajuste de treino', () => {
  it('troca de exercício manda os treinos atuais e pede para mudar só aquilo', async () => {
    iaResponde(EDITADO);

    const eventos = await coletar(
      conversarOpenAI(pedido('troca o leg press por afundo', { treinosAtuais: ATUAIS })),
    );

    const chamada = corpoDaChamada(0);
    expect(chamada.messages[0].content).toContain('AJUSTAR treinos');
    expect(chamada.messages[1].content).toContain('"Leg press 45"');
    // Os ids ficam no app: a IA só vê nomes
    expect(chamada.messages[1].content).not.toContain('"e1"');

    expect(eventos.find((evento) => evento.tipo === 'treinos')).toEqual({
      tipo: 'treinos',
      resultado: EDITADO,
      modo: 'ajuste',
    });
    expect(textoDos(eventos)).toContain('treino A: leg press 45 trocado por afundo');
    expect(textoDos(eventos)).not.toContain('treino B');
    expect(textoDos(eventos)).not.toMatch(/[–—]/);
  });

  it('ajuste que não muda nada não manda proposta', async () => {
    iaResponde({
      resumo: 'Nada.',
      treinos: ATUAIS.map((treino) => ({
        nome: treino.nome,
        foco: treino.foco ?? '',
        exercicios: treino.exercicios.map(({ nome, grupo, series, repeticoes }) => ({
          nome,
          grupo: grupo ?? 'outro',
          series,
          repeticoes,
        })),
      })),
    });

    const eventos = await coletar(
      conversarOpenAI(pedido('troca o leg press por afundo', { treinosAtuais: ATUAIS })),
    );

    expect(eventos.some((evento) => evento.tipo === 'treinos')).toBe(false);
    expect(textoDos(eventos)).toContain('Não achei o que mudar');
  });

  it('"monta um treino novo" refaz tudo e manda os dias pedidos', async () => {
    iaResponde(EDITADO);

    const eventos = await coletar(
      conversarOpenAI(
        pedido('Monta um treino novo pra segunda e quinta', { treinosAtuais: ATUAIS }),
      ),
    );

    expect(corpoDaChamada(0).messages[0].content).not.toContain('AJUSTAR treinos');
    expect(corpoDaChamada(0).messages[1].content).toContain('Dias pedidos: segunda e quinta');
    expect(eventos.find((evento) => evento.tipo === 'treinos')).toMatchObject({
      modo: 'novo',
      diasPedidos: [1, 4],
    });
    expect(textoDos(eventos)).toContain('treino A: perna (2 exercícios), segunda');
  });

  it('sem treinos salvos, o ajuste vira montagem do zero', async () => {
    iaResponde(EDITADO);

    const eventos = await coletar(conversarOpenAI(pedido('troca o leg press por afundo')));

    expect(eventos.find((evento) => evento.tipo === 'treinos')).toMatchObject({ modo: 'novo' });
  });

  it('a ferramenta ajustar_treino existe e explica que o resto fica igual', () => {
    const ajustar = FERRAMENTAS_OPENAI.find((f) => f.function.name === 'ajustar_treino');

    expect(ajustar?.function.strict).toBe(true);
    expect(ajustar?.function.description).toContain('O resto fica igual');
  });
});

describe('ajuste de dieta', () => {
  it('"troca o café da manhã" manda o plano atual e mantém as outras refeições iguais', async () => {
    // A IA mexeu no almoço também: o servidor desfaz isso
    iaResponde({
      ...PLANO_ATUAL,
      refeicoes: [
        {
          ...PLANO_ATUAL.refeicoes[0],
          calorias: 380,
          itens: [{ alimento: 'Tapioca', quantidade: '1' }],
        },
        { ...PLANO_ATUAL.refeicoes[1], itens: [{ alimento: 'Macarrão', quantidade: '200 g' }] },
      ],
    });

    const eventos = await coletar(
      conversarOpenAI(pedido('Troca o café da manhã', { planoAtual: PLANO_ATUAL })),
    );

    expect(corpoDaChamada(0).messages[1].content).toContain(
      'Mude SOMENTE estas refeições: café da manhã',
    );

    const dieta = eventos.find((evento) => evento.tipo === 'dieta');
    expect(dieta).toMatchObject({ modo: 'ajuste', refeicoes: ['cafe'] });

    const plano = (dieta as { plano: PlanoDieta }).plano;
    expect(plano.refeicoes[1]).toEqual(PLANO_ATUAL.refeicoes[1]);
    expect(plano.refeicoes[0].itens[0].alimento).toBe('Tapioca');
    expect(plano.caloriasDia).toBe(980);
    expect(textoDos(eventos)).toContain('café da manhã trocado');
  });

  it('"monta uma dieta nova" com plano salvo refaz o plano inteiro', async () => {
    iaResponde(PLANO_ATUAL);

    const eventos = await coletar(
      conversarOpenAI(pedido('Monta uma dieta nova', { planoAtual: PLANO_ATUAL })),
    );

    expect(corpoDaChamada(0).messages[1].content).not.toContain('Dieta atual (JSON)');
    expect(eventos.find((evento) => evento.tipo === 'dieta')).toMatchObject({ modo: 'novo' });
  });
});

describe('pedido com dia da semana', () => {
  const SEMANA: NonNullable<PedidoCoach['treinosAtuais']> = [
    { ...ATUAIS[0], dias: [1, 3] },
    { ...ATUAIS[1], dias: [5] },
  ];

  it('"troque o supino da sexta" muda só o treino de sexta', async () => {
    // A IA trocou o supino e, sem pedir, mexeu no leg press do treino A
    iaResponde({
      resumo: 'Troquei.',
      treinos: [
        EDITADO.treinos[0],
        {
          nome: 'Treino B',
          foco: 'Peito',
          exercicios: [{ nome: 'Supino inclinado', grupo: 'peito', series: 3, repeticoes: '10' }],
        },
      ],
    });

    const eventos = await coletar(
      conversarOpenAI(
        pedido('troque o supino da sexta por supino inclinado', { treinosAtuais: SEMANA }),
      ),
    );

    const instrucoes = corpoDaChamada(0).messages[1].content as string;
    expect(instrucoes).toContain('Mude SOMENTE o Treino B (o treino de sexta)');
    expect(instrucoes).toContain('"dias":"sexta"');
    expect(eventos.find((evento) => evento.tipo === 'treinos')).toMatchObject({
      modo: 'ajuste',
      diasAlvo: [5],
    });
    expect(textoDos(eventos)).toContain(
      'sexta: supino reto com barra trocado por supino inclinado',
    );
    expect(textoDos(eventos)).not.toContain('afundo');
  });

  it('dia sem treino marcado: avisa e não chama a IA', async () => {
    iaResponde(EDITADO);

    const eventos = await coletar(
      conversarOpenAI(pedido('tira o cardio de domingo', { treinosAtuais: SEMANA })),
    );

    expect(global.fetch).not.toHaveBeenCalled();
    expect(eventos.some((evento) => evento.tipo === 'treinos')).toBe(false);
    expect(textoDos(eventos)).toContain('não tem treino marcado no domingo');
  });

  it('"muda o almoço de quarta" parte do plano de quarta e só ele muda', async () => {
    const QUARTA: PlanoDieta = {
      ...PLANO_ATUAL,
      refeicoes: [
        PLANO_ATUAL.refeicoes[0],
        { ...PLANO_ATUAL.refeicoes[1], itens: [{ alimento: 'Peixe', quantidade: '150 g' }] },
      ],
    };

    iaResponde({
      ...QUARTA,
      refeicoes: [
        { ...QUARTA.refeicoes[0], itens: [{ alimento: 'Bolo', quantidade: '1 fatia' }] },
        { ...QUARTA.refeicoes[1], itens: [{ alimento: 'Escondidinho', quantidade: '250 g' }] },
      ],
    });

    const eventos = await coletar(
      conversarOpenAI(
        pedido('muda o almoço de quarta', {
          planoAtual: PLANO_ATUAL,
          dietaPorDia: [{ dia: 3, plano: QUARTA }],
        }),
      ),
    );

    const instrucoes = corpoDaChamada(0).messages[1].content as string;
    expect(instrucoes).toContain('Dieta atual de quarta (JSON)');
    expect(instrucoes).toContain('Peixe');

    const dieta = eventos.find((evento) => evento.tipo === 'dieta') as {
      plano: PlanoDieta;
      dias?: number[];
    };
    expect(dieta).toMatchObject({ modo: 'ajuste', refeicoes: ['almoco'], dias: [3] });
    // O café de quarta fica igual (a IA tinha mexido)
    expect(dieta.plano.refeicoes[0]).toEqual(QUARTA.refeicoes[0]);
    expect(dieta.plano.refeicoes[1].itens[0].alimento).toBe('Escondidinho');
    expect(textoDos(eventos)).toContain('quarta: almoço trocado');
  });

  it('"monta a dieta de sábado" pede um plano só para aquele dia', async () => {
    iaResponde(PLANO_ATUAL);

    const eventos = await coletar(
      conversarOpenAI(
        pedido('monta uma dieta nova para sábado', {
          planoAtual: PLANO_ATUAL,
          treinosAtuais: [{ ...ATUAIS[0], dias: [6] }],
        }),
      ),
    );

    const instrucoes = corpoDaChamada(0).messages[1].content as string;
    expect(instrucoes).toContain('Este plano vale só para sábado');
    expect(instrucoes).toContain('Treino A, Perna');
    expect(eventos.find((evento) => evento.tipo === 'dieta')).toMatchObject({
      modo: 'novo',
      dias: [6],
    });
    expect(textoDos(eventos)).toContain('sábado: plano novo só para esse dia');
  });
});
