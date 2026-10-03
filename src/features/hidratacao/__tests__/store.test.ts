import { useHidratacaoStore } from '../store';

const HOJE = new Date(2026, 9, 2, 10, 0);
const ONTEM = new Date(2026, 9, 1, 22, 0);

beforeEach(() => {
  useHidratacaoStore.setState({ registros: {} });
});

describe('useHidratacaoStore', () => {
  it('adiciona e devolve o total antes e depois', () => {
    const { adicionar } = useHidratacaoStore.getState();

    adicionar(250, HOJE);
    const resultado = adicionar(500, HOJE);

    expect(resultado).toEqual({ antesMl: 250, depoisMl: 750 });
  });

  it('separa os dias (o contador "zera" à meia-noite)', () => {
    const { adicionar } = useHidratacaoStore.getState();

    adicionar(500, ONTEM);
    const resultado = adicionar(250, HOJE);

    expect(resultado.antesMl).toBe(0);
    expect(useHidratacaoStore.getState().registros['2026-10-01']).toEqual([500]);
  });

  it('desfaz a última porção do dia', () => {
    const { adicionar, desfazer } = useHidratacaoStore.getState();

    adicionar(250, HOJE);
    adicionar(500, HOJE);
    desfazer(HOJE);

    expect(useHidratacaoStore.getState().registros['2026-10-02']).toEqual([250]);
  });

  it('apaga tudo', () => {
    useHidratacaoStore.getState().adicionar(250, HOJE);
    useHidratacaoStore.getState().apagarTudo();

    expect(useHidratacaoStore.getState().registros).toEqual({});
  });
});
