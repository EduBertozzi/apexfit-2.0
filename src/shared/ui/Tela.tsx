import type { ReactNode } from 'react';
import { ScrollView, StyleSheet, View } from 'react-native';
import { KeyboardAvoidingView } from 'react-native-keyboard-controller';
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
        // Android de ponta a ponta não encolhe a tela sozinho: o padding vale nos dois
        behavior="padding"
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
    // Espaço para a barra de abas flutuante não cobrir o fim da tela
    paddingBottom: 120,
  },
  limiteLargura: {
    width: '100%',
    maxWidth: 560,
    alignSelf: 'center',
    gap: espaco.md,
  },
});
