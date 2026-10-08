import type { BlocoDoTreino } from './grupos';

/**
 * Uma linha da grade "bento" do treino de hoje:
 * - inteira: o card ocupa a largura toda (aquecimento, ou o grupo que sobrar)
 * - par: dois cards do mesmo tamanho lado a lado
 */
export type LinhaGrade =
  | { tipo: 'inteira'; bloco: BlocoDoTreino }
  | { tipo: 'par'; blocos: [BlocoDoTreino, BlocoDoTreino] };

/**
 * Monta a grade do treino de hoje (só cards de grupo; água e dieta ficam na
 * seção "seu dia"): aquecimento em cima, de largura toda; os outros grupos de
 * dois em dois; se sobrar um, ele fecha a grade de largura toda.
 */
export function montarGrade(blocos: readonly BlocoDoTreino[]): LinhaGrade[] {
  const linhas: LinhaGrade[] = [];
  const resto = blocos.filter((bloco) => bloco.grupo !== 'aquecimento');
  const aquecimento = blocos.find((bloco) => bloco.grupo === 'aquecimento');

  if (aquecimento) {
    linhas.push({ tipo: 'inteira', bloco: aquecimento });
  }

  for (let i = 0; i + 1 < resto.length; i += 2) {
    linhas.push({ tipo: 'par', blocos: [resto[i], resto[i + 1]] });
  }

  if (resto.length % 2 === 1) {
    linhas.push({ tipo: 'inteira', bloco: resto[resto.length - 1] });
  }

  return linhas;
}
