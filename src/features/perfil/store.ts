import { create } from 'zustand';
import { persist } from 'zustand/middleware';

import { armazenamento } from '@/shared/lib/armazenamento';

import { comFoto, manterFoto } from './foto';
import type { Perfil } from './types';

type PerfilState = {
  perfil: Perfil | null;
  /** Salva os dados do formulário. A foto atual continua (ela não faz parte do formulário). */
  salvarPerfil: (perfil: Perfil) => void;
  /** Troca ou remove (`undefined`) a foto. Não faz nada sem perfil. */
  definirFoto: (fotoUri: string | undefined) => void;
  apagarPerfil: () => void;
};

export const usePerfilStore = create<PerfilState>()(
  persist(
    (set, get) => ({
      perfil: null,

      salvarPerfil: (perfil) => set({ perfil: manterFoto(get().perfil, perfil) }),

      definirFoto: (fotoUri) => {
        const atual = get().perfil;

        if (atual) {
          set({ perfil: comFoto(atual, fotoUri) });
        }
      },

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
