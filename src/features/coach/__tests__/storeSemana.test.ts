import type { PlanoDieta } from '@/features/dieta/contrato';
import { useDietaStore } from '@/features/dieta/store';
import { calcularNecessidades } from '@/features/nutricao/calculos';
import type { Perfil } from '@/features/perfil/types';
import type { RespostaTreinosIa } from '@/features/treinos/contratoIa';
import { useTreinosStore } from '@/features/treinos/store';
import type { Treino } from '@/features/treinos/types';

import type { EventoCoach } from '../contrato';
import type { DadosDemo } from '../demo';
import { escreverEvento } from '../eventos';
import { useCoachStore } from '../store';

/** Coach com dieta da semana e treinos por dia. A rede é sempre simulada. */

const PERFIL: Perfil = {
  nome: 'Eduardo',
  idade: 21,
  alturaCm: 188,
  pesoKg: 75,
  sexo: 'masculino',
  nivelAtividade: 'moderado',
  objetivo: 'manter',
};

type Refeicao = PlanoDieta['refeicoes'][number];

function refeicao(nome: string, alimento: string, calorias = 500): Refeicao {
  return {
    nome,
    horario: nome === 'Almoço' ? '12:00' : '20:00',
    calorias,
    itens: [{ alimento, quantidade: '100 g' }],
    substituicoes: [],
  };
}

function plano(almoco: string, jantar = 'Frango'): PlanoDieta {
  return {
    resumo: 'Plano.',
    caloriasDia: 1000,
    macros: { proteinaG: 80, carboidratoG: 100, gorduraG: 30 },
    refeicoes: [refeicao('Almoço', almoco), refeicao('Jantar', jantar)],
    dicas: [],
    aviso: 'Consulte um nutricionista.',
  };
}

const SEMANA = plano('Arroz e feijão');
const SEXTA = plano('Pizza caseira');

const TREINOS: Treino[] = [
  {
    id: 'a',
    nome: 'Treino A',
    foco: 'Perna',
    dias: [1, 3],
    exercicios: [
      { id: 'a1', nome: 'Leg press 45', grupo: 'perna', series: 4, repeticoes: '12', cargaKg: 90 },
      { id: 'a2', nome: 'Esteira', grupo: 'cardio', series: 1, repeticoes: '15' },
    ],
  },
  {
    id: 'b',
    nome: 'Treino B',
    foco: 'Peito',
    dias: [5],
    exercicios: [
      { id: 'b1', nome: 'Supino reto', grupo: 'peito', series: 3, repeticoes: '10' },
      { id: 'b2', nome: 'Crucifixo', grupo: 'peito', series: 3, repeticoes: '12' },
    ],
  },
];

const DADOS: DadosDemo = {
  perfil: PERFIL,
  necessidades: calcularNecessidades(PERFIL),
  agua: { hojeMl: 1000, metaMl: 2600, diasBatidosNaSemana: 2, sequencia: 1 },
  plano: SEMANA,
  porDia: { 5: SEXTA },
  hoje: 'Quarta, 7 de outubro',
  listaTreinos: TREINOS,
};

function responder(eventos: EventoCoach[]) {
  const texto = eventos.map(escreverEvento).join('');

  global.fetch = jest.fn().mockResolvedValue({
    ok: true,
    status: 200,
    body: undefined,
    text: async () => texto,
  });
}

function semIa() {
  global.fetch = jest.fn().mockResolvedValue({
    ok: false,
    status: 503,
    json: async () => ({ erro: 'Sem IA', codigo: 'SEM_IA' }),
  });
}

function corpoEnviado() {
  return JSON.parse((global.fetch as jest.Mock).mock.calls[0][1].body);
}

beforeEach(() => {
  jest.useFakeTimers({ doNotFake: ['nextTick', 'setImmediate'] });
  useCoachStore.setState({ mensagens: [], respondendo: false, erro: null });
  useDietaStore.setState({ plano: SEMANA, porDia: { 5: SEXTA }, gerando: false, erro: null });
  useTreinosStore.setState({ treinos: TREINOS, sessoes: [] });
});

afterEach(() => {
  jest.useRealTimers();
});

/** Envia e deixa o "digitando" do modo demonstração terminar. */
async function enviar(texto: string, dados: DadosDemo = DADOS) {
  const promessa = useCoachStore.getState().enviar(texto, dados);
  await jest.runAllTimersAsync();
  await promessa;

  return useCoachStore.getState().mensagens.at(-1)!;
}

describe('todo pedido leva a dieta e os treinos de agora', () => {
  it.each(['como estou na água hoje?', 'oi coach', 'troca o supino da sexta'])(
    '"%s" manda a dieta de todos os dias e os treinos com dias',
    async (texto) => {
      responder([{ tipo: 'texto', texto: 'Ok.' }, { tipo: 'fim' }]);

      await enviar(texto);

      const corpo = corpoEnviado();
      expect(corpo.planoAtual).toEqual(SEMANA);
      expect(corpo.dietaPorDia).toEqual([{ dia: 5, plano: SEXTA }]);
      expect(corpo.treinosAtuais.map((t: Treino) => [t.nome, t.dias])).toEqual([
        ['Treino A', [1, 3]],
        ['Treino B', [5]],
      ]);
      expect(corpo.treinosAtuais[1].exercicios[0]).toMatchObject({ id: 'b1', nome: 'Supino reto' });
      // O texto de contexto também traz os dias e a dieta de sexta
      expect(corpo.contexto).toContain('Dieta por dia');
      expect(corpo.contexto).toContain('sexta (1.000 kcal), diferente do plano da semana em:');
      expect(corpo.contexto).toContain('Pizza caseira');
    },
  );
});

describe('dieta por dia da semana', () => {
  it('"muda o almoço de quarta": proposta só de quarta; aplicar cria o plano de quarta', async () => {
    responder([
      {
        tipo: 'dieta',
        plano: plano('Macarrão', 'Sopa'),
        modo: 'ajuste',
        refeicoes: ['almoco'],
        dias: [3],
      },
      { tipo: 'texto', texto: 'Troquei.' },
      { tipo: 'fim' },
    ]);

    const resposta = await enviar('muda o almoço de quarta');

    expect(resposta.proposta?.resumo.mudancas).toEqual(['quarta: almoço trocado']);
    expect(resposta.proposta?.resumo.titulo).toBe('quarta: 1.000 kcal em 2 refeições');

    useCoachStore.getState().aplicarProposta(resposta.id);

    const dieta = useDietaStore.getState();
    expect(dieta.plano).toEqual(SEMANA);
    expect(dieta.porDia[5]).toEqual(SEXTA);
    expect(dieta.porDia[3]?.refeicoes.map((r) => r.itens[0].alimento)).toEqual([
      'Macarrão',
      'Frango',
    ]);

    useCoachStore.getState().desfazerProposta(resposta.id);

    expect(useDietaStore.getState().porDia).toEqual({ 5: SEXTA });
  });

  it('plano novo sem dia vale para a semana toda', async () => {
    responder([{ tipo: 'dieta', plano: plano('Peixe'), modo: 'novo' }, { tipo: 'fim' }]);

    const resposta = await enviar('monta uma dieta nova');
    useCoachStore.getState().aplicarProposta(resposta.id);

    expect(useDietaStore.getState().porDia).toEqual({});
    expect(useDietaStore.getState().plano?.refeicoes[0].itens[0].alimento).toBe('Peixe');
  });

  it('modo demonstração: "troca o almoço de sexta" parte do plano de sexta', async () => {
    semIa();

    const resposta = await enviar('troca o almoço de sexta');

    expect(resposta.texto).toContain('almoço de sexta');
    expect(resposta.proposta).toMatchObject({ tipo: 'dieta', dias: [5], alvos: ['almoco'] });
    expect(resposta.proposta?.resumo.mudancas).toEqual(['sexta: almoço trocado']);

    useCoachStore.getState().aplicarProposta(resposta.id);

    const dieta = useDietaStore.getState();
    expect(dieta.plano).toEqual(SEMANA);
    // O jantar de sexta (do plano de sexta) ficou
    expect(dieta.porDia[5]?.refeicoes.find((r) => r.nome === 'Jantar')).toEqual(SEXTA.refeicoes[1]);
    expect(dieta.porDia[5]?.refeicoes[0].itens).not.toEqual(SEXTA.refeicoes[0].itens);
  });
});

describe('treino por dia da semana', () => {
  const EDITADO: RespostaTreinosIa = {
    resumo: 'Troquei.',
    treinos: [
      {
        nome: 'Treino A',
        foco: 'Perna',
        // A IA mexeu no treino A sem ninguém pedir
        exercicios: [{ nome: 'Agachamento', grupo: 'perna', series: 4, repeticoes: '12' }],
      },
      {
        nome: 'Treino B',
        foco: 'Peito',
        exercicios: [
          { nome: 'Supino inclinado', grupo: 'peito', series: 3, repeticoes: '10' },
          { nome: 'Crucifixo', grupo: 'peito', series: 3, repeticoes: '12' },
        ],
      },
    ],
  };

  it('IA: "troque o supino da sexta" muda só o treino de sexta', async () => {
    responder([
      { tipo: 'treinos', resultado: EDITADO, modo: 'ajuste', diasAlvo: [5] },
      { tipo: 'fim' },
    ]);

    const resposta = await enviar('troque o supino da sexta por supino inclinado');

    expect(resposta.proposta?.resumo.mudancas).toEqual([
      'sexta: supino reto trocado por supino inclinado',
    ]);

    useCoachStore.getState().aplicarProposta(resposta.id);

    const [a, b] = useTreinosStore.getState().treinos;
    expect(a).toEqual(TREINOS[0]);
    expect(b.id).toBe('b');
    expect(b.dias).toEqual([5]);
    expect(b.exercicios[1]).toEqual(TREINOS[1].exercicios[1]);
    expect(b.exercicios[0].nome).toBe('Supino inclinado');
  });

  it('modo demonstração: troca por nome e dia', async () => {
    semIa();

    const resposta = await enviar('troca o supino da sexta por supino inclinado');

    expect(resposta.demo).toBe(true);
    expect(resposta.texto).toContain('Troquei supino por supino inclinado de sexta');
    expect(resposta.proposta?.resumo.mudancas).toEqual([
      'sexta: supino reto trocado por supino inclinado',
    ]);

    useCoachStore.getState().aplicarProposta(resposta.id);

    const [a, b] = useTreinosStore.getState().treinos;
    expect(a).toEqual(TREINOS[0]);
    expect(b.exercicios.map((e) => e.nome)).toEqual(['Supino inclinado', 'Crucifixo']);
    expect(b.exercicios[1].id).toBe('b2');
  });

  it('modo demonstração: troca sem dia ("troca o leg press por agachamento")', async () => {
    semIa();

    const resposta = await enviar('troca o leg press por agachamento');

    expect(resposta.proposta?.resumo.mudancas).toEqual([
      'treino A: leg press 45 trocado por agachamento',
    ]);

    useCoachStore.getState().aplicarProposta(resposta.id);

    const [a, b] = useTreinosStore.getState().treinos;
    expect(a.exercicios[0]).toMatchObject({ nome: 'Agachamento', series: 4, repeticoes: '12' });
    expect(a.exercicios[1]).toEqual(TREINOS[0].exercicios[1]);
    expect(b).toEqual(TREINOS[1]);
  });

  it('modo demonstração: "tira cardio de segunda"', async () => {
    semIa();

    const resposta = await enviar('tira cardio de segunda');

    expect(resposta.proposta?.resumo.mudancas).toEqual([
      'segunda: sai esteira (treino A, vale também para quarta)',
    ]);
  });

  it('modo demonstração: troca sem dizer por qual pergunta o substituto', async () => {
    semIa();

    const resposta = await enviar('troca o supino da sexta');

    expect(resposta.proposta).toBeUndefined();
    expect(resposta.texto).toContain('Por qual exercício você quer trocar?');
  });

  it('modo demonstração: dia sem treino avisa', async () => {
    semIa();

    const resposta = await enviar('troca o supino de domingo por crossover');

    expect(resposta.proposta).toBeUndefined();
    expect(resposta.texto).toContain('não tem treino marcado no domingo');
  });
});
