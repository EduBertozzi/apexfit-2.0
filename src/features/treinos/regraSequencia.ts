/**
 * Regra da sequência ("ninguém é o super-homem"): lógica pura, sem React.
 *
 * Percorre o histórico dia a dia, do primeiro treino registrado até hoje:
 *
 * 1. Dia com pelo menos 50% do treino feito: conta (+1).
 * 2. Descanso do plano semanal (dia sem treino marcado): conta (+1), desde que
 *    já exista uma sequência. Descanso nunca começa uma sequência sozinho.
 * 3. Folga do rodízio: num dia sem treino marcado no plano (rodízio), UM dia sem
 *    treino logo depois de um dia treinado não quebra. Ele vira "descanso" e
 *    conta (+1) quando o próximo dia é treinado. Dois dias seguidos sem treino
 *    quebram (a não ser que um congelador cubra o segundo).
 * 4. Falta que quebraria a sequência gasta um congelador sozinho: o dia fica
 *    "congelado", a sequência segue, mas o dia não soma.
 * 5. Sem congelador, a sequência volta a zero.
 *
 * Congeladores: a cada 7 dias de sequência (7, 14, 21...) a pessoa ganha 1,
 * guardando no máximo 2. Começa com 0 e não perde os guardados quando quebra.
 *
 * Hoje ainda não acabou: sem treino, hoje não conta nem quebra nada. O descanso
 * do plano de hoje já conta. `risco` diz o que acontece se hoje passar em branco.
 *
 * Dias já congelados ficam salvos na store (`congelados`): se o plano mudar
 * depois, um dia que já foi salvo por um congelador continua salvo.
 */
import { diasEntre } from '@/shared/lib/data';

import { treinosNaData } from './logica';
import {
  diaDaSemana,
  ehDescanso,
  fracaoDoDia,
  MINIMO_PARCIAL,
  somarDias,
  type MarcaDoDia,
} from './semana';
import type { Sessao, Treino } from './types';

/** A cada quantos dias de sequência ganha um congelador. */
export const DIAS_POR_CONGELADOR = 7;
/** Quantos congeladores dá para guardar. */
export const MAXIMO_CONGELADORES = 2;

/** Como um dia fechado entra na conta. */
export type TipoDoDia = 'treino' | 'descanso' | 'falta';

export type EntradaDoDia = {
  chave: string;
  tipo: TipoDoDia;
  /** Falta num dia sem treino marcado no plano: pode virar folga do rodízio. */
  folgaPermitida: boolean;
};

/** O que um dia fez com a sequência. */
export type Desfecho = 'conta' | 'folga' | 'congela' | 'quebra' | 'nada';

/**
 * Se hoje passar sem treino:
 * - nenhum: nada a perder (já treinou, descanso, folga do rodízio ou sem sequência)
 * - congela: gasta um congelador, mas ainda sobra outro
 * - ultimo-congelador: gasta o último congelador
 * - quebra: a sequência zera
 */
export type RiscoDeHoje = 'nenhum' | 'congela' | 'ultimo-congelador' | 'quebra';

type Ultimo = 'treino' | 'descanso' | 'folga' | 'congelado' | 'falta' | null;

type Estado = {
  atual: number;
  recorde: number;
  congeladores: number;
  ultimo: Ultimo;
  folgaPendente: string | null;
  marcas: Record<string, MarcaDoDia>;
  congeladosPelaRegra: string[];
};

export type ResultadoSequencia = {
  /** Dias de sequência agora (treinos e descansos; congelados seguram mas não somam). */
  atual: number;
  /** Maior sequência do histórico. */
  recorde: number;
  /** Congeladores guardados agora (0 a 2). */
  congeladores: number;
  /** Dias que aparecem como descanso ou congelado no calendário. */
  marcas: Record<string, MarcaDoDia>;
  /** Dias passados que a regra congelou e ainda não estão salvos na store. */
  congeladosNovos: string[];
  risco: RiscoDeHoje;
  /** Hoje já entrou na conta (treino feito ou descanso do plano). */
  hojeContou: boolean;
};

function estadoInicial(): Estado {
  return {
    atual: 0,
    recorde: 0,
    congeladores: 0,
    ultimo: null,
    folgaPendente: null,
    marcas: {},
    congeladosPelaRegra: [],
  };
}

function contar(estado: Estado) {
  estado.atual++;
  estado.recorde = Math.max(estado.recorde, estado.atual);

  if (estado.atual % DIAS_POR_CONGELADOR === 0 && estado.congeladores < MAXIMO_CONGELADORES) {
    estado.congeladores++;
  }
}

/** Aplica um dia ao estado (muda o estado recebido). */
function avancar(estado: Estado, entrada: EntradaDoDia, salvos: ReadonlySet<string>): Desfecho {
  const { chave, tipo } = entrada;

  if (tipo === 'treino') {
    if (estado.folgaPendente !== null) {
      // A folga de ontem ficou entre dois treinos: conta
      contar(estado);
      estado.folgaPendente = null;
    }

    contar(estado);
    estado.ultimo = 'treino';

    return 'conta';
  }

  if (tipo === 'descanso') {
    estado.marcas[chave] = 'descanso';
    estado.folgaPendente = null;

    if (estado.atual === 0) {
      estado.ultimo = 'descanso';

      return 'nada';
    }

    contar(estado);
    estado.ultimo = 'descanso';

    return 'conta';
  }

  if (estado.atual === 0) {
    estado.ultimo = 'falta';
    estado.folgaPendente = null;

    return 'nada';
  }

  if (entrada.folgaPermitida && estado.ultimo === 'treino') {
    estado.folgaPendente = chave;
    estado.marcas[chave] = 'descanso';
    estado.ultimo = 'folga';

    return 'folga';
  }

  if (estado.congeladores > 0 || salvos.has(chave)) {
    estado.congeladores = Math.max(0, estado.congeladores - 1);
    estado.marcas[chave] = 'congelado';
    estado.folgaPendente = null;
    estado.ultimo = 'congelado';

    if (!salvos.has(chave)) {
      estado.congeladosPelaRegra.push(chave);
    }

    return 'congela';
  }

  // Quebrou: a folga de ontem também não valeu
  if (estado.folgaPendente !== null) {
    delete estado.marcas[estado.folgaPendente];
    estado.folgaPendente = null;
  }

  estado.atual = 0;
  estado.ultimo = 'falta';

  return 'quebra';
}

/**
 * Núcleo da regra sobre dias já classificados (fácil de testar).
 * `hoje` é o último dia e só conta se já tiver treino ou for descanso.
 */
export function percorrerDias(
  dias: readonly EntradaDoDia[],
  hoje: EntradaDoDia | null,
  salvos: readonly string[] = [],
): ResultadoSequencia {
  const guardados = new Set(salvos);
  const estado = estadoInicial();

  for (const dia of dias) {
    avancar(estado, dia, guardados);
  }

  let risco: RiscoDeHoje = 'nenhum';
  let hojeContou = false;

  if (hoje) {
    if (hoje.tipo === 'falta') {
      const copia: Estado = {
        ...estado,
        marcas: { ...estado.marcas },
        congeladosPelaRegra: [...estado.congeladosPelaRegra],
      };
      const antes = copia.congeladores;
      const desfecho = avancar(copia, hoje, new Set());

      if (desfecho === 'quebra') {
        risco = 'quebra';
      } else if (desfecho === 'congela') {
        risco = antes <= 1 ? 'ultimo-congelador' : 'congela';
      }
    } else {
      hojeContou = avancar(estado, hoje, guardados) === 'conta';
    }
  }

  return {
    atual: estado.atual,
    recorde: estado.recorde,
    congeladores: estado.congeladores,
    marcas: estado.marcas,
    congeladosNovos: estado.congeladosPelaRegra,
    risco,
    hojeContou,
  };
}

/** Classifica um dia pelo histórico e pelo plano semanal. */
export function entradaDoDia(
  treinos: readonly Treino[],
  sessoesDoDia: readonly Sessao[],
  chave: string,
): EntradaDoDia {
  const fracao = fracaoDoDia(treinos, sessoesDoDia, chave);
  const semana = diaDaSemana(chave);
  // O plano como era nesse dia: dias marcados depois não cobram treino para trás
  const plano = treinosNaData(treinos, chave);

  if ((fracao ?? 0) >= MINIMO_PARCIAL) {
    return { chave, tipo: 'treino', folgaPermitida: false };
  }

  // O descanso só depende do plano: sem sessões a conta fica barata
  if (ehDescanso(plano, [], chave)) {
    return { chave, tipo: 'descanso', folgaPermitida: false };
  }

  const diaMarcado = plano.some((treino) => treino.dias?.includes(semana));

  return { chave, tipo: 'falta', folgaPermitida: !diaMarcado };
}

/** Primeiro dia com treino registrado (AAAA-MM-DD), ou `null` sem histórico. */
function primeiroDia(sessoes: readonly Sessao[]): string | null {
  let primeiro: string | null = null;

  for (const sessao of sessoes) {
    if (primeiro === null || sessao.data < primeiro) {
      primeiro = sessao.data;
    }
  }

  return primeiro;
}

/** A sequência completa: dias, recorde, congeladores, marcas do calendário e risco de hoje. */
export function calcularSequencia(
  treinos: readonly Treino[],
  sessoes: readonly Sessao[],
  hoje: string,
  salvos: readonly string[] = [],
): ResultadoSequencia {
  const inicio = primeiroDia(sessoes);

  if (inicio === null || inicio > hoje) {
    return percorrerDias([], null, salvos);
  }

  const porDia = new Map<string, Sessao[]>();

  for (const sessao of sessoes) {
    const lista = porDia.get(sessao.data);

    if (lista) {
      lista.push(sessao);
    } else {
      porDia.set(sessao.data, [sessao]);
    }
  }

  const total = diasEntre(inicio, hoje);
  const dias: EntradaDoDia[] = [];

  for (let n = 0; n < total; n++) {
    const chave = somarDias(inicio, n);

    dias.push(entradaDoDia(treinos, porDia.get(chave) ?? [], chave));
  }

  return percorrerDias(dias, entradaDoDia(treinos, porDia.get(hoje) ?? [], hoje), salvos);
}

/** Dias de sequência agora (o número da chama). */
export function sequenciaDeDias(
  treinos: readonly Treino[],
  sessoes: readonly Sessao[],
  hoje: string,
  salvos: readonly string[] = [],
): number {
  return calcularSequencia(treinos, sessoes, hoje, salvos).atual;
}

/** Faltam quantos dias de sequência para o próximo congelador (`null` com o máximo guardado). */
export function faltamParaCongelador(atual: number, congeladores: number): number | null {
  if (congeladores >= MAXIMO_CONGELADORES) {
    return null;
  }

  return DIAS_POR_CONGELADOR - (atual % DIAS_POR_CONGELADOR);
}

/** "1 congelador guardado", "nenhum congelador guardado" */
export function textoCongeladores(congeladores: number): string {
  if (congeladores === 0) {
    return 'nenhum congelador guardado';
  }

  return congeladores === 1 ? '1 congelador guardado' : `${congeladores} congeladores guardados`;
}

/** Linha embaixo dos congeladores: quanto falta para o próximo. */
export function textoProximoCongelador(atual: number, congeladores: number): string {
  const faltam = faltamParaCongelador(atual, congeladores);

  if (faltam === null) {
    return `você já guarda o máximo de ${MAXIMO_CONGELADORES}`;
  }

  return faltam === 1
    ? 'falta 1 dia de sequência para ganhar outro'
    : `faltam ${faltam} dias de sequência para ganhar outro`;
}

/** Explicação do congelador na página de sequência. */
export const EXPLICACAO_CONGELADOR =
  `a cada ${DIAS_POR_CONGELADOR} dias de sequência você ganha um congelador e guarda até ${MAXIMO_CONGELADORES}. ` +
  'se faltar um dia que quebraria a sequência, um congelador é usado sozinho: o dia fica azul e a sequência segue.';

/** Explicação do descanso, para não parecer que a sequência é "treinar todo dia". */
export const EXPLICACAO_DESCANSO =
  'descanso também conta: os dias de descanso do seu plano entram na sequência e, sem plano fixo, um dia de folga entre dois treinos não quebra nada.';

/** Mostra o aviso de última chance? (sequência em jogo e hoje decide) */
export function emUltimaChance(resultado: Pick<ResultadoSequencia, 'atual' | 'risco'>): boolean {
  return (
    resultado.atual > 0 && (resultado.risco === 'quebra' || resultado.risco === 'ultimo-congelador')
  );
}

/** "treine hoje para manter sua sequência de 12 dias" */
export function textoUltimaChance(atual: number, risco: RiscoDeHoje): string {
  const dias = atual === 1 ? '1 dia' : `${atual} dias`;
  const base = `treine hoje para manter sua sequência de ${dias}`;

  return risco === 'ultimo-congelador' ? `${base} sem gastar seu último congelador` : base;
}
