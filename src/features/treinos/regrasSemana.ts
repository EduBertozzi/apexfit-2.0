import type { Perfil } from '@/features/perfil/types';

import { exercicioDeAquecimento } from './aquecimento';
import { CATALOGO, exerciciosDe, type ExercicioCatalogo } from './catalogo';
import type {
  AreaEscolhida,
  EquipamentoTreino,
  EscolhasSemana,
  ExercicioIa,
  NivelTreino,
  RespostaTreinosIa,
} from './contratoIa';
import { textoDosDias } from './diasIa';
import { focoDoDia, NOME_EQUIPAMENTO, NOME_NIVEL, nomeTreinoDoDia } from './montadorIa';
import { filtroDeRestricoes } from './regrasIa';

/**
 * Modo offline do montador da semana: monta um treino por dia escolhido só com
 * o catálogo, sem IA nem internet. Usado quando o servidor não tem IA ou o
 * pedido falha, para o app sempre entregar a semana.
 */

/** Exercícios de força por treino, conforme o nível. */
const EXERCICIOS_POR_NIVEL: Record<NivelTreino, number> = {
  iniciante: 4,
  intermediario: 5,
  avancado: 6,
};

const SERIES_POR_NIVEL: Record<NivelTreino, number> = {
  iniciante: 3,
  intermediario: 3,
  avancado: 4,
};

const REPETICOES_POR_NIVEL: Record<NivelTreino, string> = {
  iniciante: '12',
  intermediario: '10 a 12',
  avancado: '8 a 12',
};

/** Minutos de cardio: sozinho no dia ou no fim do treino de força. */
const MINUTOS_CARDIO: Record<NivelTreino, { sozinho: number; junto: number }> = {
  iniciante: { sozinho: 20, junto: 10 },
  intermediario: { sozinho: 30, junto: 15 },
  avancado: { sozinho: 40, junto: 20 },
};

/** O que precisa de equipamento que a pessoa não tem. */
const PRECISA: Record<EquipamentoTreino, RegExp | null> = {
  academia: null,
  // Com halteres em casa: sem barra, cabo, polia nem máquina
  halteres: /barra|cabo|polia|pulley|maquina|leg press|cadeira|mesa|smith|hack|scott|rolo|elastico/,
  // Só o corpo: nem halter nem barra
  corpo:
    /barra|cabo|polia|pulley|maquina|leg press|cadeira|mesa|smith|hack|scott|rolo|elastico|halter|rosca|desenvolvimento|elevacao (lateral|frontal)|crucifixo|stiff|remada (unilateral|alta)/,
};

function normalizar(texto: string): string {
  return texto.trim().toLocaleLowerCase('pt-BR').normalize('NFD').replace(/[̀-ͯ]/g, '');
}

/** Cabe no equipamento escolhido? */
export function cabeNoEquipamento(
  exercicio: Pick<ExercicioCatalogo, 'nome' | 'local'>,
  equipamento: EquipamentoTreino,
): boolean {
  const proibido = PRECISA[equipamento];

  if (proibido === null) {
    return exercicio.local !== 'casa' || !/mochila|garrafa/.test(normalizar(exercicio.nome));
  }

  return exercicio.local !== 'academia' && !proibido.test(normalizar(exercicio.nome));
}

/**
 * Filtro do campo "evitar": tira exercícios citados pelo nome ("leg press",
 * "agachamento") e os que forçam uma lesão citada ("joelho", "lombar").
 */
export function filtroDoEvitar(evitar: string, restricoes?: string): (nome: string) => boolean {
  const pedacos = normalizar(evitar)
    .split(/[,;.\n]|\se\s/)
    .map((pedaco) => pedaco.replace(/^(sem|nada de|evitar|evite)\s+/, '').trim())
    .filter((pedaco) => pedaco.length >= 4);
  const porLesao = filtroDeRestricoes(`${evitar} ${restricoes ?? ''}`);

  return (nome) => {
    const texto = normalizar(nome);

    return porLesao(nome) && !pedacos.some((pedaco) => texto.includes(pedaco));
  };
}

/** Exercícios da área, alternando entre as regiões escolhidas (ou todas). */
function candidatos(area: AreaEscolhida): ExercicioCatalogo[] {
  if (area.regioes.length === 0) {
    return exerciciosDe(area.area);
  }

  const listas = area.regioes.map((regiao) => exerciciosDe(area.area, regiao));
  const maior = Math.max(0, ...listas.map((lista) => lista.length));
  const intercalados: ExercicioCatalogo[] = [];

  for (let i = 0; i < maior; i++) {
    for (const lista of listas) {
      if (lista[i]) {
        intercalados.push(lista[i]);
      }
    }
  }

  return intercalados;
}

/** Reparte o total de exercícios entre as áreas de força do dia (pelo menos 1 cada). */
export function exerciciosPorArea(total: number, areas: number): number[] {
  if (areas <= 0) {
    return [];
  }

  const base = Math.max(1, Math.floor(total / areas));
  const sobra = Math.max(0, total - base * areas);

  return Array.from({ length: areas }, (_, indice) => base + (indice < sobra ? 1 : 0));
}

function juntar(itens: readonly string[]): string {
  return itens.length > 1
    ? `${itens.slice(0, -1).join(', ')} e ${itens[itens.length - 1]}`
    : (itens[0] ?? '');
}

export function montarSemanaPorRegras(perfil: Perfil, escolhas: EscolhasSemana): RespostaTreinosIa {
  const { nivel, equipamento } = escolhas;
  const menor = perfil.idade < 18;
  const permitido = filtroDoEvitar(escolhas.evitar, perfil.restricoes);
  const series = menor ? 3 : SERIES_POR_NIVEL[nivel];
  const repeticoes =
    menor || perfil.objetivo === 'perder' ? '12 a 15' : REPETICOES_POR_NIVEL[nivel];
  // Quantas vezes cada área já apareceu: o segundo dia de perna começa de outro exercício
  const usados = new Map<string, number>();

  const treinos = escolhas.dias.map((dia) => {
    const exercicios: ExercicioIa[] = escolhas.aquecimento.ativo
      ? escolhas.aquecimento.itens.map((item) => {
          const { nome, series: seriesAq, repeticoes: repsAq } = exercicioDeAquecimento(item);

          return { nome, grupo: 'aquecimento' as const, series: seriesAq, repeticoes: repsAq };
        })
      : [];
    const forca = dia.areas.filter((area) => area.area !== 'cardio');
    const cardio = dia.areas.find((area) => area.area === 'cardio');
    const quantidades = exerciciosPorArea(EXERCICIOS_POR_NIVEL[nivel], forca.length);

    forca.forEach((area, indice) => {
      const todos = candidatos(area).filter((item) => permitido(item.nome));
      const doEquipamento = todos.filter((item) => cabeNoEquipamento(item, equipamento));
      // Sem nada no equipamento (ex: bíceps só com o corpo), usa o que der em casa
      const lista =
        doEquipamento.length > 0
          ? doEquipamento
          : todos.filter((item) => item.local !== 'academia');
      const chave = `${area.area}:${area.regioes.join(',')}`;
      const inicio = usados.get(chave) ?? 0;
      usados.set(chave, inicio + 1);

      for (let i = 0; i < Math.min(quantidades[indice], lista.length); i++) {
        const item = lista[(inicio * quantidades[indice] + i) % lista.length];

        exercicios.push({
          nome: item.nome,
          grupo: item.grupo,
          series: item.grupo === 'abdominal' ? 3 : series,
          repeticoes: item.grupo === 'abdominal' ? item.repeticoes : repeticoes,
          ...(menor && i === 0 ? { observacao: 'Carga leve, foco na técnica' } : {}),
        });
      }
    });

    if (cardio) {
      const minutos = MINUTOS_CARDIO[nivel][forca.length === 0 ? 'sozinho' : 'junto'];
      const opcoes = candidatos(cardio).filter(
        (item) => permitido(item.nome) && cabeNoEquipamento(item, equipamento),
      );
      const reserva = CATALOGO.find((item) => item.nome === 'caminhada');
      const escolhido = opcoes[(usados.get('cardio') ?? 0) % Math.max(1, opcoes.length)] ?? reserva;
      usados.set('cardio', (usados.get('cardio') ?? 0) + 1);

      if (escolhido) {
        exercicios.push({
          nome: escolhido.nome,
          grupo: 'cardio',
          series: 1,
          repeticoes: `${minutos} min`,
          observacao: `${minutos} minutos em ritmo moderado`,
        });
      }
    }

    return { nome: nomeTreinoDoDia(dia.dia), foco: focoDoDia(dia), exercicios };
  });

  const resumo = [
    `${treinos.length === 1 ? 'Um treino' : `${treinos.length} treinos`}, um por dia: ${textoDosDias(escolhas.dias.map((dia) => dia.dia))}.`,
    `Nível ${NOME_NIVEL[nivel]}, com ${NOME_EQUIPAMENTO[equipamento]}.`,
    escolhas.aquecimento.ativo
      ? `Cada treino começa com ${juntar(escolhas.aquecimento.itens.map((item) => item.nome))}.`
      : null,
    menor
      ? 'Como você é menor de idade, use carga leve e treine com um professor por perto.'
      : 'Ajuste a carga para terminar cada série com uma ou duas repetições sobrando.',
    escolhas.evitar.trim() || perfil.restricoes
      ? 'Você pediu para evitar algumas coisas: confira os exercícios com um profissional.'
      : null,
  ]
    .filter((frase) => frase !== null)
    .join(' ');

  return { resumo, treinos };
}
