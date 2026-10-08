import type { Perfil } from '@/features/perfil/types';
import { SemIa } from '@/shared/lib/semIa';

import { pedirSemanaIa } from '../apiIa';
import type { EscolhasSemana, RespostaTreinosIa } from '../contratoIa';
import { grupoDe } from '../grupos';
import { ESCOLHAS_PADRAO } from '../montadorIa';
import { useTreinosStore } from '../store';
import { useTreinosIaStore } from '../storeIa';

const PERFIL: Perfil = {
  nome: 'Eduardo',
  idade: 21,
  alturaCm: 188,
  pesoKg: 75,
  sexo: 'masculino',
  nivelAtividade: 'moderado',
  objetivo: 'manter',
};

const ESCOLHAS: EscolhasSemana = {
  ...ESCOLHAS_PADRAO,
  dias: [
    { dia: 2, areas: [{ area: 'costas', regioes: [] }] },
    { dia: 4, areas: [{ area: 'perna', regioes: [] }] },
  ],
};

// A IA respondeu fora de ordem: o nome diz o dia
const RESPOSTA: RespostaTreinosIa = {
  resumo: 'Semana de dois dias.',
  treinos: [
    {
      nome: 'treino de quinta',
      foco: 'Perna',
      exercicios: [{ nome: 'Leg press 45', grupo: 'perna', series: 3, repeticoes: '12' }],
    },
    {
      nome: 'treino de terça',
      foco: 'Costas',
      exercicios: [{ nome: 'Puxada frontal', grupo: 'costas', series: 3, repeticoes: '10' }],
    },
  ],
};

function responder(status: number, corpo: unknown) {
  global.fetch = jest.fn().mockResolvedValue({
    ok: status >= 200 && status < 300,
    status,
    json: async () => corpo,
  });
}

beforeEach(() => {
  useTreinosStore.setState({ treinos: [], sessoes: [] });
  useTreinosIaStore.setState({
    escolhas: ESCOLHAS,
    ultima: null,
    gerando: false,
    erro: null,
  });
});

describe('pedirSemanaIa', () => {
  it('manda perfil e escolhas da semana para a rota e lê a resposta', async () => {
    responder(200, { resultado: RESPOSTA, provedor: 'openai' });

    await expect(pedirSemanaIa(PERFIL, ESCOLHAS)).resolves.toEqual({
      resultado: RESPOSTA,
      provedor: 'openai',
    });

    const [url, init] = jest.mocked(global.fetch).mock.calls[0] as [string, RequestInit];
    expect(url).toBe('/api/treino');
    expect(JSON.parse(init.body as string).escolhas).toEqual(ESCOLHAS);
  });

  it('SEM_IA, falta de conexão e perfil incompleto viram SemIa', async () => {
    responder(503, { erro: 'x', codigo: 'SEM_IA' });
    await expect(pedirSemanaIa(PERFIL, ESCOLHAS)).rejects.toBeInstanceOf(SemIa);

    global.fetch = jest.fn().mockRejectedValue(new TypeError('Network request failed'));
    await expect(pedirSemanaIa(PERFIL, ESCOLHAS)).rejects.toBeInstanceOf(SemIa);

    global.fetch = jest.fn();
    await expect(
      pedirSemanaIa({ ...PERFIL, objetivo: undefined }, ESCOLHAS),
    ).rejects.toBeInstanceOf(SemIa);
    expect(global.fetch).not.toHaveBeenCalled();
  });
});

describe('useTreinosIaStore.gerar', () => {
  it('com IA: um treino por dia, no dia certo, com o aquecimento escolhido na frente', async () => {
    responder(200, { resultado: RESPOSTA, provedor: 'openai' });

    await expect(useTreinosIaStore.getState().gerar(PERFIL)).resolves.toBe(true);

    const { treinos } = useTreinosStore.getState();
    expect(treinos.map((t) => [t.nome, t.dias])).toEqual([
      ['treino de terça', [2]],
      ['treino de quinta', [4]],
    ]);
    expect(treinos[0].exercicios.map((e) => e.nome)).toEqual([
      'polichinelo',
      'mobilidade de quadril',
      'Puxada frontal',
    ]);
    expect(useTreinosIaStore.getState().ultima).toMatchObject({
      origem: 'openai',
      quantidade: 2,
      resumo: 'Semana de dois dias.',
    });
  });

  it('sem IA: monta offline com as áreas de cada dia (modo demonstração)', async () => {
    responder(503, { codigo: 'SEM_IA' });

    await expect(useTreinosIaStore.getState().gerar(PERFIL)).resolves.toBe(true);

    const { treinos } = useTreinosStore.getState();
    expect(treinos).toHaveLength(2);
    expect(
      treinos[1].exercicios
        .filter((e) => grupoDe(e) !== 'aquecimento')
        .every((e) => grupoDe(e) === 'perna'),
    ).toBe(true);
    expect(useTreinosIaStore.getState().ultima?.origem).toBe('demo');
  });

  it('erro no servidor também cai no modo offline: a demonstração nunca falha', async () => {
    useTreinosStore.getState().novoTreino();
    responder(502, { erro: 'Não deu para montar os treinos agora.' });

    await expect(useTreinosIaStore.getState().gerar(PERFIL)).resolves.toBe(true);

    expect(useTreinosStore.getState().treinos.map((t) => t.nome)).toEqual([
      'treino de terça',
      'treino de quinta',
    ]);
    expect(useTreinosIaStore.getState().erro).toBeNull();
    expect(useTreinosIaStore.getState().gerando).toBe(false);
  });

  it('escolhas inválidas: nem chama o servidor e mostra o motivo', async () => {
    global.fetch = jest.fn();
    useTreinosIaStore.getState().alternarDia(6);

    await expect(useTreinosIaStore.getState().gerar(PERFIL)).resolves.toBe(false);

    expect(global.fetch).not.toHaveBeenCalled();
    expect(useTreinosIaStore.getState().erro).toBe('escolha o que treinar em cada dia marcado.');
  });

  it('ações do montador mudam as escolhas e apagam o erro', () => {
    const store = useTreinosIaStore.getState();
    useTreinosIaStore.setState({ erro: 'antigo' });

    store.alternarArea(2, 'braco');
    store.alternarRegiao(2, 'braco', 'biceps');
    store.copiarDia(2, 4);
    store.mudarEscolhas({ nivel: 'avancado', evitar: 'joelho' });
    store.alternarAquecimento('bike leve');
    store.medidaAquecimento('polichinelo', 'tempo');
    store.passoAquecimento('polichinelo', 1);

    const { escolhas, erro } = useTreinosIaStore.getState();
    expect(erro).toBeNull();
    expect(escolhas.dias[1].areas).toEqual([
      { area: 'costas', regioes: [] },
      { area: 'braco', regioes: ['biceps'] },
    ]);
    expect(escolhas.nivel).toBe('avancado');
    expect(escolhas.aquecimento.itens.map((i) => [i.nome, i.medida])).toEqual([
      ['polichinelo', 'tempo'],
      ['mobilidade de quadril', 'repeticoes'],
      ['bike leve', 'tempo'],
    ]);
  });

  it('apagarTudo volta ao padrão', () => {
    useTreinosIaStore.getState().apagarTudo();

    expect(useTreinosIaStore.getState().escolhas).toEqual(ESCOLHAS_PADRAO);
  });
});
