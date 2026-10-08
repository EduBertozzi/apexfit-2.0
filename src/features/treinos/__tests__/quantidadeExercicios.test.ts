import type { Perfil } from '@/features/perfil/types';

import { pedidoSemanaIaSchema, type DiaMontado, type EscolhasSemana } from '../contratoIa';
import {
  contadorExercicios,
  copiarDia,
  distribuirExercicios,
  ESCOLHAS_PADRAO,
  escolhasValidas,
  EXERCICIOS_POR_NIVEL,
  exerciciosDoDia,
  exerciciosPadrao,
  passoExercicios,
  prepararSemana,
  textoNoDia,
} from '../montadorIa';
import { linhaDoDiaNoPrompt, montarPromptSemana, SISTEMA_SEMANA } from '../promptIa';
import { montarSemanaPorRegras } from '../regrasSemana';
import type { DadosExercicio } from '../types';

const PERFIL: Perfil = {
  nome: 'Eduardo',
  idade: 30,
  alturaCm: 180,
  pesoKg: 80,
  sexo: 'masculino',
  nivelAtividade: 'moderado',
  objetivo: 'ganhar',
};

const SEM_EMOJI_NEM_TRAVESSAO = /[–—]|\p{Extended_Pictographic}/u;

const PEITO_BRACO: DiaMontado = {
  dia: 1,
  areas: [
    { area: 'peito', regioes: [] },
    { area: 'braco', regioes: ['triceps'] },
  ],
};

const SEM_AQUECIMENTO: EscolhasSemana['aquecimento'] = { ativo: false, itens: [] };

function quantidades(dia: DiaMontado, nivel: EscolhasSemana['nivel'] = 'iniciante') {
  return distribuirExercicios(dia, nivel).map(({ area, quantidade }) => [area.area, quantidade]);
}

describe('quantos exercícios por dia', () => {
  it('padrão por nível: iniciante 5, intermediário 6, avançado 7', () => {
    expect(EXERCICIOS_POR_NIVEL).toEqual({ iniciante: 5, intermediario: 6, avancado: 7 });
    expect(exerciciosDoDia(PEITO_BRACO, 'iniciante')).toBe(5);
    expect(exerciciosDoDia(PEITO_BRACO, 'avancado')).toBe(7);
  });

  it('o número escolhido vale mais que o nível e fica entre 2 e 12', () => {
    expect(exerciciosDoDia({ ...PEITO_BRACO, exercicios: 9 }, 'iniciante')).toBe(9);
    expect(exerciciosDoDia({ ...PEITO_BRACO, exercicios: 40 }, 'iniciante')).toBe(12);
  });

  it('mais áreas que exercícios: a quantidade sobe para 1 por área', () => {
    const cheio: DiaMontado = {
      dia: 2,
      areas: ['peito', 'costas', 'ombro', 'braco', 'perna', 'abdominal'].map((area) => ({
        area: area as DiaMontado['areas'][number]['area'],
        regioes: [],
      })),
      exercicios: 3,
    };

    expect(exerciciosDoDia(cheio, 'iniciante')).toBe(6);
    expect(quantidades(cheio).every(([, quantidade]) => quantidade === 1)).toBe(true);
    expect(contadorExercicios(cheio, 'iniciante')).toMatchObject({
      valor: 6,
      podeMenos: false,
      legenda: 'pelo menos 1 por área, sem contar o aquecimento',
    });
  });

  it('distribui: 1 por área e o resto das grandes para as pequenas, cardio com 1', () => {
    expect(quantidades(PEITO_BRACO)).toEqual([
      ['peito', 3],
      ['braco', 2],
    ]);
    expect(quantidades({ ...PEITO_BRACO, exercicios: 6 })).toEqual([
      ['peito', 3],
      ['braco', 3],
    ]);
    expect(
      quantidades({
        dia: 3,
        areas: [
          { area: 'ombro', regioes: [] },
          { area: 'perna', regioes: [] },
          { area: 'abdominal', regioes: [] },
          { area: 'cardio', regioes: [] },
        ],
        exercicios: 8,
      }),
    ).toEqual([
      ['ombro', 2],
      ['perna', 3],
      ['abdominal', 2],
      ['cardio', 1],
    ]);
    // A soma bate com o total
    const total = distribuirExercicios({ ...PEITO_BRACO, exercicios: 11 }, 'iniciante').reduce(
      (soma, item) => soma + item.quantidade,
      0,
    );
    expect(total).toBe(11);
  });

  it('dia só de cardio contínuo tem 1 exercício e nenhum contador', () => {
    const cardio: DiaMontado = { dia: 5, areas: [{ area: 'cardio', regioes: [] }] };

    expect(exerciciosDoDia(cardio, 'avancado')).toBe(1);
    expect(contadorExercicios(cardio, 'avancado').visivel).toBe(false);
    expect(passoExercicios({ ...ESCOLHAS_PADRAO, dias: [cardio] }, 5, 1).dias[0]).toEqual(cardio);
  });

  it('passo para cima e para baixo fixa o número; padrão volta a seguir o nível', () => {
    let escolhas: EscolhasSemana = { ...ESCOLHAS_PADRAO, dias: [PEITO_BRACO] };

    escolhas = passoExercicios(escolhas, 1, 1);
    expect(escolhas.dias[0].exercicios).toBe(6);

    // Trocar o nível não mexe mais no dia
    escolhas = { ...escolhas, nivel: 'avancado' };
    expect(exerciciosDoDia(escolhas.dias[0], escolhas.nivel)).toBe(6);

    for (let i = 0; i < 20; i++) {
      escolhas = passoExercicios(escolhas, 1, -1);
    }
    expect(escolhas.dias[0].exercicios).toBe(2);

    escolhas = exerciciosPadrao(escolhas, 1);
    expect(escolhas.dias[0]).toEqual(PEITO_BRACO);
    expect(exerciciosDoDia(escolhas.dias[0], escolhas.nivel)).toBe(7);
  });

  it('contador: textos para a tela e o leitor de tela', () => {
    expect(contadorExercicios({ ...PEITO_BRACO, exercicios: 6 }, 'iniciante')).toEqual({
      visivel: true,
      valor: 6,
      padrao: false,
      podeMenos: true,
      podeMais: true,
      rotuloAcessivel: '6 exercícios na segunda',
      valorAcessivel: 'escolhido por você',
      rotuloMenos: 'menos um exercício na segunda',
      rotuloMais: 'mais um exercício na segunda',
      legenda: 'sem contar o aquecimento',
    });
    expect(contadorExercicios({ ...PEITO_BRACO, exercicios: 12 }, 'iniciante').podeMais).toBe(
      false,
    );
    expect(contadorExercicios(PEITO_BRACO, 'intermediario').legenda).toBe(
      'padrão do nível intermediário, sem contar o aquecimento',
    );
    expect(textoNoDia(6)).toBe('no sábado');
    expect(textoNoDia(0)).toBe('no domingo');
  });

  it('copiar o dia leva a quantidade junto', () => {
    const escolhas: EscolhasSemana = {
      ...ESCOLHAS_PADRAO,
      dias: [
        { ...PEITO_BRACO, exercicios: 8 },
        { dia: 3, areas: [], exercicios: 4 },
      ],
    };

    expect(copiarDia(escolhas, 1, 3).dias[1].exercicios).toBe(8);
    expect(
      copiarDia({ ...escolhas, dias: [PEITO_BRACO, escolhas.dias[1]] }, 1, 3).dias[1],
    ).not.toHaveProperty('exercicios');
  });

  it('salvo antigo (sem o campo) ou estragado fica no padrão; válido continua', () => {
    const salvas = escolhasValidas({
      ...ESCOLHAS_PADRAO,
      dias: [
        { dia: 1, areas: [{ area: 'peito', regioes: [] }] },
        { dia: 3, areas: [{ area: 'perna', regioes: [] }], exercicios: 99 },
        { dia: 5, areas: [{ area: 'costas', regioes: [] }], exercicios: 8 },
      ],
    });

    expect(salvas.dias[0]).not.toHaveProperty('exercicios');
    expect(salvas.dias[1]).not.toHaveProperty('exercicios');
    expect(salvas.dias[2].exercicios).toBe(8);
  });

  it('o contrato aceita de 2 a 12 e recusa fora disso', () => {
    const pedido = (exercicios: number) =>
      pedidoSemanaIaSchema.safeParse({
        perfil: PERFIL,
        escolhas: { ...ESCOLHAS_PADRAO, dias: [{ ...PEITO_BRACO, exercicios }] },
      }).success;

    expect(pedido(2)).toBe(true);
    expect(pedido(12)).toBe(true);
    expect(pedido(1)).toBe(false);
    expect(pedido(13)).toBe(false);
    expect(pedido(5.5)).toBe(false);
  });
});

describe('prompt da semana com as quantidades', () => {
  it('diz quantos exercícios por área em cada dia, mais o aquecimento', () => {
    expect(linhaDoDiaNoPrompt({ ...PEITO_BRACO, exercicios: 6 }, 'iniciante', true)).toBe(
      '- treino de segunda: 6 exercícios (peito 3; braço (tríceps) 3), mais o aquecimento',
    );
    expect(linhaDoDiaNoPrompt(PEITO_BRACO, 'avancado', false)).toBe(
      '- treino de segunda: 7 exercícios (peito 4; braço (tríceps) 3)',
    );

    const texto = montarPromptSemana(PERFIL, {
      ...ESCOLHAS_PADRAO,
      nivel: 'intermediario',
      dias: [PEITO_BRACO, { dia: 3, areas: [{ area: 'perna', regioes: [] }], exercicios: 4 }],
    });
    expect(texto).toContain(
      '- treino de segunda: 6 exercícios (peito 3; braço (tríceps) 3), mais o aquecimento',
    );
    expect(texto).toContain('- treino de quarta: 4 exercícios (perna 4), mais o aquecimento');
    expect(SISTEMA_SEMANA).toMatch(/Siga exatamente essas quantidades/);
    expect(texto).not.toMatch(SEM_EMOJI_NEM_TRAVESSAO);
    expect(SISTEMA_SEMANA).not.toMatch(SEM_EMOJI_NEM_TRAVESSAO);
  });
});

describe('modo offline com as quantidades', () => {
  it('cada dia sai com a quantidade escolhida, sem repetir exercício', () => {
    const escolhas: EscolhasSemana = {
      ...ESCOLHAS_PADRAO,
      aquecimento: SEM_AQUECIMENTO,
      dias: [
        { ...PEITO_BRACO, exercicios: 7 },
        {
          dia: 3,
          areas: [
            { area: 'perna', regioes: [] },
            { area: 'cardio', regioes: [] },
          ],
        },
      ],
    };
    const [segunda, quarta] = montarSemanaPorRegras(PERFIL, escolhas).treinos;

    expect(segunda.exercicios).toHaveLength(7);
    expect(segunda.exercicios.filter((e) => e.grupo === 'peito')).toHaveLength(4);
    expect(segunda.exercicios.filter((e) => e.grupo === 'braco')).toHaveLength(3);
    expect(new Set(segunda.exercicios.map((e) => e.nome)).size).toBe(7);
    // Iniciante: 5 no dia, cardio conta como 1
    expect(quarta.exercicios).toHaveLength(5);
    expect(quarta.exercicios.filter((e) => e.grupo === 'cardio')).toHaveLength(1);
  });
});

describe('prepararSemana cobra a quantidade', () => {
  const ESCOLHAS: EscolhasSemana = {
    ...ESCOLHAS_PADRAO,
    dias: [{ ...PEITO_BRACO, exercicios: 5 }],
  };

  const ex = (nome: string, grupo: DadosExercicio['grupo']): DadosExercicio => ({
    nome,
    grupo,
    series: 3,
    repeticoes: '10',
  });

  const RESERVA = [
    {
      nome: 'treino de segunda',
      exercicios: [
        ex('Supino reto', 'peito'),
        ex('Supino inclinado', 'peito'),
        ex('Crucifixo', 'peito'),
        ex('Tríceps corda', 'braco'),
        ex('Tríceps testa', 'braco'),
      ],
    },
  ];

  it('área com a menos completa com a reserva, sem repetir nome (sem acento e caixa)', () => {
    const semana = prepararSemana(
      [
        {
          nome: 'treino de segunda',
          exercicios: [ex('Polichinelo', 'aquecimento'), ex('SUPINO RETO', 'peito')],
        },
      ],
      ESCOLHAS,
      RESERVA,
    );

    // Aquecimento escolhido na frente, intacto; peito 3 e braço 2
    expect(semana[0].exercicios?.map((e) => e.nome)).toEqual([
      'polichinelo',
      'mobilidade de quadril',
      'SUPINO RETO',
      'Supino inclinado',
      'Crucifixo',
      'Tríceps corda',
      'Tríceps testa',
    ]);
  });

  it('área com exercícios a mais é cortada; repetido não conta', () => {
    const semana = prepararSemana(
      [
        {
          nome: 'treino de segunda',
          exercicios: [
            ex('Supino reto', 'peito'),
            ex('Supino reto', 'peito'),
            ex('Peck deck', 'peito'),
            ex('Crossover', 'peito'),
            ex('Flexão', 'peito'),
            ex('Tríceps francês', 'braco'),
            ex('Tríceps banco', 'braco'),
            ex('Tríceps coice', 'braco'),
          ],
        },
      ],
      { ...ESCOLHAS, aquecimento: SEM_AQUECIMENTO },
      RESERVA,
    );

    expect(semana[0].exercicios?.map((e) => e.nome)).toEqual([
      'Supino reto',
      'Peck deck',
      'Crossover',
      'Tríceps francês',
      'Tríceps banco',
    ]);
  });

  it('exercício de grupo desconhecido completa antes da reserva', () => {
    const semana = prepararSemana(
      [
        {
          nome: 'treino de segunda',
          exercicios: [
            ex('Supino reto', 'peito'),
            ex('Exercício misterioso', 'outro'),
            ex('Tríceps corda', 'braco'),
          ],
        },
      ],
      { ...ESCOLHAS, aquecimento: SEM_AQUECIMENTO },
      RESERVA,
    );

    expect(semana[0].exercicios?.map((e) => e.nome)).toEqual([
      'Supino reto',
      'Exercício misterioso',
      'Supino inclinado',
      'Tríceps corda',
      'Tríceps testa',
    ]);
  });
});
