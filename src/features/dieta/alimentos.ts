/**
 * Tabela de alimentos do dia a dia brasileiro, usada pela dieta montada por
 * regras (modo demonstração, sem IA). Valores aproximados da tabela TACO.
 *
 * - `gramas` e `ml`: nutrientes por 100 g (ou 100 ml).
 * - `unidade`: nutrientes por unidade (1 ovo, 1 fatia, 1 banana).
 * - `livre`: quantidade fixa (`base`) e texto próprio, ex: salada à vontade.
 */

export type Tag =
  'carne' | 'peixe' | 'ovo' | 'lactose' | 'laticinio' | 'gluten' | 'amendoim' | 'castanha';

export type Medida = {
  singular: string;
  plural: string;
  /** Gramas (ou ml) de uma medida caseira. Não usado em `unidade`. */
  gramas: number;
  genero: 'm' | 'f';
};

export type Alimento = {
  id: string;
  nome: string;
  tipo: 'gramas' | 'ml' | 'unidade' | 'livre';
  kcal: number;
  proteina: number;
  carboidrato: number;
  gordura: number;
  /** Arredondamento da porção (10 g, 5 g, 1 unidade). */
  passo: number;
  min: number;
  max: number;
  medida: Medida;
  tags?: Tag[];
  /** Alimentos equivalentes, na ordem de preferência, para as substituições. */
  trocas?: string[];
  /** Só para `livre`: quantidade fixa e o texto exibido. */
  base?: number;
  texto?: string;
};

const colherSopa = (gramas: number): Medida => ({
  singular: 'colher de sopa',
  plural: 'colheres de sopa',
  gramas,
  genero: 'f',
});

const UNIDADE: Medida = { singular: 'unidade', plural: 'unidades', gramas: 0, genero: 'f' };
const FATIA: Medida = { singular: 'fatia', plural: 'fatias', gramas: 0, genero: 'f' };

const LISTA: Alimento[] = [
  // Carboidratos
  {
    id: 'arroz',
    nome: 'Arroz branco',
    tipo: 'gramas',
    kcal: 128,
    proteina: 2.5,
    carboidrato: 28.1,
    gordura: 0.2,
    passo: 10,
    min: 50,
    max: 350,
    medida: { singular: 'colher de servir', plural: 'colheres de servir', gramas: 45, genero: 'f' },
    trocas: ['batata-doce', 'mandioca', 'macarrao', 'cuscuz'],
  },
  {
    id: 'arroz-integral',
    nome: 'Arroz integral',
    tipo: 'gramas',
    kcal: 124,
    proteina: 2.6,
    carboidrato: 25.8,
    gordura: 1,
    passo: 10,
    min: 50,
    max: 350,
    medida: { singular: 'colher de servir', plural: 'colheres de servir', gramas: 45, genero: 'f' },
    trocas: ['arroz', 'batata-doce', 'mandioca'],
  },
  {
    id: 'feijao',
    nome: 'Feijão carioca',
    tipo: 'gramas',
    kcal: 76,
    proteina: 4.8,
    carboidrato: 13.6,
    gordura: 0.5,
    passo: 10,
    min: 50,
    max: 300,
    medida: { singular: 'concha', plural: 'conchas', gramas: 90, genero: 'f' },
    trocas: ['lentilha', 'grao-de-bico'],
  },
  {
    id: 'lentilha',
    nome: 'Lentilha',
    tipo: 'gramas',
    kcal: 93,
    proteina: 6.3,
    carboidrato: 16.3,
    gordura: 0.5,
    passo: 10,
    min: 50,
    max: 300,
    medida: { singular: 'concha', plural: 'conchas', gramas: 90, genero: 'f' },
    trocas: ['feijao', 'grao-de-bico'],
  },
  {
    id: 'grao-de-bico',
    nome: 'Grão-de-bico',
    tipo: 'gramas',
    kcal: 164,
    proteina: 8.9,
    carboidrato: 27.4,
    gordura: 2.6,
    passo: 10,
    min: 50,
    max: 300,
    medida: colherSopa(22),
    trocas: ['lentilha', 'feijao'],
  },
  {
    id: 'batata-doce',
    nome: 'Batata-doce cozida',
    tipo: 'gramas',
    kcal: 77,
    proteina: 0.6,
    carboidrato: 18.4,
    gordura: 0.1,
    passo: 10,
    min: 80,
    max: 400,
    medida: { singular: 'unidade média', plural: 'unidades médias', gramas: 150, genero: 'f' },
    trocas: ['mandioca', 'arroz'],
  },
  {
    id: 'mandioca',
    nome: 'Mandioca cozida',
    tipo: 'gramas',
    kcal: 125,
    proteina: 0.6,
    carboidrato: 30.1,
    gordura: 0.3,
    passo: 10,
    min: 60,
    max: 300,
    medida: { singular: 'pedaço médio', plural: 'pedaços médios', gramas: 80, genero: 'm' },
    trocas: ['batata-doce', 'arroz'],
  },
  {
    id: 'macarrao',
    nome: 'Macarrão cozido',
    tipo: 'gramas',
    kcal: 157,
    proteina: 5.8,
    carboidrato: 30.9,
    gordura: 0.9,
    passo: 10,
    min: 80,
    max: 400,
    medida: { singular: 'pegador', plural: 'pegadores', gramas: 110, genero: 'm' },
    tags: ['gluten'],
    trocas: ['arroz', 'batata-doce'],
  },
  {
    id: 'macarrao-arroz',
    nome: 'Macarrão de arroz cozido',
    tipo: 'gramas',
    kcal: 150,
    proteina: 3,
    carboidrato: 33,
    gordura: 0.5,
    passo: 10,
    min: 80,
    max: 400,
    medida: { singular: 'pegador', plural: 'pegadores', gramas: 110, genero: 'm' },
    trocas: ['arroz', 'batata-doce'],
  },
  {
    id: 'cuscuz',
    nome: 'Cuscuz de milho',
    tipo: 'gramas',
    kcal: 113,
    proteina: 2.2,
    carboidrato: 25.3,
    gordura: 0.7,
    passo: 10,
    min: 50,
    max: 350,
    medida: { singular: 'pedaço médio', plural: 'pedaços médios', gramas: 100, genero: 'm' },
    trocas: ['tapioca', 'batata-doce'],
  },
  {
    id: 'tapioca',
    nome: 'Tapioca',
    tipo: 'gramas',
    kcal: 240,
    proteina: 0.2,
    carboidrato: 59.6,
    gordura: 0.1,
    passo: 10,
    min: 20,
    max: 120,
    medida: colherSopa(20),
    trocas: ['cuscuz', 'pao-frances'],
  },
  {
    id: 'aveia',
    nome: 'Aveia em flocos',
    tipo: 'gramas',
    kcal: 394,
    proteina: 13.9,
    carboidrato: 66.6,
    gordura: 8.5,
    passo: 5,
    min: 10,
    max: 80,
    medida: colherSopa(15),
    tags: ['gluten'],
    trocas: ['banana', 'mamao'],
  },
  {
    id: 'pao-frances',
    nome: 'Pão francês',
    tipo: 'unidade',
    kcal: 150,
    proteina: 4,
    carboidrato: 29,
    gordura: 1.5,
    passo: 1,
    min: 1,
    max: 3,
    medida: UNIDADE,
    tags: ['gluten'],
    trocas: ['tapioca', 'cuscuz', 'pao-integral'],
  },
  {
    id: 'pao-integral',
    nome: 'Pão integral',
    tipo: 'unidade',
    kcal: 63,
    proteina: 2.5,
    carboidrato: 11,
    gordura: 1,
    passo: 1,
    min: 1,
    max: 4,
    medida: FATIA,
    tags: ['gluten'],
    trocas: ['pao-frances', 'tapioca'],
  },
  {
    id: 'pao-sem-gluten',
    nome: 'Pão sem glúten',
    tipo: 'unidade',
    kcal: 75,
    proteina: 1.5,
    carboidrato: 14,
    gordura: 1.5,
    passo: 1,
    min: 1,
    max: 4,
    medida: FATIA,
    trocas: ['tapioca', 'cuscuz'],
  },
  // Frutas
  {
    id: 'banana',
    nome: 'Banana prata',
    tipo: 'unidade',
    kcal: 68,
    proteina: 0.9,
    carboidrato: 18,
    gordura: 0.1,
    passo: 1,
    min: 1,
    max: 3,
    medida: UNIDADE,
    trocas: ['maca', 'mamao'],
  },
  {
    id: 'maca',
    nome: 'Maçã',
    tipo: 'unidade',
    kcal: 73,
    proteina: 0.4,
    carboidrato: 19.5,
    gordura: 0.2,
    passo: 1,
    min: 1,
    max: 2,
    medida: UNIDADE,
    trocas: ['laranja', 'banana'],
  },
  {
    id: 'laranja',
    nome: 'Laranja',
    tipo: 'unidade',
    kcal: 63,
    proteina: 1.3,
    carboidrato: 15.5,
    gordura: 0.2,
    passo: 1,
    min: 1,
    max: 2,
    medida: UNIDADE,
    trocas: ['maca', 'banana'],
  },
  {
    id: 'mamao',
    nome: 'Mamão papaia',
    tipo: 'gramas',
    kcal: 40,
    proteina: 0.5,
    carboidrato: 10.4,
    gordura: 0.1,
    passo: 10,
    min: 80,
    max: 400,
    medida: { singular: 'fatia média', plural: 'fatias médias', gramas: 150, genero: 'f' },
    trocas: ['banana', 'maca'],
  },
  // Proteínas
  {
    id: 'frango',
    nome: 'Peito de frango grelhado',
    tipo: 'gramas',
    kcal: 159,
    proteina: 32,
    carboidrato: 0,
    gordura: 2.5,
    passo: 10,
    min: 60,
    max: 300,
    medida: { singular: 'filé médio', plural: 'filés médios', gramas: 100, genero: 'm' },
    tags: ['carne'],
    trocas: ['tilapia', 'patinho', 'tofu', 'grao-de-bico'],
  },
  {
    id: 'patinho',
    nome: 'Patinho moído',
    tipo: 'gramas',
    kcal: 219,
    proteina: 35.9,
    carboidrato: 0,
    gordura: 7.3,
    passo: 10,
    min: 60,
    max: 250,
    medida: colherSopa(25),
    tags: ['carne'],
    trocas: ['frango', 'tilapia', 'proteina-soja'],
  },
  {
    id: 'tilapia',
    nome: 'Filé de tilápia grelhado',
    tipo: 'gramas',
    kcal: 128,
    proteina: 26,
    carboidrato: 0,
    gordura: 2.7,
    passo: 10,
    min: 80,
    max: 300,
    medida: { singular: 'filé', plural: 'filés', gramas: 120, genero: 'm' },
    tags: ['peixe'],
    trocas: ['frango', 'patinho', 'tofu'],
  },
  {
    id: 'atum',
    nome: 'Atum em água',
    tipo: 'gramas',
    kcal: 116,
    proteina: 26,
    carboidrato: 0,
    gordura: 1,
    passo: 10,
    min: 40,
    max: 200,
    medida: { singular: 'lata', plural: 'latas', gramas: 120, genero: 'f' },
    tags: ['peixe'],
    trocas: ['frango', 'grao-de-bico'],
  },
  {
    id: 'ovo',
    nome: 'Ovo cozido ou mexido',
    tipo: 'unidade',
    kcal: 73,
    proteina: 6.5,
    carboidrato: 0.6,
    gordura: 4.9,
    passo: 1,
    min: 1,
    max: 5,
    medida: UNIDADE,
    tags: ['ovo'],
    trocas: ['tofu', 'queijo-branco', 'queijo-sem-lactose'],
  },
  {
    id: 'tofu',
    nome: 'Tofu',
    tipo: 'gramas',
    kcal: 120,
    proteina: 12,
    carboidrato: 2,
    gordura: 7,
    passo: 10,
    min: 50,
    max: 300,
    medida: { singular: 'fatia grossa', plural: 'fatias grossas', gramas: 50, genero: 'f' },
    trocas: ['proteina-soja', 'grao-de-bico'],
  },
  {
    id: 'proteina-soja',
    nome: 'Proteína de soja refogada',
    tipo: 'gramas',
    kcal: 132,
    proteina: 20,
    carboidrato: 12,
    gordura: 0.4,
    passo: 10,
    min: 50,
    max: 250,
    medida: colherSopa(25),
    trocas: ['tofu', 'lentilha'],
  },
  // Laticínios e bebidas
  {
    id: 'iogurte',
    nome: 'Iogurte natural',
    tipo: 'gramas',
    kcal: 51,
    proteina: 4.1,
    carboidrato: 1.9,
    gordura: 3,
    passo: 10,
    min: 100,
    max: 340,
    medida: { singular: 'pote', plural: 'potes', gramas: 170, genero: 'm' },
    tags: ['lactose', 'laticinio'],
    trocas: ['leite', 'bebida-soja'],
  },
  {
    id: 'iogurte-sem-lactose',
    nome: 'Iogurte natural sem lactose',
    tipo: 'gramas',
    kcal: 55,
    proteina: 4,
    carboidrato: 5,
    gordura: 2.2,
    passo: 10,
    min: 100,
    max: 340,
    medida: { singular: 'pote', plural: 'potes', gramas: 170, genero: 'm' },
    tags: ['laticinio'],
    trocas: ['leite-sem-lactose', 'bebida-soja'],
  },
  {
    id: 'leite',
    nome: 'Leite desnatado',
    tipo: 'ml',
    kcal: 35,
    proteina: 3.4,
    carboidrato: 5,
    gordura: 0.1,
    passo: 50,
    min: 100,
    max: 500,
    medida: { singular: 'copo', plural: 'copos', gramas: 200, genero: 'm' },
    tags: ['lactose', 'laticinio'],
    trocas: ['iogurte', 'bebida-soja'],
  },
  {
    id: 'leite-sem-lactose',
    nome: 'Leite desnatado sem lactose',
    tipo: 'ml',
    kcal: 35,
    proteina: 3.2,
    carboidrato: 5,
    gordura: 0.1,
    passo: 50,
    min: 100,
    max: 500,
    medida: { singular: 'copo', plural: 'copos', gramas: 200, genero: 'm' },
    tags: ['laticinio'],
    trocas: ['iogurte-sem-lactose', 'bebida-soja'],
  },
  {
    id: 'bebida-soja',
    nome: 'Bebida de soja sem açúcar',
    tipo: 'ml',
    kcal: 40,
    proteina: 3.3,
    carboidrato: 2,
    gordura: 1.9,
    passo: 50,
    min: 100,
    max: 500,
    medida: { singular: 'copo', plural: 'copos', gramas: 200, genero: 'm' },
    trocas: ['leite-sem-lactose'],
  },
  {
    id: 'queijo-branco',
    nome: 'Queijo minas frescal',
    tipo: 'gramas',
    kcal: 264,
    proteina: 17.4,
    carboidrato: 3.2,
    gordura: 20.2,
    passo: 10,
    min: 20,
    max: 90,
    medida: { singular: 'fatia', plural: 'fatias', gramas: 30, genero: 'f' },
    tags: ['lactose', 'laticinio'],
    trocas: ['ovo', 'tofu'],
  },
  {
    id: 'queijo-sem-lactose',
    nome: 'Queijo minas sem lactose',
    tipo: 'gramas',
    kcal: 264,
    proteina: 17.4,
    carboidrato: 3.2,
    gordura: 20.2,
    passo: 10,
    min: 20,
    max: 90,
    medida: { singular: 'fatia', plural: 'fatias', gramas: 30, genero: 'f' },
    tags: ['laticinio'],
    trocas: ['ovo', 'tofu'],
  },
  // Gorduras boas
  {
    id: 'azeite',
    nome: 'Azeite de oliva',
    tipo: 'unidade',
    kcal: 44,
    proteina: 0,
    carboidrato: 0,
    gordura: 5,
    passo: 1,
    min: 1,
    max: 3,
    medida: {
      singular: 'colher de sobremesa',
      plural: 'colheres de sobremesa',
      gramas: 0,
      genero: 'f',
    },
  },
  {
    id: 'abacate',
    nome: 'Abacate',
    tipo: 'gramas',
    kcal: 96,
    proteina: 1.2,
    carboidrato: 6,
    gordura: 8.4,
    passo: 10,
    min: 30,
    max: 150,
    medida: colherSopa(30),
    trocas: ['castanha-para', 'semente-girassol'],
  },
  {
    id: 'castanha-caju',
    nome: 'Castanha de caju',
    tipo: 'gramas',
    kcal: 570,
    proteina: 18.5,
    carboidrato: 29,
    gordura: 46.3,
    passo: 5,
    min: 10,
    max: 40,
    medida: { singular: 'punhado', plural: 'punhados', gramas: 20, genero: 'm' },
    tags: ['castanha'],
    trocas: ['castanha-para', 'semente-girassol'],
  },
  {
    id: 'castanha-para',
    nome: 'Castanha-do-pará',
    tipo: 'unidade',
    kcal: 26,
    proteina: 0.6,
    carboidrato: 0.5,
    gordura: 2.5,
    passo: 1,
    min: 1,
    max: 4,
    medida: UNIDADE,
    tags: ['castanha'],
    trocas: ['castanha-caju', 'semente-girassol'],
  },
  {
    id: 'pasta-amendoim',
    nome: 'Pasta de amendoim integral',
    tipo: 'gramas',
    kcal: 600,
    proteina: 25,
    carboidrato: 20,
    gordura: 49,
    passo: 5,
    min: 10,
    max: 45,
    medida: colherSopa(15),
    tags: ['amendoim'],
    trocas: ['castanha-caju', 'semente-girassol'],
  },
  {
    id: 'semente-girassol',
    nome: 'Semente de girassol',
    tipo: 'gramas',
    kcal: 580,
    proteina: 21,
    carboidrato: 20,
    gordura: 51,
    passo: 5,
    min: 10,
    max: 40,
    medida: colherSopa(10),
    trocas: ['abacate'],
  },
  // Vegetais e bebidas sem caloria relevante
  {
    id: 'legumes',
    nome: 'Legumes cozidos (cenoura, brócolis, abobrinha)',
    tipo: 'gramas',
    kcal: 35,
    proteina: 1.5,
    carboidrato: 7,
    gordura: 0.3,
    passo: 10,
    min: 50,
    max: 250,
    medida: { singular: 'colher de servir', plural: 'colheres de servir', gramas: 50, genero: 'f' },
  },
  {
    id: 'salada',
    nome: 'Salada de folhas e tomate',
    tipo: 'livre',
    kcal: 15,
    proteina: 1,
    carboidrato: 2.5,
    gordura: 0.2,
    passo: 0,
    min: 0,
    max: 0,
    base: 100,
    texto: 'À vontade (1 prato raso)',
    medida: UNIDADE,
  },
  {
    id: 'cafe',
    nome: 'Café ou chá sem açúcar',
    tipo: 'livre',
    kcal: 2,
    proteina: 0.1,
    carboidrato: 0.3,
    gordura: 0,
    passo: 0,
    min: 0,
    max: 0,
    base: 100,
    texto: '1 xícara',
    medida: UNIDADE,
  },
];

export const ALIMENTOS: Readonly<Record<string, Alimento>> = Object.fromEntries(
  LISTA.map((alimento) => [alimento.id, alimento]),
);

export function buscarAlimento(id: string): Alimento {
  const alimento = ALIMENTOS[id];

  if (!alimento) {
    throw new Error(`Alimento desconhecido: ${id}`);
  }

  return alimento;
}

export type Nutrientes = { kcal: number; proteina: number; carboidrato: number; gordura: number };

/** Nutrientes de uma porção. `quantidade` em g/ml ou em unidades, conforme o tipo. */
export function nutrientesDaPorcao(alimento: Alimento, quantidade: number): Nutrientes {
  const fator =
    alimento.tipo === 'unidade'
      ? quantidade
      : alimento.tipo === 'livre'
        ? (alimento.base ?? 0) / 100
        : quantidade / 100;

  return {
    kcal: alimento.kcal * fator,
    proteina: alimento.proteina * fator,
    carboidrato: alimento.carboidrato * fator,
    gordura: alimento.gordura * fator,
  };
}

/** "1 colher de sopa e meia", "meio filé", "2 conchas". Arredonda para meias medidas. */
export function medidaCaseira(medida: Medida, gramas: number): string {
  const meias = Math.max(1, Math.round((gramas / medida.gramas) * 2));
  const inteiras = Math.floor(meias / 2);
  const temMeia = meias % 2 === 1;
  const meio = medida.genero === 'f' ? 'meia' : 'meio';

  if (inteiras === 0) {
    return `${meio} ${medida.singular}`;
  }

  const nome = inteiras === 1 ? medida.singular : medida.plural;

  return `${inteiras} ${nome}${temMeia ? ` e ${meio}` : ''}`;
}

/** Texto da quantidade: "120 g (5 colheres de sopa)", "2 unidades", "200 ml (1 copo)". */
export function textoQuantidade(alimento: Alimento, quantidade: number): string {
  switch (alimento.tipo) {
    case 'livre':
      return alimento.texto ?? '';
    case 'unidade':
      return `${quantidade} ${quantidade === 1 ? alimento.medida.singular : alimento.medida.plural}`;
    case 'ml':
      return `${quantidade} ml (${medidaCaseira(alimento.medida, quantidade)})`;
    default:
      return `${quantidade} g (${medidaCaseira(alimento.medida, quantidade)})`;
  }
}

/** Arredonda para o passo do alimento e respeita mínimo e máximo. */
export function ajustarPorcao(alimento: Alimento, quantidade: number): number {
  if (alimento.tipo === 'livre') {
    return alimento.base ?? 0;
  }

  const arredondada = Math.round(quantidade / alimento.passo) * alimento.passo;

  return Math.min(alimento.max, Math.max(alimento.min, arredondada));
}
