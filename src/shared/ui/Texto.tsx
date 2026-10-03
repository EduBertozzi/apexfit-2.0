import { StyleSheet, Text, type TextProps } from 'react-native';

import { fonte } from '../theme/tokens';
import { useCores } from '../theme/useCores';

type Variante = 'destaque' | 'titulo' | 'subtitulo' | 'corpo' | 'legenda';

type Props = TextProps & {
  variante?: Variante;
  secundario?: boolean;
};

export function Texto({ variante = 'corpo', secundario = false, style, ...props }: Props) {
  const c = useCores();

  return (
    <Text
      style={[estilos[variante], { color: secundario ? c.textoSecundario : c.texto }, style]}
      {...props}
    />
  );
}

const estilos = StyleSheet.create({
  destaque: { fontSize: fonte.destaque, fontWeight: '800' },
  titulo: { fontSize: fonte.titulo, fontWeight: '700' },
  subtitulo: { fontSize: fonte.subtitulo, fontWeight: '600' },
  corpo: { fontSize: fonte.corpo, lineHeight: 22 },
  legenda: { fontSize: fonte.legenda, lineHeight: 18 },
});
