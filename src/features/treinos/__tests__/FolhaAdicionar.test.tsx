import { render, screen, userEvent } from '@testing-library/react-native';
import { SafeAreaProvider } from 'react-native-safe-area-context';

import { FolhaAdicionar } from '../components/FolhaAdicionar';
import type { Treino } from '../types';

const METRICAS = {
  frame: { x: 0, y: 0, width: 390, height: 844 },
  insets: { top: 0, left: 0, right: 0, bottom: 0 },
};

const TREINO: Treino = {
  id: 't1',
  nome: 'Treino A',
  exercicios: [{ id: 'e1', nome: 'Rosca direta', grupo: 'braco', series: 3, repeticoes: '12' }],
};

async function abrir(props: Partial<Parameters<typeof FolhaAdicionar>[0]> = {}) {
  const onSalvar = jest.fn();

  await render(
    <SafeAreaProvider initialMetrics={METRICAS}>
      <FolhaAdicionar
        treino={TREINO}
        treinos={[TREINO]}
        onSalvar={onSalvar}
        onCancelar={jest.fn()}
        {...props}
      />
    </SafeAreaProvider>,
  );

  return onSalvar;
}

describe('<FolhaAdicionar />', () => {
  it('já vem com 3 sugestões do grupo do treino, sem repetir o que tem', async () => {
    await abrir();

    const marcados = screen
      .getAllByRole('checkbox')
      .filter((item) => item.props.accessibilityState?.checked);

    expect(marcados).toHaveLength(3);
    expect(screen.queryByRole('checkbox', { name: /^Rosca direta/ })).toBeNull();
    expect(screen.getByRole('button', { name: 'adicionar 3 exercícios' })).toBeEnabled();
  });

  it('desmarcar muda a contagem e salvar manda os marcados com séries e repetições', async () => {
    const usuario = userEvent.setup();
    const onSalvar = await abrir();

    await usuario.press(screen.getByTestId('regiao-triceps'));
    await usuario.press(screen.getByRole('checkbox', { name: /^Tríceps corda/ }));
    await usuario.press(screen.getByTestId('series-mais'));
    await usuario.press(screen.getByRole('button', { name: 'adicionar 2 exercícios' }));

    expect(onSalvar).toHaveBeenCalledWith({
      exercicios: [
        { nome: 'Tríceps pulley', grupo: 'braco', series: 4, repeticoes: '12' },
        { nome: 'Tríceps testa', grupo: 'braco', series: 4, repeticoes: '12' },
      ],
      dias: undefined,
    });
  });

  it('plano semanal: marcar um dia libera "salvar dias"', async () => {
    const usuario = userEvent.setup();
    const onSalvar = await abrir({ aba: 'plano' });

    expect(screen.getByRole('button', { name: 'salvar dias' })).toBeDisabled();

    await usuario.press(screen.getByRole('checkbox', { name: 'segunda' }));
    await usuario.press(screen.getByRole('button', { name: 'salvar dias' }));

    expect(onSalvar).toHaveBeenCalledWith({ exercicios: [], dias: [1] });
  });

  it('cardio salva em minutos', async () => {
    const usuario = userEvent.setup();
    const onSalvar = await abrir({ aba: 'cardio' });

    await usuario.press(screen.getByRole('checkbox', { name: /^Esteira/ }));
    await usuario.press(screen.getByTestId('minutos-mais'));
    await usuario.press(screen.getByRole('button', { name: 'adicionar 1 exercício' }));

    expect(onSalvar).toHaveBeenCalledWith({
      exercicios: [{ nome: 'Esteira', grupo: 'cardio', series: 1, repeticoes: '15 min' }],
      dias: undefined,
    });
  });
});
