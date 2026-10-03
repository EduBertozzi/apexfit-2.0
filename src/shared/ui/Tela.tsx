import type { ReactNode } from 'react';
import { KeyboardAvoidingView, Platform, ScrollView, StyleSheet, View } from 'react-native';
import { SafeAreaView, type Edge } from 'react-native-safe-area-context';

import { espaco } from '../theme/tokens';
import { useCores } from '../theme/useCores';

type Props = {
  children: ReactNode;
  /** Bordas que respeitam o notch/barra do sistema. Telas com header não precisam do "top". */
  bordas?: Edge[];
};

/** Container padrão de tela: fundo do tema, área segura, rolagem e teclado sem cobrir campos. */
export function Tela({ children, bordas = ['top'] }: Props) {
  const c = useCores();

  return (
    <SafeAreaView edges={bordas} style={[estilos.raiz, { backgroundColor: c.fundo }]}>
      <KeyboardAvoidingView
        style={estilos.raiz}
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
      >
        <ScrollView contentContainerStyle={estilos.conteudo} keyboardShouldPersistTaps="handled">
          <View style={estilos.limiteLargura}>{children}</View>
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

const estilos = StyleSheet.create({
  raiz: {
    flex: 1,
  },
  conteudo: {
    padding: espaco.md,
    paddingBottom: espaco.xl,
  },
  limiteLargura: {
    width: '100%',
    maxWidth: 560,
    alignSelf: 'center',
    gap: espaco.md,
  },
});
