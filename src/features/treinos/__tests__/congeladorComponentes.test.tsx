import { act, render, screen, userEvent, waitFor } from '@testing-library/react-native';

import { agendarAvisoUnico, cancelarAviso, podeNotificar } from '@/features/lembretes/notificacoes';

import { AvisoUltimaChance } from '../components/AvisoUltimaChance';
import { CalendarioSequencia } from '../components/CalendarioSequencia';
import { CartaoCongelador } from '../components/CartaoCongelador';
import { FaixaSemana } from '../components/FaixaSemana';
import { calcularSequencia } from '../regraSequencia';
import { diasDaFaixa, somarDias } from '../semana';
import { useTreinosStore } from '../store';
import type { Sessao, Treino } from '../types';
import { ID_AVISO_ULTIMA_CHANCE } from '../ultimaChance';

jest.mock('@/features/lembretes/notificacoes', () => ({
  podeNotificar: jest.fn(async () => true),
  agendarAvisoUnico: jest.fn(async () => {}),
  cancelarAviso: jest.fn(async () => {}),
}));

// Quarta, 7 de outubro de 2026, de manhã
const HOJE = '2026-10-07';
const MANHA = new Date(2026, 9, 7, 9, 0);
const IDS = ['e1', 'e2'];
const TREINO: Treino = {
  id: 't',
  nome: 'Treino A',
  exercicios: IDS.map((id) => ({ id, nome: id, series: 3, repeticoes: '10' })),
};

function sessao(data: string, feitos = 2): Sessao {
  return {
    id: `s-${data}`,
    treinoId: 't',
    data,
    concluidos: IDS.slice(0, feitos),
    finalizada: true,
  };
}

beforeEach(() => {
  jest.clearAllMocks();
  jest.useFakeTimers({ now: MANHA });
});

afterEach(() => {
  jest.useRealTimers();
});

describe('<AvisoUltimaChance />', () => {
  // Domingo e segunda treinados, terça folga: se hoje passar em branco, quebra
  const EM_RISCO = [sessao('2026-10-04'), sessao('2026-10-05')];

  it('aparece com a sequência em jogo e agenda o aviso das 20:00', async () => {
    useTreinosStore.setState({ treinos: [TREINO], sessoes: EM_RISCO, congelados: [] });
    const onPress = jest.fn();

    await render(<AvisoUltimaChance hoje={MANHA} onPress={onPress} />);

    expect(screen.getByText('última chance')).toBeOnTheScreen();
    expect(screen.getByText('treine hoje para manter sua sequência de 2 dias')).toBeOnTheScreen();
    await waitFor(() => expect(agendarAvisoUnico).toHaveBeenCalledTimes(1));
    expect(jest.mocked(agendarAvisoUnico).mock.calls[0][0]).toMatchObject({
      id: ID_AVISO_ULTIMA_CHANCE,
      quando: new Date(2026, 9, 7, 20, 0),
    });

    await userEvent.press(screen.getByRole('button', { name: /última chance/ }));
    expect(onPress).toHaveBeenCalled();
  });

  it('some e cancela o aviso quando o treino de hoje é feito', async () => {
    useTreinosStore.setState({ treinos: [TREINO], sessoes: EM_RISCO, congelados: [] });

    await render(<AvisoUltimaChance hoje={MANHA} />);
    expect(screen.getByText('última chance')).toBeOnTheScreen();

    await act(async () => {
      useTreinosStore.setState({ sessoes: [...EM_RISCO, sessao(HOJE)] });
    });

    expect(screen.queryByText('última chance')).toBeNull();
    await waitFor(() => expect(cancelarAviso).toHaveBeenCalledWith(ID_AVISO_ULTIMA_CHANCE));
  });

  it('sem permissão de notificação, só mostra o aviso', async () => {
    jest.mocked(podeNotificar).mockResolvedValueOnce(false);
    useTreinosStore.setState({ treinos: [TREINO], sessoes: EM_RISCO, congelados: [] });

    await render(<AvisoUltimaChance hoje={MANHA} />);

    await waitFor(() => expect(podeNotificar).toHaveBeenCalled());
    expect(agendarAvisoUnico).not.toHaveBeenCalled();
    expect(screen.getByText('última chance')).toBeOnTheScreen();
  });

  it('guarda na store os dias que o congelador salvou', async () => {
    // 7 dias até 2/10 (ganha 1), 3/10 folga, 4/10 congelado, 5 e 6 treinados
    const sessoes = [
      ...Array.from({ length: 7 }, (_, n) => sessao(somarDias('2026-10-02', -n))),
      sessao('2026-10-05'),
      sessao('2026-10-06'),
    ];
    useTreinosStore.setState({ treinos: [TREINO], sessoes, congelados: [] });

    await render(<AvisoUltimaChance hoje={MANHA} />);

    await waitFor(() => expect(useTreinosStore.getState().congelados).toEqual(['2026-10-04']));
    // Ontem treinou: hoje ainda tem folga, sem aviso
    expect(screen.queryByText('última chance')).toBeNull();
  });
});

describe('<CartaoCongelador />', () => {
  it('mostra os guardados, o próximo e a explicação', async () => {
    await render(
      <CartaoCongelador
        congeladores={1}
        texto="1 congelador guardado"
        proximo="faltam 4 dias de sequência para ganhar outro"
      />,
    );

    expect(
      screen.getByLabelText('1 congelador guardado. faltam 4 dias de sequência para ganhar outro'),
    ).toBeOnTheScreen();
    expect(screen.getByText(/um congelador é usado sozinho/)).toBeOnTheScreen();
    expect(screen.getByText(/descanso também conta/)).toBeOnTheScreen();
  });
});

describe('anel de progresso nos calendários', () => {
  it('o calendário do mês diz a porcentagem de cada dia', async () => {
    useTreinosStore.setState({
      treinos: [TREINO],
      sessoes: [sessao('2026-10-05', 1), sessao('2026-10-06')],
      congelados: [],
    });

    await render(<CalendarioSequencia hoje={MANHA} />);

    expect(
      screen.getByLabelText('5 de outubro, treino parcial, 50% do treino feito'),
    ).toBeOnTheScreen();
    expect(
      screen.getByLabelText('6 de outubro, treino completo, 100% do treino feito'),
    ).toBeOnTheScreen();
    // A legenda é decorativa (escondida do leitor de tela)
    expect(screen.getByText('congelado', { includeHiddenElements: true })).toBeOnTheScreen();
  });

  it('a faixa da semana mostra o dia congelado e a legenda dele', async () => {
    const sessoes = [
      ...Array.from({ length: 7 }, (_, n) => sessao(somarDias('2026-10-02', -n))),
      sessao('2026-10-05'),
    ];
    const { marcas } = calcularSequencia([TREINO], sessoes, HOJE);
    const dias = diasDaFaixa([TREINO], sessoes, HOJE, 1, 1, marcas);

    await render(<FaixaSemana dias={dias} resumo="" selecionado={HOJE} onSelecionar={jest.fn()} />);

    expect(
      screen.getByRole('button', { name: 'domingo, 4, congelado, a sequência seguiu' }),
    ).toBeOnTheScreen();
    expect(
      screen.getByRole('button', { name: 'segunda, 5, 100% do treino feito' }),
    ).toBeOnTheScreen();
    expect(screen.getByText('congelado')).toBeOnTheScreen();
  });
});
