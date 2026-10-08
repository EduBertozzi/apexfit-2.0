import { useColorScheme } from 'react-native';

import { resolverEsquema, type Esquema } from '@/features/ajustes/logica';
import { useAjustesStore } from '@/features/ajustes/store';

import { categorias, cores, type Cores, type CorCategoria } from './tokens';

/** "claro" ou "escuro": a escolha em Ajustes, ou o modo do celular se for automático. */
export function useEsquema(): Esquema {
  const sistema = useColorScheme();
  const preferencia = useAjustesStore((state) => state.tema);

  return resolverEsquema(preferencia, sistema);
}

/** Devolve a paleta certa para o tema atual. */
export function useCores(): Cores {
  return useEsquema() === 'escuro' ? cores.escuro : cores.claro;
}

/** Cores por grupo muscular: `texto` para rótulos e ícones, `fundo` para pílulas com texto escuro. */
export function useCategorias(): {
  texto: Record<CorCategoria, string>;
  fundo: Record<CorCategoria, string>;
} {
  return useEsquema() === 'escuro' ? categorias.escuro : categorias.claro;
}
