import { act, render, screen, userEvent } from '@testing-library/react-native';

import { confirmar } from '@/shared/lib/confirmar';

import { DialogoConfirmacao } from '../DialogoConfirmacao';

describe('<DialogoConfirmacao />', () => {
  it('mostra a pergunta e devolve "sim" ao confirmar', async () => {
    const usuario = userEvent.setup();
    await render(<DialogoConfirmacao />);

    let resposta: Promise<boolean> = Promise.resolve(false);
    await act(async () => {
      resposta = confirmar('remover a foto?', 'o perfil volta a mostrar a inicial.', 'remover');
    });

    expect(screen.getByText('remover a foto?')).toBeOnTheScreen();
    await usuario.press(screen.getByRole('button', { name: 'remover' }));

    await expect(resposta).resolves.toBe(true);
  });

  it('cancelar devolve "não"', async () => {
    const usuario = userEvent.setup();
    await render(<DialogoConfirmacao />);

    let resposta: Promise<boolean> = Promise.resolve(true);
    await act(async () => {
      resposta = confirmar('apagar conversa?', 'o histórico some.', 'apagar');
    });

    await usuario.press(screen.getByRole('button', { name: 'cancelar' }));

    await expect(resposta).resolves.toBe(false);
  });
});
