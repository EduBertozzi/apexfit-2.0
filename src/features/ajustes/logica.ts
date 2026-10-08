export type PreferenciaTema = 'sistema' | 'claro' | 'escuro';

export type Esquema = 'claro' | 'escuro';

export const NOME_TEMA: Record<PreferenciaTema, string> = {
  sistema: 'automático',
  claro: 'claro',
  escuro: 'escuro',
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

/**
 * Migra os ajustes salvos. Até a versão 1 o padrão era "escuro" e ficava salvo igual
 * a uma escolha de verdade; como não dá para distinguir, "escuro" vira "sistema".
 * "claro" só existe se a pessoa escolheu, então fica.
 */
export function migrarAjustes(salvo: unknown, versao: number): unknown {
  if (versao < 2 && salvo && typeof salvo === 'object') {
    const ajustes = salvo as { tema?: unknown };

    if (ajustes.tema === 'escuro') {
      return { ...ajustes, tema: 'sistema' };
    }
  }

  return salvo;
}
