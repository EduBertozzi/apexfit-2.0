import { fireEvent, render, screen, userEvent } from '@testing-library/react-native';
import * as Haptics from 'expo-haptics';
import { router } from 'expo-router';
import { AccessibilityInfo } from 'react-native';

import { useAjustesStore } from '@/features/ajustes/store';

import { CartaoAguaInicio } from '../components/CartaoAguaInicio';
import { useHidratacaoStore } from '../store';

jest.mock('expo-router', () => ({ router: { push: jest.fn() } }));
jest.mock('expo-haptics', () => ({
  impactAsync: jest.fn(() => Promise.resolve()),
  notificationAsync: jest.fn(() => Promise.resolve()),
  ImpactFeedbackStyle: { Light: 'light' },
  NotificationFeedbackType: { Success: 'success' },
}));

const anunciar = jest.spyOn(AccessibilityInfo, 'announceForAccessibility');

beforeEach(() => {
  jest.clearAllMocks();
  useHidratacaoStore.setState({ registros: {} });
  useAjustesStore.setState({ vibracao: true });
});

function total() {
  const registros = useHidratacaoStore.getState().registros;

  return Object.values(registros)
    .flat()
    .reduce((soma, ml) => soma + ml, 0);
}

describe('<CartaoAguaInicio />', () => {
  it('um toque soma 250 ml, vibra e anuncia o total', async () => {
    const usuario = userEvent.setup();

    await render(<CartaoAguaInicio metaMl={3000} />);

    const cartao = screen.getByRole('button', { name: 'água, 0 de 3 litros hoje' });
    expect(cartao).toHaveProp(
      'accessibilityHint',
      'toque para somar 250 ml. toque e segure para desfazer o último copo',
    );

    await usuario.press(cartao);

    expect(total()).toBe(250);
    expect(Haptics.impactAsync).toHaveBeenCalled();
    expect(anunciar).toHaveBeenCalledWith('mais 250 ml, 0,25 de 3 litros');
    expect(screen.getByRole('button', { name: 'água, 0,3 de 3 litros hoje' })).toBeOnTheScreen();
  });

  it('bater a meta comemora com a vibração de sucesso', async () => {
    const usuario = userEvent.setup();
    useHidratacaoStore.getState().adicionar(2900);

    await render(<CartaoAguaInicio metaMl={3000} />);
    await usuario.press(screen.getByTestId('cartao-agua'));

    expect(Haptics.notificationAsync).toHaveBeenCalled();
    expect(anunciar).toHaveBeenCalledWith(
      'mais 250 ml, 3,15 de 3 litros. meta de água batida, boa!',
    );
  });

  it('vibração desligada em Ajustes: não vibra', async () => {
    const usuario = userEvent.setup();
    useAjustesStore.setState({ vibracao: false });

    await render(<CartaoAguaInicio metaMl={3000} />);
    await usuario.press(screen.getByTestId('cartao-agua'));

    expect(Haptics.impactAsync).not.toHaveBeenCalled();
  });

  it('tocar e segurar desfaz o último copo e anuncia', async () => {
    useHidratacaoStore.getState().adicionar(250);
    useHidratacaoStore.getState().adicionar(500);

    await render(<CartaoAguaInicio metaMl={3000} />);
    fireEvent(screen.getByTestId('cartao-agua'), 'longPress');

    expect(total()).toBe(250);
    expect(anunciar).toHaveBeenCalledWith('desfeito, menos 500 ml, 0,25 de 3 litros');
  });

  it('o leitor de tela também desfaz pela ação "desfazer o último copo"', async () => {
    useHidratacaoStore.getState().adicionar(250);

    await render(<CartaoAguaInicio metaMl={3000} />);
    fireEvent(screen.getByTestId('cartao-agua'), 'accessibilityAction', {
      nativeEvent: { actionName: 'desfazer' },
    });

    expect(total()).toBe(0);
  });

  it('desfazer sem nada no dia só avisa', async () => {
    await render(<CartaoAguaInicio metaMl={3000} />);
    fireEvent(screen.getByTestId('cartao-agua'), 'longPress');

    expect(anunciar).toHaveBeenCalledWith('nada para desfazer hoje');
  });

  it('a seta redonda é um botão separado que abre a tela de água', async () => {
    const usuario = userEvent.setup();

    await render(<CartaoAguaInicio metaMl={3000} />);
    await usuario.press(screen.getByRole('button', { name: 'abrir a tela de água' }));

    expect(router.push).toHaveBeenCalledWith('/agua');
    expect(total()).toBe(0);
  });
});
