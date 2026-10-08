import { render, screen, userEvent, waitFor } from '@testing-library/react-native';

import { CartaoGrupo } from '../components/CartaoGrupo';
import { ChecklistSessao } from '../components/ChecklistSessao';
import { FaixaSemana } from '../components/FaixaSemana';
import { FormularioExercicio } from '../components/FormularioExercicio';
import { agruparPorGrupo } from '../grupos';
import { diasDaFaixa, diasDaSemana, resumoDaSemana } from '../semana';
import { useTreinosStore } from '../store';

describe('<FormularioExercicio />', () => {
  it('mostra o erro e não salva sem nome', async () => {
    const onSalvar = jest.fn();
    const usuario = userEvent.setup();

    await render(
      <FormularioExercicio textoBotao="Adicionar" onSalvar={onSalvar} onCancelar={jest.fn()} />,
    );

    await usuario.press(screen.getByRole('button', { name: 'Adicionar' }));

    expect(await screen.findByText('informe o nome do exercício')).toBeOnTheScreen();
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
  const [bloco] = agruparPorGrupo([
    { id: 'r', nome: 'Remada alta', grupo: 'braco', series: 3, repeticoes: '12' },
    { id: 'a', nome: 'Agachamento', grupo: 'braco', series: 3, repeticoes: '12' },
  ]);

  it('o título é uma frase só e a seta redonda abre o treino', async () => {
    const onAbrir = jest.fn();
    const usuario = userEvent.setup();

    await render(
      <CartaoGrupo bloco={bloco} concluidos={[]} onAbrir={onAbrir} onAlternar={jest.fn()} />,
    );

    expect(screen.getByLabelText('braço, 3 séries de 12, 0 de 2 feitos')).toBeOnTheScreen();
    expect(screen.getByText('3x12')).toBeOnTheScreen();

    await usuario.press(screen.getByRole('button', { name: 'abrir o treino de hoje, braço' }));

    expect(onAbrir).toHaveBeenCalled();
  });

  it('cada exercício é uma caixa de marcar que marca direto da tela inicial', async () => {
    const onAlternar = jest.fn();
    const usuario = userEvent.setup();

    await render(
      <CartaoGrupo bloco={bloco} concluidos={['r']} onAbrir={jest.fn()} onAlternar={onAlternar} />,
    );

    const feito = screen.getByRole('checkbox', { name: 'remada alta, feito' });
    const pendente = screen.getByRole('checkbox', { name: 'agachamento, marcar como feito' });

    expect(feito).toBeChecked();
    expect(pendente).not.toBeChecked();

    await usuario.press(pendente);

    expect(onAlternar).toHaveBeenCalledWith('a');
  });

  it('com o treino finalizado, os exercícios ficam só para ver', async () => {
    const onAlternar = jest.fn();

    await render(
      <CartaoGrupo
        bloco={bloco}
        concluidos={['r']}
        onAbrir={jest.fn()}
        onAlternar={onAlternar}
        podeMarcar={false}
      />,
    );

    expect(screen.getByRole('checkbox', { name: 'agachamento, não feito' })).toBeDisabled();
  });
});

describe('<CartaoGrupo /> feito', () => {
  it('risca o feito e apaga o card quando o grupo inteiro está feito', async () => {
    const [aquecimento] = agruparPorGrupo([
      { id: 'a', nome: 'Polichinelo', grupo: 'aquecimento', series: 2, repeticoes: '10' },
      { id: 'b', nome: 'Swing', grupo: 'aquecimento', series: 2, repeticoes: '10' },
    ]);
    const props = { bloco: aquecimento, onAbrir: jest.fn(), onAlternar: jest.fn(), inteiro: true };

    const { rerender } = await render(<CartaoGrupo {...props} concluidos={['a']} />);

    expect(screen.getByText('polichinelo')).toHaveStyle({ textDecorationLine: 'line-through' });
    expect(screen.getByText('swing')).not.toHaveStyle({ textDecorationLine: 'line-through' });
    expect(screen.getByTestId('grupo-aquecimento')).not.toHaveStyle({ opacity: 0.6 });

    await rerender(<CartaoGrupo {...props} concluidos={['a', 'b']} />);

    expect(screen.getByLabelText(/tudo feito$/)).toBeOnTheScreen();
    expect(screen.getByTestId('grupo-aquecimento')).toHaveStyle({ opacity: 0.6 });
  });
});

describe('<FaixaSemana />', () => {
  const HOJE = '2026-10-07';

  it('mostra as 3 semanas e um resumo para o leitor de tela', async () => {
    const dias = diasDaFaixa([], [], HOJE);
    const resumo = resumoDaSemana(diasDaSemana([], [], HOJE));

    await render(
      <FaixaSemana dias={dias} resumo={resumo} selecionado={HOJE} onSelecionar={jest.fn()} />,
    );

    expect(dias).toHaveLength(21);
    expect(screen.getByLabelText(resumo)).toBeOnTheScreen();
    expect(screen.getByTestId('dia-2026-09-27')).toBeOnTheScreen(); // domingo da semana passada
    expect(screen.getByTestId('dia-2026-10-17')).toBeOnTheScreen(); // sábado da próxima
  });

  it('pílulas largas de tamanho fixo: a faixa rola em vez de espremer', async () => {
    const dias = diasDaFaixa([], [], HOJE);

    await render(<FaixaSemana dias={dias} resumo="" selecionado={HOJE} onSelecionar={jest.fn()} />);

    expect(screen.getByTestId(`dia-${HOJE}`)).toHaveStyle({ width: 62 });
  });

  it('tocar num dia escolhe esse dia', async () => {
    const usuario = userEvent.setup();
    const onSelecionar = jest.fn();
    // Domingo marcado no plano e não treinado: vermelho; os outros dias sem nada ficam neutros
    const dias = diasDaFaixa(
      [{ id: 't', nome: 'treino A', exercicios: [], dias: [0] }],
      [],
      HOJE,
      0,
      0,
    );

    await render(
      <FaixaSemana dias={dias} resumo="" selecionado={HOJE} onSelecionar={onSelecionar} />,
    );

    expect(screen.getByText('completo')).toBeOnTheScreen();
    expect(screen.getByText('pouco ou nada')).toBeOnTheScreen();

    await usuario.press(screen.getByRole('button', { name: 'segunda, 5, dia de descanso' }));

    expect(onSelecionar).toHaveBeenCalledWith('2026-10-05');
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
