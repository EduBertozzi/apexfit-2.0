import type { CircuitoCardio, DiaMontado, EquipamentoTreino, ExercicioIa } from './contratoIa';
import { LIMITES_MONTADOR } from './contratoIa';

/**
 * Cardio em circuito (montador da semana): vários exercícios curtos com o peso
 * do corpo, cada um por alguns segundos, repetidos em voltas. Lógica pura.
 *
 * No treino salvo, cada exercício do circuito é do grupo "cardio", com
 * séries = voltas e repetições = segundos ("40 s"), e a observação explica o
 * descanso. O circuito é um bloco à parte: NÃO entra na conta do contador
 * "exercícios" do dia (que vale para a musculação e o cardio contínuo).
 */

export const CIRCUITO_PADRAO: CircuitoCardio = { exercicios: 4, segundos: 40, voltas: 3 };

/** Passo do "+" e "-" de cada número do circuito. */
export const PASSO_CIRCUITO: Record<keyof CircuitoCardio, number> = {
  exercicios: 1,
  segundos: 10,
  voltas: 1,
};

/** Descanso fixo, dito na observação de cada exercício. */
export const DESCANSO_CIRCUITO = { entreExercicios: 20, entreVoltas: 60 } as const;

/** Exercícios do circuito, na ordem em que entram. `corda`: precisa de uma corda. */
export const OPCOES_CIRCUITO: readonly { nome: string; corda?: boolean }[] = [
  { nome: 'polichinelo' },
  { nome: 'corrida no lugar' },
  { nome: 'escalador' },
  { nome: 'agachamento com salto' },
  { nome: 'burpee' },
  { nome: 'pular corda', corda: true },
  { nome: 'skipping alto' },
  { nome: 'polichinelo cruzado' },
];

function entre(valor: number, min: number, max: number): number {
  return Math.min(max, Math.max(min, valor));
}

/** O circuito do dia, só quando o dia tem cardio e está no modo circuito. */
export function circuitoDoDia(dia: DiaMontado): CircuitoCardio | undefined {
  return dia.areas.some((item) => item.area === 'cardio') ? dia.circuito : undefined;
}

/** Um passo para cima ou para baixo num dos números, dentro dos limites. */
export function passoNoCircuito(
  circuito: CircuitoCardio,
  campo: keyof CircuitoCardio,
  sentido: 1 | -1,
): CircuitoCardio {
  const { min, max } = LIMITES_MONTADOR.circuito[campo];

  return {
    ...circuito,
    [campo]: entre(circuito[campo] + PASSO_CIRCUITO[campo] * sentido, min, max),
  };
}

/** Circuito salvo estragado (ou de outra versão) volta para undefined. */
export function circuitoValido(salvo: unknown): CircuitoCardio | undefined {
  if (typeof salvo !== 'object' || salvo === null) {
    return undefined;
  }

  const dados = salvo as Record<string, unknown>;
  const campos = Object.keys(LIMITES_MONTADOR.circuito) as (keyof CircuitoCardio)[];
  const valido = campos.every((campo) => {
    const valor = dados[campo];
    const { min, max } = LIMITES_MONTADOR.circuito[campo];

    return typeof valor === 'number' && Number.isInteger(valor) && valor >= min && valor <= max;
  });

  return valido
    ? {
        exercicios: dados.exercicios as number,
        segundos: dados.segundos as number,
        voltas: dados.voltas as number,
      }
    : undefined;
}

// ---------------------------------------------------------------------------
// Textos
// ---------------------------------------------------------------------------

/** "40 s" (o formato das repetições de um exercício por segundos). */
export function textoSegundos(segundos: number): string {
  return `${segundos} s`;
}

/** "circuito: 4 exercícios de 40 s, 3 voltas". */
export function textoCircuito(circuito: CircuitoCardio): string {
  const voltas = circuito.voltas === 1 ? '1 volta' : `${circuito.voltas} voltas`;

  return `circuito: ${circuito.exercicios} exercícios de ${textoSegundos(circuito.segundos)}, ${voltas}`;
}

/** Observação de cada exercício: "circuito: 3 voltas, 20 s de descanso entre exercícios e 1 min entre voltas". */
export function observacaoCircuito(circuito: CircuitoCardio): string {
  const voltas = circuito.voltas === 1 ? '1 volta' : `${circuito.voltas} voltas`;

  return `circuito: ${voltas}, ${DESCANSO_CIRCUITO.entreExercicios} s de descanso entre exercícios e ${DESCANSO_CIRCUITO.entreVoltas / 60} min entre voltas`;
}

// ---------------------------------------------------------------------------
// Exercícios
// ---------------------------------------------------------------------------

/** Deixa um exercício de cardio no formato do circuito (voltas, segundos, observação). */
export function noFormatoDoCircuito<T extends Pick<ExercicioIa, 'nome'>>(
  exercicio: T,
  circuito: CircuitoCardio,
): T & { grupo: 'cardio'; series: number; repeticoes: string; observacao: string } {
  return {
    ...exercicio,
    grupo: 'cardio',
    series: circuito.voltas,
    repeticoes: textoSegundos(circuito.segundos),
    observacao: observacaoCircuito(circuito),
  };
}

/**
 * Os exercícios do circuito no modo offline. `vez`: quantos circuitos já
 * saíram na semana, para o próximo dia começar de outro exercício.
 */
export function montarCircuito(
  circuito: CircuitoCardio,
  equipamento: EquipamentoTreino,
  permitido: (nome: string) => boolean,
  vez = 0,
): ExercicioIa[] {
  const opcoes = OPCOES_CIRCUITO.filter(
    (item) => permitido(item.nome) && !(item.corda && equipamento === 'corpo'),
  );
  // Se o "evitar" tirou tudo, corrida no lugar é o mais leve
  const lista = opcoes.length > 0 ? opcoes : [{ nome: 'corrida no lugar' }];
  const quantidade = Math.min(circuito.exercicios, lista.length);

  return Array.from({ length: quantidade }, (_, i) =>
    noFormatoDoCircuito({ nome: lista[(vez + i) % lista.length].nome }, circuito),
  );
}
