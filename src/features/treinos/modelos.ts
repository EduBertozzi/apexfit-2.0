import type { DadosExercicio, DadosTreino } from './types';

export type ModeloTreino = {
  id: string;
  nome: string;
  descricao: string;
  /** Ex: "3x por semana". */
  frequencia: string;
  treinos: DadosTreino[];
};

// Atalho para escrever os exercícios dos modelos sem repetir as chaves
function ex(nome: string, series: number, repeticoes: string, observacao?: string): DadosExercicio {
  return { nome, series, repeticoes, observacao };
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
          ex('Supino reto com barra', 3, '8 a 12'),
          ex('Supino inclinado com halteres', 3, '10 a 12'),
          ex('Crucifixo na máquina', 3, '12'),
          ex('Desenvolvimento com halteres', 3, '10 a 12'),
          ex('Elevação lateral', 3, '12 a 15'),
          ex('Tríceps na polia', 3, '12'),
        ],
      },
      {
        nome: 'Treino B',
        foco: 'Costas e bíceps',
        exercicios: [
          ex('Puxada frontal', 3, '8 a 12'),
          ex('Remada baixa', 3, '10 a 12'),
          ex('Remada curvada com barra', 3, '8 a 10'),
          ex('Pulldown com corda', 3, '12'),
          ex('Rosca direta com barra', 3, '10 a 12'),
          ex('Rosca martelo', 3, '12'),
        ],
      },
      {
        nome: 'Treino C',
        foco: 'Pernas e abdômen',
        exercicios: [
          ex('Agachamento livre', 4, '8 a 10', 'Desça até a coxa ficar paralela ao chão'),
          ex('Leg press 45', 3, '10 a 12'),
          ex('Cadeira extensora', 3, '12'),
          ex('Mesa flexora', 3, '12'),
          ex('Panturrilha em pé', 4, '15'),
          ex('Abdominal supra', 3, '15 a 20'),
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
          ex('Agachamento livre', 3, '8 a 10'),
          ex('Supino reto com barra', 3, '8 a 10'),
          ex('Remada baixa', 3, '10 a 12'),
          ex('Desenvolvimento com halteres', 3, '10'),
          ex('Abdominal supra', 3, '15 a 20'),
        ],
      },
      {
        nome: 'Treino B',
        foco: 'Corpo todo, ênfase em puxar',
        exercicios: [
          ex('Levantamento terra romeno', 3, '8 a 10'),
          ex('Puxada frontal', 3, '8 a 12'),
          ex('Flexão de braço', 3, '8 a 15'),
          ex('Afundo com halteres', 3, '10', 'Repetições por perna'),
          ex('Rosca direta com halteres', 2, '12'),
        ],
      },
      {
        nome: 'Treino C',
        foco: 'Corpo todo, pernas e core',
        exercicios: [
          ex('Leg press 45', 3, '10 a 12'),
          ex('Supino inclinado com halteres', 3, '10'),
          ex('Remada unilateral com halter', 3, '10', 'Repetições por braço'),
          ex('Elevação lateral', 3, '12 a 15'),
          ex('Abdominal na polia', 3, '12 a 15'),
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
          ex('Supino reto com barra', 4, '6 a 8'),
          ex('Remada curvada com barra', 4, '6 a 8'),
          ex('Desenvolvimento militar', 3, '8 a 10'),
          ex('Puxada frontal', 3, '10 a 12'),
          ex('Tríceps testa', 3, '10 a 12'),
          ex('Rosca direta com barra', 3, '10 a 12'),
        ],
      },
      {
        nome: 'Treino B',
        foco: 'Inferior',
        exercicios: [
          ex('Agachamento livre', 4, '6 a 8'),
          ex('Levantamento terra romeno', 3, '8 a 10'),
          ex('Leg press 45', 3, '10 a 12'),
          ex('Mesa flexora', 3, '12'),
          ex('Panturrilha sentado', 4, '15'),
        ],
      },
    ],
  },
];
