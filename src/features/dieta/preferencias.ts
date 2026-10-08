import { z } from 'zod';

/**
 * Opções da dieta escolhidas na central de IA: quantas refeições, estilo,
 * o que tirar, orçamento, preparo e observações livres. Valem para a IA (vão no
 * prompt) e para o modo offline (viram restrições e quantidade de refeições).
 */

export const REFEICOES_DIETA = ['auto', '3', '4', '5'] as const;
export const ESTILOS_DIETA = ['tudo', 'vegetariano', 'vegano'] as const;
export const SEM_DIETA = ['lactose', 'gluten'] as const;
export const ORCAMENTOS_DIETA = ['normal', 'economica'] as const;
export const PREPAROS_DIETA = ['tanto-faz', 'pratico'] as const;

export const LIMITES_PREFERENCIAS = { evitar: 200, observacoes: 300 } as const;

export const preferenciasDietaSchema = z.object({
  refeicoes: z.enum(REFEICOES_DIETA),
  estilo: z.enum(ESTILOS_DIETA),
  sem: z.array(z.enum(SEM_DIETA)).max(SEM_DIETA.length),
  orcamento: z.enum(ORCAMENTOS_DIETA),
  preparo: z.enum(PREPAROS_DIETA),
  evitar: z.string().max(LIMITES_PREFERENCIAS.evitar),
  observacoes: z.string().max(LIMITES_PREFERENCIAS.observacoes),
});

export type PreferenciasDieta = z.infer<typeof preferenciasDietaSchema>;
export type RefeicoesDieta = (typeof REFEICOES_DIETA)[number];
export type EstiloDieta = (typeof ESTILOS_DIETA)[number];
export type SemDieta = (typeof SEM_DIETA)[number];
export type OrcamentoDieta = (typeof ORCAMENTOS_DIETA)[number];
export type PreparoDieta = (typeof PREPAROS_DIETA)[number];

export const PREFERENCIAS_DIETA_PADRAO: PreferenciasDieta = {
  refeicoes: 'auto',
  estilo: 'tudo',
  sem: [],
  orcamento: 'normal',
  preparo: 'tanto-faz',
  evitar: '',
  observacoes: '',
};

export const NOME_REFEICOES: Record<RefeicoesDieta, string> = {
  auto: 'automático',
  '3': '3',
  '4': '4',
  '5': '5',
};

export const NOME_ESTILO: Record<EstiloDieta, string> = {
  tudo: 'como de tudo',
  vegetariano: 'vegetariano',
  vegano: 'vegano',
};

export const NOME_SEM: Record<SemDieta, string> = {
  lactose: 'sem lactose',
  gluten: 'sem glúten',
};

export const NOME_ORCAMENTO: Record<OrcamentoDieta, string> = {
  normal: 'normal',
  economica: 'econômica',
};

export const NOME_PREPARO: Record<PreparoDieta, string> = {
  'tanto-faz': 'tanto faz',
  pratico: 'rápido de fazer',
};

/** Escolhas salvas que não batem mais com o formato voltam ao padrão, campo a campo. */
export function preferenciasValidas(salvo: unknown): PreferenciasDieta {
  const base = {
    ...PREFERENCIAS_DIETA_PADRAO,
    ...(salvo && typeof salvo === 'object' ? salvo : {}),
  };
  const lido = preferenciasDietaSchema.safeParse(base);

  return lido.success ? lido.data : PREFERENCIAS_DIETA_PADRAO;
}

export function alternarSem(sem: readonly SemDieta[], item: SemDieta): SemDieta[] {
  return sem.includes(item)
    ? sem.filter((atual) => atual !== item)
    : SEM_DIETA.filter((opcao) => opcao === item || sem.includes(opcao));
}

/** Refeições pedidas, ou `undefined` no automático (o app decide pelas calorias). */
export function quantidadeDeRefeicoesEscolhida(
  preferencias: PreferenciasDieta,
): 3 | 4 | 5 | undefined {
  return preferencias.refeicoes === 'auto'
    ? undefined
    : (Number(preferencias.refeicoes) as 3 | 4 | 5);
}

/**
 * Junta as restrições do perfil com o estilo e o que tirar, no texto que o
 * modo offline já entende ("vegetariano, sem lactose").
 */
export function restricoesComPreferencias(
  restricoesDoPerfil: string | undefined,
  preferencias: PreferenciasDieta,
): string | undefined {
  const partes = [
    restricoesDoPerfil?.trim(),
    preferencias.estilo === 'tudo' ? undefined : preferencias.estilo,
    ...preferencias.sem.map((item) => NOME_SEM[item]),
    preferencias.evitar.trim() ? `evitar: ${preferencias.evitar.trim()}` : undefined,
  ].filter((parte): parte is string => Boolean(parte));

  return partes.length === 0 ? undefined : partes.join(', ');
}

/** Linhas que vão no prompt da IA. Só o que a pessoa mudou do padrão. */
export function linhasPreferencias(preferencias: PreferenciasDieta): string[] {
  const linhas: string[] = [];

  if (preferencias.estilo !== 'tudo') {
    linhas.push(`Estilo: ${preferencias.estilo}. Nenhum alimento fora disso.`);
  }

  if (preferencias.sem.length > 0) {
    linhas.push(`Tirar: ${preferencias.sem.map((item) => NOME_SEM[item]).join(' e ')}.`);
  }

  if (preferencias.orcamento === 'economica') {
    linhas.push(
      'Orçamento: econômico. Prefira alimentos baratos (ovo, frango, arroz, feijão, banana).',
    );
  }

  if (preferencias.preparo === 'pratico') {
    linhas.push('Preparo: rápido. Refeições simples, com poucos minutos de cozinha.');
  }

  if (preferencias.evitar.trim()) {
    linhas.push(`Não colocar: ${preferencias.evitar.trim()}.`);
  }

  if (preferencias.observacoes.trim()) {
    linhas.push(`Observações do usuário: ${preferencias.observacoes.trim()}`);
  }

  return linhas;
}

/** Uma linha para a central de IA fechada: "4 refeições · vegetariano · sem lactose". */
export function resumoPreferencias(preferencias: PreferenciasDieta): string {
  const quantidade = quantidadeDeRefeicoesEscolhida(preferencias);
  const partes = [
    quantidade ? `${quantidade} refeições` : 'refeições automáticas',
    preferencias.estilo === 'tudo' ? undefined : preferencias.estilo,
    ...preferencias.sem.map((item) => NOME_SEM[item]),
    preferencias.orcamento === 'economica' ? 'econômica' : undefined,
    preferencias.preparo === 'pratico' ? 'rápida de fazer' : undefined,
    preferencias.evitar.trim() || preferencias.observacoes.trim() ? 'com observações' : undefined,
  ].filter((parte): parte is string => Boolean(parte));

  return partes.join(' · ');
}
