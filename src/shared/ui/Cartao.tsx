import type { ReactNode } from 'react';
import { StyleSheet, View, type StyleProp, type ViewStyle } from 'react-native';

import { borda, espaco, raio } from '../theme/tokens';
import { useCores } from '../theme/useCores';
import { Texto } from './Texto';

/**
 * - padrao: fundo de superfície com borda
 * - tracejado: para o que ainda não existe ("em breve")
 * - heroi: bloco escuro de destaque. Dentro dele, use as cores `textoHeroi*`
 */
type Variante = 'padrao' | 'tracejado' | 'heroi';

type Props = {
  titulo?: string;
  children: ReactNode;
  variante?: Variante;
  style?: StyleProp<ViewStyle>;
};

export function Cartao({ titulo, children, variante = 'padrao', style }: Props) {
  const c = useCores();

  const aparencia = {
    padrao: { backgroundColor: c.superficie, borderColor: c.borda },
    tracejado: { backgroundColor: 'transparent', borderColor: c.borda, borderStyle: 'dashed' },
    heroi: { backgroundColor: c.heroi, borderColor: c.heroi },
  }[variante] as ViewStyle;

  return (
    <View style={[estilos.cartao, aparencia, style]}>
      {titulo ? (
        <Texto
          variante="rotulo"
          secundario={variante !== 'heroi'}
          style={variante === 'heroi' && { color: c.textoHeroi }}
          accessibilityRole="header"
        >
          {titulo}
        </Texto>
      ) : null}
      {children}
    </View>
  );
}

const estilos = StyleSheet.create({
  cartao: {
    borderRadius: raio.sm,
    borderWidth: borda.grossa,
    padding: espaco.md,
    gap: espaco.sm,
  },
});
