import { chaveDoDia } from '@/shared/lib/data';
import { calcularNecessidades } from '@/features/nutricao/calculos';
import type { Perfil } from '@/features/perfil/types';
import type { RespostaTreinosIa } from '@/features/treinos/contratoIa';
import { useTreinosStore } from '@/features/treinos/store';
import type { Sessao, Treino } from '@/features/treinos/types';

import type { EventoCoach } from '../contrato';
import type { DadosDemo } from '../demo';
import { escreverEvento, lerEventos } from '../eventos';
import { useCoachStore } from '../store';

// Sessão aberta precisa ser de hoje de verdade: de dias passados ela vira histórico
const HOJE_DE_VERDADE = chaveDoDia(new Date());

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

  it('vira proposta com dias; só troca os treinos ao aplicar', async () => {
    responder([
      { tipo: 'treinos', resultado: TREINOS },
      { tipo: 'texto', texto: 'Montei 1 treino.' },
      { tipo: 'fim' },
    ]);

    await useCoachStore.getState().enviar('Monta meu treino', DADOS);

    const resposta = useCoachStore.getState().mensagens.at(-1)!;
    expect(useTreinosStore.getState().treinos).toEqual([]);
    expect(resposta.proposta).toMatchObject({
      tipo: 'treinos',
      estado: 'pendente',
      resumo: { titulo: '1 treino', linhas: ['treino A: segunda, 1 exercício'] },
    });

    useCoachStore.getState().aplicarProposta(resposta.id);

    const treinos = useTreinosStore.getState().treinos;
    expect(treinos.map((treino) => treino.nome)).toEqual(['Treino A']);
    expect(treinos[0].dias).toEqual([1]);
    expect(treinos[0].exercicios[0]).toMatchObject({ grupo: 'peito', repeticoes: '8 a 12' });
  });
});

describe('ajuste de treino pelo coach', () => {
  const ATUAIS: Treino[] = [
    {
      id: 't1',
      nome: 'Treino A',
      foco: 'Perna',
      dias: [1, 4],
      exercicios: [
        {
          id: 'e1',
          nome: 'Agachamento livre',
          grupo: 'perna',
          series: 3,
          repeticoes: '10',
          cargaKg: 60,
        },
        { id: 'e2', nome: 'Leg press 45', grupo: 'perna', series: 3, repeticoes: '12' },
      ],
    },
    {
      id: 't2',
      nome: 'Treino B',
      foco: 'Peito',
      exercicios: [
        { id: 'e3', nome: 'Supino reto com barra', grupo: 'peito', series: 3, repeticoes: '10' },
      ],
    },
  ];

  const EDITADO: RespostaTreinosIa = {
    resumo: 'Troquei o leg press.',
    treinos: [
      {
        nome: 'Treino A',
        foco: 'Perna',
        exercicios: [
          { nome: 'Agachamento livre', grupo: 'perna', series: 3, repeticoes: '10' },
          { nome: 'Afundo', grupo: 'perna', series: 3, repeticoes: '12' },
        ],
      },
      {
        nome: 'Treino B',
        foco: 'Peito',
        exercicios: [
          { nome: 'Supino reto com barra', grupo: 'peito', series: 3, repeticoes: '10' },
        ],
      },
    ],
  };

  const SESSAO_ABERTA: Sessao = {
    id: 's1',
    treinoId: 't1',
    data: HOJE_DE_VERDADE,
    concluidos: ['e1', 'e2'],
    finalizada: false,
  };

  beforeEach(() => {
    useTreinosStore.setState({ treinos: ATUAIS, sessoes: [SESSAO_ABERTA] });
  });

  it('manda os treinos atuais com ids no pedido', async () => {
    responder([{ tipo: 'fim' }]);

    await useCoachStore.getState().enviar('troca o leg press por afundo', DADOS);

    const corpo = JSON.parse((global.fetch as jest.Mock).mock.calls[0][1].body);
    expect(corpo.treinosAtuais[0]).toMatchObject({ id: 't1', dias: [1, 4] });
    expect(corpo.treinosAtuais[0].exercicios[0]).toMatchObject({ id: 'e1', cargaKg: 60 });
  });

  it('aplicar mantém ids, dias, carga e marcas do que não mudou; desfazer volta tudo', async () => {
    responder([
      { tipo: 'treinos', resultado: EDITADO, modo: 'ajuste' },
      { tipo: 'texto', texto: 'Troquei.' },
      { tipo: 'fim' },
    ]);

    await useCoachStore.getState().enviar('troca o leg press por afundo', DADOS);

    const resposta = useCoachStore.getState().mensagens.at(-1)!;
    expect(resposta.proposta?.resumo.mudancas).toEqual([
      'treino A: leg press 45 trocado por afundo',
    ]);

    useCoachStore.getState().aplicarProposta(resposta.id);

    const [a, b] = useTreinosStore.getState().treinos;
    expect(a.id).toBe('t1');
    expect(a.dias).toEqual([1, 4]);
    expect(a.exercicios[0]).toMatchObject({ id: 'e1', cargaKg: 60 });
    expect(a.exercicios[1].id).not.toBe('e2');
    expect(a.exercicios[1].nome).toBe('Afundo');
    expect(b).toEqual(ATUAIS[1]);
    // A sessão de hoje continua, só sem a marca do exercício que saiu
    expect(useTreinosStore.getState().sessoes).toEqual([{ ...SESSAO_ABERTA, concluidos: ['e1'] }]);

    useCoachStore.getState().desfazerProposta(resposta.id);

    expect(useTreinosStore.getState().treinos).toEqual(ATUAIS);
    expect(useCoachStore.getState().mensagens.at(-1)?.proposta?.estado).toBe('pendente');
  });

  it('"não, obrigado" não mexe nos treinos', async () => {
    responder([
      { tipo: 'treinos', resultado: EDITADO, modo: 'ajuste' },
      { tipo: 'texto', texto: 'Troquei.' },
      { tipo: 'fim' },
    ]);

    await useCoachStore.getState().enviar('troca o leg press por afundo', DADOS);
    useCoachStore.getState().recusarProposta(useCoachStore.getState().mensagens.at(-1)!.id);

    expect(useTreinosStore.getState().treinos).toEqual(ATUAIS);
    expect(useCoachStore.getState().mensagens.at(-1)?.proposta?.estado).toBe('descartado');
  });
});
