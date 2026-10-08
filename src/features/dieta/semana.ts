import type { PlanoDieta } from './contrato';
import { mesclarPlano, type SlotRefeicao } from './mesclar';

/**
 * Dieta da semana. Modelo simples: um plano que vale para todos os dias
 * (`plano`) e, se a pessoa quiser, um plano diferente em alguns dias
 * (`porDia`, chave 0 = domingo a 6 = sábado, como `Treino.dias`). Lógica pura.
 */

export type DiaSemana = 0 | 1 | 2 | 3 | 4 | 5 | 6;

export type DietaPorDia = Partial<Record<number, PlanoDieta>>;

export type DietaSemana = {
  /** Plano padrão: vale em todo dia que não tem plano próprio. */
  plano: PlanoDieta | null;
  /** Dias com plano próprio ("dieta de sexta"). */
  porDia: DietaPorDia;
};

/** Ordem do seletor: semana começando na segunda, como a pessoa fala. */
export const ORDEM_DIAS: readonly DiaSemana[] = [1, 2, 3, 4, 5, 6, 0];

const SIGLAS = ['dom', 'seg', 'ter', 'qua', 'qui', 'sex', 'sáb'] as const;
const NOMES = ['domingo', 'segunda', 'terça', 'quarta', 'quinta', 'sexta', 'sábado'] as const;

export function ehDia(valor: unknown): valor is DiaSemana {
  return typeof valor === 'number' && Number.isInteger(valor) && valor >= 0 && valor <= 6;
}

export function nomeDoDiaSemana(dia: number): string {
  return NOMES[dia] ?? '';
}

/** O plano que vale num dia: o próprio do dia ou, sem ele, o padrão. */
export function planoDoDia(semana: DietaSemana, dia: number): PlanoDieta | null {
  return semana.porDia[dia] ?? semana.plano;
}

/** O dia tem plano próprio (diferente do padrão)? */
export function temPlanoProprio(semana: DietaSemana, dia: number): boolean {
  return semana.porDia[dia] !== undefined;
}

/** Dias com plano próprio, em ordem de semana (segunda primeiro). */
export function diasPersonalizados(semana: DietaSemana): DiaSemana[] {
  return ORDEM_DIAS.filter((dia) => temPlanoProprio(semana, dia));
}

function iguais(a: PlanoDieta | null | undefined, b: PlanoDieta | null | undefined): boolean {
  return JSON.stringify(a ?? null) === JSON.stringify(b ?? null);
}

/**
 * Dá um plano próprio para os dias. Se o plano ficar igual ao padrão, o dia
 * volta a seguir o padrão (sem cópia guardada à toa).
 */
export function definirDias(
  semana: DietaSemana,
  dias: readonly number[],
  plano: PlanoDieta,
): DietaSemana {
  const porDia: DietaPorDia = { ...semana.porDia };
  const padrao = semana.plano ?? plano;

  for (const dia of dias.filter(ehDia)) {
    if (iguais(plano, padrao)) {
      delete porDia[dia];
    } else {
      porDia[dia] = plano;
    }
  }

  return { plano: padrao, porDia };
}

/** O dia volta a seguir o plano padrão. */
export function voltarAoPadrao(semana: DietaSemana, dia: number): DietaSemana {
  if (!temPlanoProprio(semana, dia)) {
    return semana;
  }

  const porDia: DietaPorDia = { ...semana.porDia };
  delete porDia[dia];

  return { ...semana, porDia };
}

/** Plano novo para a semana toda: os dias com plano próprio deixam de existir. */
export function planoDaSemanaToda(plano: PlanoDieta): DietaSemana {
  return { plano, porDia: {} };
}

/**
 * Aplica uma dieta proposta (coach ou IA) na semana.
 * - com `dias`: só esses dias mudam. Num ajuste, cada dia junta o próprio
 *   plano com as refeições pedidas (`alvos`); o resto do dia fica igual.
 * - sem `dias` e plano novo: vira o plano da semana toda.
 * - sem `dias` e ajuste: muda o plano padrão; os dias com plano próprio ficam.
 */
export function aplicarNaSemana(
  semana: DietaSemana,
  plano: PlanoDieta,
  opcoes: {
    dias?: readonly number[];
    alvos?: readonly SlotRefeicao[];
    modo?: 'novo' | 'ajuste';
  } = {},
): DietaSemana {
  const dias = (opcoes.dias ?? []).filter(ehDia);
  const alvos = opcoes.alvos ?? [];

  if (dias.length === 0) {
    return opcoes.modo === 'ajuste' ? { ...semana, plano } : planoDaSemanaToda(plano);
  }

  let resultado: DietaSemana = semana.plano ? semana : { plano, porDia: {} };

  for (const dia of dias) {
    const atual = planoDoDia(resultado, dia);
    const doDia = opcoes.modo === 'ajuste' ? mesclarPlano(atual, plano, alvos) : plano;

    resultado = definirDias(resultado, [dia], doDia);
  }

  return resultado;
}

export type DiaDoSeletor = {
  dia: DiaSemana;
  /** "seg", "ter"... */
  sigla: string;
  /** "segunda", "terça"... */
  nome: string;
  hoje: boolean;
  /** Tem plano próprio, diferente do padrão. */
  proprio: boolean;
};

/** Os 7 botões do seletor de dias da tela de dieta, de segunda a domingo. */
export function diasDoSeletor(semana: DietaSemana, hoje: number): DiaDoSeletor[] {
  return ORDEM_DIAS.map((dia) => ({
    dia,
    sigla: SIGLAS[dia],
    nome: NOMES[dia],
    hoje: dia === hoje,
    proprio: temPlanoProprio(semana, dia),
  }));
}

/** Legenda do dia escolhido: "dieta de sexta, só deste dia" ou "dieta de sexta, igual à semana". */
export function legendaDoDia(semana: DietaSemana, dia: number, hoje: number): string {
  const nome = dia === hoje ? `hoje, ${nomeDoDiaSemana(dia)}` : nomeDoDiaSemana(dia);

  return temPlanoProprio(semana, dia)
    ? `${nome}: plano só deste dia`
    : `${nome}: mesmo plano da semana`;
}

type TreinoComDias = { nome: string; foco?: string; dias?: readonly number[] };

/**
 * Treino marcado para o dia, em texto para a IA ("Treino B, pernas"). Sem
 * treino no dia (ou treinos sem dias marcados), `undefined`.
 */
export function treinoNoDia(treinos: readonly TreinoComDias[], dia: number): string | undefined {
  const treino = treinos.find((item) => item.dias?.includes(dia));

  if (!treino) {
    return undefined;
  }

  return treino.foco ? `${treino.nome}, ${treino.foco}` : treino.nome;
}

/** Título do botão que monta o plano de um dia só: "plano só para sexta" (cabe em 360 px). */
export function tituloPlanoDoDia(dia: number): string {
  return `plano só para ${nomeDoDiaSemana(dia)}`;
}

/** Título do botão que volta o dia ao plano da semana. */
export const TITULO_VOLTAR_AO_PADRAO = 'voltar ao plano da semana';

/**
 * Dados salvos de versões antigas viram o formato da semana. Até a versão 1
 * só existia `plano` (um plano para todos os dias): ele vira o padrão.
 */
export function migrarDieta(salvo: unknown, versao: number): Record<string, unknown> {
  const estado = (salvo && typeof salvo === 'object' ? salvo : {}) as Record<string, unknown>;

  if (versao < 2 || !estado.porDia || typeof estado.porDia !== 'object') {
    return { ...estado, plano: estado.plano ?? null, porDia: {} };
  }

  return estado;
}
