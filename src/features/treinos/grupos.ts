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
  abdominal: 'abdominal',
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
