import { useDietaStore } from '@/features/dieta/store';
import { useTreinosStore } from '@/features/treinos/store';
import { calcularNecessidades } from '@/features/nutricao/calculos';
import type { Perfil } from '@/features/perfil/types';

import { montarContextoCoach } from '../contexto';
import type { DadosDemo } from '../demo';

import type { EventoCoach } from '../contrato';
import { escreverEvento } from '../eventos';
import { useCoachStore } from '../store';

const PERFIL: Perfil = {
  nome: 'Eduardo',
  idade: 21,
  alturaCm: 188,
  pesoKg: 75,
  sexo: 'masculino',
  nivelAtividade: 'moderado',
  objetivo: 'manter',
};

const DADOS: DadosDemo = {
  perfil: PERFIL,
  necessidades: calcularNecessidades(PERFIL),
  agua: { hojeMl: 1750, metaMl: 2650, diasBatidosNaSemana: 3, sequencia: 2 },
  plano: null,
  hoje: 'Sábado, 3 de outubro',
};

const PLANO = {
  resumo: 'Plano novo.',
  caloriasDia: 2800,
  macros: { proteinaG: 120, carboidratoG: 440, gorduraG: 65 },
  refeicoes: [],
  dicas: [],
  aviso: 'Consulte um nutricionista.',
};

/** Simula a rota respondendo em pedaços, cortando linhas no meio de propósito. */
function responderComStream(eventos: EventoCoach[], tamanhoPedaco = 7) {
  const bytes = new TextEncoder().encode(eventos.map(escreverEvento).join(''));
  let posicao = 0;

  global.fetch = jest.fn().mockResolvedValue({
    ok: true,
    status: 200,
    body: {
      getReader: () => ({
        read: async () => {
          if (posicao >= bytes.length) {
            return { done: true, value: undefined };
          }

          const value = bytes.slice(posicao, posicao + tamanhoPedaco);
          posicao += tamanhoPedaco;

          return { done: false, value };
        },
      }),
    },
  });
}

beforeEach(() => {
  useCoachStore.setState({ mensagens: [], respondendo: false, erro: null });
  useDietaStore.setState({ plano: null, geradoEm: null, gerando: false, erro: null });
  useTreinosStore.setState({ treinos: [], sessoes: [] });
});

describe('useCoachStore.enviar', () => {
  it('monta a resposta do coach com os pedaços que chegam', async () => {
    responderComStream([
      { tipo: 'texto', texto: 'Bora, ' },
      { tipo: 'texto', texto: 'Eduardo! Água primeiro.' },
      { tipo: 'fim' },
    ]);

    await useCoachStore.getState().enviar('Oi coach', DADOS);

    const { mensagens, respondendo } = useCoachStore.getState();
    expect(respondendo).toBe(false);
    expect(mensagens.map(({ papel, texto }) => ({ papel, texto }))).toEqual([
      { papel: 'usuario', texto: 'Oi coach' },
      { papel: 'coach', texto: 'Bora, Eduardo! Água primeiro.' },
    ]);
  });

  it('manda histórico e contexto para /api/coach', async () => {
    useCoachStore.setState({
      mensagens: [{ id: '1', papel: 'coach', texto: 'Fala!' }],
    });
    responderComStream([{ tipo: 'fim' }]);

    await useCoachStore.getState().enviar('  Monta minha dieta  ', DADOS);

    const [url, opcoes] = (global.fetch as jest.Mock).mock.calls[0];
    expect(url).toBe('/api/coach');
    expect(JSON.parse(opcoes.body)).toEqual({
      mensagens: [
        { papel: 'coach', texto: 'Fala!' },
        { papel: 'usuario', texto: 'Monta minha dieta' },
      ],
      contexto: montarContextoCoach(DADOS),
    });
  });

  it('a dieta do coach vira proposta: não salva antes de aplicar', async () => {
    responderComStream([
      { tipo: 'dieta', plano: PLANO },
      { tipo: 'texto', texto: 'Montei seu plano.' },
      { tipo: 'fim' },
    ]);

    await useCoachStore.getState().enviar('Monta minha dieta', DADOS);

    const resposta = useCoachStore.getState().mensagens.at(-1);
    expect(useDietaStore.getState().plano).toBeNull();
    expect(resposta?.texto).toBe('Montei seu plano.');
    expect(resposta?.proposta).toMatchObject({
      tipo: 'dieta',
      estado: 'pendente',
      plano: PLANO,
      resumo: { titulo: '2.800 kcal em 0 refeições' },
    });
  });

  it('aplicar salva a dieta; desfazer volta a de antes', async () => {
    const ANTIGO = { ...PLANO, resumo: 'Plano antigo.', caloriasDia: 2500 };
    useDietaStore.setState({ plano: ANTIGO, origem: 'demo', geradoEm: '2026-10-01T10:00:00Z' });
    responderComStream([{ tipo: 'dieta', plano: PLANO, modo: 'novo' }, { tipo: 'fim' }]);

    await useCoachStore.getState().enviar('Monta uma dieta nova', DADOS);
    const id = useCoachStore.getState().mensagens.at(-1)!.id;

    useCoachStore.getState().aplicarProposta(id);

    expect(useDietaStore.getState().plano).toEqual(PLANO);
    expect(useDietaStore.getState().origem).toBe('ia');
    expect(useCoachStore.getState().mensagens.at(-1)?.proposta).toMatchObject({
      estado: 'aplicado',
      anterior: { plano: ANTIGO, origem: 'demo', geradoEm: '2026-10-01T10:00:00Z' },
    });

    // Aplicar de novo não faz nada
    useCoachStore.getState().aplicarProposta(id);

    useCoachStore.getState().desfazerProposta(id);

    expect(useDietaStore.getState().plano).toEqual(ANTIGO);
    expect(useDietaStore.getState().geradoEm).toBe('2026-10-01T10:00:00Z');
    const proposta = useCoachStore.getState().mensagens.at(-1)?.proposta;
    expect(proposta?.estado).toBe('pendente');
    expect(proposta?.anterior).toBeUndefined();
  });

  it('"não, obrigado" descarta sem mexer na dieta', async () => {
    responderComStream([{ tipo: 'dieta', plano: PLANO }, { tipo: 'fim' }]);

    await useCoachStore.getState().enviar('Monta minha dieta', DADOS);
    const id = useCoachStore.getState().mensagens.at(-1)!.id;

    useCoachStore.getState().recusarProposta(id);
    useCoachStore.getState().aplicarProposta(id);

    expect(useDietaStore.getState().plano).toBeNull();
    expect(useCoachStore.getState().mensagens.at(-1)?.proposta?.estado).toBe('descartado');
  });

  it('só a última proposta aplicada guarda o "desfazer"', async () => {
    responderComStream([{ tipo: 'dieta', plano: PLANO }, { tipo: 'fim' }]);
    await useCoachStore.getState().enviar('Monta minha dieta', DADOS);
    const primeira = useCoachStore.getState().mensagens.at(-1)!.id;
    useCoachStore.getState().aplicarProposta(primeira);

    responderComStream([
      { tipo: 'dieta', plano: { ...PLANO, caloriasDia: 2700 }, modo: 'novo' },
      { tipo: 'fim' },
    ]);
    await useCoachStore.getState().enviar('Monta outra dieta', DADOS);
    const segunda = useCoachStore.getState().mensagens.at(-1)!.id;
    useCoachStore.getState().aplicarProposta(segunda);

    const porId = (id: string) =>
      useCoachStore.getState().mensagens.find((mensagem) => mensagem.id === id)?.proposta;
    expect(porId(primeira)?.anterior).toBeUndefined();
    expect(porId(segunda)?.anterior).toMatchObject({ plano: PLANO });

    // A antiga não desfaz mais nada
    useCoachStore.getState().desfazerProposta(primeira);
    expect(useDietaStore.getState().plano?.caloriasDia).toBe(2700);
  });

  it('manda o plano atual quando existe (para mudar só o que foi pedido)', async () => {
    const PLANO_SALVO = { ...PLANO, resumo: 'Salvo.' };
    responderComStream([{ tipo: 'fim' }]);

    await useCoachStore
      .getState()
      .enviar('Troca o café da manhã', { ...DADOS, plano: PLANO_SALVO });

    const [, opcoes] = (global.fetch as jest.Mock).mock.calls[0];
    expect(JSON.parse(opcoes.body).planoAtual).toEqual(PLANO_SALVO);
  });

  it('mostra o erro do servidor e remove a resposta vazia', async () => {
    global.fetch = jest.fn().mockResolvedValue({
      ok: false,
      status: 503,
      json: () => Promise.resolve({ erro: 'Servidor sem ANTHROPIC_API_KEY configurada.' }),
    });

    await useCoachStore.getState().enviar('Oi', DADOS);

    const { mensagens, erro } = useCoachStore.getState();
    expect(erro).toBe('Servidor sem ANTHROPIC_API_KEY configurada.');
    expect(mensagens).toHaveLength(1);
    expect(mensagens[0].papel).toBe('usuario');
  });

  it('ignora mensagem vazia e não envia duas ao mesmo tempo', async () => {
    responderComStream([{ tipo: 'fim' }]);

    await useCoachStore.getState().enviar('   ', DADOS);
    expect(global.fetch).not.toHaveBeenCalled();

    useCoachStore.setState({ respondendo: true });
    await useCoachStore.getState().enviar('Oi', DADOS);
    expect(global.fetch).not.toHaveBeenCalled();
  });
});

describe('useCoachStore.enviar sem IA (modo demonstração)', () => {
  function semIa() {
    global.fetch = jest.fn().mockResolvedValue({
      ok: false,
      status: 503,
      json: () => Promise.resolve({ erro: 'Nenhuma IA', codigo: 'SEM_IA' }),
    });
  }

  it('responde offline com dados reais e marca a mensagem como demonstração', async () => {
    semIa();

    await useCoachStore.getState().enviar('Como estou na água hoje?', DADOS);

    const resposta = useCoachStore.getState().mensagens.at(-1);
    expect(resposta?.papel).toBe('coach');
    expect(resposta?.demo).toBe(true);
    expect(resposta?.texto).toContain('1.750');
    expect(useCoachStore.getState().erro).toBeNull();
  });

  it('monta a dieta offline como proposta; aplicada, salva com origem demo', async () => {
    semIa();

    await useCoachStore.getState().enviar('Monta minha dieta', DADOS);

    const resposta = useCoachStore.getState().mensagens.at(-1)!;
    expect(resposta.proposta).toMatchObject({ tipo: 'dieta', estado: 'pendente', origem: 'demo' });
    expect(useDietaStore.getState().plano).toBeNull();

    useCoachStore.getState().aplicarProposta(resposta.id);

    expect(useDietaStore.getState().plano).not.toBeNull();
    expect(useDietaStore.getState().origem).toBe('demo');
  });

  it('offline, "troca o almoço" muda só o almoço', async () => {
    semIa();
    await useCoachStore.getState().enviar('Monta minha dieta', DADOS);
    useCoachStore.getState().aplicarProposta(useCoachStore.getState().mensagens.at(-1)!.id);
    const antes = useDietaStore.getState().plano!;

    await useCoachStore.getState().enviar('troca o almoço', { ...DADOS, plano: antes });

    const proposta = useCoachStore.getState().mensagens.at(-1)?.proposta;
    expect(proposta?.tipo).toBe('dieta');
    expect(proposta?.resumo.mudancas).toEqual(['almoço trocado']);

    const depois = proposta?.tipo === 'dieta' ? proposta.plano : null;
    depois!.refeicoes.forEach((refeicao, i) => {
      if (refeicao.nome !== 'Almoço') {
        expect(refeicao).toEqual(antes.refeicoes[i]);
      }
    });
  });

  it('offline, "monta meu treino" propõe treinos com dias da semana', async () => {
    semIa();

    await useCoachStore.getState().enviar('monta meu treino pra segunda, quarta e sexta', DADOS);

    const proposta = useCoachStore.getState().mensagens.at(-1)?.proposta;
    expect(proposta?.tipo).toBe('treinos');
    expect(proposta?.resumo.linhas).toEqual([
      expect.stringMatching(/^treino A: segunda, /),
      expect.stringMatching(/^treino B: quarta, /),
      expect.stringMatching(/^treino C: sexta, /),
    ]);
  });

  it('sem conexão com o servidor também cai no modo demonstração', async () => {
    global.fetch = jest.fn().mockRejectedValue(new TypeError('Network request failed'));

    await useCoachStore.getState().enviar('Oi coach', DADOS);

    expect(useCoachStore.getState().mensagens.at(-1)?.demo).toBe(true);
    expect(useCoachStore.getState().erro).toBeNull();
  });
});
