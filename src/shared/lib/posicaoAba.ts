/**
 * Onde fica a pílula da aba ativa dentro da barra: abas de largura igual,
 * com `respiro` nas bordas da barra e `vao` entre elas.
 */
export function posicaoDaAba(
  larguraBarra: number,
  quantidade: number,
  indice: number,
  respiro: number,
  vao: number,
): { x: number; largura: number } {
  if (larguraBarra <= 0 || quantidade <= 0) {
    return { x: 0, largura: 0 };
  }

  const util = larguraBarra - 2 * respiro - vao * (quantidade - 1);
  const largura = Math.max(0, util / quantidade);
  const posicao = Math.min(Math.max(indice, 0), quantidade - 1);

  return { x: respiro + posicao * (largura + vao), largura };
}
