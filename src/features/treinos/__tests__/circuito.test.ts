import type { Perfil } from '@/features/perfil/types';

import {
  CIRCUITO_PADRAO,
  circuitoDoDia,
  circuitoValido,
  montarCircuito,
  observacaoCircuito,
  passoNoCircuito,
  textoCircuito,
} from '../circuito';
import { pedidoSemanaIaSchema, type DiaMontado, type EscolhasSemana } from '../contratoIa';
import { esquemaAcessivel, textoEsquema } from '../grupos';
import { paraDadosTreino } from '../ia';
import { resumoExercicioAcessivel } from '../logica';
import {
  contadoresCircuito,
  copiarDia,
  distribuirExercicios,
  ESCOLHAS_PADRAO,
  escolhasValidas,
  exerciciosDoDia,
  modoCardio,
  opcoesCardio,
  passoCircuito,
  prepararSemana,
  resumoDoDia,
  rotuloDoDia,
} from '../montadorIa';
import { linhaDoDiaNoPrompt, SISTEMA_SEMANA } from '../promptIa';
import { montarSemanaPorRegras } from '../regrasSemana';
import { exercicioSchema } from '../schema';

const PERFIL: Perfil = {
  nome: 'Eduardo',
  idade: 30,
  alturaCm: 180,
  pesoKg: 80,
  sexo: 'masculino',
  nivelAtividade: 'moderado',
  objetivo: 'perder',
};

const SEM_EMOJI_NEM_TRAVESSAO = /[–—]|\p{Extended_Pictographic}/u;

const PERNA_CARDIO: DiaMontado = {
  dia: 3,
  areas: [
    { area: 'perna', regioes: [] },
    { area: 'cardio', regioes: [] },
  ],
};

const COM_CIRCUITO: DiaMontado = { ...PERNA_CARDIO, circuito: CIRCUITO_PADRAO };

describe('circuito: peças', () => {
  it('padrão de 4 exercícios de 40 s, 3 voltas', () => {
    expect(CIRCUITO_PADRAO).toEqual({ exercicios: 4, segundos: 40, voltas: 3 });
    expect(textoCircuito(CIRCUITO_PADRAO)).toBe('circuito: 4 exercícios de 40 s, 3 voltas');
    expect(observacaoCircuito(CIRCUITO_PADRAO)).toBe(
      'circuito: 3 voltas, 20 s de descanso entre exercícios e 1 min entre voltas',
    );
  });

  it('passos respeitam os limites (segundos de 10 em 10)', () => {
    expect(passoNoCircuito(CIRCUITO_PADRAO, 'segundos', 1).segundos).toBe(50);
    expect(passoNoCircuito({ ...CIRCUITO_PADRAO, segundos: 90 }, 'segundos', 1).segundos).toBe(90);
    expect(passoNoCircuito({ ...CIRCUITO_PADRAO, voltas: 2 }, 'voltas', -1).voltas).toBe(2);
    expect(passoNoCircuito({ ...CIRCUITO_PADRAO, exercicios: 8 }, 'exercicios', 1).exercicios).toBe(
      8,
    );
  });

  it('só vale quando o dia tem cardio', () => {
    expect(circuitoDoDia(COM_CIRCUITO)).toEqual(CIRCUITO_PADRAO);
    expect(
      circuitoDoDia({ ...COM_CIRCUITO, areas: [{ area: 'perna', regioes: [] }] }),
    ).toBeUndefined();
  });

  it('salvo estragado volta para contínuo', () => {
    expect(circuitoValido({ exercicios: 4, segundos: 40, voltas: 3 })).toEqual(CIRCUITO_PADRAO);
    expect(circuitoValido({ exercicios: 4, segundos: 5, voltas: 3 })).toBeUndefined();
    expect(circuitoValido('x')).toBeUndefined();
  });

  it('modo offline: exercícios do circuito com voltas, segundos e observação', () => {
    const exercicios = montarCircuito(CIRCUITO_PADRAO, 'academia', () => true);

    expect(exercicios).toHaveLength(4);
    expect(exercicios[0]).toEqual({
      nome: 'polichinelo',
      grupo: 'cardio',
      series: 3,
      repeticoes: '40 s',
      observacao: 'circuito: 3 voltas, 20 s de descanso entre exercícios e 1 min entre voltas',
    });
    // Outro dia começa de outro exercício; só com o corpo, nada de corda
    expect(montarCircuito(CIRCUITO_PADRAO, 'academia', () => true, 1)[0].nome).toBe(
      'corrida no lugar',
    );
    expect(
      montarCircuito({ ...CIRCUITO_PADRAO, exercicios: 8 }, 'corpo', () => true).map((e) => e.nome),
    ).not.toContain('pular corda');
    // Evitar tirou tudo: sobra a corrida no lugar
    expect(montarCircuito(CIRCUITO_PADRAO, 'corpo', () => false).map((e) => e.nome)).toEqual([
      'corrida no lugar',
    ]);
  });
});

describe('circuito no montador', () => {
  it('liga e desliga o circuito; os números mudam no dia certo', () => {
    let escolhas: EscolhasSemana = { ...ESCOLHAS_PADRAO, dias: [PERNA_CARDIO] };

    escolhas = modoCardio(escolhas, 3, 'circuito');
    expect(escolhas.dias[0].circuito).toEqual(CIRCUITO_PADRAO);

    escolhas = passoCircuito(escolhas, 3, 'voltas', 1);
    escolhas = passoCircuito(escolhas, 3, 'segundos', -1);
    expect(escolhas.dias[0].circuito).toEqual({ exercicios: 4, segundos: 30, voltas: 4 });

    // Ligar de novo mantém o que já estava
    expect(modoCardio(escolhas, 3, 'circuito').dias[0].circuito?.voltas).toBe(4);

    escolhas = modoCardio(escolhas, 3, 'continuo');
    expect(escolhas.dias[0]).toEqual(PERNA_CARDIO);
    // Sem circuito, o passo não faz nada
    expect(passoCircuito(escolhas, 3, 'voltas', 1)).toEqual(escolhas);
  });

  it('circuito fica fora da conta: cardio sai do contador e leva os exercícios do circuito', () => {
    // Contínuo: cardio conta 1 dos 5
    expect(distribuirExercicios(PERNA_CARDIO, 'iniciante').map((q) => q.quantidade)).toEqual([
      4, 1,
    ]);
    // Circuito: os 5 são de perna e o cardio tem os 4 do circuito
    expect(exerciciosDoDia(COM_CIRCUITO, 'iniciante')).toBe(5);
    expect(distribuirExercicios(COM_CIRCUITO, 'iniciante').map((q) => q.quantidade)).toEqual([
      5, 4,
    ]);
    // Dia só de circuito: 0 no contador
    expect(
      exerciciosDoDia(
        { dia: 0, areas: [{ area: 'cardio', regioes: [] }], circuito: CIRCUITO_PADRAO },
        'iniciante',
      ),
    ).toBe(0);
  });

  it('textos do dia, das pílulas e dos contadores', () => {
    expect(resumoDoDia(COM_CIRCUITO, 'iniciante')).toBe(
      'perna e cardio · 5 exercícios · circuito: 4 exercícios de 40 s, 3 voltas',
    );
    expect(
      resumoDoDia(
        { dia: 0, areas: [{ area: 'cardio', regioes: [] }], circuito: CIRCUITO_PADRAO },
        'iniciante',
      ),
    ).toBe('cardio · circuito: 4 exercícios de 40 s, 3 voltas');
    expect(rotuloDoDia(COM_CIRCUITO, 'iniciante')).toBe(
      'quarta, perna e cardio, 5 exercícios, circuito: 4 exercícios de 40 s, 3 voltas',
    );

    const cardio = opcoesCardio(COM_CIRCUITO);
    expect(cardio.visivel).toBe(true);
    expect(cardio.opcoes.map((o) => [o.rotulo, o.selecionada, o.rotuloAcessivel])).toEqual([
      ['contínuo', false, 'cardio contínuo na quarta'],
      ['circuito', true, 'cardio em circuito na quarta'],
    ]);
    expect(opcoesCardio({ dia: 1, areas: [{ area: 'peito', regioes: [] }] }).visivel).toBe(false);

    expect(contadoresCircuito(PERNA_CARDIO)).toEqual([]);
    expect(contadoresCircuito(COM_CIRCUITO).map((c) => [c.valorTexto, c.rotuloAcessivel])).toEqual([
      ['4', '4 exercícios no circuito na quarta'],
      ['40 s', '40 segundos por exercício na quarta'],
      ['3', '3 voltas na quarta'],
    ]);

    for (const texto of [
      resumoDoDia(COM_CIRCUITO, 'iniciante'),
      cardio.legenda,
      opcoesCardio(PERNA_CARDIO).legenda,
    ]) {
      expect(texto).not.toMatch(SEM_EMOJI_NEM_TRAVESSAO);
      expect(texto).toBe(texto.toLocaleLowerCase('pt-BR'));
    }
  });

  it('copiar o dia leva o circuito; salvo estragado sai; o contrato valida', () => {
    const escolhas: EscolhasSemana = {
      ...ESCOLHAS_PADRAO,
      dias: [COM_CIRCUITO, { dia: 5, areas: [] }],
    };

    expect(copiarDia(escolhas, 3, 5).dias[1].circuito).toEqual(CIRCUITO_PADRAO);
    expect(
      escolhasValidas({
        ...escolhas,
        dias: [{ ...PERNA_CARDIO, circuito: { exercicios: 50, segundos: 40, voltas: 3 } }],
      }).dias[0],
    ).not.toHaveProperty('circuito');

    const pedido = (circuito: unknown) =>
      pedidoSemanaIaSchema.safeParse({
        perfil: PERFIL,
        escolhas: { ...ESCOLHAS_PADRAO, dias: [{ ...PERNA_CARDIO, circuito }] },
      }).success;
    expect(pedido(CIRCUITO_PADRAO)).toBe(true);
    expect(pedido({ exercicios: 4, segundos: 100, voltas: 3 })).toBe(false);
  });
});

describe('circuito na IA e no modo offline', () => {
  it('o prompt pede o circuito à parte, com segundos e voltas', () => {
    expect(linhaDoDiaNoPrompt(COM_CIRCUITO, 'iniciante', true)).toBe(
      '- treino de quarta: 5 exercícios (perna 5), mais o aquecimento; cardio em circuito: 4 exercícios de 40 s, 3 voltas, 20 s de descanso entre exercícios e 1 min entre voltas',
    );
    expect(
      linhaDoDiaNoPrompt(
        { dia: 0, areas: [{ area: 'cardio', regioes: [] }], circuito: CIRCUITO_PADRAO },
        'iniciante',
        false,
      ),
    ).toBe(
      '- treino de domingo: cardio em circuito: 4 exercícios de 40 s, 3 voltas, 20 s de descanso entre exercícios e 1 min entre voltas',
    );
    expect(SISTEMA_SEMANA).toMatch(/cardio em circuito/);
    expect(SISTEMA_SEMANA).toMatch(/"40 s"/);
  });

  it('modo offline: perna na quantidade do contador e o circuito no fim', () => {
    const escolhas: EscolhasSemana = {
      ...ESCOLHAS_PADRAO,
      aquecimento: { ativo: false, itens: [] },
      dias: [COM_CIRCUITO, { ...COM_CIRCUITO, dia: 5 }],
    };
    const [quarta, sexta] = montarSemanaPorRegras(PERFIL, escolhas).treinos;

    expect(quarta.exercicios.filter((e) => e.grupo === 'perna')).toHaveLength(5);
    expect(quarta.exercicios.slice(5)).toHaveLength(4);
    expect(
      quarta.exercicios.slice(5).every((e) => e.grupo === 'cardio' && e.repeticoes === '40 s'),
    ).toBe(true);
    // O segundo circuito da semana começa de outro exercício
    expect(sexta.exercicios[5].nome).not.toBe(quarta.exercicios[5].nome);

    // Vira treino salvo sem perder os segundos
    const [dados] = paraDadosTreino({ resumo: '', treinos: [quarta] });
    expect(dados.exercicios?.at(-1)).toMatchObject({ series: 3, repeticoes: '40 s' });
  });

  it('depois da IA: completa o circuito com a reserva e põe tudo no formato escolhido', () => {
    const escolhas: EscolhasSemana = {
      ...ESCOLHAS_PADRAO,
      aquecimento: { ativo: false, itens: [] },
      dias: [{ ...COM_CIRCUITO, exercicios: 2 }],
    };
    const reserva = paraDadosTreino(montarSemanaPorRegras(PERFIL, escolhas));
    const semana = prepararSemana(
      [
        {
          nome: 'treino de quarta',
          exercicios: [
            { nome: 'Agachamento livre', grupo: 'perna', series: 4, repeticoes: '10' },
            { nome: 'Leg press', grupo: 'perna', series: 4, repeticoes: '10' },
            // A IA errou o formato: 1 série de 5 min
            { nome: 'Burpee', grupo: 'cardio', series: 1, repeticoes: '5 min' },
          ],
        },
      ],
      escolhas,
      reserva,
    );
    const circuito = semana[0].exercicios?.filter((e) => e.grupo === 'cardio') ?? [];

    expect(circuito).toHaveLength(4);
    expect(circuito[0]).toMatchObject({ nome: 'Burpee', series: 3, repeticoes: '40 s' });
    expect(circuito.every((e) => e.observacao === observacaoCircuito(CIRCUITO_PADRAO))).toBe(true);
    expect(new Set(circuito.map((e) => e.nome.toLowerCase())).size).toBe(4);
  });
});

describe('repetições em segundos', () => {
  it('o formulário aceita "40 s", "40s" e "40 segundos" e guarda "40 s"', () => {
    for (const texto of ['40 s', '40s', '40 seg', '40 segundos']) {
      expect(exercicioSchema.shape.repeticoes.parse(texto)).toBe('40 s');
    }
    expect(exercicioSchema.shape.repeticoes.safeParse('2 s').success).toBe(false);
  });

  it('no card e no leitor de tela', () => {
    expect(textoEsquema('3x40 s')).toBe('3x 40 s');
    expect(textoEsquema('1x30 s')).toBe('30 s');
    expect(esquemaAcessivel('3x40 s')).toBe('3 séries de 40 segundos');
    expect(resumoExercicioAcessivel({ series: 3, repeticoes: '40 s' })).toBe(
      '3 séries de 40 segundos',
    );
  });
});
