import type { NativeStackHeaderProps } from 'expo-router';
import { Platform, StyleSheet, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { espaco, familia, fonte } from '../theme/tokens';
import { useCores } from '../theme/useCores';
import { BotaoVoltar, TAMANHO_BOTAO_VOLTAR } from './BotaoVoltar';
import { Texto } from './Texto';

/**
 * Cabeçalho das telas empilhadas, igual em Android, iPhone e web:
 * voltar redondo à esquerda, título centralizado com folga dos dois lados
 * (o lado direito reserva o mesmo espaço do botão) e reticências se não couber.
 */
export function CabecalhoPilha({ back, navigation, options }: NativeStackHeaderProps) {
  const c = useCores();
  const insets = useSafeAreaInsets();
  const titulo = typeof options.title === 'string' ? options.title : '';
  // No iPhone o modal abre como folha, já abaixo da barra de status
  const modalNoIos = Platform.OS === 'ios' && options.presentation === 'modal';
  const topo = modalNoIos ? espaco.sm : insets.top;
  const direita = options.headerRight?.({ tintColor: c.texto, canGoBack: back !== undefined });

  return (
    <View style={[estilos.raiz, { backgroundColor: c.fundo, paddingTop: topo + espaco.sm }]}>
      <View style={estilos.lado}>
        {back ? <BotaoVoltar onPress={() => navigation.goBack()} /> : null}
      </View>
      <Texto
        accessibilityRole="header"
        numberOfLines={1}
        maxFontSizeMultiplier={1.3}
        style={[estilos.titulo, { color: c.texto }]}
      >
        {titulo}
      </Texto>
      <View style={[estilos.lado, estilos.ladoDireito]}>{direita}</View>
    </View>
  );
}

const estilos = StyleSheet.create({
  raiz: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: espaco.md,
    paddingHorizontal: espaco.md,
    paddingBottom: espaco.sm,
  },
  lado: {
    width: TAMANHO_BOTAO_VOLTAR,
    height: TAMANHO_BOTAO_VOLTAR,
    justifyContent: 'center',
  },
  ladoDireito: {
    alignItems: 'flex-end',
  },
  titulo: {
    flex: 1,
    textAlign: 'center',
    fontFamily: familia.displayLeve,
    fontSize: fonte.cabecalho,
    lineHeight: fonte.cabecalho * 1.3,
  },
});
