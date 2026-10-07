import type { ReactNode } from 'react';
import { StyleSheet, View, type StyleProp, type ViewStyle } from 'react-native';

import { borda, espaco, raio } from '../theme/tokens';
import { useCores } from '../theme/useCores';
import { Texto } from './Texto';

/**
 * Card "bento": sem borda, cantos bem arredondados.
 * - padrao: fundo de superfície
 * - tracejado: para o que ainda não existe ("em breve")
 * - heroi: bloco escuro de destaque (escuro nos dois temas). Dentro dele, use `textoHeroi*`
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
    padrao: { backgroundColor: c.superficie },
    tracejado: {
      backgroundColor: 'transparent',
      borderColor: c.textoSecundario,
      borderStyle: 'dashed',
      borderWidth: borda.grossa,
    },
    heroi: { backgroundColor: c.heroi },
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
    borderRadius: raio.lg,
    borderCurve: 'continuous',
    padding: espaco.lg - 4,
    gap: espaco.sm,
  },
});
