import { render, screen, userEvent } from '@testing-library/react-native';
import { router } from 'expo-router';

import type { PlanoDieta } from '@/features/dieta/contrato';
import { useDietaStore } from '@/features/dieta/store';
import type { Perfil } from '@/features/perfil/types';

import { CartaoDietaInicio } from '../components/CartoesInicio';

jest.mock('expo-router', () => ({ router: { push: jest.fn() } }));

const PERFIL_ANTIGO: Perfil = { nome: 'Ana', idade: 30, alturaCm: 165, pesoKg: 60 };

function plano(refeicoes: number, caloriasDia: number): PlanoDieta {
  return {
    resumo: '',
    caloriasDia,
    macros: { proteinaG: 0, carboidratoG: 0, gorduraG: 0 },
    refeicoes: Array.from({ length: refeicoes }, (_, i) => ({
      nome: `refeição ${i}`,
      horario: '08:00',
      calorias: 0,
      itens: [],
      substituicoes: [],
    })),
    dicas: [],
    aviso: '',
  };
}

beforeEach(() => {
  jest.clearAllMocks();
  useDietaStore.setState({ plano: null });
});

describe('<CartaoDietaInicio />', () => {
  it('com plano: refeições e calorias num card só, e abre a dieta', async () => {
    const usuario = userEvent.setup();
    useDietaStore.setState({ plano: plano(5, 2970) });

    await render(<CartaoDietaInicio perfil={PERFIL_ANTIGO} />);

    expect(screen.getByText('dieta')).toBeOnTheScreen();
    expect(screen.getByText('5 refeições · 2.970 kcal')).toBeOnTheScreen();

    await usuario.press(
      screen.getByRole('button', { name: 'dieta: 5 refeições, 2.970 quilocalorias por dia' }),
    );

    expect(router.push).toHaveBeenCalledWith('/dieta');
  });

  it('sem plano e com perfil incompleto: leva para completar o perfil', async () => {
    const usuario = userEvent.setup();

    await render(<CartaoDietaInicio perfil={PERFIL_ANTIGO} />);
    await usuario.press(screen.getByTestId('cartao-dieta'));

    expect(screen.getByText('complete o perfil')).toBeOnTheScreen();
    expect(router.push).toHaveBeenCalledWith('/editar-perfil');
  });
});
