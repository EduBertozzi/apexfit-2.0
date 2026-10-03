// Aceita "70", "70.5" e "70,5" (teclado brasileiro usa vírgula).
// Recusa letras, sinais, notação científica e separador sozinho ("." ou ",").
const PADRAO_DECIMAL = /^\d+([.,]\d+)?$/;

const PADRAO_INTEIRO = /^\d+$/;

/**
 * Converte o texto digitado pelo usuário em número.
 * Retorna `null` quando o texto não é um número válido.
 *
 * Na v1, `Double.parseDouble("1,75")` fechava o app. Aqui o erro vira `null`
 * e quem chamou decide qual mensagem mostrar.
 */
export function paraDecimal(texto: string): number | null {
  const limpo = texto.trim();

  if (!PADRAO_DECIMAL.test(limpo)) {
    return null;
  }

  return Number(limpo.replace(',', '.'));
}

/** Igual a `paraDecimal`, mas só aceita números inteiros ("16", e não "16,5"). */
export function paraInteiro(texto: string): number | null {
  const limpo = texto.trim();

  if (!PADRAO_INTEIRO.test(limpo)) {
    return null;
  }

  return Number(limpo);
}

/** Formata para exibir no padrão brasileiro: 1234.5 → "1.234,5" */
export function formatarNumero(valor: number, casasDecimais = 0): string {
  return valor.toLocaleString('pt-BR', {
    minimumFractionDigits: casasDecimais,
    maximumFractionDigits: casasDecimais,
  });
}
