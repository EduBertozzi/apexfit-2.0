import { calcularNecessidades } from '@/features/nutricao/calculos';
import type { Perfil } from '@/features/perfil/types';
import type { RespostaTreinosIa } from '@/features/treinos/contratoIa';
import { useTreinosStore } from '@/features/treinos/store';

import type { EventoCoach } from '../contrato';
import type { DadosDemo } from '../demo';
import { escreverEvento, lerEventos } from '../eventos';
import { useCoachStore } from '../store';

const PERFIL: Perfil = {
  nome: 'Eduardo',
  idade: 21,
  alturaCm: 188,
  pesoKg: 75,
  sexo: 'masculino',
  nivelAtividade: 'moderado',
  objetivo: 'manter',
};

const DADOS: DadosDemo = {
  perfil: PERFIL,
  necessidades: calcularNecessidades(PERFIL),
  agua: { hojeMl: 1750, metaMl: 2650, diasBatidosNaSemana: 3, sequencia: 2 },
  plano: null,
  hoje: 'Sábado, 3 de outubro',
};

const TREINOS: RespostaTreinosIa = {
  resumo: 'AB.',
  treinos: [
    {
      nome: 'Treino A',
      foco: 'Peito',
      exercicios: [
        { nome: 'Supino reto com barra', grupo: 'peito', series: 3, repeticoes: '8-12' },
      ],
    },
  ],
};

function responder(eventos: EventoCoach[]) {
  const texto = eventos.map(escreverEvento).join('');

  global.fetch = jest.fn().mockResolvedValue({
    ok: true,
    status: 200,
    body: undefined,
    text: async () => texto,
  });
}

beforeEach(() => {
  useCoachStore.setState({ mensagens: [], respondendo: false, erro: null });
  useTreinosStore.setState({ treinos: [], sessoes: [] });
});

describe('evento "treinos" do coach', () => {
  it('passa pelo leitor de eventos', () => {
    const { eventos } = lerEventos(escreverEvento({ tipo: 'treinos', resultado: TREINOS }));

    expect(eventos).toEqual([{ tipo: 'treinos', resultado: TREINOS }]);
  });

  it('troca os treinos salvos e marca a resposta', async () => {
    responder([
      { tipo: 'treinos', resultado: TREINOS },
      { tipo: 'texto', texto: 'Pronto! Montei 1 treino.' },
      { tipo: 'fim' },
    ]);

    await useCoachStore.getState().enviar('Monta meu treino', DADOS);

    const treinos = useTreinosStore.getState().treinos;
    expect(treinos.map((treino) => treino.nome)).toEqual(['Treino A']);
    expect(treinos[0].exercicios[0]).toMatchObject({ grupo: 'peito', repeticoes: '8 a 12' });

    const resposta = useCoachStore.getState().mensagens.at(-1);
    expect(resposta).toMatchObject({ papel: 'coach', treinosAtualizados: true });
  });
});
