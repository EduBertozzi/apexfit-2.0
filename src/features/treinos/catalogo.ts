import type { GrupoMuscular } from './types';
import { minusculaInicial } from '@/shared/lib/texto';

/**
 * Catálogo de exercícios para montar o treino sem digitar: nomes como se fala
 * nas academias do Brasil, separados por grupo e região do músculo.
 * Cada um já vem com séries e repetições comuns, que a pessoa pode mudar.
 */

export type Local = 'academia' | 'casa' | 'ambos';

export type ExercicioCatalogo = {
  nome: string;
  grupo: GrupoMuscular;
  /** Id da região dentro do grupo, ex: "biceps". */
  regiao: string;
  local: Local;
  series: number;
  /** Mesmo formato do exercício salvo: "12", "8 a 12" ou "10 min". */
  repeticoes: string;
};

export type Regiao = { id: string; nome: string };

/** Região especial: mistura exercícios de todas as regiões do grupo. */
export const MISTO = 'misto';

/** Grupos que aparecem na aba de musculação (cardio tem aba própria). */
export const GRUPOS_MUSCULACAO: GrupoMuscular[] = [
  'peito',
  'costas',
  'ombro',
  'braco',
  'perna',
  'abdominal',
  'aquecimento',
];

export const REGIOES: Record<GrupoMuscular, Regiao[]> = {
  braco: [
    { id: 'biceps', nome: 'bíceps' },
    { id: 'triceps', nome: 'tríceps' },
    { id: 'antebraco', nome: 'antebraço' },
  ],
  perna: [
    { id: 'quadriceps', nome: 'quadríceps' },
    { id: 'posterior', nome: 'posterior' },
    { id: 'gluteo', nome: 'glúteo' },
    { id: 'panturrilha', nome: 'panturrilha' },
  ],
  peito: [
    { id: 'superior', nome: 'superior' },
    { id: 'medio', nome: 'médio' },
    { id: 'inferior', nome: 'inferior' },
  ],
  costas: [
    { id: 'dorsal', nome: 'dorsal' },
    { id: 'meio', nome: 'meio das costas' },
    { id: 'lombar', nome: 'lombar' },
  ],
  ombro: [
    { id: 'anterior', nome: 'anterior' },
    { id: 'lateral', nome: 'lateral' },
    { id: 'posterior', nome: 'posterior' },
  ],
  abdominal: [
    { id: 'superior', nome: 'superior' },
    { id: 'infra', nome: 'infra' },
    { id: 'obliquo', nome: 'oblíquo' },
  ],
  aquecimento: [
    { id: 'mobilidade', nome: 'mobilidade' },
    { id: 'ativacao', nome: 'ativação' },
  ],
  cardio: [
    { id: 'esteira', nome: 'esteira' },
    { id: 'bike', nome: 'bike' },
    { id: 'eliptico', nome: 'elíptico' },
    { id: 'escada', nome: 'escada' },
    { id: 'corda', nome: 'corda' },
    { id: 'remo', nome: 'remo' },
  ],
  outro: [],
};

type Linha = [nome: string, regiao: string, local: Local, series: number, repeticoes: string];

function de(grupo: GrupoMuscular, linhas: Linha[]): ExercicioCatalogo[] {
  return linhas.map(([nome, regiao, local, series, repeticoes]) => ({
    // Minúscula como o resto do app ("supino reto"), siglas preservadas
    nome: minusculaInicial(nome),
    grupo,
    regiao,
    local,
    series,
    repeticoes,
  }));
}

export const CATALOGO: readonly ExercicioCatalogo[] = [
  ...de('peito', [
    ['Supino inclinado com barra', 'superior', 'academia', 4, '10'],
    ['Supino inclinado com halteres', 'superior', 'academia', 3, '10'],
    ['Crucifixo inclinado', 'superior', 'academia', 3, '12'],
    ['Flexão declinada', 'superior', 'casa', 3, '12'],
    ['Supino reto com barra', 'medio', 'academia', 4, '10'],
    ['Supino reto com halteres', 'medio', 'academia', 3, '10'],
    ['Crucifixo reto', 'medio', 'academia', 3, '12'],
    ['Peck deck', 'medio', 'academia', 3, '12'],
    ['Flexão de braço', 'medio', 'ambos', 3, '12'],
    ['Supino declinado', 'inferior', 'academia', 3, '10'],
    ['Crossover de cima para baixo', 'inferior', 'academia', 3, '12'],
    ['Mergulho nas paralelas', 'inferior', 'academia', 3, '10'],
    ['Flexão inclinada no banco', 'inferior', 'casa', 3, '12'],
  ]),
  ...de('costas', [
    ['Puxada frontal', 'dorsal', 'academia', 4, '10'],
    ['Barra fixa', 'dorsal', 'ambos', 3, '8'],
    ['Pulldown com corda', 'dorsal', 'academia', 3, '12'],
    ['Pullover no cabo', 'dorsal', 'academia', 3, '12'],
    ['Remada curvada com barra', 'meio', 'academia', 4, '10'],
    ['Remada baixa no cabo', 'meio', 'academia', 3, '12'],
    ['Remada unilateral com halter', 'meio', 'ambos', 3, '10'],
    ['Remada cavalinho', 'meio', 'academia', 3, '10'],
    ['Remada com elástico', 'meio', 'casa', 3, '15'],
    ['Levantamento terra', 'lombar', 'academia', 3, '8'],
    ['Hiperextensão lombar', 'lombar', 'academia', 3, '12'],
    ['Superman no solo', 'lombar', 'casa', 3, '15'],
    ['Bom dia com barra', 'lombar', 'academia', 3, '10'],
  ]),
  ...de('ombro', [
    ['Desenvolvimento com halteres', 'anterior', 'ambos', 4, '10'],
    ['Desenvolvimento com barra', 'anterior', 'academia', 3, '10'],
    ['Elevação frontal', 'anterior', 'ambos', 3, '12'],
    ['Desenvolvimento Arnold', 'anterior', 'academia', 3, '10'],
    ['Elevação lateral', 'lateral', 'ambos', 4, '12'],
    ['Elevação lateral no cabo', 'lateral', 'academia', 3, '12'],
    ['Remada alta', 'lateral', 'academia', 3, '12'],
    ['Crucifixo inverso', 'posterior', 'ambos', 3, '12'],
    ['Face pull', 'posterior', 'academia', 3, '15'],
    ['Voador inverso', 'posterior', 'academia', 3, '12'],
  ]),
  ...de('braco', [
    ['Rosca direta', 'biceps', 'ambos', 3, '12'],
    ['Rosca alternada', 'biceps', 'ambos', 3, '12'],
    ['Rosca martelo', 'biceps', 'ambos', 3, '12'],
    ['Rosca Scott', 'biceps', 'academia', 3, '10'],
    ['Rosca concentrada', 'biceps', 'ambos', 3, '12'],
    ['Tríceps pulley', 'triceps', 'academia', 3, '12'],
    ['Tríceps corda', 'triceps', 'academia', 3, '12'],
    ['Tríceps testa', 'triceps', 'academia', 3, '10'],
    ['Tríceps francês', 'triceps', 'ambos', 3, '12'],
    ['Mergulho no banco', 'triceps', 'casa', 3, '12'],
    ['Rosca de punho', 'antebraco', 'ambos', 3, '15'],
    ['Rosca inversa', 'antebraco', 'ambos', 3, '12'],
    ['Pegada no rolo', 'antebraco', 'academia', 3, '10'],
  ]),
  ...de('perna', [
    ['Agachamento livre', 'quadriceps', 'ambos', 4, '10'],
    ['Leg press', 'quadriceps', 'academia', 4, '12'],
    ['Cadeira extensora', 'quadriceps', 'academia', 3, '12'],
    ['Agachamento hack', 'quadriceps', 'academia', 3, '10'],
    ['Afundo', 'quadriceps', 'ambos', 3, '10'],
    ['Mesa flexora', 'posterior', 'academia', 3, '12'],
    ['Cadeira flexora', 'posterior', 'academia', 3, '12'],
    ['Stiff', 'posterior', 'ambos', 3, '10'],
    ['Flexora em pé', 'posterior', 'academia', 3, '12'],
    ['Elevação pélvica', 'gluteo', 'ambos', 4, '12'],
    ['Agachamento búlgaro', 'gluteo', 'ambos', 3, '10'],
    ['Glúteo no cabo', 'gluteo', 'academia', 3, '12'],
    ['Abdução de quadril', 'gluteo', 'academia', 3, '15'],
    ['Panturrilha em pé', 'panturrilha', 'ambos', 4, '15'],
    ['Panturrilha sentado', 'panturrilha', 'academia', 3, '15'],
    ['Panturrilha no leg press', 'panturrilha', 'academia', 3, '15'],
  ]),
  ...de('abdominal', [
    ['Abdominal crunch', 'superior', 'ambos', 3, '15'],
    ['Abdominal na polia', 'superior', 'academia', 3, '12'],
    ['Abdominal remador', 'superior', 'casa', 3, '15'],
    ['Elevação de pernas', 'infra', 'ambos', 3, '12'],
    ['Abdominal infra no banco', 'infra', 'ambos', 3, '15'],
    ['Abdominal canivete', 'infra', 'casa', 3, '12'],
    ['Abdominal bicicleta', 'obliquo', 'ambos', 3, '20'],
    ['Abdominal oblíquo', 'obliquo', 'ambos', 3, '15'],
    ['Rotação russa', 'obliquo', 'ambos', 3, '20'],
  ]),
  ...de('aquecimento', [
    ['Mobilidade de ombros', 'mobilidade', 'ambos', 1, '10'],
    ['Mobilidade de quadril', 'mobilidade', 'ambos', 1, '10'],
    ['Alongamento dinâmico', 'mobilidade', 'ambos', 1, '10'],
    ['Polichinelo', 'ativacao', 'ambos', 2, '20'],
    ['Agachamento sem peso', 'ativacao', 'ambos', 2, '15'],
    ['Ativação de glúteo com elástico', 'ativacao', 'ambos', 2, '15'],
    ['Flexão no joelho', 'ativacao', 'ambos', 1, '10'],
    ['Corrida no lugar', 'ativacao', 'ambos', 1, '2 min'],
    // Aparelho de cardio no aquecimento: sempre por tempo
    ['Bike leve', 'ativacao', 'academia', 1, '5 min'],
    ['Esteira leve', 'ativacao', 'academia', 1, '5 min'],
  ]),
  ...de('cardio', [
    ['Esteira', 'esteira', 'academia', 1, '10 min'],
    ['Caminhada', 'esteira', 'casa', 1, '10 min'],
    ['Bike ergométrica', 'bike', 'academia', 1, '10 min'],
    ['Elíptico', 'eliptico', 'academia', 1, '10 min'],
    ['Escada', 'escada', 'academia', 1, '10 min'],
    ['Pular corda', 'corda', 'ambos', 1, '10 min'],
    ['Remo ergométrico', 'remo', 'academia', 1, '10 min'],
  ]),
];

function normalizar(nome: string): string {
  return nome.trim().toLocaleLowerCase('pt-BR').normalize('NFD').replace(/[̀-ͯ]/g, '');
}

/** Regiões do grupo com "misto" na frente (quando o grupo tem mais de uma). */
export function regioesComMisto(grupo: GrupoMuscular): Regiao[] {
  const regioes = REGIOES[grupo];

  return regioes.length > 1 ? [{ id: MISTO, nome: 'misto' }, ...regioes] : regioes;
}

/**
 * Exercícios do grupo, na ordem do catálogo. Sem região (ou "misto"), intercala
 * as regiões: um de cada, depois o segundo de cada... Assim o "misto" já
 * começa variado.
 */
export function exerciciosDe(grupo: GrupoMuscular, regiao?: string): ExercicioCatalogo[] {
  const doGrupo = CATALOGO.filter((exercicio) => exercicio.grupo === grupo);

  if (regiao !== undefined && regiao !== MISTO) {
    return doGrupo.filter((exercicio) => exercicio.regiao === regiao);
  }

  const porRegiao = REGIOES[grupo].map((item) =>
    doGrupo.filter((exercicio) => exercicio.regiao === item.id),
  );
  const maior = Math.max(0, ...porRegiao.map((lista) => lista.length));
  const intercalados: ExercicioCatalogo[] = [];

  for (let i = 0; i < maior; i++) {
    for (const lista of porRegiao) {
      if (lista[i]) {
        intercalados.push(lista[i]);
      }
    }
  }

  return intercalados;
}

/** Tira da lista o que já está no treino (comparando o nome sem acento nem maiúscula). */
export function semRepetidos(
  exercicios: readonly ExercicioCatalogo[],
  jaNoTreino: readonly string[],
): ExercicioCatalogo[] {
  const usados = new Set(jaNoTreino.map(normalizar));

  return exercicios.filter((exercicio) => !usados.has(normalizar(exercicio.nome)));
}

/**
 * Sugestão determinística: os primeiros `quantidade` exercícios do grupo e da
 * região que ainda não estão no treino.
 */
export function sugerir(
  grupo: GrupoMuscular,
  regiao: string | undefined,
  quantidade: number,
  jaNoTreino: readonly string[] = [],
): ExercicioCatalogo[] {
  return semRepetidos(exerciciosDe(grupo, regiao), jaNoTreino).slice(0, Math.max(0, quantidade));
}

/** Acha um exercício do catálogo pelo nome (sem acento nem maiúscula). */
export function buscarNoCatalogo(nome: string): ExercicioCatalogo | undefined {
  const alvo = normalizar(nome);

  return CATALOGO.find((exercicio) => normalizar(exercicio.nome) === alvo);
}
