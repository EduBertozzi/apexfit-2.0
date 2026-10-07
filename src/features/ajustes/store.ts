import { create } from 'zustand';
import { persist } from 'zustand/middleware';

import { armazenamento } from '@/shared/lib/armazenamento';

import type { PreferenciaTema } from './logica';

type AjustesState = {
  tema: PreferenciaTema;
  vibracao: boolean;
  /** `null` = meta automática pelo peso. */
  metaAguaManualMl: number | null;
  definirTema: (tema: PreferenciaTema) => void;
  definirVibracao: (ligada: boolean) => void;
  definirMetaAguaManual: (ml: number | null) => void;
  restaurarPadrao: () => void;
};

const PADRAO = {
  // O visual foi desenhado no escuro; quem preferir troca em Ajustes
  tema: 'escuro' as PreferenciaTema,
  vibracao: true,
  metaAguaManualMl: null as number | null,
};

export const useAjustesStore = create<AjustesState>()(
  persist(
    (set) => ({
      ...PADRAO,
      definirTema: (tema) => set({ tema }),
      definirVibracao: (vibracao) => set({ vibracao }),
      definirMetaAguaManual: (metaAguaManualMl) => set({ metaAguaManualMl }),
      restaurarPadrao: () => set(PADRAO),
    }),
    {
      name: 'apexfit/ajustes',
      storage: armazenamento,
      version: 1,
      partialize: ({ tema, vibracao, metaAguaManualMl }) => ({ tema, vibracao, metaAguaManualMl }),
    },
  ),
);
