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
    expect(screen.getByRole('button', { name: 'segunda, peito e braço (tríceps)' })).toBeTruthy();
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
