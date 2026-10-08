import type { PlanoDieta } from './contrato';

/**
 * Texto que vem da IA às vezes chega com markdown (**negrito**, "### título",
 * "- item"), travessão ou espaços sobrando. O app mostra texto puro: estas
 * funções limpam tudo antes de exibir ou salvar. Lógica pura.
 */

/** Tira markdown e sobras de formatação de uma linha de texto. */
export function limparTextoIa(texto: string): string {
  return (
    texto
      // Títulos ("### Almoço") e citações ("> dica")
      .replace(/^\s*#{1,6}\s*/gm, '')
      .replace(/^\s*>\s?/gm, '')
      // Marcadores de lista no começo da linha ("- ", "* ", "• ", "1. ")
      .replace(/^\s*(?:[-*+•·]|\d+[.)])\s+/gm, '')
      // Negrito, itálico, tachado e código: fica só o texto
      .replace(/(\*\*|__)(.+?)\1/g, '$2')
      .replace(/(^|[^\w*])\*(?!\s)([^*\n]+?)\*(?!\w)/g, '$1$2')
      .replace(/(^|\W)_(?!\s)([^_\n]+?)_(?!\w)/g, '$1$2')
      .replace(/~~(.+?)~~/g, '$1')
      .replace(/`+([^`]*)`+/g, '$1')
      // Asteriscos soltos que sobraram
      .replace(/\*+/g, '')
      // Links [texto](url) viram só o texto
      .replace(/\[([^\]]+)\]\([^)]*\)/g, '$1')
      // Travessão e meia-risca viram vírgula (regra da copy do app)
      .replace(/\s*[—–]\s*/g, ', ')
      // Quebras de linha e espaços repetidos
      .replace(/\s*\n+\s*/g, ' ')
      .replace(/\s{2,}/g, ' ')
      .replace(/\s+([,.;:!?])/g, '$1')
      .replace(/,{2,}/g, ',')
      .replace(/^[\s,;:]+|[\s,;]+$/g, '')
      .trim()
  );
}

/** Lista de textos limpa: sem itens vazios e sem repetidos. */
export function limparLista(lista: readonly string[]): string[] {
  const vistos = new Set<string>();

  return lista.map(limparTextoIa).filter((item) => {
    const chave = item.toLowerCase();

    if (item === '' || vistos.has(chave)) {
      return false;
    }

    vistos.add(chave);
    return true;
  });
}

/** O plano inteiro com todos os textos limpos. Números ficam como estão. */
export function limparPlano(plano: PlanoDieta): PlanoDieta {
  return {
    ...plano,
    resumo: limparTextoIa(plano.resumo),
    aviso: limparTextoIa(plano.aviso),
    dicas: limparLista(plano.dicas),
    refeicoes: plano.refeicoes.map((refeicao) => ({
      ...refeicao,
      nome: limparTextoIa(refeicao.nome),
      horario: limparTextoIa(refeicao.horario),
      substituicoes: limparLista(refeicao.substituicoes),
      itens: refeicao.itens
        .map((item) => ({
          alimento: limparTextoIa(item.alimento),
          quantidade: limparTextoIa(item.quantidade),
        }))
        .filter((item) => item.alimento !== ''),
    })),
  };
}

export type QuantidadeSeparada = {
  /** Medida curta para a coluna da direita: "250 g", "2 unidades". `null` se não deu para separar. */
  principal: string | null;
  /** O resto, embaixo do nome: "cerca de 1 xícara e meia". */
  detalhe: string | null;
};

/** Até onde a medida principal cabe na coluna da direita sem apertar o nome. */
export const MAXIMO_PRINCIPAL = 14;

const MEDIDA =
  /^(\d+(?:[.,]\d+)?(?:\s*(?:a|-)\s*\d+(?:[.,]\d+)?)?)\s*(kg|g|mg|ml|l|unidades?|un|fatias?|colher(?:es)?(?: de (?:sopa|chá))?|xícaras?|copos?|conchas?|potes?|scoops?)?(?![\p{L}\d])\s*(.*)$/iu;

/** Texto curto inteiro na direita; comprido, inteiro embaixo do nome. */
function inteiro(texto: string): QuantidadeSeparada {
  return texto.length <= MAXIMO_PRINCIPAL
    ? { principal: texto, detalhe: null }
    : { principal: null, detalhe: texto };
}

/**
 * "250 g, cerca de 1 xícara e meia" vira { principal: "250 g", detalhe: "cerca
 * de 1 xícara e meia" }; "120 g (4 colheres)" vira { "120 g", "4 colheres" }.
 * Texto que não começa com número e medida fica inteiro (curto na direita,
 * comprido embaixo do nome).
 */
export function separarQuantidade(quantidade: string): QuantidadeSeparada {
  const texto = limparTextoIa(quantidade);

  if (texto === '') {
    return { principal: null, detalhe: null };
  }

  const achado = MEDIDA.exec(texto);

  // Sem unidade ("1 banana") ou medida que continua ("1 xícara e meia"): não corta
  if (!achado || !achado[2] || /^(e|de|da|do|com)\b/i.test(achado[3])) {
    return inteiro(texto);
  }

  const principal = `${achado[1]} ${achado[2]}`.replace(/\s+/g, ' ').trim();
  const detalhe = achado[3]
    .replace(/^[\s,;:(-]+/, '')
    .replace(/\)\s*$/, '')
    .replace(/^ou\s+/i, '')
    .trim();

  if (principal.length > MAXIMO_PRINCIPAL) {
    return inteiro(texto);
  }

  return { principal, detalhe: detalhe === '' ? null : detalhe };
}
