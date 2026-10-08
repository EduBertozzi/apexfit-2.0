import Ionicons from '@expo/vector-icons/Ionicons';
import { StyleSheet, Text, View } from 'react-native';
import Animated from 'react-native-reanimated';

import { espaco, familia, fonte } from '@/shared/theme/tokens';
import { useCategorias, useCores } from '@/shared/theme/useCores';
import { Cartao } from '@/shared/ui';
import { useEntrada } from '@/shared/ui/animacao';

import { textoSequencia } from '../semana';

type Props = {
  dias: number;
  /** "dias de sequência" ou "dia de sequência" */
  rotulo: string;
  /** "uma semana inteira" */
  frase: string;
};

/** Topo da página: chama grande, o número enorme e a frase que muda com a sequência. */
export function HeroiSequencia({ dias, rotulo, frase }: Props) {
  const c = useCores();
  const cat = useCategorias();
  const entrada = useEntrada();

  return (
    <Cartao variante="heroi" style={estilos.cartao}>
      <View
        accessible
        accessibilityRole="header"
        accessibilityLabel={`${textoSequencia(dias)}. ${frase}`}
        style={estilos.conteudo}
      >
        <Animated.View style={entrada}>
          {/* A chama usa o pastel: o herói é escuro nos dois temas */}
          <Ionicons name="flame" size={96} color={cat.fundo.cardio} />
        </Animated.View>
        <Text maxFontSizeMultiplier={1.2} style={[estilos.numero, { color: c.textoHeroi }]}>
          {dias}
        </Text>
        <Text maxFontSizeMultiplier={1.4} style={[estilos.rotulo, { color: c.textoHeroi }]}>
          {rotulo}
        </Text>
        <Text style={[estilos.frase, { color: c.textoHeroiSecundario }]}>{frase}</Text>
      </View>
    </Cartao>
  );
}

const NUMERO = fonte.gigante * 2.4;

const estilos = StyleSheet.create({
  cartao: {
    paddingVertical: espaco.xl,
  },
  conteudo: {
    alignItems: 'center',
  },
  numero: {
    fontFamily: familia.display,
    fontSize: NUMERO,
    lineHeight: NUMERO * 1.05,
    letterSpacing: -2,
    marginTop: espaco.xs,
  },
  rotulo: {
    fontFamily: familia.displayLeve,
    fontSize: fonte.subtitulo,
    lineHeight: fonte.subtitulo * 1.25,
  },
  frase: {
    fontFamily: familia.corpo,
    fontSize: fonte.corpo,
    lineHeight: fonte.corpo * 1.35,
    marginTop: espaco.xs,
    textAlign: 'center',
  },
});
