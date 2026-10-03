/**
 * Transforma uma data na "chave do dia" no formato AAAA-MM-DD, no fuso do aparelho.
 *
 * Não usamos `toISOString()` porque ele converte para UTC: às 22h no Brasil
 * (UTC-3) ele já devolveria o dia seguinte, e a água bebida à noite
 * cairia no dia errado.
 */
export function chaveDoDia(data: Date): string {
  const ano = data.getFullYear();
  const mes = String(data.getMonth() + 1).padStart(2, '0');
  const dia = String(data.getDate()).padStart(2, '0');

  return `${ano}-${mes}-${dia}`;
}

/** "sexta-feira, 2 de outubro" → "Sexta-feira, 2 de outubro" */
export function dataPorExtenso(data: Date): string {
  const texto = data.toLocaleDateString('pt-BR', {
    weekday: 'long',
    day: 'numeric',
    month: 'long',
  });

  return texto.charAt(0).toUpperCase() + texto.slice(1);
}

/** Diferença em dias inteiros entre duas chaves AAAA-MM-DD (b - a). */
export function diasEntre(a: string, b: string): number {
  const UM_DIA_MS = 24 * 60 * 60 * 1000;
  const inicio = Date.UTC(Number(a.slice(0, 4)), Number(a.slice(5, 7)) - 1, Number(a.slice(8, 10)));
  const fim = Date.UTC(Number(b.slice(0, 4)), Number(b.slice(5, 7)) - 1, Number(b.slice(8, 10)));

  return Math.round((fim - inicio) / UM_DIA_MS);
}
