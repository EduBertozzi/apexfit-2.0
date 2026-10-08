import type { PlanoDieta } from '@/features/dieta/contrato';
import type { SlotRefeicao } from '@/features/dieta/mesclar';
import { planoDoDia, type DietaSemana } from '@/features/dieta/semana';
import { textoDosDias } from '@/features/treinos/diasIa';
import { treinosNosDias } from '@/features/treinos/mesclar';

import type { PedidoCoach, TreinoAtual } from './contrato';
import {
  diasCitados,
  diasDoAjusteDeTreino,
  modoDaDieta,
  modoDoTreino,
  refeicoesPedidas,
  type ModoMudanca,
} from './intencao';

/**
 * O que um pedido ao coach quer mudar, lido no servidor (as IAs) com os dados
 * que o app mandou. Lógica pura: "muda o almoço de quarta" mira só a dieta de
 * quarta; "troca o supino da sexta" mira só o treino de sexta.
 */

/** Dieta da semana que veio no pedido. */
export function semanaDoPedido(pedido: PedidoCoach): DietaSemana {
  const porDia: DietaSemana['porDia'] = {};

  for (const { dia, plano } of pedido.dietaPorDia ?? []) {
    porDia[dia] = plano;
  }

  return { plano: pedido.planoAtual ?? null, porDia };
}

/** Dias citados em qualquer um dos textos (a mensagem e o pedido da ferramenta), sem repetir. */
export function diasDosTextos(...textos: string[]): number[] {
  return [...new Set(textos.flatMap(diasCitados))].sort((a, b) => a - b);
}

export type AlvoDieta = {
  modo: ModoMudanca;
  /** Refeições pedidas (num ajuste). */
  alvos: SlotRefeicao[];
  /** Dias citados; vazio = semana toda. */
  dias: number[];
  /** O plano que vale hoje no alvo (o do dia citado ou o da semana). */
  atual: PlanoDieta | null;
};

/**
 * `pedido`: o que mudar (a frase da ferramenta ou a mensagem). `outros`: mais
 * textos onde procurar o dia da semana (ex: a última mensagem da pessoa).
 */
export function alvoDaDieta(pedido: PedidoCoach, texto: string, ...outros: string[]): AlvoDieta {
  const dias = diasDosTextos(texto, ...outros);
  const semana = semanaDoPedido(pedido);
  const atual = dias.length > 0 ? planoDoDia(semana, dias[0]) : semana.plano;
  const modo = modoDaDieta(texto, atual !== null);

  return { modo, alvos: modo === 'ajuste' ? refeicoesPedidas(texto) : [], dias, atual };
}

/** Prefixo das linhas de mudança: "quarta: almoço trocado". */
export function comPrefixoDias(linhas: readonly string[], dias: readonly number[]): string[] {
  return dias.length > 0 ? linhas.map((linha) => `${textoDosDias(dias)}: ${linha}`) : [...linhas];
}

export type AlvoTreino = {
  modo: ModoMudanca;
  /** Dias citados num ajuste ("o supino da sexta"); vazio = qualquer treino. */
  diasAlvo: number[];
  /** Treinos marcados nesses dias (vazio se não citou dia). */
  doDia: TreinoAtual[];
};

export function alvoDoTreino(pedido: PedidoCoach, texto: string, ...outros: string[]): AlvoTreino {
  const atuais = pedido.treinosAtuais ?? [];
  const modo = modoDoTreino(texto, atuais.length > 0);
  const diasAlvo =
    modo === 'ajuste'
      ? [...new Set([texto, ...outros].flatMap(diasDoAjusteDeTreino))].sort((a, b) => a - b)
      : [];

  return {
    modo,
    diasAlvo,
    doDia: diasAlvo.length > 0 ? treinosNosDias(atuais, diasAlvo) : [],
  };
}
