export type PreferenciaTema = 'sistema' | 'claro' | 'escuro';

export type Esquema = 'claro' | 'escuro';

export const NOME_TEMA: Record<PreferenciaTema, string> = {
  sistema: 'Automático',
  claro: 'Claro',
  escuro: 'Escuro',
};

/** Faixa e passo da meta de água quando a pessoa escolhe na mão. */
export const META_AGUA_MANUAL = { min: 1000, max: 6000, passo: 250 } as const;

/** Decide o tema final: a escolha do usuário vence; "sistema" segue o celular. */
export function resolverEsquema(
  preferencia: PreferenciaTema,
  sistema: 'light' | 'dark' | 'unspecified' | null | undefined,
): Esquema {
  if (preferencia !== 'sistema') {
    return preferencia;
  }

  return sistema === 'dark' ? 'escuro' : 'claro';
}

/** Meta manual, se houver, senão a calculada pelo peso. */
export function metaAguaEfetiva(automaticaMl: number, manualMl: number | null): number {
  return manualMl ?? automaticaMl;
}

/** Soma (ou subtrai) um passo, mantendo dentro da faixa permitida. */
export function ajustarMetaManual(atualMl: number, direcao: 1 | -1): number {
  const { min, max, passo } = META_AGUA_MANUAL;
  // Vai para o próximo múltiplo do passo: de 2650, "+" dá 2750 e "−" dá 2500
  const proximo =
    direcao === 1
      ? Math.floor(atualMl / passo) * passo + passo
      : Math.ceil(atualMl / passo) * passo - passo;

  return Math.min(Math.max(proximo, min), max);
}
