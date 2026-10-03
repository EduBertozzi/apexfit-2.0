import { render, screen, userEvent, waitFor } from '@testing-library/react-native';

import { OnboardingEtapas } from '../components/OnboardingEtapas';

async function renderizar() {
  const onSalvar = jest.fn();
  const usuario = userEvent.setup();

  await render(<OnboardingEtapas onSalvar={onSalvar} />);

  const tocar = (nome: string) => usuario.press(screen.getByRole('button', { name: nome }));

  return { onSalvar, usuario, tocar };
}

describe('<OnboardingEtapas />', () => {
  it('começa nas boas-vindas e vai para a primeira pergunta', async () => {
    const { tocar } = await renderizar();

    await tocar('Começar');

    expect(screen.getByText('Etapa 1 de 6')).toBeOnTheScreen();
    expect(screen.getByText('Como quer ser chamado?')).toBeOnTheScreen();
  });

  it('não avança com a etapa inválida e mostra o erro', async () => {
    const { tocar } = await renderizar();

    await tocar('Começar');
    await tocar('Continuar');

    expect(await screen.findByText('Informe seu nome')).toBeOnTheScreen();
    expect(screen.getByText('Etapa 1 de 6')).toBeOnTheScreen();
  });

  it('volta para a etapa anterior mantendo o que foi digitado', async () => {
    const { usuario, tocar } = await renderizar();

    await tocar('Começar');
    await usuario.type(screen.getByLabelText('Nome'), 'Luiz');
    await tocar('Continuar');
    expect(await screen.findByText('Etapa 2 de 6')).toBeOnTheScreen();

    await tocar('Voltar');

    expect(screen.getByText('Etapa 1 de 6')).toBeOnTheScreen();
    expect(screen.getByLabelText('Nome')).toHaveDisplayValue('Luiz');
  });

  it('percorre todas as etapas e salva o perfil completo', async () => {
    const { onSalvar, usuario, tocar } = await renderizar();

    await tocar('Começar');
    await usuario.type(screen.getByLabelText('Nome'), 'Luiz');
    await tocar('Continuar');

    await usuario.type(await screen.findByLabelText('Idade'), '17');
    await usuario.press(screen.getByRole('radio', { name: 'Masculino' }));
    await tocar('Continuar');

    await usuario.type(await screen.findByLabelText('Altura'), '175');
    await usuario.type(screen.getByLabelText('Peso'), '70,5');
    await tocar('Continuar');

    await usuario.press(await screen.findByRole('radio', { name: 'Moderado' }));
    await tocar('Continuar');

    await usuario.press(await screen.findByRole('radio', { name: 'Ganhar massa' }));
    await tocar('Continuar');

    expect(await screen.findByText('Etapa 6 de 6')).toBeOnTheScreen();
    await tocar('Criar meu perfil');

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
});
