/**
 * Primeira letra minúscula, como os títulos do app ("Treino A" vira "treino A").
 * Siglas no começo ("HIIT na esteira") ficam como estão.
 */
export function minusculaInicial(texto: string | undefined): string {
  if (!texto) {
    return '';
  }

  const primeiraPalavra = texto.trim().split(/\s+/)[0] ?? '';

  if (
    primeiraPalavra.length > 1 &&
    primeiraPalavra === primeiraPalavra.toLocaleUpperCase('pt-BR')
  ) {
    return texto;
  }

  return texto.charAt(0).toLocaleLowerCase('pt-BR') + texto.slice(1);
}
