import Ionicons from '@expo/vector-icons/Ionicons';
import { router } from 'expo-router';
import { StyleSheet, Text, View } from 'react-native';

import { espaco, familia, fonte } from '@/shared/theme/tokens';
import { useCategorias, useCores } from '@/shared/theme/useCores';
import { CartaoToque } from '@/shared/ui/CartaoToque';

import { textoAguaCartao } from '../formato';
import { useAguaDoDia } from '../store';

/** Quadradinho de água da tela inicial: "1,2 /3L". Tocar abre a tela de água. */
export function CartaoAguaInicio({ metaMl }: { metaMl: number }) {
  const c = useCores();
  const cat = useCategorias();
  const { totalMl } = useAguaDoDia();
  const texto = textoAguaCartao(totalMl, metaMl);

  return (
    <CartaoToque
      rotuloAcessivel={texto.acessivel}
      dica="Abre a tela de água"
      onPress={() => router.push('/agua')}
      style={estilos.cartao}
      testID="cartao-agua"
    >
      <Ionicons name="water" size={44} color={cat.texto.agua} />
      <View style={estilos.base}>
        <View style={estilos.valores}>
          <Text maxFontSizeMultiplier={1.3} style={[estilos.total, { color: c.texto }]}>
            {texto.total}
          </Text>
          <Text maxFontSizeMultiplier={1.3} style={[estilos.meta, { color: c.textoSecundario }]}>
            {` ${texto.meta}`}
          </Text>
        </View>
        <Text maxFontSizeMultiplier={1.3} style={[estilos.rotulo, { color: c.textoSecundario }]}>
          água
        </Text>
      </View>
    </CartaoToque>
  );
}

const estilos = StyleSheet.create({
  cartao: {
    flex: 1,
    justifyContent: 'space-between',
  },
  base: {
    marginTop: espaco.sm,
  },
  valores: {
    flexDirection: 'row',
    alignItems: 'baseline',
    flexWrap: 'wrap',
  },
  total: {
    fontFamily: familia.display,
    fontSize: 30,
  },
  meta: {
    fontFamily: familia.corpo,
    fontSize: fonte.rotulo,
  },
  rotulo: {
    fontFamily: familia.corpo,
    fontSize: fonte.rotulo,
  },
});
