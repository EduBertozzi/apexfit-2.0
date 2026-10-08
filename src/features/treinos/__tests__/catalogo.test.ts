import {
  buscarNoCatalogo,
  CATALOGO,
  exerciciosDe,
  GRUPOS_MUSCULACAO,
  MISTO,
  REGIOES,
  regioesComMisto,
  semRepetidos,
  sugerir,
} from '../catalogo';
import { ORDEM_GRUPOS } from '../grupos';
import { exercicioSchema } from '../schema';

describe('catálogo', () => {
  it('não repete nomes', () => {
    const nomes = CATALOGO.map((item) => item.nome.toLocaleLowerCase('pt-BR'));

    expect(new Set(nomes).size).toBe(nomes.length);
  });

  it('toda região tem exercício e todo exercício tem região válida', () => {
    for (const grupo of [...GRUPOS_MUSCULACAO, 'cardio' as const]) {
      for (const regiao of REGIOES[grupo]) {
        expect(exerciciosDe(grupo, regiao.id).length).toBeGreaterThan(0);
      }
    }

    for (const item of CATALOGO) {
      expect(REGIOES[item.grupo].map((regiao) => regiao.id)).toContain(item.regiao);
      expect(ORDEM_GRUPOS).toContain(item.grupo);
    }
  });

  it('todo exercício passa na validação do formulário', () => {
    for (const item of CATALOGO) {
      const resultado = exercicioSchema.safeParse({
        nome: item.nome,
        grupo: item.grupo,
        series: String(item.series),
        repeticoes: item.repeticoes,
        cargaKg: '',
        observacao: '',
      });

      expect(resultado.success).toBe(true);
    }
  });

  it('cardio vem com 1 x 10 min', () => {
    for (const item of exerciciosDe('cardio')) {
      expect(item.series).toBe(1);
      expect(item.repeticoes).toBe('10 min');
    }
  });

  it('textos sem emoji nem travessão', () => {
    const textos = [
      ...CATALOGO.map((item) => item.nome),
      ...Object.values(REGIOES).flatMap((lista) => lista.map((regiao) => regiao.nome)),
    ];

    for (const texto of textos) {
      expect(texto).not.toMatch(/[–—]|\p{Extended_Pictographic}/u);
    }
  });
});

describe('regioesComMisto', () => {
  it('põe misto na frente quando o grupo tem várias regiões', () => {
    expect(regioesComMisto('braco').map((regiao) => regiao.id)).toEqual([
      MISTO,
      'biceps',
      'triceps',
      'antebraco',
    ]);
    expect(regioesComMisto('outro')).toEqual([]);
  });
});

describe('exerciciosDe', () => {
  it('filtra pela região', () => {
    const triceps = exerciciosDe('braco', 'triceps');

    expect(triceps.length).toBeGreaterThan(0);
    expect(triceps.every((item) => item.regiao === 'triceps')).toBe(true);
  });

  it('misto (ou sem região) intercala as regiões', () => {
    const misto = exerciciosDe('braco', MISTO);

    expect(misto.slice(0, 3).map((item) => item.regiao)).toEqual([
      'biceps',
      'triceps',
      'antebraco',
    ]);
    expect(exerciciosDe('braco')).toEqual(misto);
    expect(misto).toHaveLength(CATALOGO.filter((item) => item.grupo === 'braco').length);
  });
});

describe('sugerir', () => {
  it('é determinístico e respeita a quantidade', () => {
    const primeira = sugerir('perna', 'quadriceps', 2);

    expect(primeira.map((item) => item.nome)).toEqual(['agachamento livre', 'leg press']);
    expect(sugerir('perna', 'quadriceps', 2)).toEqual(primeira);
    expect(sugerir('perna', 'quadriceps', 0)).toEqual([]);
  });

  it('pula o que já está no treino, sem ligar para acento ou maiúscula', () => {
    const nomes = sugerir('perna', 'quadriceps', 2, ['agachamento LIVRE']).map((item) => item.nome);

    expect(nomes).toEqual(['leg press', 'cadeira extensora']);
  });

  it('misto sugere uma de cada região', () => {
    expect(sugerir('peito', MISTO, 3).map((item) => item.regiao)).toEqual([
      'superior',
      'medio',
      'inferior',
    ]);
  });

  it('pedir mais do que existe devolve só o que tem', () => {
    const todos = exerciciosDe('braco', 'antebraco');

    expect(sugerir('braco', 'antebraco', 50)).toHaveLength(todos.length);
  });
});

describe('semRepetidos e buscarNoCatalogo', () => {
  it('acha pelo nome normalizado', () => {
    expect(buscarNoCatalogo('triceps corda')?.grupo).toBe('braco');
    expect(buscarNoCatalogo('não existe')).toBeUndefined();
    expect(
      semRepetidos(exerciciosDe('cardio'), ['ESTEIRA']).map((item) => item.nome),
    ).not.toContain('Esteira');
  });
});
