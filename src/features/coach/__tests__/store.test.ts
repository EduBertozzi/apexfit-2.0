import { useDietaStore } from '@/features/dieta/store';

import type { EventoCoach } from '../contrato';
import { escreverEvento } from '../eventos';
import { useCoachStore } from '../store';

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
});

describe('useCoachStore.enviar', () => {
  it('monta a resposta do coach com os pedaços que chegam', async () => {
    responderComStream([
      { tipo: 'texto', texto: 'Bora, ' },
      { tipo: 'texto', texto: 'Eduardo! Água primeiro.' },
      { tipo: 'fim' },
    ]);

    await useCoachStore.getState().enviar('Oi coach', 'contexto');

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

    await useCoachStore.getState().enviar('  Monta minha dieta  ', 'CTX');

    const [url, opcoes] = (global.fetch as jest.Mock).mock.calls[0];
    expect(url).toBe('/api/coach');
    expect(JSON.parse(opcoes.body)).toEqual({
      mensagens: [
        { papel: 'coach', texto: 'Fala!' },
        { papel: 'usuario', texto: 'Monta minha dieta' },
      ],
      contexto: 'CTX',
    });
  });

  it('salva a dieta quando o coach usa a ferramenta', async () => {
    responderComStream([
      { tipo: 'dieta', plano: PLANO },
      { tipo: 'texto', texto: 'Troquei o almoço.' },
      { tipo: 'fim' },
    ]);

    await useCoachStore.getState().enviar('Troca o almoço', 'ctx');

    expect(useDietaStore.getState().plano).toEqual(PLANO);
    expect(useDietaStore.getState().geradoEm).not.toBeNull();
    expect(useCoachStore.getState().mensagens.at(-1)?.dietaAtualizada).toBe(true);
  });

  it('mostra o erro do servidor e remove a resposta vazia', async () => {
    global.fetch = jest.fn().mockResolvedValue({
      ok: false,
      status: 503,
      json: () => Promise.resolve({ erro: 'Servidor sem ANTHROPIC_API_KEY configurada.' }),
    });

    await useCoachStore.getState().enviar('Oi', 'ctx');

    const { mensagens, erro } = useCoachStore.getState();
    expect(erro).toBe('Servidor sem ANTHROPIC_API_KEY configurada.');
    expect(mensagens).toHaveLength(1);
    expect(mensagens[0].papel).toBe('usuario');
  });

  it('ignora mensagem vazia e não envia duas ao mesmo tempo', async () => {
    responderComStream([{ tipo: 'fim' }]);

    await useCoachStore.getState().enviar('   ', 'ctx');
    expect(global.fetch).not.toHaveBeenCalled();

    useCoachStore.setState({ respondendo: true });
    await useCoachStore.getState().enviar('Oi', 'ctx');
    expect(global.fetch).not.toHaveBeenCalled();
  });
});
