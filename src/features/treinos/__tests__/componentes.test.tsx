import { render, screen, userEvent, waitFor } from '@testing-library/react-native';

import { CartaoGrupo } from '../components/CartaoGrupo';
import { ChecklistSessao } from '../components/ChecklistSessao';
import { FaixaSemana } from '../components/FaixaSemana';
import { FormularioExercicio } from '../components/FormularioExercicio';
import { agruparPorGrupo } from '../grupos';
import { diasDaSemana, resumoDaSemana } from '../semana';
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

    await usuario.type(screen.getByLabelText('exercício'), 'Supino reto');
    await usuario.clear(screen.getByLabelText('repetições'));
    await usuario.type(screen.getByLabelText('repetições'), '8-12');
    await usuario.type(screen.getByLabelText('carga'), '22,5');
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

describe('<FormularioExercicio /> grupo', () => {
  it('escolher o grupo salva junto com o exercício', async () => {
    const onSalvar = jest.fn();
    const usuario = userEvent.setup();

    await render(
      <FormularioExercicio textoBotao="adicionar" onSalvar={onSalvar} onCancelar={jest.fn()} />,
    );

    await usuario.type(screen.getByLabelText('exercício'), 'Remada alta');
    await usuario.press(screen.getByRole('radio', { name: 'braço' }));
    await usuario.press(screen.getByRole('button', { name: 'adicionar' }));

    await waitFor(() => expect(onSalvar).toHaveBeenCalledTimes(1));
    expect(onSalvar.mock.calls[0][0].grupo).toBe('braco');
  });
});

describe('<CartaoGrupo />', () => {
  it('é um botão com a frase completa e mostra o esquema', async () => {
    const onPress = jest.fn();
    const usuario = userEvent.setup();
    const [bloco] = agruparPorGrupo([
      { id: 'r', nome: 'Remada alta', grupo: 'braco', series: 3, repeticoes: '12' },
    ]);

    await render(<CartaoGrupo bloco={bloco} concluidos={[]} onPress={onPress} />);

    const cartao = screen.getByRole('button', { name: 'braço, 3 séries de 12, remada alta' });

    expect(screen.getByText('3x12')).toBeOnTheScreen();

    await usuario.press(cartao);

    expect(onPress).toHaveBeenCalled();
  });
});

describe('<CartaoGrupo /> feito', () => {
  it('risca o feito e troca a seta pelo check quando o grupo inteiro está feito', async () => {
    const [bloco] = agruparPorGrupo([
      { id: 'a', nome: 'Polichinelo', grupo: 'aquecimento', series: 2, repeticoes: '10' },
      { id: 'b', nome: 'Swing', grupo: 'aquecimento', series: 2, repeticoes: '10' },
    ]);

    const { rerender } = await render(
      <CartaoGrupo bloco={bloco} concluidos={['a']} onPress={jest.fn()} inteiro />,
    );

    expect(screen.getByText('polichinelo')).toHaveStyle({ textDecorationLine: 'line-through' });
    expect(screen.getByText('swing')).not.toHaveStyle({ textDecorationLine: 'line-through' });
    expect(
      screen.getByRole('button', {
        name: 'aquecimento, 2 séries de 10, polichinelo feito e swing',
      }),
    ).not.toHaveStyle({ opacity: 0.6 });

    await rerender(
      <CartaoGrupo bloco={bloco} concluidos={['a', 'b']} onPress={jest.fn()} inteiro />,
    );

    expect(screen.getByRole('button', { name: /tudo feito$/ })).toHaveStyle({ opacity: 0.6 });
  });
});

describe('<FaixaSemana />', () => {
  it('mostra os 7 dias e um resumo para o leitor de tela', async () => {
    const dias = diasDaSemana([], [], '2026-10-07');
    const resumo = resumoDaSemana(dias);

    await render(<FaixaSemana dias={dias} resumo={resumo} />);

    expect(screen.getByLabelText(resumo)).toBeOnTheScreen();
    expect(screen.getByText('qua')).toBeOnTheScreen();
    expect(screen.getByTestId('dia-2026-10-10')).toBeOnTheScreen();
  });

  it('tocar num dia mostra o resumo dele', async () => {
    const usuario = userEvent.setup();
    const dias = diasDaSemana([], [], '2026-10-07');

    await render(<FaixaSemana dias={dias} resumo={resumoDaSemana(dias)} />);

    // Hoje já tem resumo embaixo do título da tela; a faixa só mostra o dia tocado
    expect(screen.queryByText('hoje: ainda sem treino')).toBeNull();
    expect(screen.getByText('completo')).toBeOnTheScreen();

    await usuario.press(screen.getByRole('button', { name: 'segunda, 5, sem treino' }));

    expect(screen.getByText('segunda: descanso')).toBeOnTheScreen();
  });

  it('cards longos cortam a lista e mostram quantos faltam', async () => {
    const blocos = agruparPorGrupo(
      ['Supino reto', 'Supino inclinado', 'Crucifixo', 'Crossover', 'Peck deck'].map(
        (nome, indice) => ({
          id: String(indice),
          nome,
          grupo: 'peito' as const,
          series: 3,
          repeticoes: '12',
        }),
      ),
    );

    await render(<CartaoGrupo bloco={blocos[0]} concluidos={[]} onPress={jest.fn()} />);

    expect(screen.getByText('supino reto')).toBeOnTheScreen();
    expect(screen.queryByText('crossover')).toBeNull();
    expect(screen.getByText('+3 exercícios')).toBeOnTheScreen();
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
    const finalizar = () => screen.getByRole('button', { name: /finalizar/i });

    expect(item).not.toBeChecked();
    expect(finalizar()).toBeDisabled();

    await usuario.press(item);

    expect(screen.getByRole('checkbox', { name: /Supino/ })).toBeChecked();
    expect(finalizar()).toBeEnabled();

    await usuario.press(finalizar());

    expect(useTreinosStore.getState().sessoes[0].finalizada).toBe(true);
  });
});
