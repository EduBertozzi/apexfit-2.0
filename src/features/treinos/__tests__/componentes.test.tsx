import { render, screen, userEvent, waitFor } from '@testing-library/react-native';

import { ChecklistSessao } from '../components/ChecklistSessao';
import { FormularioExercicio } from '../components/FormularioExercicio';
import { useTreinosStore } from '../store';

describe('<FormularioExercicio />', () => {
  it('mostra o erro e não salva sem nome', async () => {
    const onSalvar = jest.fn();
    const usuario = userEvent.setup();

    await render(
      <FormularioExercicio textoBotao="Adicionar" onSalvar={onSalvar} onCancelar={jest.fn()} />,
    );

    await usuario.press(screen.getByRole('button', { name: 'Adicionar' }));

    expect(await screen.findByText('Informe o nome do exercício')).toBeOnTheScreen();
    expect(onSalvar).not.toHaveBeenCalled();
  });

  it('salva convertido, com carga em vírgula e faixa de repetições', async () => {
    const onSalvar = jest.fn();
    const usuario = userEvent.setup();

    await render(
      <FormularioExercicio textoBotao="Adicionar" onSalvar={onSalvar} onCancelar={jest.fn()} />,
    );

    await usuario.type(screen.getByLabelText('Exercício'), 'Supino reto');
    await usuario.clear(screen.getByLabelText('Repetições'));
    await usuario.type(screen.getByLabelText('Repetições'), '8-12');
    await usuario.type(screen.getByLabelText('Carga'), '22,5');
    await usuario.press(screen.getByRole('button', { name: 'Adicionar' }));

    await waitFor(() => expect(onSalvar).toHaveBeenCalledTimes(1));

    expect(onSalvar.mock.calls[0][0]).toEqual({
      nome: 'Supino reto',
      series: 3,
      repeticoes: '8 a 12',
      cargaKg: 22.5,
      observacao: undefined,
    });
  });
});

describe('<ChecklistSessao />', () => {
  beforeEach(() => {
    useTreinosStore.setState({ treinos: [], sessoes: [] });
  });

  function preparar() {
    const id = useTreinosStore.getState().novoTreino();
    useTreinosStore.getState().adicionarExercicio(id, {
      nome: 'Supino',
      series: 3,
      repeticoes: '10',
      cargaKg: 40,
    });
    useTreinosStore.getState().comecarTreino(id);
  }

  function Tela() {
    const treino = useTreinosStore((state) => state.treinos[0]);
    const sessao = useTreinosStore((state) => state.sessoes[0]);

    return <ChecklistSessao treino={treino} sessao={sessao} />;
  }

  it('marca o exercício como checkbox e libera o finalizar', async () => {
    preparar();
    const usuario = userEvent.setup();

    await render(<Tela />);

    const item = screen.getByRole('checkbox', { name: /Supino/ });
    const finalizar = () => screen.getByRole('button', { name: /Finalizar/ });

    expect(item).not.toBeChecked();
    expect(finalizar()).toBeDisabled();

    await usuario.press(item);

    expect(screen.getByRole('checkbox', { name: /Supino/ })).toBeChecked();
    expect(finalizar()).toBeEnabled();

    await usuario.press(finalizar());

    expect(useTreinosStore.getState().sessoes[0].finalizada).toBe(true);
  });
});
