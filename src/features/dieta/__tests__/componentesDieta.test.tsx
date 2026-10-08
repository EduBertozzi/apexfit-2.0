import { render, screen, userEvent } from '@testing-library/react-native';
import { StyleSheet } from 'react-native';

import { PlanoDietaDetalhe } from '../components/PlanoDietaDetalhe';
import { SeletorDias } from '../components/SeletorDias';
import type { PlanoDieta } from '../contrato';
import { diasDoSeletor } from '../semana';

const PLANO: PlanoDieta = {
  resumo: '**Plano** de manutenção.',
  caloriasDia: 2000,
  macros: { proteinaG: 120, carboidratoG: 260, gorduraG: 60 },
  refeicoes: [
    {
      nome: '### Almoço',
      horario: '12:00',
      calorias: 700,
      itens: [
        {
          alimento: '**Arroz branco cozido com cenoura ralada e ervilha fresca**',
          quantidade: '250 g, cerca de 1 xícara e meia bem cheia de arroz',
        },
        { alimento: 'Feijão carioca', quantidade: 'a gosto, sem exagerar no caldo' },
      ],
      substituicoes: ['Arroz por batata-doce cozida (300 g)', 'Feijão por lentilha'],
    },
  ],
  dicas: ['- Beba água'],
  aviso: 'Consulte um nutricionista.',
};

describe('PlanoDietaDetalhe', () => {
  it('mostra o texto sem markdown e com a capitalização da IA', async () => {
    await render(<PlanoDietaDetalhe plano={PLANO} />);

    expect(screen.getByText('Plano de manutenção.')).toBeOnTheScreen();
    expect(screen.getByText('Almoço')).toBeOnTheScreen();
    expect(screen.getByText('Beba água')).toBeOnTheScreen();
    expect(screen.queryByText(/\*\*|###/)).toBeNull();
  });

  it('separa a medida curta (direita) da medida caseira (embaixo do nome)', async () => {
    await render(<PlanoDietaDetalhe plano={PLANO} />);

    expect(
      screen.getByText('Arroz branco cozido com cenoura ralada e ervilha fresca'),
    ).toBeOnTheScreen();
    expect(screen.getByText('250 g')).toBeOnTheScreen();
    expect(screen.getByText('cerca de 1 xícara e meia bem cheia de arroz')).toBeOnTheScreen();
    // Sem número: a quantidade inteira vai embaixo do nome
    expect(screen.getByText('a gosto, sem exagerar no caldo')).toBeOnTheScreen();
  });

  it('o nome do alimento nunca fica com largura zero e a medida não estica', async () => {
    await render(<PlanoDietaDetalhe plano={PLANO} />);

    const medida = StyleSheet.flatten(screen.getByText('250 g').props.style);
    expect(medida.flexShrink).toBe(0);
    expect(medida.maxWidth).toBe('40%');
  });

  it('as trocas aparecem uma por linha', async () => {
    await render(<PlanoDietaDetalhe plano={PLANO} />);

    expect(screen.getByText('pode trocar')).toBeOnTheScreen();
    expect(screen.getByText('Arroz por batata-doce cozida (300 g)')).toBeOnTheScreen();
    expect(screen.getByText('Feijão por lentilha')).toBeOnTheScreen();
  });
});

describe('SeletorDias', () => {
  it('mostra os 7 dias, marca hoje e troca o dia', async () => {
    const aoEscolher = jest.fn();
    const dias = diasDoSeletor({ plano: PLANO, porDia: { 5: PLANO } }, 3);

    await render(<SeletorDias dias={dias} selecionado={3} onSelecionar={aoEscolher} />);

    expect(screen.getAllByRole('tab')).toHaveLength(7);
    expect(screen.getByText('hoje')).toBeOnTheScreen();
    expect(screen.getByLabelText('quarta, hoje')).toBeSelected();
    expect(screen.getByLabelText('sexta, plano só deste dia')).toBeOnTheScreen();

    await userEvent.setup().press(screen.getByLabelText('sexta, plano só deste dia'));

    expect(aoEscolher).toHaveBeenCalledWith(5);
  });
});
