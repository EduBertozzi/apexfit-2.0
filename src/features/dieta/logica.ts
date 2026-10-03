/** Diferença a partir da qual o plano já não serve para a meta atual. */
export const TOLERANCIA_PLANO = 0.05;

/**
 * O plano foi feito para outra meta de calorias? (perfil editado: peso,
 * atividade ou objetivo mudaram). Diferenças pequenas são arredondamento da IA.
 */
export function planoDesatualizado(caloriasPlano: number, metaAtual: number | null): boolean {
  if (metaAtual === null || metaAtual <= 0) {
    return false;
  }

  return Math.abs(caloriasPlano - metaAtual) / metaAtual > TOLERANCIA_PLANO;
}
