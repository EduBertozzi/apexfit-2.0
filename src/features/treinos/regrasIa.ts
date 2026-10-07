import type { Perfil } from '@/features/perfil/types';

import type { ExercicioIa, LocalTreino, PreferenciasTreino, RespostaTreinosIa } from './contratoIa';
import { NOME_GRUPO } from './grupos';
import { exerciciosPorTempo } from './promptIa';
import type { GrupoMuscular } from './types';

/**
 * Modo demonstração: monta os treinos sem IA, por regras, com os mesmos
 * princípios do prompt (aquecimento, divisão por dias, cardio, restrições).
 * Usado quando o servidor não tem IA ou não há internet.
 */

type GrupoForca = Exclude<GrupoMuscular, 'aquecimento' | 'cardio' | 'outro'>;

/** Exercícios por grupo, do mais básico ao mais específico. */
const BANCO: Record<LocalTreino, Record<GrupoForca, string[]>> = {
  academia: {
    peito: [
      'Supino reto com barra',
      'Supino inclinado com halteres',
      'Crucifixo na máquina',
      'Crossover',
    ],
    costas: ['Puxada frontal', 'Remada baixa', 'Remada curvada com barra', 'Pulldown com corda'],
    ombro: ['Desenvolvimento com halteres', 'Elevação lateral', 'Elevação frontal'],
    braco: ['Tríceps na polia', 'Rosca direta com barra', 'Rosca martelo', 'Tríceps testa'],
    perna: [
      'Agachamento livre',
      'Leg press 45',
      'Cadeira extensora',
      'Mesa flexora',
      'Stiff com halteres',
      'Panturrilha em pé',
    ],
    abdominal: ['Prancha', 'Abdominal supra', 'Abdominal infra'],
  },
  casa: {
    peito: ['Flexão de braço', 'Flexão inclinada no sofá', 'Flexão com pegada fechada'],
    costas: ['Remada com mochila', 'Remada unilateral com garrafa', 'Extensão lombar no chão'],
    ombro: [
      'Desenvolvimento com garrafas',
      'Elevação lateral com garrafas',
      'Elevação frontal com garrafas',
    ],
    braco: ['Mergulho na cadeira', 'Rosca com mochila', 'Rosca martelo com garrafas'],
    perna: [
      'Agachamento livre',
      'Afundo',
      'Elevação pélvica',
      'Agachamento búlgaro na cadeira',
      'Stiff com mochila',
      'Panturrilha em pé',
    ],
    abdominal: ['Prancha', 'Abdominal supra', 'Elevação de pernas'],
  },
};

const AQUECIMENTO: Record<LocalTreino, string> = {
  academia: 'Bicicleta ergométrica leve',
  casa: 'Polichinelo e mobilidade',
};

const CARDIO: Record<LocalTreino, string[]> = {
  academia: ['Esteira', 'Bicicleta ergométrica', 'Elíptico'],
  casa: ['Caminhada rápida', 'Corrida no lugar', 'Polichinelo'],
};

/** Grupos de cada sessão, conforme os dias por semana. */
const DIVISOES: Record<number, GrupoForca[][]> = {
  2: [
    ['perna', 'peito', 'costas', 'ombro', 'abdominal'],
    ['perna', 'costas', 'peito', 'braco', 'abdominal'],
  ],
  3: [
    ['peito', 'ombro', 'braco'],
    ['costas', 'braco', 'abdominal'],
    ['perna', 'abdominal'],
  ],
  4: [
    ['peito', 'ombro', 'braco'],
    ['perna', 'abdominal'],
    ['costas', 'braco'],
    ['perna', 'ombro', 'abdominal'],
  ],
  5: [
    ['peito', 'braco'],
    ['costas', 'braco'],
    ['perna', 'abdominal'],
    ['ombro', 'abdominal'],
    ['perna'],
  ],
  6: [
    ['peito', 'ombro', 'braco'],
    ['costas', 'braco', 'abdominal'],
    ['perna', 'abdominal'],
    ['peito', 'ombro', 'braco'],
    ['costas', 'braco', 'abdominal'],
    ['perna', 'abdominal'],
  ],
};

/** Exercícios que forçam uma região com restrição comum. */
const EVITAR: [RegExp, RegExp][] = [
  [/joelho/, /afundo|bulgaro|agachamento livre|corrida|polichinelo/],
  [/coluna|lombar|hernia|costas/, /stiff|remada curvada|agachamento livre|extensao lombar/],
  [/ombro/, /desenvolvimento|mergulho|tríceps testa|triceps testa/],
];

function normalizar(texto: string): string {
  return texto.toLowerCase().normalize('NFD').replace(/[̀-ͯ]/g, '');
}

function filtroDeRestricoes(restricoes: string | undefined): (nome: string) => boolean {
  const texto = normalizar(restricoes ?? '');
  const proibidos = EVITAR.filter(([regiao]) => regiao.test(texto)).map(([, padrao]) => padrao);

  return (nome) => !proibidos.some((padrao) => padrao.test(normalizar(nome)));
}

function juntar(nomes: string[]): string {
  return nomes.length <= 1
    ? (nomes[0] ?? '')
    : `${nomes.slice(0, -1).join(', ')} e ${nomes[nomes.length - 1]}`;
}

function repeticoesDoObjetivo(perfil: Perfil): string {
  if (perfil.idade < 18 || perfil.objetivo === 'perder') {
    return '12 a 15';
  }

  return perfil.objetivo === 'ganhar' ? '8 a 12' : '10 a 12';
}

/** Minutos de cardio no fim, ou 0 quando não cabe. */
function minutosDeCardio(perfil: Perfil, minutos: PreferenciasTreino['minutos']): number {
  if (perfil.objetivo === 'perder') {
    return minutos >= 45 ? 20 : 10;
  }

  if (minutos < 45) {
    return 0;
  }

  return perfil.objetivo === 'ganhar' ? (minutos >= 60 ? 10 : 0) : 15;
}

export function montarTreinosPorRegras(
  perfil: Perfil,
  preferencias: PreferenciasTreino,
): RespostaTreinosIa {
  const { local, minutos } = preferencias;
  const dias = Math.min(6, Math.max(2, Math.round(preferencias.diasPorSemana)));
  const divisao = DIVISOES[dias];
  const permitido = filtroDeRestricoes(perfil.restricoes);
  const menor = perfil.idade < 18;
  const repeticoes = repeticoesDoObjetivo(perfil);
  const series = minutos >= 90 && perfil.objetivo === 'ganhar' && !menor ? 4 : 3;
  const quantidade = exerciciosPorTempo(minutos);
  const cardio = minutosDeCardio(perfil, minutos);
  const aquecimento = minutos <= 30 ? 5 : 8;
  const usados = new Map<GrupoForca, number>();

  const treinos = divisao.map((grupos, indice) => {
    const exercicios: ExercicioIa[] = [
      {
        nome: permitido(AQUECIMENTO[local]) ? AQUECIMENTO[local] : 'Mobilidade articular',
        grupo: 'aquecimento',
        series: 1,
        repeticoes: String(aquecimento),
        observacao: `${aquecimento} minutos em ritmo leve`,
      },
    ];
    const vistos = new Set<string>();

    // Distribui os exercícios entre os grupos do dia, um de cada vez
    for (
      let posicao = 0;
      exercicios.length - 1 < quantidade && posicao < quantidade * 3;
      posicao++
    ) {
      const grupo = grupos[posicao % grupos.length];
      const opcoes = BANCO[local][grupo].filter((nome) => permitido(nome) && !vistos.has(nome));

      if (opcoes.length === 0) {
        continue;
      }

      // Sessões repetidas (6 dias) começam de outro exercício do mesmo grupo
      const inicio = usados.get(grupo) ?? 0;
      const nome = opcoes[inicio % opcoes.length];
      usados.set(grupo, inicio + 1);
      vistos.add(nome);

      exercicios.push({
        nome,
        grupo,
        series: grupo === 'abdominal' ? 3 : series,
        repeticoes: nome === 'Prancha' ? '30' : grupo === 'abdominal' ? '15 a 20' : repeticoes,
        ...(nome === 'Prancha'
          ? { observacao: 'Segundos parado na posição' }
          : menor && exercicios.length === 1
            ? { observacao: 'Carga leve, foco na técnica' }
            : {}),
      });
    }

    if (cardio > 0) {
      const opcoes = CARDIO[local].filter(permitido);

      exercicios.push({
        nome: opcoes.length > 0 ? opcoes[indice % opcoes.length] : 'Caminhada leve',
        grupo: 'cardio',
        series: 1,
        repeticoes: String(cardio),
        observacao: `${cardio} minutos em ritmo moderado`,
      });
    }

    const foco = juntar([...new Set(grupos)].map((grupo) => NOME_GRUPO[grupo]));

    return {
      nome: `Treino ${String.fromCharCode(65 + indice)}`,
      foco: foco.charAt(0).toUpperCase() + foco.slice(1),
      exercicios,
    };
  });

  const resumo = [
    `Divisão em ${dias} treinos de ${minutos} minutos, ${local === 'casa' ? 'em casa, sem aparelhos' : 'na academia'}.`,
    'Cada treino começa com aquecimento' + (cardio > 0 ? ' e termina com cardio.' : '.'),
    menor
      ? 'Como você é menor de idade, use carga leve e treine com um professor por perto.'
      : 'Ajuste a carga para terminar cada série com uma ou duas repetições sobrando.',
    perfil.restricoes
      ? 'Você informou restrições: confira os exercícios com um profissional antes de começar.'
      : null,
  ]
    .filter((frase) => frase !== null)
    .join(' ');

  return { resumo, treinos };
}
