import type { DadosExercicio, DadosTreino, GrupoMuscular } from './types';

export type ModeloTreino = {
  id: string;
  nome: string;
  descricao: string;
  /** Ex: "3x por semana". */
  frequencia: string;
  treinos: DadosTreino[];
};

// Atalho para escrever os exercícios dos modelos sem repetir as chaves
function ex(
  grupo: GrupoMuscular,
  nome: string,
  series: number,
  repeticoes: string,
  observacao?: string,
): DadosExercicio {
  return { nome, grupo, series, repeticoes, observacao };
}

/** Aquecimento curto, igual em todos os treinos: corpo quente antes da carga. */
const AQUECIMENTO: DadosExercicio[] = [
  ex('aquecimento', 'Polichinelo', 2, '20'),
  ex('aquecimento', 'Agachamento livre sem peso', 2, '10'),
  ex('aquecimento', 'Flexão de braço', 2, '10', 'Pode apoiar os joelhos'),
  ex('aquecimento', 'Kettlebell swing', 2, '10', 'Carga leve, só para aquecer'),
];

/** Cardio leve no fim. As repetições do cardio são minutos. */
function cardio(nome: string, minutos: number): DadosExercicio {
  return ex('cardio', nome, 1, `${minutos} min`);
}

/**
 * Fichas prontas para quem não quer montar do zero.
 * Sem carga: cada pessoa coloca a sua depois do primeiro treino.
 */
export const MODELOS: readonly ModeloTreino[] = [
  {
    id: 'abc-iniciante',
    nome: 'ABC iniciante',
    descricao: 'Divide o corpo em três treinos. Clássico de academia para quem está começando.',
    frequencia: '3x por semana',
    treinos: [
      {
        nome: 'Treino A',
        foco: 'Peito, ombro e tríceps',
        exercicios: [
          ...AQUECIMENTO,
          ex('peito', 'Supino reto com barra', 3, '8 a 12'),
          ex('peito', 'Supino inclinado com halteres', 3, '10 a 12'),
          ex('peito', 'Crucifixo na máquina', 3, '12'),
          ex('ombro', 'Desenvolvimento com halteres', 3, '10 a 12'),
          ex('ombro', 'Elevação lateral', 3, '12 a 15'),
          ex('braco', 'Tríceps na polia', 3, '12'),
          cardio('Elíptico', 10),
        ],
      },
      {
        nome: 'Treino B',
        foco: 'Costas e bíceps',
        exercicios: [
          ...AQUECIMENTO,
          ex('costas', 'Puxada frontal', 3, '8 a 12'),
          ex('costas', 'Remada baixa', 3, '10 a 12'),
          ex('costas', 'Remada curvada com barra', 3, '8 a 10'),
          ex('costas', 'Pulldown com corda', 3, '12'),
          ex('braco', 'Rosca direta com barra', 3, '10 a 12'),
          ex('braco', 'Rosca martelo', 3, '12'),
          cardio('Bicicleta ergométrica', 10),
        ],
      },
      {
        nome: 'Treino C',
        foco: 'Pernas e abdômen',
        exercicios: [
          ...AQUECIMENTO,
          ex('perna', 'Agachamento livre', 4, '8 a 10', 'Desça até a coxa ficar paralela ao chão'),
          ex('perna', 'Leg press 45', 3, '10 a 12'),
          ex('perna', 'Cadeira extensora', 3, '12'),
          ex('perna', 'Mesa flexora', 3, '12'),
          ex('perna', 'Panturrilha em pé', 4, '15'),
          ex('abdominal', 'Abdominal supra', 3, '15 a 20'),
          cardio('Esteira', 10),
        ],
      },
    ],
  },
  {
    id: 'full-body-3x',
    nome: 'Full body 3x',
    descricao: 'Corpo todo em cada treino. Ótimo para quem treina dia sim, dia não.',
    frequencia: '3x por semana',
    treinos: [
      {
        nome: 'Treino A',
        foco: 'Corpo todo, ênfase em empurrar',
        exercicios: [
          ...AQUECIMENTO,
          ex('perna', 'Agachamento livre', 3, '8 a 10'),
          ex('peito', 'Supino reto com barra', 3, '8 a 10'),
          ex('costas', 'Remada baixa', 3, '10 a 12'),
          ex('ombro', 'Desenvolvimento com halteres', 3, '10'),
          ex('abdominal', 'Abdominal supra', 3, '15 a 20'),
          cardio('Elíptico', 10),
        ],
      },
      {
        nome: 'Treino B',
        foco: 'Corpo todo, ênfase em puxar',
        exercicios: [
          ...AQUECIMENTO,
          ex('perna', 'Levantamento terra romeno', 3, '8 a 10'),
          ex('costas', 'Puxada frontal', 3, '8 a 12'),
          ex('peito', 'Flexão de braço', 3, '8 a 15'),
          ex('perna', 'Afundo com halteres', 3, '10', 'Repetições por perna'),
          ex('braco', 'Rosca direta com halteres', 2, '12'),
          cardio('Bicicleta ergométrica', 10),
        ],
      },
      {
        nome: 'Treino C',
        foco: 'Corpo todo, pernas e core',
        exercicios: [
          ...AQUECIMENTO,
          ex('perna', 'Leg press 45', 3, '10 a 12'),
          ex('peito', 'Supino inclinado com halteres', 3, '10'),
          ex('costas', 'Remada unilateral com halter', 3, '10', 'Repetições por braço'),
          ex('ombro', 'Elevação lateral', 3, '12 a 15'),
          ex('abdominal', 'Abdominal na polia', 3, '12 a 15'),
          cardio('Esteira', 10),
        ],
      },
    ],
  },
  {
    id: 'superior-inferior',
    nome: 'Superior e inferior',
    descricao: 'Alterna parte de cima e pernas. Bom para quem já treina e quer 4 dias.',
    frequencia: '4x por semana',
    treinos: [
      {
        nome: 'Treino A',
        foco: 'Superior',
        exercicios: [
          ...AQUECIMENTO,
          ex('peito', 'Supino reto com barra', 4, '6 a 8'),
          ex('costas', 'Remada curvada com barra', 4, '6 a 8'),
          ex('ombro', 'Desenvolvimento militar', 3, '8 a 10'),
          ex('costas', 'Puxada frontal', 3, '10 a 12'),
          ex('braco', 'Tríceps testa', 3, '10 a 12'),
          ex('braco', 'Rosca direta com barra', 3, '10 a 12'),
          cardio('Elíptico', 10),
        ],
      },
      {
        nome: 'Treino B',
        foco: 'Inferior',
        exercicios: [
          ...AQUECIMENTO,
          ex('perna', 'Agachamento livre', 4, '6 a 8'),
          ex('perna', 'Levantamento terra romeno', 3, '8 a 10'),
          ex('perna', 'Leg press 45', 3, '10 a 12'),
          ex('perna', 'Mesa flexora', 3, '12'),
          ex('perna', 'Panturrilha sentado', 4, '15'),
          ex('abdominal', 'Prancha', 3, '30', 'Segundos parado na posição'),
          cardio('Bicicleta ergométrica', 10),
        ],
      },
    ],
  },
];
