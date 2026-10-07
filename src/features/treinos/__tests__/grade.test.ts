import { caloriasNaGrade, montarGrade, type ItemGrade, type LinhaGrade } from '../grade';
import type { BlocoDoTreino } from '../grupos';
import type { GrupoMuscular } from '../types';

function bloco(grupo: GrupoMuscular): BlocoDoTreino {
  return { grupo, esquema: '3x12', exercicios: [] };
}

function nome(item: ItemGrade): string {
  return item.tipo === 'bloco' ? item.bloco.grupo : item.tipo;
}

/** A grade como texto, para comparar fácil: "aquecimento | braco+perna | cardio+agua". */
function desenho(linhas: LinhaGrade[]): string {
  return linhas
    .map((linha) => (linha.tipo === 'inteira' ? nome(linha.item) : linha.itens.map(nome).join('+')))
    .join(' | ');
}

describe('montarGrade', () => {
  it('fica igual ao desenho de referência', () => {
    const linhas = montarGrade(
      ['aquecimento', 'braco', 'perna', 'abdominal', 'costas', 'cardio'].map((grupo) =>
        bloco(grupo as GrupoMuscular),
      ),
    );

    expect(desenho(linhas)).toBe('aquecimento | braco+perna | abdominal+costas | cardio+agua');
    expect(linhas[linhas.length - 1]).toMatchObject({ tipo: 'par', largo: true });
    expect(linhas[1]).toMatchObject({ tipo: 'par', largo: false });
    expect(caloriasNaGrade(linhas)).toBe(false);
  });

  it('com número par de grupos, a água divide a linha com as calorias', () => {
    const linhas = montarGrade([bloco('peito'), bloco('ombro')]);

    expect(desenho(linhas)).toBe('peito+ombro | calorias+agua');
    expect(caloriasNaGrade(linhas)).toBe(true);
  });

  it('só aquecimento', () => {
    expect(desenho(montarGrade([bloco('aquecimento')]))).toBe('aquecimento | calorias+agua');
  });

  it('treino vazio ainda mostra água e calorias', () => {
    expect(desenho(montarGrade([]))).toBe('calorias+agua');
  });
});
