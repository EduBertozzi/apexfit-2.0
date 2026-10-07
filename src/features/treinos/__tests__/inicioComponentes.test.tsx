import { act, render, screen, userEvent } from '@testing-library/react-native';
import { router } from 'expo-router';

import { BotaoTreinoHoje } from '../components/BotaoTreinoHoje';
import { GradeTreinoHoje } from '../components/GradeTreinoHoje';
import { useTreinosStore } from '../store';

jest.mock('expo-router', () => ({ router: { push: jest.fn() } }));

beforeEach(() => {
  jest.clearAllMocks();
  useTreinosStore.setState({ treinos: [], sessoes: [] });
});

function montarTreino(nomes: string[]) {
  const id = useTreinosStore.getState().novoTreino();

  for (const nome of nomes) {
    useTreinosStore
      .getState()
      .adicionarExercicio(id, { nome, series: 3, repeticoes: '10', grupo: 'perna' });
  }

  return id;
}

describe('<BotaoTreinoHoje />', () => {
  it('sem treino montado não aparece', async () => {
    await render(<BotaoTreinoHoje />);

    expect(screen.queryByTestId('botao-treino-hoje')).toBeNull();
  });

  it('começar, continuar e concluído, sempre abrindo o treino de hoje', async () => {
    const usuario = userEvent.setup();
    const id = montarTreino(['Agachamento', 'Leg press']);
    const [a, b] = useTreinosStore.getState().treinos[0].exercicios;

    await render(<BotaoTreinoHoje />);

    expect(screen.getByText('começar treino')).toBeOnTheScreen();

    await usuario.press(screen.getByTestId('botao-treino-hoje'));
    expect(router.push).toHaveBeenCalledWith('/treino/sessao');

    await act(() => useTreinosStore.getState().marcarExercicioDeHoje(id, a.id));
    expect(await screen.findByText('continuar treino · 1 de 2')).toBeOnTheScreen();
    expect(
      screen.getByRole('button', { name: 'continuar treino, 1 de 2 exercícios feitos' }),
    ).toBeOnTheScreen();

    await act(() => useTreinosStore.getState().marcarExercicioDeHoje(id, b.id));
    expect(await screen.findByText('treino concluído')).toBeOnTheScreen();
  });
});

describe('<GradeTreinoHoje />', () => {
  it('marcar no card começa o treino de hoje e risca o exercício', async () => {
    const usuario = userEvent.setup();
    montarTreino(['Agachamento']);

    await render(<GradeTreinoHoje />);

    await usuario.press(screen.getByRole('checkbox', { name: 'agachamento, marcar como feito' }));

    expect(screen.getByRole('checkbox', { name: 'agachamento, feito' })).toBeChecked();
    expect(useTreinosStore.getState().sessoes).toHaveLength(1);
    expect(router.push).not.toHaveBeenCalled();
  });

  it('só tem cards de grupo: água e dieta ficam fora da grade', async () => {
    montarTreino(['Agachamento']);

    await render(<GradeTreinoHoje />);

    expect(screen.getByTestId('grupo-perna')).toBeOnTheScreen();
    expect(screen.queryByTestId('cartao-agua')).toBeNull();
  });
});
