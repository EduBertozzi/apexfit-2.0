import { useColorScheme } from 'react-native';

import { cores, type Cores } from './tokens';

/** Devolve a paleta certa para o modo claro ou escuro do aparelho. */
export function useCores(): Cores {
  const esquema = useColorScheme();

  return esquema === 'dark' ? cores.escuro : cores.claro;
}
