import { render, screen, userEvent } from '@testing-library/react-native';
import { router } from 'expo-router';
import { SafeAreaProvider } from 'react-native-safe-area-context';

import { CartaoMinhaSemana } from '../components/CartaoMinhaSemana';
import { FolhaEscolherDia } from '../components/FolhaEscolherDia';
import { MinhaSemana } from '../components/MinhaSemana';
import { opcoesDoDia } from '../planoSemana';
import { useTreinosStore } from '../store';

const METRICAS = {
  frame: { x: 0, y: 0, width: 390, height: 844 },
  insets: { top: 0, left: 0, right: 0, bottom: 0 },
};

jest.mock('expo-router', () => ({ router: { push: jest.fn() } }));

beforeEach(() => {
  jest.clearAllMocks();
  useTreinosStore.setState({ treinos: [], sessoes: [] });
});

describe('<MinhaSemana />', () => {
  it('no rodízio, explica e distribui automático', async () => {
    useTreinosStore.getState().novoTreino();
    useTreinosStore.getState().novoTreino();
    await render(<MinhaSemana />);

    expect(screen.getByText(/agora o app usa o rodízio A, B, C/)).toBeTruthy();

    await userEvent.setup().press(screen.getByRole('button', { name: 'distribuir automático' }));

    expect(screen.getByText('2 dias de treino, 5 de descanso')).toBeTruthy();
    expect(screen.getByRole('button', { name: 'segunda: treino A' })).toBeTruthy();
    expect(screen.getByRole('button', { name: 'quinta: treino B' })).toBeTruthy();
    expect(screen.getByRole('button', { name: 'domingo: descanso' })).toBeTruthy();
  });

  it('tocar num dia abre a folha daquele dia', async () => {
    await render(<MinhaSemana />);

    await userEvent.setup().press(screen.getByTestId('dia-3'));

    expect(router.push).toHaveBeenCalledWith({
      pathname: '/treino/escolher-dia',
      params: { dia: '3' },
    });
  });

  it('o cartão da tela de treinos abre minha semana', async () => {
    await render(<CartaoMinhaSemana />);

    await userEvent.setup().press(screen.getByTestId('cartao-minha-semana'));

    expect(router.push).toHaveBeenCalledWith('/treino/semana');
  });
});

describe('<FolhaEscolherDia />', () => {
  it('lista os treinos e descanso, e escolhe', async () => {
    const id = useTreinosStore.getState().novoTreino();
    const onEscolher = jest.fn();
    const onNovoTreino = jest.fn();
    await render(
      <SafeAreaProvider initialMetrics={METRICAS}>
        <FolhaEscolherDia
          titulo="treino de segunda"
          opcoes={opcoesDoDia(useTreinosStore.getState().treinos, 1)}
          onEscolher={onEscolher}
          onNovoTreino={onNovoTreino}
        />
      </SafeAreaProvider>,
    );
    const usuario = userEvent.setup();

    expect(screen.getByRole('radio', { name: /sem treino fixo/ })).toBeTruthy();

    await usuario.press(screen.getByRole('radio', { name: 'treino A' }));
    await usuario.press(screen.getByRole('button', { name: 'novo treino' }));

    expect(onEscolher).toHaveBeenCalledWith(id);
    expect(onNovoTreino).toHaveBeenCalled();
  });
});
