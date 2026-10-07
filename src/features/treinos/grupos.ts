import type { Exercicio, GrupoMuscular } from './types';

/** Ordem dos cards na tela: aquecimento primeiro, cardio no fim. */
export const ORDEM_GRUPOS: GrupoMuscular[] = [
  'aquecimento',
  'peito',
  'costas',
  'ombro',
  'braco',
  'perna',
  'abdominal',
  'cardio',
  'outro',
];

export const NOME_GRUPO: Record<GrupoMuscular, string> = {
  aquecimento: 'aquecimento',
  peito: 'peito',
  costas: 'costas',
  ombro: 'ombro',
  braco: 'braço',
  perna: 'perna',
  abdominal: 'abdômen',
  cardio: 'cardio',
  outro: 'outros',
};

function normalizar(texto: string): string {
  return texto.toLowerCase().normalize('NFD').replace(/[̀-ͯ]/g, '');
}

/** Palavras-chave por grupo, na ordem de checagem (a primeira que bate vence). */
const PISTAS: [GrupoMuscular, RegExp][] = [
  ['aquecimento', /aquec|polichinelo|mobilidade|alongamento|corda|polichinelos/],
  [
    'cardio',
    /cardio|esteira|eliptico|bicicleta ergom|bike|corrida|caminhada|escada|remo ergom|spinning|hiit/,
  ],
  ['abdominal', /abdom|prancha|infra|crunch|obliquo|elevacao de pernas|canivete/],
  [
    'perna',
    /agach|leg|cadeira (extensora|flexora)|extensora|flexora|afundo|passada|stiff|panturrilha|gluteo|elevacao pelvica|hack|sumo|bulgaro|terra/,
  ],
  ['costas', /remada|puxada|barra fixa|pulldown|pull ?down|serrote|cavalinho|lombar|pullover/],
  ['peito', /supino|crucifixo|flexao|peck|voador|crossover|peitoral/],
  ['ombro', /desenvolvimento|elevacao lateral|elevacao frontal|ombro|arnold|encolhimento/],
  ['braco', /rosca|triceps|biceps|testa|martelo|frances|corda no pulley|mergulho|antebraco/],
];

/** Grupo de um exercício pelo nome, para treinos que não têm o campo. */
export function inferirGrupo(nome: string): GrupoMuscular {
  const texto = normalizar(nome);

  return PISTAS.find(([, padrao]) => padrao.test(texto))?.[0] ?? 'outro';
}

export function grupoDe(exercicio: Pick<Exercicio, 'nome' | 'grupo'>): GrupoMuscular {
  return exercicio.grupo ?? inferirGrupo(exercicio.nome);
}

export type BlocoDoTreino = {
  grupo: GrupoMuscular;
  /** "3x12": séries x repetições mais comum do grupo. */
  esquema: string;
  exercicios: Exercicio[];
};

/** Agrupa os exercícios de um treino em blocos por grupo, na ordem da tela. */
export function agruparPorGrupo(exercicios: readonly Exercicio[]): BlocoDoTreino[] {
  const porGrupo = new Map<GrupoMuscular, Exercicio[]>();

  for (const exercicio of exercicios) {
    const grupo = grupoDe(exercicio);
    porGrupo.set(grupo, [...(porGrupo.get(grupo) ?? []), exercicio]);
  }

  return ORDEM_GRUPOS.filter((grupo) => porGrupo.has(grupo)).map((grupo) => {
    const lista = porGrupo.get(grupo)!;
    const contagem = new Map<string, number>();

    for (const exercicio of lista) {
      const chave = `${exercicio.series}x${exercicio.repeticoes}`;
      contagem.set(chave, (contagem.get(chave) ?? 0) + 1);
    }

    // Empate: vale o do primeiro exercício (Map mantém a ordem de inserção)
    const esquema = [...contagem.entries()].sort((a, b) => b[1] - a[1])[0][0];

    return { grupo, esquema, exercicios: lista };
  });
}

// ---------------------------------------------------------------------------
// Textos dos cards da tela inicial
// ---------------------------------------------------------------------------

const PADRAO_MINUTOS = /^(\d+) min$/;

/**
 * Esquema como aparece no card: "3x12". No cardio (repetições em minutos) e com
 * uma série só, vira "10 min".
 */
export function textoEsquema(esquema: string): string {
  const [series, repeticoes = ''] = esquema.split('x');

  if (PADRAO_MINUTOS.test(repeticoes)) {
    return series === '1' ? repeticoes : `${series}x ${repeticoes}`;
  }

  return esquema;
}

/** Versão falada: "3 séries de 12", "10 minutos". */
export function esquemaAcessivel(esquema: string): string {
  const [seriesTexto, repeticoes = ''] = esquema.split('x');
  const series = Number(seriesTexto);
  const minutos = PADRAO_MINUTOS.exec(repeticoes);
  const textoSeries = series === 1 ? '1 série' : `${series} séries`;

  if (minutos) {
    const tempo = `${minutos[1]} minutos`;

    return series === 1 ? tempo : `${textoSeries} de ${tempo}`;
  }

  return `${textoSeries} de ${repeticoes}`;
}

/** Nomes em minúsculas, como no visual da tela inicial. */
export function nomeNoCard(nome: string): string {
  return nome.trim().toLocaleLowerCase('pt-BR');
}

/** Todos os exercícios do grupo já foram marcados hoje? */
export function blocoCompleto(bloco: BlocoDoTreino, concluidos: readonly string[]): boolean {
  return (
    bloco.exercicios.length > 0 &&
    bloco.exercicios.every((exercicio) => concluidos.includes(exercicio.id))
  );
}

/**
 * Rótulo completo do card para o leitor de tela:
 * "braço, 3 séries de 12, remada alta feito e rosca direta". Com tudo marcado,
 * termina em ", tudo feito".
 */
export function rotuloDoBloco(bloco: BlocoDoTreino, concluidos: readonly string[] = []): string {
  const nomes = bloco.exercicios.map(
    (exercicio) =>
      `${nomeNoCard(exercicio.nome)}${concluidos.includes(exercicio.id) ? ' feito' : ''}`,
  );
  const lista =
    nomes.length > 1 ? `${nomes.slice(0, -1).join(', ')} e ${nomes[nomes.length - 1]}` : nomes[0];
  const final = blocoCompleto(bloco, concluidos) ? ', tudo feito' : '';

  return `${NOME_GRUPO[bloco.grupo]}, ${esquemaAcessivel(bloco.esquema)}, ${lista}${final}`;
}

/** Divide a lista em duas colunas (a da esquerda fica com o item a mais). */
export function emDuasColunas<T>(itens: readonly T[]): [T[], T[]] {
  const meio = Math.ceil(itens.length / 2);

  return [itens.slice(0, meio), itens.slice(meio)];
}

/**
 * Corta a lista para caber no card sem quebrar a grade: mostra até `maximo`
 * e conta o resto ("+2"). A lista inteira fica na tela do treino.
 */
export function limitarLista<T>(
  itens: readonly T[],
  maximo: number,
): { visiveis: T[]; resto: number } {
  if (itens.length <= maximo) {
    return { visiveis: [...itens], resto: 0 };
  }

  // Guarda uma linha para o "+N"
  const visiveis = itens.slice(0, Math.max(maximo - 1, 0));

  return { visiveis, resto: itens.length - visiveis.length };
}
