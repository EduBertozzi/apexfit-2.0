import { agendarLembretes, cancelarLembretes, pedirPermissao } from '../notificacoes';
import { useLembretesStore } from '../store';

jest.mock('../notificacoes', () => ({
  notificacoesSuportadas: jest.fn(() => true),
  pedirPermissao: jest.fn(async () => true),
  agendarLembretes: jest.fn(async () => {}),
  cancelarLembretes: jest.fn(async () => {}),
  configurarExibicaoComAppAberto: jest.fn(),
}));

const pedirPermissaoMock = jest.mocked(pedirPermissao);
const agendarMock = jest.mocked(agendarLembretes);
const cancelarMock = jest.mocked(cancelarLembretes);

beforeEach(async () => {
  await useLembretesStore.getState().apagarTudo();
  jest.clearAllMocks();
  pedirPermissaoMock.mockResolvedValue(true);
});

describe('useLembretesStore', () => {
  it('começa desligado, das 08:00 às 22:00, de 2 em 2 horas', () => {
    expect(useLembretesStore.getState()).toMatchObject({
      ativo: false,
      inicio: '08:00',
      fim: '22:00',
      intervaloMin: 120,
    });
  });

  it('ao ligar com permissão, agenda os lembretes do dia', async () => {
    await expect(useLembretesStore.getState().ligar()).resolves.toBe('ligado');

    expect(useLembretesStore.getState().ativo).toBe(true);
    expect(agendarMock).toHaveBeenCalledTimes(1);
    expect(agendarMock.mock.calls[0][0]).toHaveLength(8);
  });

  it('se a pessoa negar a permissão, continua desligado e não agenda', async () => {
    pedirPermissaoMock.mockResolvedValue(false);

    await expect(useLembretesStore.getState().ligar()).resolves.toBe('negado');

    expect(useLembretesStore.getState().ativo).toBe(false);
    expect(agendarMock).not.toHaveBeenCalled();
  });

  it('reagenda quando muda intervalo, início ou fim', async () => {
    await useLembretesStore.getState().ligar();
    agendarMock.mockClear();

    await useLembretesStore.getState().definirIntervalo(60);
    expect(agendarMock.mock.calls[0][0]).toHaveLength(15);

    await useLembretesStore.getState().mudarInicio(1);
    expect(useLembretesStore.getState().inicio).toBe('08:30');

    await useLembretesStore.getState().mudarFim(-1);
    expect(useLembretesStore.getState().fim).toBe('21:30');

    expect(agendarMock).toHaveBeenCalledTimes(3);
    expect(agendarMock.mock.calls[2][0][0]).toMatchObject({ hora: 8, minuto: 30 });
  });

  it('ignora intervalo fora da lista', async () => {
    await useLembretesStore.getState().definirIntervalo(45);

    expect(useLembretesStore.getState().intervaloMin).toBe(120);
  });

  it('com lembretes desligados, mudar horário só cancela (não agenda nada)', async () => {
    await useLembretesStore.getState().mudarFim(1);

    expect(agendarMock).not.toHaveBeenCalled();
    expect(cancelarMock).toHaveBeenCalled();
  });

  it('desligar cancela os lembretes', async () => {
    await useLembretesStore.getState().ligar();
    await useLembretesStore.getState().desligar();

    expect(useLembretesStore.getState().ativo).toBe(false);
    expect(cancelarMock).toHaveBeenCalledTimes(1);
  });

  it('apagarTudo volta ao padrão e cancela', async () => {
    await useLembretesStore.getState().ligar();
    await useLembretesStore.getState().definirIntervalo(180);
    cancelarMock.mockClear();

    await useLembretesStore.getState().apagarTudo();

    expect(useLembretesStore.getState()).toMatchObject({ ativo: false, intervaloMin: 120 });
    expect(cancelarMock).toHaveBeenCalledTimes(1);
  });
});
