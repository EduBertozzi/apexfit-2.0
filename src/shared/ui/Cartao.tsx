import type { ReactNode } from 'react';
import { StyleSheet, View, type ViewStyle } from 'react-native';

import { espaco, raio } from '../theme/tokens';
import { useCores } from '../theme/useCores';
import { Texto } from './Texto';

type Props = {
  titulo?: string;
  children: ReactNode;
  style?: ViewStyle;
};

export function Cartao({ titulo, children, style }: Props) {
  const c = useCores();

  return (
    <View style={[estilos.cartao, { backgroundColor: c.superficie, borderColor: c.borda }, style]}>
      {titulo ? (
        <Texto variante="subtitulo" accessibilityRole="header">
          {titulo}
        </Texto>
      ) : null}
      {children}
    </View>
  );
}

const estilos = StyleSheet.create({
  cartao: {
    borderRadius: raio.lg,
    borderWidth: StyleSheet.hairlineWidth,
    padding: espaco.md,
    gap: espaco.sm,
  },
});
