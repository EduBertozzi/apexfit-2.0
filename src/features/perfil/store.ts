import { create } from 'zustand';
import { persist } from 'zustand/middleware';

import { armazenamento } from '@/shared/lib/armazenamento';

import type { Perfil } from './types';

type PerfilState = {
  perfil: Perfil | null;
  salvarPerfil: (perfil: Perfil) => void;
  apagarPerfil: () => void;
};

export const usePerfilStore = create<PerfilState>()(
  persist(
    (set) => ({
      perfil: null,

      salvarPerfil: (perfil) => set({ perfil }),

      apagarPerfil: () => set({ perfil: null }),
    }),
    {
      name: 'apexfit/perfil',
      storage: armazenamento,
      // Aumente quando mudar o formato do Perfil e escreva a migração em `migrate`,
      // para não perder os dados de quem já usa o app.
      version: 1,
      partialize: (state) => ({ perfil: state.perfil }),
    },
  ),
);
