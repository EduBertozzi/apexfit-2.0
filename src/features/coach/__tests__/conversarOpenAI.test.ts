import type { PlanoDieta } from '@/features/dieta/contrato';
import type { RespostaTreinosIa } from '@/features/treinos/contratoIa';
import { respostaSse } from '@/shared/servidor/sseSimulado';

import type { EventoCoach, PedidoCoach } from '../contrato';
import { confirmarTreinos, pedeMudancaDeTreino } from '../intencao';
import { SISTEMA_COACH, SISTEMA_COACH_PEDIDOS } from '../prompt';
import { conversarOpenAI, FERRAMENTAS_OPENAI } from '../servidor/conversarOpenAI';

const AMBIENTE = { ...process.env };

const TREINOS: RespostaTreinosIa = {
  resumo: 'Treino em casa.',
  treinos: [
    {
      nome: 'Treino A',
      foco: 'Corpo todo',
      exercicios: [
        { nome: 'Polichinelo', grupo: 'aquecimento', series: 1, repeticoes: '5' },
        { nome: 'Flexão de braço', grupo: 'peito', series: 3, repeticoes: '10 a 12' },
      ],
    },
  ],
};

const PLANO: PlanoDieta = {
  resumo: 'Plano.',
  caloriasDia: 2000,
  macros: { proteinaG: 120, carboidratoG: 250, gorduraG: 60 },
  refeicoes: [
    {
      nome: 'Almoço',
      horario: '12:00',
      calorias: 2000,
      itens: [{ alimento: 'Arroz', quantidade: '100 g' }],
      substituicoes: [],
    },
  ],
  dicas: [],
  aviso: 'Consulte um nutricionista.',
};

function pedido(texto: string): PedidoCoach {
  return { mensagens: [{ papel: 'usuario', texto }], contexto: 'Nome: Eduardo' };
}

async function coletar(gerador: AsyncGenerator<EventoCoach>): Promise<EventoCoach[]> {
  const eventos: EventoCoach[] = [];

  for await (const evento of gerador) {
    eventos.push(evento);
  }

  return eventos;
}

function corpoDaChamada(indice: number) {
  return JSON.parse(jest.mocked(global.fetch).mock.calls[indice][1]!.body as string);
}

beforeEach(() => {
  process.env = { ...AMBIENTE, OPENAI_API_KEY: 'sk-teste' };
});

afterAll(() => {
  process.env = AMBIENTE;
});

describe('conversarOpenAI', () => {
  it('papo normal: repassa o texto em streaming com as ferramentas disponíveis', async () => {
    global.fetch = jest
      .fn()
      .mockResolvedValue(respostaSse([{ texto: 'Oi, Eduardo! ' }, { texto: 'Bora treinar?' }]));

    const eventos = await coletar(conversarOpenAI(pedido('Oi coach')));

    expect(eventos).toEqual([
      { tipo: 'texto', texto: 'Oi, Eduardo! ' },
      { tipo: 'texto', texto: 'Bora treinar?' },
    ]);

    const corpo = corpoDaChamada(0);
    expect(corpo.stream).toBe(true);
    expect(corpo.tools.map((t: { function: { name: string } }) => t.function.name)).toEqual([
      'atualizar_dieta',
      'atualizar_treinos',
    ]);
    expect(corpo.messages[0].content).toContain('Nome: Eduardo');
  });

  it('ferramenta atualizar_treinos: monta os treinos e confirma', async () => {
    global.fetch = jest
      .fn()
      .mockResolvedValueOnce(
        respostaSse([
          { texto: 'Fechado.' },
          {
            ferramenta: {
              indice: 0,
              nome: 'atualizar_treinos',
              argumentos: '{"pedido":"trocar supino por flexão"}',
            },
          },
        ]),
      )
      .mockResolvedValueOnce(respostaSse([{ texto: JSON.stringify(TREINOS) }], 40));

    const eventos = await coletar(conversarOpenAI(pedido('Não tenho banco, e agora?')));

    expect(eventos.map((evento) => evento.tipo)).toEqual(['texto', 'texto', 'treinos', 'texto']);
    expect(eventos[2]).toEqual({ tipo: 'treinos', resultado: TREINOS });
    expect(eventos[3]).toEqual({ tipo: 'texto', texto: confirmarTreinos(TREINOS) });

    const segunda = corpoDaChamada(1);
    expect(segunda.response_format.json_schema.name).toBe('treinos');
    expect(segunda.messages[1].content).toContain('trocar supino por flexão');
  });

  it('pedido claro de treino vai direto para o formato travado', async () => {
    global.fetch = jest.fn().mockResolvedValue(respostaSse([{ texto: JSON.stringify(TREINOS) }]));

    const eventos = await coletar(conversarOpenAI(pedido('Monta um treino em casa de 3 dias')));

    expect(global.fetch).toHaveBeenCalledTimes(1);
    expect(corpoDaChamada(0).tools).toBeUndefined();
    expect(eventos.some((evento) => evento.tipo === 'treinos')).toBe(true);
  });

  it('pedido claro de dieta vai direto para o plano', async () => {
    global.fetch = jest.fn().mockResolvedValue(respostaSse([{ texto: JSON.stringify(PLANO) }]));

    const eventos = await coletar(conversarOpenAI(pedido('Monta minha dieta sem ovo')));

    expect(corpoDaChamada(0).response_format.json_schema.name).toBe('plano_dieta');
    expect(eventos.find((evento) => evento.tipo === 'dieta')).toEqual({
      tipo: 'dieta',
      plano: PLANO,
    });
  });

  it('ferramentas no formato estrito', () => {
    for (const ferramenta of FERRAMENTAS_OPENAI) {
      expect(ferramenta.function.strict).toBe(true);
      expect(ferramenta.function.parameters).toMatchObject({
        required: ['pedido'],
        additionalProperties: false,
      });
    }
  });
});

describe('pedeMudancaDeTreino', () => {
  it.each([
    'Monta meu treino',
    'monta um treino em casa de 3 dias',
    'Refaz minha ficha pra 4 dias',
    'Troca os exercícios do treino A',
    'Pode montar um treino pra mim?',
    'Cria uma divisão nova',
  ])('reconhece pedido: "%s"', (mensagem) => {
    expect(pedeMudancaDeTreino(mensagem)).toBe(true);
  });

  it.each([
    'Qual treino faço hoje?',
    'Como foi meu treino?',
    'Posso trocar o supino por flexão no treino?',
    'Monta minha dieta para os dias de treino',
    'Bora treinar hoje',
  ])('não confunde: "%s"', (mensagem) => {
    expect(pedeMudancaDeTreino(mensagem)).toBe(false);
  });
});

describe('prompt do coach com ferramentas por pedido', () => {
  it('troca as duas instruções e mantém o resto', () => {
    expect(SISTEMA_COACH_PEDIDOS).not.toBe(SISTEMA_COACH);
    expect(SISTEMA_COACH_PEDIDOS).toContain('atualizar_treinos');
    expect(SISTEMA_COACH_PEDIDOS).toContain('descreva em uma frase');
    expect(SISTEMA_COACH_PEDIDOS).not.toContain('a pessoa muda os treinos na aba Treinos');
    expect(SISTEMA_COACH_PEDIDOS).toContain('Nunca use emoji. Nunca use travessão');
  });

  it('confirmação dos treinos sem emoji nem travessão', () => {
    expect(confirmarTreinos(TREINOS)).toMatch(
      /^Pronto! Montei 1 treino:\n- treino A: corpo todo \(2 exercícios\)/,
    );
    expect(confirmarTreinos(TREINOS)).not.toMatch(/[–—]|\p{Extended_Pictographic}/u);
  });
});
