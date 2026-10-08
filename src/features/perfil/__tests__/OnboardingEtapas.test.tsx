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

    await tocar('começar');

    expect(screen.getByText('etapa 1 de 6')).toBeOnTheScreen();
    expect(screen.getByText('como quer ser chamado?')).toBeOnTheScreen();
  });

  it('não avança com a etapa inválida e mostra o erro', async () => {
    const { tocar } = await renderizar();

    await tocar('começar');
    await tocar('continuar');

    expect(await screen.findByText('informe seu nome')).toBeOnTheScreen();
    expect(screen.getByText('etapa 1 de 6')).toBeOnTheScreen();
  });

  it('volta para a etapa anterior mantendo o que foi digitado', async () => {
    const { usuario, tocar } = await renderizar();

    await tocar('começar');
    await usuario.type(screen.getByLabelText('nome'), 'Luiz');
    await tocar('continuar');
    expect(await screen.findByText('etapa 2 de 6')).toBeOnTheScreen();

    await tocar('voltar');

    expect(screen.getByText('etapa 1 de 6')).toBeOnTheScreen();
    expect(screen.getByLabelText('nome')).toHaveDisplayValue('Luiz');
  });

  it('percorre todas as etapas e salva o perfil completo', async () => {
    const { onSalvar, usuario, tocar } = await renderizar();

    await tocar('começar');
    await usuario.type(screen.getByLabelText('nome'), 'Luiz');
    await tocar('continuar');

    await usuario.type(await screen.findByLabelText('idade'), '17');
    await usuario.press(screen.getByRole('radio', { name: 'masculino' }));
    await tocar('continuar');

    await usuario.type(await screen.findByLabelText('altura'), '175');
    await usuario.type(screen.getByLabelText('peso'), '70,5');
    await tocar('continuar');

    await usuario.press(await screen.findByRole('radio', { name: 'moderado' }));
    await tocar('continuar');

    await usuario.press(await screen.findByRole('radio', { name: 'ganhar massa' }));
    await tocar('continuar');

    expect(await screen.findByText('etapa 6 de 6')).toBeOnTheScreen();
    await tocar('criar meu perfil');

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
