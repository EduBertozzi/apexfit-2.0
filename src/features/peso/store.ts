import { create } from 'zustand';
import { persist } from 'zustand/middleware';

import { usePerfilStore } from '@/features/perfil/store';
import { armazenamento } from '@/shared/lib/armazenamento';
import { chaveDoDia } from '@/shared/lib/data';

import {
  limparHistoricoAntigo,
  pesoValido,
  registrarPeso,
  removerRegistro,
  ultimoRegistro,
  type RegistroPeso,
} from './logica';

type PesoState = {
  registros: RegistroPeso[];
  /** Registra o peso do dia (padrão: hoje). Retorna `false` se o peso estiver fora dos limites. */
  registrar: (kg: number, data?: Date) => boolean;
  /** Remove o registro do dia `data` (AAAA-MM-DD). */
  remover: (data: string) => void;
  apagarTudo: () => void;
};

/**
 * O peso do perfil acompanha o registro mais recente, para a meta de água
 * e as calorias seguirem o peso atual.
 */
function sincronizarPerfil(registros: readonly RegistroPeso[]) {
  const ultimo = ultimoRegistro(registros);
  const { perfil, salvarPerfil } = usePerfilStore.getState();

  if (!ultimo || !perfil || perfil.pesoKg === ultimo.kg) {
    return;
  }

  salvarPerfil({ ...perfil, pesoKg: ultimo.kg });
}

export const usePesoStore = create<PesoState>()(
  persist(
    (set, get) => ({
      registros: [],

      registrar: (kg, data = new Date()) => {
        if (!pesoValido(kg)) {
          return false;
        }

        const dia = chaveDoDia(data);
        const registros = limparHistoricoAntigo(registrarPeso(get().registros, dia, kg), dia);

        set({ registros });
        sincronizarPerfil(registros);

        return true;
      },

      remover: (data) => {
        const registros = removerRegistro(get().registros, data);

        set({ registros });
        sincronizarPerfil(registros);
      },

      apagarTudo: () => set({ registros: [] }),
    }),
    {
      name: 'apexfit/peso',
      storage: armazenamento,
      version: 1,
      partialize: (state) => ({ registros: state.registros }),
    },
  ),
);
