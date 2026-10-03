import { render, screen, userEvent } from '@testing-library/react-native';

import { chaveDoDia } from '@/shared/lib/data';

import { GraficoPeso } from '../components/GraficoPeso';
import { somarDias } from '../logica';

const HOJE = chaveDoDia(new Date());
const REGISTROS = [
  { data: somarDias(HOJE, -60), kg: 80 },
  { data: somarDias(HOJE, -10), kg: 78 },
  { data: HOJE, kg: 77.5 },
];

describe('<GraficoPeso />', () => {
  it('resume o gráfico em texto e troca o período', async () => {
    const usuario = userEvent.setup();

    await render(<GraficoPeso registros={REGISTROS} />);

    expect(screen.getByRole('image').props.accessibilityLabel).toContain(
      'últimos 30 dias: 2 registros',
    );

    await usuario.press(screen.getByRole('radio', { name: 'Últimos 90 dias' }));

    expect(screen.getByRole('image').props.accessibilityLabel).toContain(
      'últimos 90 dias: 3 registros',
    );
  });

  it('avisa quando não há registros no período', async () => {
    await render(<GraficoPeso registros={[]} />);

    expect(screen.getByText('Sem registros neste período.')).toBeOnTheScreen();
  });
});
