import { montarGrade, type LinhaGrade } from '../grade';
import type { BlocoDoTreino } from '../grupos';
import type { GrupoMuscular } from '../types';

function bloco(grupo: GrupoMuscular): BlocoDoTreino {
  return { grupo, esquema: '3x12', exercicios: [] };
}

/** A grade como texto, para comparar fácil: "aquecimento | braco+perna | cardio". */
function desenho(linhas: LinhaGrade[]): string {
  return linhas
    .map((linha) =>
      linha.tipo === 'inteira' ? linha.bloco.grupo : linha.blocos.map((b) => b.grupo).join('+'),
    )
    .join(' | ');
}

describe('montarGrade', () => {
  it('aquecimento em cima, grupos em pares e o que sobra de largura toda', () => {
    const linhas = montarGrade(
      ['aquecimento', 'braco', 'perna', 'abdominal', 'costas', 'cardio'].map((grupo) =>
        bloco(grupo as GrupoMuscular),
      ),
    );

    expect(desenho(linhas)).toBe('aquecimento | braco+perna | abdominal+costas | cardio');
    expect(linhas[linhas.length - 1]).toMatchObject({ tipo: 'inteira' });
  });

  it('número par de grupos: só pares', () => {
    expect(desenho(montarGrade([bloco('peito'), bloco('ombro')]))).toBe('peito+ombro');
  });

  it('um grupo só ocupa a largura toda', () => {
    expect(desenho(montarGrade([bloco('aquecimento'), bloco('perna')]))).toBe(
      'aquecimento | perna',
    );
  });

  it('só aquecimento', () => {
    expect(desenho(montarGrade([bloco('aquecimento')]))).toBe('aquecimento');
  });

  it('treino vazio não tem grade (água e dieta ficam em "seu dia")', () => {
    expect(montarGrade([])).toEqual([]);
  });

  it('nunca deixa um card sozinho pela metade', () => {
    const grupos = ['peito', 'costas', 'ombro', 'braco', 'perna', 'abdominal', 'cardio'] as const;

    for (let n = 0; n <= grupos.length; n++) {
      const linhas = montarGrade(grupos.slice(0, n).map(bloco));
      const cards = linhas.reduce((soma, l) => soma + (l.tipo === 'par' ? 2 : 1), 0);

      expect(cards).toBe(n);
      expect(linhas.filter((l) => l.tipo === 'inteira')).toHaveLength(n % 2);
    }
  });
});
