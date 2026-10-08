import { render, screen, userEvent, waitFor } from '@testing-library/react-native';

import { FormularioPerfil } from '../components/FormularioPerfil';

// Simula um usuário de verdade digitando e tocando nos botões
async function renderizar() {
  const onSalvar = jest.fn();
  const usuario = userEvent.setup();

  await render(<FormularioPerfil textoBotao="Começar" onSalvar={onSalvar} />);

  const botaoComecar = () => screen.getByRole('button', { name: 'Começar' });

  return { onSalvar, usuario, botaoComecar };
}

describe('<FormularioPerfil />', () => {
  it('mostra o erro embaixo de cada campo e não salva quando está vazio', async () => {
    const { onSalvar, usuario, botaoComecar } = await renderizar();

    await usuario.press(botaoComecar());

    expect(await screen.findByText('informe seu nome')).toBeOnTheScreen();
    expect(screen.getByText('informe sua idade')).toBeOnTheScreen();
    expect(screen.getByText('informe sua altura')).toBeOnTheScreen();
    expect(screen.getByText('informe seu peso')).toBeOnTheScreen();
    expect(screen.getByText('escolha uma opção')).toBeOnTheScreen();
    expect(screen.getByText('escolha seu nível de atividade')).toBeOnTheScreen();
    expect(screen.getByText('escolha seu objetivo')).toBeOnTheScreen();
    expect(onSalvar).not.toHaveBeenCalled();
  });

  it('salva o perfil convertido quando tudo está certo', async () => {
    const { onSalvar, usuario, botaoComecar } = await renderizar();

    await usuario.type(screen.getByLabelText('nome'), 'Luiz');
    await usuario.type(screen.getByLabelText('idade'), '17');
    await usuario.type(screen.getByLabelText('altura'), '175');
    await usuario.type(screen.getByLabelText('peso'), '70,5');
    await usuario.press(screen.getByRole('radio', { name: 'masculino' }));
    await usuario.press(screen.getByRole('radio', { name: 'moderado' }));
    await usuario.press(screen.getByRole('radio', { name: 'ganhar massa' }));
    await usuario.press(botaoComecar());

    await waitFor(() => expect(onSalvar).toHaveBeenCalledTimes(1));

    expect(onSalvar.mock.calls[0][0]).toEqual({
      nome: 'Luiz',
      idade: 17,
      alturaCm: 175,
      pesoKg: 70.5,
      percentualGordura: undefined,
      restricoes: undefined,
      sexo: 'masculino',
      nivelAtividade: 'moderado',
      objetivo: 'ganhar',
    });
  });

  it('avisa quando a altura é digitada em metros', async () => {
    const { usuario, botaoComecar } = await renderizar();

    await usuario.type(screen.getByLabelText('altura'), '1,75');
    await usuario.press(botaoComecar());

    expect(await screen.findByText('deve estar entre 100 e 250 cm')).toBeOnTheScreen();
  });
});
