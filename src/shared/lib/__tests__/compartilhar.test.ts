import * as Sharing from 'expo-sharing';
import { captureRef } from 'react-native-view-shot';

import { compartilharView } from '../compartilhar';

jest.mock('expo-sharing', () => ({
  isAvailableAsync: jest.fn(),
  shareAsync: jest.fn(),
}));
jest.mock('react-native-view-shot', () => ({ captureRef: jest.fn() }));

const disponivel = Sharing.isAvailableAsync as jest.Mock;
const compartilhar = Sharing.shareAsync as jest.Mock;
const capturar = captureRef as jest.Mock;
const ref = { current: {} } as never;

beforeEach(() => {
  jest.clearAllMocks();
  disponivel.mockResolvedValue(true);
  capturar.mockResolvedValue('file:///tmp/cartao.png');
  compartilhar.mockResolvedValue(undefined);
});

describe('compartilharView (celular)', () => {
  it('captura em PNG no tamanho pedido e abre o menu do sistema', async () => {
    await expect(compartilharView(ref, { largura: 1080, altura: 1920 })).resolves.toBe(
      'compartilhado',
    );
    expect(capturar).toHaveBeenCalledWith(ref, {
      format: 'png',
      quality: 1,
      width: 1080,
      height: 1920,
    });
    expect(compartilhar).toHaveBeenCalledWith(
      'file:///tmp/cartao.png',
      expect.objectContaining({ mimeType: 'image/png', UTI: 'public.png' }),
    );
  });

  it('sem como compartilhar: avisa e nem captura', async () => {
    disponivel.mockResolvedValue(false);

    await expect(compartilharView(ref)).resolves.toBe('indisponivel');
    expect(capturar).not.toHaveBeenCalled();
  });

  it('captura falhou', async () => {
    capturar.mockRejectedValue(new Error('falhou'));

    await expect(compartilharView(ref)).resolves.toBe('erro');
  });

  it('ref vazia', async () => {
    await expect(compartilharView({ current: null })).resolves.toBe('erro');
  });
});
