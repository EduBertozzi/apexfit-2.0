import type { ReactNode } from 'react';
import { Text } from 'react-native';

import { useCategorias, useCores, useEsquema } from '../theme/useCores';

/**
 * Trecho de destaque dentro de um <Texto>: a palavra ganha a cor menta.
 * Ex: <Texto variante="gigante">bora, <Marcado>Eduardo!</Marcado></Texto>
 *
 * Texto dentro de texto não aceita cantos arredondados no celular, então o
 * destaque é só de cor. No modo claro o menta vira verde forte, porque o
 * pastel some em fundo claro.
 */
export function Marcado({ children }: { children: ReactNode }) {
  const c = useCores();
  const categorias = useCategorias();
  const escuro = useEsquema() === 'escuro';

  return (
    <Text style={{ color: escuro ? c.destaque : categorias.texto.aquecimento }}>{children}</Text>
  );
}
