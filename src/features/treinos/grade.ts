import type { BlocoDoTreino } from './grupos';

/** Um item da grade "bento" da tela inicial. */
export type ItemGrade =
  { tipo: 'bloco'; bloco: BlocoDoTreino } | { tipo: 'agua' } | { tipo: 'calorias' };

/**
 * Uma linha da grade:
 * - inteira: o aquecimento ocupa a largura toda
 * - par: dois cards lado a lado; `largo` diz se o primeiro é maior que o segundo
 *   (card ao lado do quadradinho de água)
 */
export type LinhaGrade =
  | { tipo: 'inteira'; item: ItemGrade }
  | { tipo: 'par'; itens: [ItemGrade, ItemGrade]; largo: boolean };

/**
 * Monta a grade como no desenho de referência:
 * aquecimento em cima, de largura toda; os outros grupos de dois em dois;
 * a água vira um card quadrado ao lado do último grupo que sobrar sozinho,
 * ou divide a última linha com o card de calorias.
 */
export function montarGrade(blocos: readonly BlocoDoTreino[]): LinhaGrade[] {
  const linhas: LinhaGrade[] = [];
  const resto = blocos.filter((bloco) => bloco.grupo !== 'aquecimento');
  const aquecimento = blocos.find((bloco) => bloco.grupo === 'aquecimento');

  if (aquecimento) {
    linhas.push({ tipo: 'inteira', item: { tipo: 'bloco', bloco: aquecimento } });
  }

  for (let i = 0; i + 1 < resto.length; i += 2) {
    linhas.push({
      tipo: 'par',
      itens: [
        { tipo: 'bloco', bloco: resto[i] },
        { tipo: 'bloco', bloco: resto[i + 1] },
      ],
      largo: false,
    });
  }

  if (resto.length % 2 === 1) {
    linhas.push({
      tipo: 'par',
      itens: [{ tipo: 'bloco', bloco: resto[resto.length - 1] }, { tipo: 'agua' }],
      largo: true,
    });
  } else {
    linhas.push({ tipo: 'par', itens: [{ tipo: 'calorias' }, { tipo: 'agua' }], largo: true });
  }

  return linhas;
}

/** O card de calorias já está na grade (ao lado da água)? Se não, vai embaixo dela. */
export function caloriasNaGrade(linhas: readonly LinhaGrade[]): boolean {
  return linhas.some(
    (linha) => linha.tipo === 'par' && linha.itens.some((item) => item.tipo === 'calorias'),
  );
}
