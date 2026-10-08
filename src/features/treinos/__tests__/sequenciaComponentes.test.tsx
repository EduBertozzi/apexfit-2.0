import { render, screen, userEvent } from '@testing-library/react-native';
import { router } from 'expo-router';

import { CabecalhoTreinoHoje } from '../components/CabecalhoTreinoHoje';
import { CalendarioSequencia } from '../components/CalendarioSequencia';
import { CartaoCompartilhar } from '../components/CartaoCompartilhar';
import { MarcosSequencia } from '../components/MarcosSequencia';
import { marcos, semanaDaSequencia } from '../sequencia';
import { useTreinosStore } from '../store';

jest.mock('expo-router', () => ({ router: { push: jest.fn() } }));

beforeEach(() => {
  jest.clearAllMocks();
  useTreinosStore.setState({ treinos: [], sessoes: [] });
});

describe('<CabecalhoTreinoHoje />', () => {
  it('a chama abre a página de sequência', async () => {
    await render(
      <CabecalhoTreinoHoje nomeDoDia="quarta" titulo="treino de hoje" legenda="" sequencia={4} />,
    );

    await userEvent.press(screen.getByRole('button', { name: 'ver sua sequência' }));

    expect(router.push).toHaveBeenCalledWith('/sequencia');
  });
});

describe('<CalendarioSequencia />', () => {
  it('mostra o mês e não deixa avançar além de hoje', async () => {
    await render(<CalendarioSequencia hoje={new Date(2026, 9, 7)} />);

    expect(screen.getByText('outubro de 2026')).toBeOnTheScreen();
    expect(screen.getByRole('button', { name: 'próximo mês' })).toBeDisabled();
    expect(screen.getByLabelText('7 de outubro, hoje, ainda sem treino')).toBeOnTheScreen();
  });
});

describe('<MarcosSequencia />', () => {
  it('selos conquistados e quanto falta para o próximo', async () => {
    const { lista, proximo } = marcos(18, 18);

    await render(<MarcosSequencia lista={lista} proximo={proximo} />);

    expect(screen.getByLabelText('7 dias, conquistado')).toBeOnTheScreen();
    expect(screen.getByLabelText('30 dias, ainda não')).toBeOnTheScreen();
    expect(screen.getByText('faltam 12 dias para 30')).toBeOnTheScreen();
  });
});

describe('<CartaoCompartilhar />', () => {
  const bolinhas = semanaDaSequencia([], [], '2026-10-07');

  it('número, nome e o treino de hoje só quando pedido', async () => {
    await render(
      <CartaoCompartilhar
        largura={270}
        dias={12}
        rotulo="dias seguidos"
        frase="uma semana inteira"
        bolinhas={bolinhas}
        nome="Ana"
        treinoDeHoje="treino A: 5 de 6 exercícios"
      />,
    );

    expect(screen.getByText('12')).toBeOnTheScreen();
    expect(screen.getByText('Ana no ApexFit')).toBeOnTheScreen();
    expect(screen.getByText('hoje: treino A: 5 de 6 exercícios')).toBeOnTheScreen();
  });

  it('sem o treino de hoje', async () => {
    await render(
      <CartaoCompartilhar
        largura={270}
        dias={1}
        rotulo="dia seguido"
        frase="começou bem"
        bolinhas={bolinhas}
        nome="Ana"
      />,
    );

    expect(screen.queryByText(/^hoje:/)).toBeNull();
  });
});
