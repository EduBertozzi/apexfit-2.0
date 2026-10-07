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

/**
 * Litros para o leitor de tela, com até 2 casas: 1450 → "1,45", 1500 → "1,5",
 * 3000 → "3". O card arredonda para 1 casa; a frase falada pode ser exata.
 */
export function formatarLitrosFalado(ml: number): string {
  const litros = Math.round(Math.max(ml, 0) / 10) / 100;

  return formatarNumero(litros, 2).replace(/,?0+$/, '');
}

/** Dica do card de água da tela inicial (o que o toque e o toque longo fazem). */
export function dicaAguaCartao(porcaoMl: number): string {
  return `toque para somar ${porcaoMl} ml. toque e segure para desfazer o último copo`;
}

function deLitros(totalMl: number, metaMl: number): string {
  return `${formatarLitrosFalado(totalMl)} de ${formatarLitrosFalado(metaMl)} litros`;
}

/** Anúncio depois do toque: "mais 250 ml, 1,45 de 3 litros". */
export function anuncioAguaAdicionada(
  ml: number,
  totalMl: number,
  metaMl: number,
  bateuMeta: boolean,
): string {
  const base = `mais ${ml} ml, ${deLitros(totalMl, metaMl)}`;

  return bateuMeta ? `${base}. meta de água batida, boa!` : base;
}

/** Anúncio do desfazer: "desfeito, menos 250 ml, 1,2 de 3 litros". `null` = nada para desfazer. */
export function anuncioAguaDesfeita(ml: number | null, totalMl: number, metaMl: number): string {
  if (ml === null) {
    return 'nada para desfazer hoje';
  }

  return `desfeito, menos ${ml} ml, ${deLitros(totalMl, metaMl)}`;
}
