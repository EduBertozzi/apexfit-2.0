import type { ReactNode } from 'react';
import { Text } from 'react-native';

import { useCores } from '../theme/useCores';

/**
 * Trecho "marca-texto": fundo menta com texto preto, dentro de um <Texto>.
 * Ex: <Texto variante="gigante">Bora, <Marcado>Eduardo.</Marcado></Texto>
 */
export function Marcado({ children }: { children: ReactNode }) {
  const c = useCores();

  return (
    <Text style={{ backgroundColor: c.destaque, color: c.textoSobreDestaque }}> {children} </Text>
  );
}
