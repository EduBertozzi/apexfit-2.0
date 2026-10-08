import { inferirGrupo } from '@/features/treinos/grupos';
import { treinosNosDias } from '@/features/treinos/mesclar';
import type { DadosTreino, Treino } from '@/features/treinos/types';

import { diasCitados } from './intencao';

/**
 * Pedidos simples de exercício que o modo demonstração (sem IA) resolve:
 * "troca o supino da sexta por supino inclinado", "troca o leg press por
 * agachamento", "tira o cardio de segunda". Lógica pura.
 */

/** `para` vazio: a pessoa não disse por qual exercício ("troca o supino da sexta"). */
export type PedidoExercicio =
  | { tipo: 'trocar'; de: string; para: string; dias: number[] }
  | { tipo: 'tirar'; alvo: string; dias: number[] };

/** Minúsculas e sem acento, letra por letra (o tamanho do texto não muda). */
function normalizarAlinhado(texto: string): string {
  return Array.from(
    texto.toLowerCase(),
    (letra) => letra.normalize('NFD').replace(/[̀-ͯ]/g, '') || letra,
  ).join('');
}

function normalizar(texto: string): string {
  return normalizarAlinhado(texto).replace(/\s+/g, ' ').trim();
}

const DIA = '(?:dom|seg|ter|qua|qui|sex|sab)[a-z]*(?:-feiras?)?';

/** "da sexta", "de segunda e quarta", "no treino de sexta", "do treino B" no fim do trecho. */
const SUFIXO = new RegExp(
  `\\s+(?:(?:d[aeo]s?|n[ao]s?|em)\\s+)?(?:(?:d[aeo]s?|n[ao]s?)\\s+)?(?:(?:treino|dia)\\s+(?:d[aeo]s?\\s+|[a-f]\\b\\s*)?)?(?:${DIA}(?:\\s*(?:,|e)\\s*${DIA})*)?\\s*$`,
);

const TREINO_LETRA = /\s+(?:d[ao]|n[ao])\s+treino\s+[a-f]\s*$/;

function semSufixo(trecho: string): string {
  let limpo = trecho.trim();

  // Repete: "do treino de sexta" pode ter mais de um pedaço
  for (let i = 0; i < 3; i++) {
    const antes = limpo;
    limpo = limpo.replace(TREINO_LETRA, '').replace(SUFIXO, '').trim();

    if (limpo === antes) {
      break;
    }
  }

  return limpo;
}

const TROCAR =
  /\b(?:troc\w*|troqu\w*|substitu\w*|mud\w*)\s+(?:(?:o|a|os|as)\s+)?(.+?)\s+(?:por|pel[oa])\s+(?:(?:um|uma|o|a)\s+)?(.+?)\s*[.!?]*$/;
const TROCAR_SEM_POR = /\b(?:troc\w*|troqu\w*|substitu\w*)\s+(?:(?:o|a|os|as)\s+)?(.+?)\s*[.!?]*$/;
const TIRAR = /\b(?:tir\w*|remov\w*)\s+(?:(?:o|a|os|as)\s+)?(.+?)\s*[.!?]*$/;

/** Primeira letra maiúscula, como os nomes de exercício do app. */
function capitalizar(texto: string): string {
  return texto.charAt(0).toLocaleUpperCase('pt-BR') + texto.slice(1);
}

/** Lê o pedido. Sem um pedido claro de troca ou remoção de exercício, `null`. */
export function lerPedidoExercicio(mensagem: string): PedidoExercicio | null {
  const original = mensagem.trim();
  const normal = normalizarAlinhado(original);
  const dias = diasCitados(original);
  const troca = TROCAR.exec(normal);

  if (troca) {
    const de = semSufixo(troca[1]);
    const paraNormal = semSufixo(troca[2]);
    // O "para" mantém acentos e letras do texto original
    const inicio = troca.index + troca[0].lastIndexOf(troca[2]);
    const para = original.slice(inicio, inicio + paraNormal.length).trim();

    if (de.length < 3 || para.length < 3) {
      return null;
    }

    return { tipo: 'trocar', de, para: capitalizar(para), dias };
  }

  const semPor = TROCAR_SEM_POR.exec(normal);

  if (semPor) {
    const de = semSufixo(semPor[1]);

    return de.length >= 3 ? { tipo: 'trocar', de, para: '', dias } : null;
  }

  const tira = TIRAR.exec(normal);

  if (tira) {
    const alvo = semSufixo(tira[1]);

    return alvo.length >= 3 ? { tipo: 'tirar', alvo, dias } : null;
  }

  return null;
}

/** O nome do exercício bate com o que a pessoa escreveu? ("supino" acha "Supino reto"). */
export function nomeBate(nomeExercicio: string, citado: string): boolean {
  const nome = normalizar(nomeExercicio);
  const alvo = normalizar(citado);

  if (alvo.length < 3) {
    return false;
  }

  return (
    nome === alvo ||
    new RegExp(`\\b${alvo.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')}`).test(nome) ||
    // "agachamento livre com barra" citado inteiro para "Agachamento livre"
    alvo.startsWith(`${nome} `)
  );
}

/** Grupos que a pessoa costuma citar no lugar do exercício. */
const GRUPOS_CITAVEIS = ['cardio', 'aquecimento', 'abdominal'] as const;

export type ResultadoExercicio =
  | { ok: true; treinos: DadosTreino[]; achados: number }
  | { ok: false; motivo: 'sem-treino-no-dia' | 'sem-exercicio' }
  /** Achou o exercício, mas a pessoa não disse por qual trocar. */
  | { ok: false; motivo: 'sem-substituto'; encontrado: string };

function paraDados(treino: Treino): DadosTreino {
  return {
    nome: treino.nome,
    ...(treino.foco ? { foco: treino.foco } : {}),
    ...(treino.dias ? { dias: treino.dias } : {}),
    exercicios: treino.exercicios.map(({ id: _id, ...resto }) => resto),
  };
}

/**
 * Aplica o pedido nos treinos salvos e devolve todos eles sem ids (o app junta
 * de novo com `mesclarTreinos`, que mantém os ids do que não mudou). Só os
 * treinos dos dias citados mudam; sem dia, todos os que têm o exercício.
 */
export function aplicarPedidoExercicio(
  treinos: readonly Treino[],
  pedido: PedidoExercicio,
): ResultadoExercicio {
  const alvos = pedido.dias.length > 0 ? treinosNosDias(treinos, pedido.dias) : [...treinos];

  if (alvos.length === 0) {
    return { ok: false, motivo: 'sem-treino-no-dia' };
  }

  const ids = new Set(alvos.map((treino) => treino.id));
  const citado = pedido.tipo === 'trocar' ? pedido.de : pedido.alvo;
  // "tira o cardio": vale o grupo do exercício (esteira, bike...)
  const grupo = GRUPOS_CITAVEIS.find((item) => normalizar(citado) === item);
  const bate = (exercicio: { nome: string; grupo?: string }) =>
    nomeBate(exercicio.nome, citado) ||
    (grupo !== undefined && (exercicio.grupo ?? inferirGrupo(exercicio.nome)) === grupo);
  let achados = 0;
  let encontrado = '';

  const resultado = treinos.map((treino): DadosTreino => {
    const dados = paraDados(treino);

    if (!ids.has(treino.id)) {
      return dados;
    }

    const exercicios = (dados.exercicios ?? []).flatMap((exercicio) => {
      if (!bate(exercicio)) {
        return [exercicio];
      }

      achados += 1;
      encontrado ||= exercicio.nome;

      if (pedido.tipo === 'tirar') {
        return [];
      }

      return [
        {
          nome: pedido.para,
          grupo: inferirGrupo(pedido.para),
          series: exercicio.series,
          repeticoes: exercicio.repeticoes,
        },
      ];
    });

    return { ...dados, exercicios };
  });

  if (achados === 0) {
    return { ok: false, motivo: 'sem-exercicio' };
  }

  if (pedido.tipo === 'trocar' && pedido.para === '') {
    return { ok: false, motivo: 'sem-substituto', encontrado };
  }

  return { ok: true, treinos: resultado, achados };
}
