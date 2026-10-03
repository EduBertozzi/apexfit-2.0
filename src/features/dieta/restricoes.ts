import type { Alimento, Tag } from './alimentos';

/** Minúsculas e sem acento: "Intolerância à Lactose" → "intolerancia a lactose". */
export function normalizarTexto(texto: string): string {
  return texto
    .toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '');
}

export type Restricoes = {
  bloqueadas: ReadonlySet<Tag>;
  /** Como a adaptação aparece no resumo, ex: "sem lactose", "vegetariano". */
  rotulos: string[];
};

type Regra = { padrao: RegExp; bloqueia: Tag[]; rotulo: string };

const REGRAS: Regra[] = [
  {
    padrao: /vegan/,
    bloqueia: ['carne', 'peixe', 'ovo', 'laticinio', 'lactose'],
    rotulo: 'vegano',
  },
  {
    padrao: /vegetarian|nao como carne/,
    bloqueia: ['carne', 'peixe'],
    rotulo: 'vegetariano',
  },
  { padrao: /lactose/, bloqueia: ['lactose'], rotulo: 'sem lactose' },
  {
    padrao: /aplv|alergi\w*\s+(a|ao|de)?\s*(leite|proteina do leite)/,
    bloqueia: ['lactose', 'laticinio'],
    rotulo: 'sem leite e derivados',
  },
  { padrao: /gluten|celiac/, bloqueia: ['gluten'], rotulo: 'sem glúten' },
  { padrao: /amendoim/, bloqueia: ['amendoim'], rotulo: 'sem amendoim' },
  { padrao: /castanha|nozes|oleaginosa/, bloqueia: ['castanha'], rotulo: 'sem castanhas' },
  {
    padrao: /alergi\w*\s+(a|ao|de)?\s*(peixe|frutos do mar)/,
    bloqueia: ['peixe'],
    rotulo: 'sem peixe',
  },
  { padrao: /alergi\w*\s+(a|ao|de)?\s*ovos?\b/, bloqueia: ['ovo'], rotulo: 'sem ovo' },
];

/** Lê as restrições escritas livremente no perfil por palavras-chave. */
export function lerRestricoes(texto: string | undefined): Restricoes {
  const bloqueadas = new Set<Tag>();
  const rotulos: string[] = [];
  const normal = normalizarTexto(texto ?? '');

  for (const regra of REGRAS) {
    if (!regra.padrao.test(normal)) {
      continue;
    }

    // "vegano" já cobre "vegetariano" e "sem lactose": não repete no resumo
    const coberta = regra.bloqueia.every((tag) => bloqueadas.has(tag));

    regra.bloqueia.forEach((tag) => bloqueadas.add(tag));

    if (!coberta) {
      rotulos.push(regra.rotulo);
    }
  }

  return { bloqueadas, rotulos };
}

export function alimentoPermitido(alimento: Alimento, restricoes: Restricoes): boolean {
  return !(alimento.tags ?? []).some((tag) => restricoes.bloqueadas.has(tag));
}
