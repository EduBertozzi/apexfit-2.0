import type { PlanoDieta } from '@/features/dieta/contrato';
import type { OrigemPlano } from '@/features/dieta/store';
import type { OrigemTreinos } from '@/features/treinos/storeIa';
import { formatarNumero } from '@/shared/lib/numero';
import type { ProvedorIa } from '@/shared/lib/semIa';

/** Textos da central de IA (aba do cérebro). Funções puras, em minúsculas como o resto da copy. */

const NOME_PROVEDOR: Record<ProvedorIa | 'demo', string> = {
  claude: 'feito pelo Claude',
  openai: 'feito pelo ChatGPT',
  local: 'feito pela IA local',
  demo: 'modo demonstração',
};

/** "feito pelo ChatGPT", "modo demonstração"... null quando não dá para saber. */
export function textoOrigem(origem: OrigemTreinos | null | undefined): string | null {
  return origem ? NOME_PROVEDOR[origem] : null;
}

/** Origem da dieta: o store guarda "ia" ou "demo" e, às vezes, qual IA. */
export function textoOrigemDieta(
  origem: OrigemPlano | null,
  provedor: ProvedorIa | null | undefined,
): string | null {
  if (origem === 'demo') {
    return NOME_PROVEDOR.demo;
  }

  if (origem === 'ia') {
    return provedor ? NOME_PROVEDOR[provedor] : 'feito pela IA';
  }

  return null;
}

/** "2.830 kcal em 4 refeições" ou o convite para gerar. */
export function resumoDieta(plano: PlanoDieta | null): string {
  if (!plano) {
    return 'ainda sem plano. a IA monta as refeições com as suas metas.';
  }

  const refeicoes = plano.refeicoes.length;

  return `${formatarNumero(plano.caloriasDia)} kcal em ${refeicoes} ${refeicoes === 1 ? 'refeição' : 'refeições'}`;
}

/** "3 treinos prontos na tela inicial" */
export function resumoTreinosGerados(quantidade: number): string {
  return quantidade === 1
    ? '1 treino pronto na tela inicial'
    : `${quantidade} treinos prontos na tela inicial`;
}
