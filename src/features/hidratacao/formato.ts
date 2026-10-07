import { formatarNumero } from '@/shared/lib/numero';

/**
 * Mililitros em litros com vírgula e no máximo 1 casa: 1200 → "1,2", 3000 → "3".
 * O ",0" sai para o card ficar limpo.
 */
export function formatarLitros(ml: number): string {
  const litros = Math.max(ml, 0) / 1000;
  const texto = formatarNumero(Math.round(litros * 10) / 10, 1);

  return texto.endsWith(',0') ? texto.slice(0, -2) : texto;
}

/** Textos do card de água da tela inicial: "1,2" grande e "/3L" pequeno, e a frase falada. */
export function textoAguaCartao(totalMl: number, metaMl: number) {
  const total = formatarLitros(totalMl);
  const meta = formatarLitros(metaMl);

  return {
    total,
    meta: `/${meta}L`,
    acessivel: `água, ${total} de ${meta} litros hoje`,
  };
}
