import type { Perfil } from '@/features/perfil/types';

import { DIAS_POR_SEMANA, respostaTreinosIaSchema, type PreferenciasTreino } from '../contratoIa';
import { inferirGrupo } from '../grupos';
import { paraDadosTreino } from '../ia';
import { exerciciosPorTempo, montarPromptTreinos, SISTEMA_TREINOS } from '../promptIa';
import { montarTreinosPorRegras } from '../regrasIa';

const PERFIL: Perfil = {
  nome: 'Eduardo',
  idade: 21,
  alturaCm: 188,
  pesoKg: 75,
  sexo: 'masculino',
  nivelAtividade: 'moderado',
  objetivo: 'ganhar',
};

const PREFS: PreferenciasTreino = { diasPorSemana: 3, local: 'academia', minutos: 60 };

const SEM_EMOJI_NEM_TRAVESSAO = /[–—]|\p{Extended_Pictographic}/u;

describe('montarTreinosPorRegras', () => {
  it.each(DIAS_POR_SEMANA)('monta %i treinos válidos, de A em diante', (dias) => {
    const resultado = montarTreinosPorRegras(PERFIL, { ...PREFS, diasPorSemana: dias });

    expect(respostaTreinosIaSchema.safeParse(resultado).success).toBe(true);
    expect(resultado.treinos.map((treino) => treino.nome)).toEqual(
      [...'ABCDEF'].slice(0, dias).map((letra) => `Treino ${letra}`),
    );
  });

  it('começa com aquecimento e termina com cardio quando cabe', () => {
    const { treinos } = montarTreinosPorRegras(PERFIL, PREFS);

    for (const treino of treinos) {
      expect(treino.exercicios[0].grupo).toBe('aquecimento');
      expect(treino.exercicios[treino.exercicios.length - 1].grupo).toBe('cardio');
    }
  });

  it('respeita o tempo: mais minutos, mais exercícios', () => {
    const forca = (minutos: PreferenciasTreino['minutos']) =>
      montarTreinosPorRegras(PERFIL, { ...PREFS, minutos }).treinos[0].exercicios.filter(
        (exercicio) => !['aquecimento', 'cardio'].includes(exercicio.grupo),
      ).length;

    expect(forca(30)).toBe(exerciciosPorTempo(30));
    expect(forca(90)).toBe(exerciciosPorTempo(90));
    expect(forca(90)).toBeGreaterThan(forca(30));
  });

  it('em casa não usa máquina, barra nem polia', () => {
    const { treinos } = montarTreinosPorRegras(PERFIL, {
      ...PREFS,
      local: 'casa',
      diasPorSemana: 6,
    });
    const nomes = treinos.flatMap((treino) => treino.exercicios.map((e) => e.nome)).join(' | ');

    expect(nomes).not.toMatch(
      /máquina|barra|polia|leg press|cadeira extensora|mesa flexora|esteira/i,
    );
  });

  it('o grupo de cada exercício bate com o nome (os cards da tela inicial dependem disso)', () => {
    for (const local of ['academia', 'casa'] as const) {
      const { treinos } = montarTreinosPorRegras(PERFIL, { ...PREFS, local, diasPorSemana: 5 });

      for (const exercicio of treinos.flatMap((treino) => treino.exercicios)) {
        if (!['aquecimento', 'cardio'].includes(exercicio.grupo)) {
          expect([exercicio.nome, inferirGrupo(exercicio.nome)]).toEqual([
            exercicio.nome,
            exercicio.grupo,
          ]);
        }
      }
    }
  });

  it('com dor no joelho, tira afundo, búlgaro e agachamento livre', () => {
    const { treinos, resumo } = montarTreinosPorRegras(
      { ...PERFIL, restricoes: 'Dor no joelho direito' },
      { ...PREFS, local: 'casa', diasPorSemana: 4 },
    );
    const nomes = treinos.flatMap((treino) => treino.exercicios.map((e) => e.nome)).join(' | ');

    expect(nomes).not.toMatch(/afundo|búlgaro|agachamento livre|corrida|polichinelo/i);
    expect(resumo).toContain('profissional');
  });

  it('menor de idade: repetições altas e aviso de carga leve', () => {
    const { treinos, resumo } = montarTreinosPorRegras({ ...PERFIL, idade: 15 }, PREFS);
    const forca = treinos[0].exercicios.filter((e) => e.grupo === 'peito');

    expect(forca.every((e) => e.repeticoes === '12 a 15')).toBe(true);
    expect(resumo).toMatch(/carga leve/);
  });

  it('textos sem emoji nem travessão e com repetições que o formulário aceita', () => {
    const resultado = montarTreinosPorRegras({ ...PERFIL, objetivo: 'perder' }, PREFS);

    expect(JSON.stringify(resultado)).not.toMatch(SEM_EMOJI_NEM_TRAVESSAO);
    expect(paraDadosTreino(resultado).flatMap((t) => t.exercicios ?? [])).toHaveLength(
      resultado.treinos.flatMap((t) => t.exercicios).length,
    );
  });
});

describe('prompt dos treinos', () => {
  it('pede aquecimento, cardio, nomes brasileiros e proíbe emoji e travessão', () => {
    expect(SISTEMA_TREINOS).toMatch(/aquecimento/);
    expect(SISTEMA_TREINOS).toMatch(/cardio/);
    expect(SISTEMA_TREINOS).toMatch(/Nunca use emoji. Nunca use travessão/);
    expect(SISTEMA_TREINOS).not.toMatch(SEM_EMOJI_NEM_TRAVESSAO);
  });

  it('leva perfil, preferências e o alerta de menor de idade', () => {
    const texto = montarPromptTreinos(
      { ...PERFIL, idade: 16, restricoes: 'asma' },
      { diasPorSemana: 4, local: 'casa', minutos: 45, foco: 'mais glúteo' },
    );

    expect(texto).toContain('menor de idade');
    expect(texto).toContain('Dias de treino por semana: 4');
    expect(texto).toContain('em casa, sem aparelhos');
    expect(texto).toContain('45 minutos');
    expect(texto).toContain('Restrições/Saúde: asma');
    expect(texto).toContain('Pedido do usuário: mais glúteo');
  });
});
