import { fireEvent, render, screen, userEvent } from '@testing-library/react-native';

import { MontadorSemana } from '../components/MontadorSemana';
import { ESCOLHAS_PADRAO } from '../montadorIa';
import { useTreinosIaStore } from '../storeIa';

beforeEach(() => {
  useTreinosIaStore.setState({ escolhas: ESCOLHAS_PADRAO, erro: null, gerando: false });
});

describe('<MontadorSemana />', () => {
  it('mostra os dias marcados e as áreas do dia aberto', async () => {
    await render(<MontadorSemana />);

    expect(screen.getByRole('checkbox', { name: 'segunda' })).toBeChecked();
    expect(screen.getByRole('checkbox', { name: 'terça' })).not.toBeChecked();
    expect(
      screen.getByRole('button', { name: 'segunda, peito e braço (tríceps), 5 exercícios' }),
    ).toBeTruthy();
    expect(screen.getByRole('button', { name: 'peito na segunda' })).toBeSelected();
    expect(screen.getByRole('checkbox', { name: 'braço, tríceps' })).toBeChecked();
  });

  it('marcar um dia abre ele; escolher área e região muda a store', async () => {
    const usuario = userEvent.setup();
    await render(<MontadorSemana />);

    await usuario.press(screen.getByRole('checkbox', { name: 'sábado' }));
    await usuario.press(screen.getByRole('button', { name: 'perna na sábado' }));
    await usuario.press(screen.getByRole('checkbox', { name: 'perna, glúteo' }));

    const sabado = useTreinosIaStore.getState().escolhas.dias.find((dia) => dia.dia === 6);
    expect(sabado?.areas).toEqual([{ area: 'perna', regioes: ['gluteo'] }]);
  });

  it('copiar de outro dia', async () => {
    const usuario = userEvent.setup();
    await render(<MontadorSemana />);

    await usuario.press(screen.getByRole('checkbox', { name: 'domingo' }));
    await usuario.press(screen.getByRole('button', { name: 'copiar o treino de quarta' }));

    const domingo = useTreinosIaStore.getState().escolhas.dias.find((dia) => dia.dia === 0);
    expect(domingo?.areas).toEqual([{ area: 'perna', regioes: [] }]);
  });

  it('contador de exercícios do dia: mais, menos e voltar ao padrão', async () => {
    const usuario = userEvent.setup();
    await render(<MontadorSemana />);

    const contador = screen.getByRole('adjustable', { name: '5 exercícios na segunda' });
    expect(contador).toHaveAccessibilityValue({ text: 'padrão do nível iniciante' });
    expect(screen.getByText('padrão do nível iniciante, sem contar o aquecimento')).toBeTruthy();

    await usuario.press(screen.getByRole('button', { name: 'mais um exercício na segunda' }));
    await usuario.press(screen.getByRole('button', { name: 'mais um exercício na segunda' }));

    expect(useTreinosIaStore.getState().escolhas.dias[0].exercicios).toBe(7);
    expect(screen.getByTestId('exercicios-1-valor')).toHaveTextContent('7');
    expect(
      screen.getByRole('button', { name: 'segunda, peito e braço (tríceps), 7 exercícios' }),
    ).toBeTruthy();
    expect(screen.getByText('peito e braço (tríceps) · 7 exercícios')).toBeTruthy();

    await usuario.press(screen.getByRole('button', { name: 'menos um exercício na segunda' }));
    expect(useTreinosIaStore.getState().escolhas.dias[0].exercicios).toBe(6);

    await usuario.press(
      screen.getByRole('button', { name: 'voltar ao padrão do nível na segunda' }),
    );
    expect(useTreinosIaStore.getState().escolhas.dias[0]).not.toHaveProperty('exercicios');
    expect(
      screen.queryByRole('button', { name: 'voltar ao padrão do nível na segunda' }),
    ).toBeNull();
  });

  it('no mínimo o menos fica desligado', async () => {
    useTreinosIaStore.setState({
      escolhas: {
        ...ESCOLHAS_PADRAO,
        dias: [{ ...ESCOLHAS_PADRAO.dias[0], exercicios: 2 }],
      },
    });
    await render(<MontadorSemana />);

    expect(screen.getByRole('button', { name: 'menos um exercício na segunda' })).toBeDisabled();
  });

  it('cardio: troca para circuito e ajusta voltas e segundos', async () => {
    const usuario = userEvent.setup();
    await render(<MontadorSemana />);

    await usuario.press(screen.getByRole('button', { name: 'cardio na segunda' }));
    expect(screen.getByRole('button', { name: 'cardio contínuo na segunda' })).toBeSelected();
    expect(screen.queryByRole('adjustable', { name: '3 voltas na segunda' })).toBeNull();

    await usuario.press(screen.getByRole('button', { name: 'cardio em circuito na segunda' }));
    expect(screen.getByRole('adjustable', { name: '3 voltas na segunda' })).toBeTruthy();

    await usuario.press(screen.getByRole('button', { name: 'aumentar voltas na segunda' }));
    await usuario.press(
      screen.getByRole('button', { name: 'diminuir segundos por exercício na segunda' }),
    );

    expect(useTreinosIaStore.getState().escolhas.dias[0].circuito).toEqual({
      exercicios: 4,
      segundos: 30,
      voltas: 4,
    });
    expect(screen.getByTestId('circuito-1-segundos-valor')).toHaveTextContent('30 s');
  });

  it('aquecimento: troca para tempo e desliga', async () => {
    const usuario = userEvent.setup();
    await render(<MontadorSemana />);

    await usuario.press(screen.getByRole('button', { name: 'polichinelo por tempo' }));
    expect(useTreinosIaStore.getState().escolhas.aquecimento.itens[0].medida).toBe('tempo');

    await usuario.press(screen.getByRole('button', { name: 'aquecimento: bike leve' }));
    expect(screen.getByText('sempre por tempo: 5 minutos')).toBeTruthy();

    await fireEvent(screen.getByRole('switch', { name: 'aquecimento' }), 'valueChange', false);
    expect(useTreinosIaStore.getState().escolhas.aquecimento.ativo).toBe(false);
    expect(screen.queryByText('escolha um ou mais')).toBeNull();
  });
});
