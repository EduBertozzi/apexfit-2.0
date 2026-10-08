import { formatarNumero } from '@/shared/lib/numero';

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

export type CartaoDietaInicio = {
  /** "5 refeições · 2.970 kcal" ou "meta do dia 2.970 kcal" */
  linha: string;
  /** "montar dieta", "complete o perfil"... `null` quando já tem plano. */
  dica: string | null;
  /** Frase lida pelo leitor de tela. */
  acessivel: string;
  /** O que acontece ao tocar, para o leitor de tela. */
  dicaToque: string;
  destino: '/dieta' | '/editar-perfil';
};

/**
 * Card de dieta da tela inicial (junta o antigo card de calorias):
 * com plano mostra refeições e calorias; sem plano, a meta do dia e o convite
 * para montar; sem dados no perfil para calcular a meta, leva para completar.
 */
export function textoDietaInicio(
  plano: { refeicoes: readonly unknown[]; caloriasDia: number } | null,
  metaCalorias: number | null,
): CartaoDietaInicio {
  if (plano) {
    const n = plano.refeicoes.length;
    const refeicoes = n === 1 ? '1 refeição' : `${n} refeições`;
    const kcal = formatarNumero(plano.caloriasDia);

    return {
      linha: `${refeicoes} · ${kcal} kcal`,
      dica: null,
      acessivel: `dieta: ${refeicoes}, ${kcal} quilocalorias por dia`,
      dicaToque: 'abre a dieta',
      destino: '/dieta',
    };
  }

  if (metaCalorias !== null) {
    const kcal = formatarNumero(metaCalorias);

    return {
      linha: `meta do dia ${kcal} kcal`,
      dica: 'montar dieta',
      acessivel: `dieta: meta do dia ${kcal} quilocalorias, montar dieta`,
      dicaToque: 'abre a dieta para montar seu plano',
      destino: '/dieta',
    };
  }

  return {
    linha: 'complete o perfil',
    dica: 'para calcular sua meta',
    acessivel: 'dieta: complete o perfil para o app calcular sua meta',
    dicaToque: 'abre a edição do perfil',
    destino: '/editar-perfil',
  };
}
