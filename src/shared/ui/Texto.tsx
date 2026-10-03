import { StyleSheet, Text, type TextProps } from 'react-native';

import { familia, fonte } from '../theme/tokens';
import { useCores } from '../theme/useCores';

type Variante = 'gigante' | 'destaque' | 'titulo' | 'subtitulo' | 'rotulo' | 'corpo' | 'legenda';

type Props = TextProps & {
  variante?: Variante;
  secundario?: boolean;
};

/**
 * Quanto cada variante pode crescer com a "fonte grande" do sistema.
 * Texto corrido cresce à vontade; títulos enormes têm teto para não estourar a tela.
 */
const AMPLIACAO_MAXIMA: Partial<Record<Variante, number>> = {
  gigante: 1.25,
  destaque: 1.4,
  titulo: 1.5,
  subtitulo: 1.8,
};

export function Texto({ variante = 'corpo', secundario = false, style, ...props }: Props) {
  const c = useCores();

  return (
    <Text
      maxFontSizeMultiplier={AMPLIACAO_MAXIMA[variante]}
      style={[estilos[variante], { color: secundario ? c.textoSecundario : c.texto }, style]}
      {...props}
    />
  );
}

const estilos = StyleSheet.create({
  gigante: {
    fontFamily: familia.display,
    fontSize: fonte.gigante,
    lineHeight: fonte.gigante * 0.95,
    textTransform: 'uppercase',
  },
  destaque: {
    fontFamily: familia.display,
    fontSize: fonte.destaque,
    lineHeight: fonte.destaque,
  },
  titulo: {
    fontFamily: familia.display,
    fontSize: fonte.titulo,
    lineHeight: fonte.titulo * 1.05,
    textTransform: 'uppercase',
  },
  subtitulo: {
    fontFamily: familia.displayLeve,
    fontSize: fonte.subtitulo,
    lineHeight: fonte.subtitulo * 1.15,
    textTransform: 'uppercase',
  },
  rotulo: {
    fontFamily: familia.rotulo,
    fontSize: fonte.rotulo,
    letterSpacing: 1.4,
    textTransform: 'uppercase',
  },
  corpo: { fontFamily: familia.corpo, fontSize: fonte.corpo, lineHeight: 22 },
  legenda: { fontFamily: familia.corpo, fontSize: fonte.legenda, lineHeight: 18 },
});
