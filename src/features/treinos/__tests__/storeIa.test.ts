import type { Perfil } from '@/features/perfil/types';
import { SemIa } from '@/shared/lib/semIa';

import { pedirTreinosIa } from '../apiIa';
import type { RespostaTreinosIa } from '../contratoIa';
import { useTreinosStore } from '../store';
import { PREFERENCIAS_PADRAO, useTreinosIaStore } from '../storeIa';

const PERFIL: Perfil = {
  nome: 'Eduardo',
  idade: 21,
  alturaCm: 188,
  pesoKg: 75,
  sexo: 'masculino',
  nivelAtividade: 'moderado',
  objetivo: 'manter',
};

const RESPOSTA: RespostaTreinosIa = {
  resumo: 'Divisão AB.',
  treinos: [
    {
      nome: 'Treino A',
      foco: 'Costas',
      exercicios: [{ nome: 'Puxada frontal', grupo: 'costas', series: 3, repeticoes: '10' }],
    },
    {
      nome: 'Treino B',
      foco: 'Perna',
      exercicios: [{ nome: 'Leg press 45', grupo: 'perna', series: 3, repeticoes: '12' }],
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
    preferencias: PREFERENCIAS_PADRAO,
    ultima: null,
    gerando: false,
    erro: null,
  });
});

describe('pedirTreinosIa', () => {
  it('manda perfil e preferências para a rota e lê a resposta', async () => {
    responder(200, { resultado: RESPOSTA, provedor: 'openai' });

    await expect(pedirTreinosIa(PERFIL, PREFERENCIAS_PADRAO)).resolves.toEqual({
      resultado: RESPOSTA,
      provedor: 'openai',
    });

    const [url, init] = jest.mocked(global.fetch).mock.calls[0] as [string, RequestInit];
    expect(url).toBe('/api/treino');
    expect(JSON.parse(init.body as string).preferencias).toEqual(PREFERENCIAS_PADRAO);
  });

  it('SEM_IA e falta de conexão viram SemIa', async () => {
    responder(503, { erro: 'x', codigo: 'SEM_IA' });
    await expect(pedirTreinosIa(PERFIL, PREFERENCIAS_PADRAO)).rejects.toBeInstanceOf(SemIa);

    global.fetch = jest.fn().mockRejectedValue(new TypeError('Network request failed'));
    await expect(pedirTreinosIa(PERFIL, PREFERENCIAS_PADRAO)).rejects.toBeInstanceOf(SemIa);
  });

  it('perfil incompleto nem chama o servidor', async () => {
    global.fetch = jest.fn();

    await expect(
      pedirTreinosIa({ ...PERFIL, objetivo: undefined }, PREFERENCIAS_PADRAO),
    ).rejects.toThrow(/Complete seu perfil/);
    expect(global.fetch).not.toHaveBeenCalled();
  });
});

describe('useTreinosIaStore.gerar', () => {
  it('com IA: troca os treinos e guarda qual IA montou', async () => {
    responder(200, { resultado: RESPOSTA, provedor: 'openai' });

    await expect(useTreinosIaStore.getState().gerar(PERFIL)).resolves.toBe(true);

    expect(useTreinosStore.getState().treinos.map((t) => t.nome)).toEqual(['Treino A', 'Treino B']);
    expect(useTreinosStore.getState().treinos[0].exercicios[0].grupo).toBe('costas');
    expect(useTreinosIaStore.getState().ultima).toMatchObject({
      origem: 'openai',
      quantidade: 2,
      resumo: 'Divisão AB.',
    });
  });

  it('sem IA: monta offline pelas preferências (modo demonstração)', async () => {
    responder(503, { codigo: 'SEM_IA' });
    useTreinosIaStore.getState().mudarPreferencias({ diasPorSemana: 4, local: 'casa' });

    await expect(useTreinosIaStore.getState().gerar(PERFIL)).resolves.toBe(true);

    expect(useTreinosStore.getState().treinos).toHaveLength(4);
    expect(useTreinosIaStore.getState().ultima?.origem).toBe('demo');
  });

  it('erro de verdade: mantém os treinos e mostra a mensagem', async () => {
    useTreinosStore.getState().novoTreino();
    responder(502, { erro: 'Não deu para montar os treinos agora.' });

    await expect(useTreinosIaStore.getState().gerar(PERFIL)).resolves.toBe(false);

    expect(useTreinosStore.getState().treinos).toHaveLength(1);
    expect(useTreinosIaStore.getState().erro).toBe('Não deu para montar os treinos agora.');
    expect(useTreinosIaStore.getState().gerando).toBe(false);
  });
});
