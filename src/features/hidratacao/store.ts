import { create } from 'zustand';
import { persist } from 'zustand/middleware';

import { armazenamento } from '@/shared/lib/armazenamento';
import { chaveDoDia } from '@/shared/lib/data';

import {
  adicionarPorcao,
  desfazerUltimaPorcao,
  limparHistoricoAntigo,
  totalDoDia,
  type RegistrosPorDia,
} from './logica';

type HidratacaoState = {
  registros: RegistrosPorDia;
  /** Adiciona uma porção no dia informado (padrão: hoje). Retorna o total antes e depois. */
  adicionar: (ml: number, data?: Date) => { antesMl: number; depoisMl: number };
  desfazer: (data?: Date) => void;
  apagarTudo: () => void;
};

export const useHidratacaoStore = create<HidratacaoState>()(
  persist(
    (set, get) => ({
      registros: {},

      adicionar: (ml, data = new Date()) => {
        const dia = chaveDoDia(data);
        const antesMl = totalDoDia(get().registros[dia]);
        const comNovaPorcao = adicionarPorcao(get().registros, dia, ml);
        const registros = limparHistoricoAntigo(comNovaPorcao, dia);

        set({ registros });

        return { antesMl, depoisMl: totalDoDia(registros[dia]) };
      },

      desfazer: (data = new Date()) => {
        const dia = chaveDoDia(data);

        set({ registros: desfazerUltimaPorcao(get().registros, dia) });
      },

      apagarTudo: () => set({ registros: {} }),
    }),
    {
      name: 'apexfit/hidratacao',
      storage: armazenamento,
      version: 1,
      partialize: (state) => ({ registros: state.registros }),
    },
  ),
);

/** Hook para a tela: total de hoje e se dá para desfazer. */
export function useAguaDoDia(data: Date = new Date()) {
  const dia = chaveDoDia(data);
  const porcoes = useHidratacaoStore((state) => state.registros[dia]);

  return {
    totalMl: totalDoDia(porcoes),
    podeDesfazer: (porcoes?.length ?? 0) > 0,
  };
}
