import { Image } from 'expo-image';
import { StyleSheet, Text, View } from 'react-native';

import { familia } from '@/shared/theme/tokens';
import { useCores } from '@/shared/theme/useCores';

import { inicialDoNome } from '../foto';

type Props = {
  nome: string;
  fotoUri?: string;
  tamanho?: number;
};

/** Foto redonda do perfil; sem foto, a inicial do nome num círculo menta. Só visual. */
export function Avatar({ nome, fotoUri, tamanho = 56 }: Props) {
  const c = useCores();
  const forma = { width: tamanho, height: tamanho, borderRadius: tamanho / 2 };

  if (fotoUri) {
    return (
      <Image
        source={{ uri: fotoUri }}
        style={[forma, { backgroundColor: c.superficie }]}
        contentFit="cover"
        accessibilityIgnoresInvertColors
        transition={150}
      />
    );
  }

  return (
    <View style={[forma, estilos.centro, { backgroundColor: c.destaque }]}>
      <Text
        maxFontSizeMultiplier={1}
        style={{
          fontFamily: familia.display,
          fontSize: tamanho * 0.42,
          color: c.textoSobreDestaque,
        }}
      >
        {inicialDoNome(nome)}
      </Text>
    </View>
  );
}

const estilos = StyleSheet.create({
  centro: {
    alignItems: 'center',
    justifyContent: 'center',
  },
});
