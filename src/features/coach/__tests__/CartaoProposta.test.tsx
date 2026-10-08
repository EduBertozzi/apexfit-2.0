import { render, screen, userEvent } from '@testing-library/react-native';
import { router } from 'expo-router';

import type { PlanoDieta } from '@/features/dieta/contrato';

import { CartaoProposta } from '../components/CartaoProposta';
import { aplicarProposta, propostaDeDieta, recusarProposta } from '../proposta';

jest.mock('expo-router', () => ({ router: { push: jest.fn() } }));

const PLANO: PlanoDieta = {
  resumo: '',
  caloriasDia: 2000,
  macros: { proteinaG: 0, carboidratoG: 0, gorduraG: 0 },
  refeicoes: [
    {
      nome: 'Almoço',
      horario: '12:00',
      calorias: 2000,
      itens: [{ alimento: 'Arroz', quantidade: '1' }],
      substituicoes: [],
    },
  ],
  dicas: [],
  aviso: '',
};

const PENDENTE = propostaDeDieta(null, PLANO, { modo: 'novo', alvos: [], origem: 'ia' })!;

async function montar(proposta = PENDENTE, bloqueada = false) {
  const acoes = { onAplicar: jest.fn(), onRecusar: jest.fn(), onDesfazer: jest.fn() };

  await render(<CartaoProposta proposta={proposta} bloqueada={bloqueada} {...acoes} />);

  return acoes;
}

beforeEach(() => {
  jest.clearAllMocks();
});

describe('<CartaoProposta />', () => {
  it('pendente: mostra o resumo e os botões aplicar e não, obrigado', async () => {
    const usuario = userEvent.setup();
    const acoes = await montar();

    expect(screen.getByText('proposta de dieta')).toBeOnTheScreen();
    expect(screen.getByText('2.000 kcal em 1 refeição')).toBeOnTheScreen();
    expect(screen.getByText('12:00 almoço: 2.000 kcal')).toBeOnTheScreen();

    await usuario.press(screen.getByRole('button', { name: 'Aplicar a proposta de dieta' }));
    await usuario.press(screen.getByRole('button', { name: 'Não aplicar a proposta de dieta' }));

    expect(acoes.onAplicar).toHaveBeenCalledTimes(1);
    expect(acoes.onRecusar).toHaveBeenCalledTimes(1);
  });

  it('enquanto o coach escreve, os botões esperam', async () => {
    await montar(PENDENTE, true);

    expect(screen.getByRole('button', { name: 'Aplicar a proposta de dieta' })).toBeDisabled();
  });

  it('aplicado: mostra "aplicado", desfazer e ver dieta', async () => {
    const usuario = userEvent.setup();
    const acoes = await montar(
      aplicarProposta(PENDENTE, { plano: null, origem: null, geradoEm: null }),
    );

    expect(screen.getByText('aplicado')).toBeOnTheScreen();
    expect(screen.queryByText('aplicar')).toBeNull();

    await usuario.press(screen.getByRole('button', { name: /Desfazer/ }));
    await usuario.press(screen.getByRole('button', { name: 'ver dieta' }));

    expect(acoes.onDesfazer).toHaveBeenCalledTimes(1);
    expect(router.push).toHaveBeenCalledWith('/dieta');
  });

  it('descartado: só o aviso, sem botões', async () => {
    await montar(recusarProposta(PENDENTE));

    expect(screen.getByText('descartado')).toBeOnTheScreen();
    expect(screen.queryAllByRole('button')).toHaveLength(0);
  });
});
