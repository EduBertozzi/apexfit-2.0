import { diasEntre } from '@/shared/lib/data';

/** Copos rápidos mostrados na tela. */
export const PORCOES_ML = [250, 500] as const;

/** Um toque no card de água da tela inicial soma um copo deste tamanho. */
export const PORCAO_RAPIDA_ML = 250;

/** Quantos dias de histórico guardamos no aparelho. */
export const DIAS_DE_HISTORICO = 90;

/**
 * Registros por dia: `{ "2026-10-02": [250, 250, 500] }`.
 * Guardamos cada porção (e não só o total) para o "desfazer" saber o que remover.
 */
export type RegistrosPorDia = Record<string, number[]>;

/** A última porção do dia (a que o "desfazer" tira), ou `null` se não tem nenhuma. */
export function ultimaPorcao(porcoes: readonly number[] | undefined): number | null {
  return porcoes && porcoes.length > 0 ? porcoes[porcoes.length - 1] : null;
}

export function totalDoDia(porcoes: readonly number[] | undefined): number {
  if (!porcoes) {
    return 0;
  }

  return porcoes.reduce((soma, ml) => soma + ml, 0);
}

/** Progresso de 0 a 1 (nunca passa de 1, mesmo se beber além da meta). */
export function progresso(totalMl: number, metaMl: number): number {
  if (metaMl <= 0) {
    return 0;
  }

  return Math.min(totalMl / metaMl, 1);
}

/**
 * A meta foi batida AGORA, com esta porção?
 * Na v1 a conta era `consumido == meta`: com meta de 2450 ml e copos de 250 ml
 * o total pulava de 2250 para 2500 e o parabéns nunca aparecia.
 */
export function bateuMetaAgora(antesMl: number, depoisMl: number, metaMl: number): boolean {
  return antesMl < metaMl && depoisMl >= metaMl;
}

export function adicionarPorcao(
  registros: RegistrosPorDia,
  dia: string,
  ml: number,
): RegistrosPorDia {
  if (!Number.isFinite(ml) || ml <= 0) {
    return registros;
  }

  const porcoesDoDia = registros[dia] ?? [];

  return { ...registros, [dia]: [...porcoesDoDia, ml] };
}

export function desfazerUltimaPorcao(registros: RegistrosPorDia, dia: string): RegistrosPorDia {
  const porcoesDoDia = registros[dia];

  if (!porcoesDoDia || porcoesDoDia.length === 0) {
    return registros;
  }

  return { ...registros, [dia]: porcoesDoDia.slice(0, -1) };
}

/** Remove dias mais antigos que o limite, para o armazenamento não crescer para sempre. */
export function limparHistoricoAntigo(registros: RegistrosPorDia, hoje: string): RegistrosPorDia {
  const resultado: RegistrosPorDia = {};

  for (const [dia, porcoes] of Object.entries(registros)) {
    if (diasEntre(dia, hoje) < DIAS_DE_HISTORICO) {
      resultado[dia] = porcoes;
    }
  }

  return resultado;
}
