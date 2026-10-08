import { minusculaInicial } from '@/shared/lib/texto';

import type { PlanoDieta } from './contrato';

/**
 * Pedido pequeno ("troca o café da manhã") muda só aquela refeição: o resto
 * do plano fica exatamente como estava, mesmo que a IA tenha mexido. Lógica pura.
 */

export const SLOTS_REFEICAO = ['cafe', 'almoco', 'lanche', 'jantar', 'ceia'] as const;

export type SlotRefeicao = (typeof SLOTS_REFEICAO)[number];

function normalizar(texto: string): string {
  return texto.toLowerCase().normalize('NFD').replace(/[̀-ͯ]/g, '').trim();
}

/** "Café da manhã" vira "cafe"; "Lanche da tarde" vira "lanche". Outro nome: null. */
export function slotDaRefeicao(nome: string): SlotRefeicao | null {
  const normal = normalizar(nome);

  if (/\bcafe\b/.test(normal)) return 'cafe';
  if (/\balmoco\b/.test(normal)) return 'almoco';
  if (/\blanche\b/.test(normal)) return 'lanche';
  if (/\bjant(ar|a)\b/.test(normal)) return 'jantar';
  if (/\bceia\b/.test(normal)) return 'ceia';

  return null;
}

type Refeicao = PlanoDieta['refeicoes'][number];

function chave(refeicao: Refeicao): string {
  return slotDaRefeicao(refeicao.nome) ?? normalizar(refeicao.nome);
}

/**
 * Junta o plano proposto com o atual. Só as refeições em `alvos` vêm do
 * proposto; as outras voltam iguais às do plano atual (o mesmo objeto). O
 * total de calorias é recalculado. Sem alvos (ou sem plano atual), vale o proposto.
 */
export function mesclarPlano(
  atual: PlanoDieta | null,
  proposto: PlanoDieta,
  alvos: readonly SlotRefeicao[],
): PlanoDieta {
  if (!atual || alvos.length === 0) {
    return proposto;
  }

  const refeicoes = atual.refeicoes.map((refeicao) => {
    const slot = slotDaRefeicao(refeicao.nome);

    if (!slot || !alvos.includes(slot)) {
      return refeicao;
    }

    return proposto.refeicoes.find((nova) => slotDaRefeicao(nova.nome) === slot) ?? refeicao;
  });

  return {
    ...proposto,
    refeicoes,
    caloriasDia: refeicoes.reduce((soma, refeicao) => soma + refeicao.calorias, 0),
  };
}

function femininoDe(refeicao: Refeicao): boolean {
  return slotDaRefeicao(refeicao.nome) === 'ceia';
}

/**
 * O que mudou de um plano para o outro, uma linha por refeição:
 * "café da manhã trocado". Sem plano antes, lista vazia.
 */
export function resumoMudancasDieta(atual: PlanoDieta | null, novo: PlanoDieta): string[] {
  if (!atual) {
    return [];
  }

  const linhas: string[] = [];

  for (const refeicao of novo.refeicoes) {
    const antes = atual.refeicoes.find((item) => chave(item) === chave(refeicao));
    const nome = minusculaInicial(refeicao.nome);
    const a = femininoDe(refeicao) ? 'a' : 'o';

    if (!antes) {
      linhas.push(`${nome} nov${a}`);
    } else if (JSON.stringify(antes.itens) !== JSON.stringify(refeicao.itens)) {
      linhas.push(`${nome} trocad${a}`);
    } else if (antes.horario !== refeicao.horario) {
      linhas.push(`${nome} agora às ${refeicao.horario}`);
    }
  }

  for (const antes of atual.refeicoes) {
    if (!novo.refeicoes.some((refeicao) => chave(refeicao) === chave(antes))) {
      linhas.push(`${minusculaInicial(antes.nome)} sai do plano`);
    }
  }

  return linhas;
}
