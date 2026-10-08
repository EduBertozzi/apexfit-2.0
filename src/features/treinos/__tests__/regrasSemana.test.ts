import type { Perfil } from '@/features/perfil/types';

import { CATALOGO } from '../catalogo';
import { respostaTreinosIaSchema, type EscolhasSemana } from '../contratoIa';
import { grupoDe } from '../grupos';
import { paraDadosTreino } from '../ia';
import { ESCOLHAS_PADRAO, prepararSemana } from '../montadorIa';
import { montarPromptSemana, SISTEMA_SEMANA, SISTEMA_TREINOS } from '../promptIa';
import { cabeNoEquipamento, filtroDoEvitar, montarSemanaPorRegras } from '../regrasSemana';

const PERFIL: Perfil = {
  nome: 'Eduardo',
  idade: 21,
  alturaCm: 188,
  pesoKg: 75,
  sexo: 'masculino',
  nivelAtividade: 'moderado',
  objetivo: 'ganhar',
};

const SEM_EMOJI_NEM_TRAVESSAO = /[–—]|\p{Extended_Pictographic}/u;

const ESCOLHAS: EscolhasSemana = {
  ...ESCOLHAS_PADRAO,
  dias: [
    {
      dia: 1,
      areas: [
        { area: 'braco', regioes: ['biceps', 'triceps'] },
        { area: 'cardio', regioes: [] },
      ],
    },
    { dia: 3, areas: [{ area: 'perna', regioes: ['gluteo'] }] },
    { dia: 5, areas: [{ area: 'cardio', regioes: [] }] },
  ],
};

function exerciciosSemAquecimento(treino: { exercicios: { nome: string; grupo: string }[] }) {
  return treino.exercicios.filter((exercicio) => exercicio.grupo !== 'aquecimento');
}

describe('montarSemanaPorRegras (modo offline)', () => {
  it('um treino válido por dia, com o nome do dia e só as áreas escolhidas', () => {
    const resultado = montarSemanaPorRegras(PERFIL, ESCOLHAS);

    expect(respostaTreinosIaSchema.safeParse(resultado).success).toBe(true);
    expect(resultado.treinos.map((treino) => treino.nome)).toEqual([
      'treino de segunda',
      'treino de quarta',
      'treino de sexta',
    ]);

    const [segunda, quarta, sexta] = resultado.treinos;
    expect(new Set(exerciciosSemAquecimento(segunda).map((e) => e.grupo))).toEqual(
      new Set(['braco', 'cardio']),
    );
    // Cardio fica no fim
    expect(segunda.exercicios.at(-1)?.grupo).toBe('cardio');
    expect(exerciciosSemAquecimento(sexta)).toEqual([
      expect.objectContaining({ grupo: 'cardio', repeticoes: '20 min' }),
    ]);

    // Regiões escolhidas: só glúteo na quarta, bíceps e tríceps na segunda
    const regiao = (nome: string) => CATALOGO.find((item) => item.nome === nome)?.regiao;
    expect(exerciciosSemAquecimento(quarta).every((e) => regiao(e.nome) === 'gluteo')).toBe(true);
    expect(
      new Set(
        exerciciosSemAquecimento(segunda)
          .filter((e) => e.grupo === 'braco')
          .map((e) => regiao(e.nome)),
      ),
    ).toEqual(new Set(['biceps', 'triceps']));
  });

  it('aquecimento escolhido primeiro, com repetições ou minutos; desligado, nenhum', () => {
    const comAquecimento = montarSemanaPorRegras(PERFIL, {
      ...ESCOLHAS,
      aquecimento: {
        ativo: true,
        itens: [
          { nome: 'polichinelo', medida: 'repeticoes', valor: 30 },
          { nome: 'bike leve', medida: 'tempo', valor: 5 },
        ],
      },
    });

    expect(comAquecimento.treinos[1].exercicios.slice(0, 2)).toEqual([
      { nome: 'polichinelo', grupo: 'aquecimento', series: 1, repeticoes: '30' },
      { nome: 'bike leve', grupo: 'aquecimento', series: 1, repeticoes: '5 min' },
    ]);

    const sem = montarSemanaPorRegras(PERFIL, {
      ...ESCOLHAS,
      aquecimento: { ativo: false, itens: [] },
    });
    expect(sem.treinos.flatMap((t) => t.exercicios).some((e) => e.grupo === 'aquecimento')).toBe(
      false,
    );
  });

  it('o nível muda a quantidade de exercícios e as séries', () => {
    const dia: EscolhasSemana = {
      ...ESCOLHAS_PADRAO,
      dias: [
        {
          dia: 1,
          areas: [
            { area: 'peito', regioes: [] },
            { area: 'costas', regioes: [] },
          ],
        },
      ],
      aquecimento: { ativo: false, itens: [] },
    };
    const iniciante = montarSemanaPorRegras(PERFIL, { ...dia, nivel: 'iniciante' }).treinos[0];
    const avancado = montarSemanaPorRegras(PERFIL, { ...dia, nivel: 'avancado' }).treinos[0];

    expect(iniciante.exercicios).toHaveLength(5);
    expect(avancado.exercicios).toHaveLength(7);
    expect(avancado.exercicios[0].series).toBe(4);
  });

  it('respeita o equipamento: peso do corpo e halteres não usam máquina', () => {
    const tudo: EscolhasSemana = {
      ...ESCOLHAS_PADRAO,
      nivel: 'avancado',
      dias: [
        {
          dia: 1,
          areas: [
            { area: 'peito', regioes: [] },
            { area: 'costas', regioes: [] },
            { area: 'perna', regioes: [] },
          ],
        },
      ],
    };

    for (const equipamento of ['halteres', 'corpo'] as const) {
      const nomes = montarSemanaPorRegras(PERFIL, { ...tudo, equipamento })
        .treinos[0].exercicios.filter((e) => e.grupo !== 'aquecimento')
        .map((e) => e.nome);

      expect(nomes.length).toBeGreaterThan(0);
      expect(nomes.join(' ')).not.toMatch(/leg press|cadeira|puxada|pulley|cabo|mesa/i);
    }
  });

  it('evita o que a pessoa pediu: exercício pelo nome e lesão', () => {
    const perna: EscolhasSemana = {
      ...ESCOLHAS_PADRAO,
      nivel: 'avancado',
      evitar: 'leg press, dor no joelho',
      dias: [{ dia: 1, areas: [{ area: 'perna', regioes: [] }] }],
    };
    const nomes = montarSemanaPorRegras(PERFIL, perna)
      .treinos[0].exercicios.map((e) => e.nome)
      .join(' ');

    expect(nomes).not.toMatch(/leg press|afundo|búlgaro|agachamento livre/i);
  });

  it('dois dias da mesma área começam de exercícios diferentes', () => {
    const resultado = montarSemanaPorRegras(PERFIL, {
      ...ESCOLHAS_PADRAO,
      aquecimento: { ativo: false, itens: [] },
      dias: [
        { dia: 1, areas: [{ area: 'perna', regioes: [] }] },
        { dia: 4, areas: [{ area: 'perna', regioes: [] }] },
      ],
    });

    expect(resultado.treinos[0].exercicios[0].nome).not.toBe(
      resultado.treinos[1].exercicios[0].nome,
    );
  });

  it('menor de idade: repetições altas e aviso no resumo; texto sem emoji nem travessão', () => {
    const resultado = montarSemanaPorRegras({ ...PERFIL, idade: 15 }, ESCOLHAS);
    const forca = resultado.treinos[0].exercicios.find((e) => e.grupo === 'braco');

    expect(forca?.repeticoes).toBe('12 a 15');
    expect(resultado.resumo).toMatch(/menor de idade/);
    expect(resultado.resumo).not.toMatch(SEM_EMOJI_NEM_TRAVESSAO);
  });

  it('passa por paraDadosTreino e prepararSemana sem perder nenhum dia', () => {
    const dados = prepararSemana(
      paraDadosTreino(montarSemanaPorRegras(PERFIL, ESCOLHAS)),
      ESCOLHAS,
    );

    expect(dados.map((treino) => treino.dias)).toEqual([[1], [3], [5]]);
  });
});

describe('peças do modo offline', () => {
  it('equipamento', () => {
    expect(cabeNoEquipamento({ nome: 'leg press', local: 'academia' }, 'academia')).toBe(true);
    expect(cabeNoEquipamento({ nome: 'leg press', local: 'academia' }, 'halteres')).toBe(false);
    expect(
      cabeNoEquipamento({ nome: 'remada unilateral com halter', local: 'ambos' }, 'halteres'),
    ).toBe(true);
    expect(
      cabeNoEquipamento({ nome: 'remada unilateral com halter', local: 'ambos' }, 'corpo'),
    ).toBe(false);
    expect(cabeNoEquipamento({ nome: 'flexão de braço', local: 'ambos' }, 'corpo')).toBe(true);
  });

  it('evitar por nome, por lesão e pelas restrições do perfil', () => {
    const permitido = filtroDoEvitar('sem stiff e afundo', 'dor no ombro');

    expect(permitido('stiff')).toBe(false);
    expect(permitido('afundo')).toBe(false);
    expect(permitido('desenvolvimento com halteres')).toBe(false);
    expect(permitido('rosca direta')).toBe(true);
    expect(filtroDoEvitar('')('agachamento livre')).toBe(true);
  });
});

describe('prompt da semana', () => {
  it('leva dias, áreas, regiões, nível, equipamento, evitar, aquecimento e o pedido livre', () => {
    const texto = montarPromptSemana(
      { ...PERFIL, idade: 16 },
      {
        ...ESCOLHAS,
        nivel: 'intermediario',
        equipamento: 'halteres',
        evitar: 'dor no joelho',
        livre: 'quero focar em glúteo',
        aquecimento: {
          ativo: true,
          itens: [
            { nome: 'polichinelo', medida: 'repeticoes', valor: 20 },
            { nome: 'bike leve', medida: 'tempo', valor: 5 },
          ],
        },
      },
    );

    expect(texto).toContain('menor de idade');
    expect(texto).toContain('Nível: intermediário');
    expect(texto).toContain('Equipamento: halteres');
    expect(texto).toContain('Evitar (lesões ou exercícios): dor no joelho');
    expect(texto).toContain('Dias de treino (3, um treino por dia):');
    expect(texto).toContain(
      '- treino de segunda: 6 exercícios (braço (bíceps e tríceps) 5; cardio 1), mais o aquecimento',
    );
    expect(texto).toContain(
      '- treino de quarta: 6 exercícios (perna (glúteo) 6), mais o aquecimento',
    );
    expect(texto).toContain('polichinelo 20 repetições; bike leve 5 min');
    expect(texto).toContain('Pedido do usuário: quero focar em glúteo');
    expect(texto).not.toMatch(SEM_EMOJI_NEM_TRAVESSAO);
  });

  it('aquecimento desligado vai dito no prompt; campos vazios não aparecem', () => {
    const texto = montarPromptSemana(PERFIL, {
      ...ESCOLHAS,
      aquecimento: { ativo: false, itens: [] },
    });

    expect(texto).toContain('Aquecimento: desligado');
    expect(texto).not.toContain('Evitar');
    expect(texto).not.toContain('Pedido do usuário');
  });

  it('as instruções fixas pedem um treino por dia, só as áreas e o aquecimento com reps ou tempo', () => {
    expect(SISTEMA_SEMANA).toMatch(/exatamente um treino para cada dia/);
    expect(SISTEMA_SEMANA).toMatch(/somente as áreas/);
    expect(SISTEMA_TREINOS).toMatch(/por repetições \("15"\) ou por tempo/);
    expect(SISTEMA_SEMANA).not.toMatch(SEM_EMOJI_NEM_TRAVESSAO);
    expect(SISTEMA_TREINOS).not.toMatch(SEM_EMOJI_NEM_TRAVESSAO);
  });
});

describe('grupos do modo offline', () => {
  it('todo exercício gerado tem grupo conhecido', () => {
    const resultado = montarSemanaPorRegras(PERFIL, ESCOLHAS);

    for (const exercicio of resultado.treinos.flatMap((t) => t.exercicios)) {
      expect(grupoDe(exercicio)).toBe(exercicio.grupo);
    }
  });
});
