import MaterialCommunityIcons from '@expo/vector-icons/MaterialCommunityIcons';
import type { ReactNode } from 'react';
import { Pressable, StyleSheet, View, type StyleProp, type ViewStyle } from 'react-native';

import { espaco, raio } from '../theme/tokens';
import { useCores } from '../theme/useCores';

type Props = {
  /** Frase completa lida pelo leitor de tela, ex: "braço, 3 séries de 12, remada alta". */
  rotuloAcessivel: string;
  /** O que acontece ao tocar, ex: "Abre o treino". */
  dica?: string;
  onPress: () => void;
  children: ReactNode;
  /** Seta "abrir" no canto de cima, como nos cards do desenho. Padrão: sim. */
  seta?: boolean;
  /** Tudo feito: o canto mostra um check no lugar da seta e o card fica apagado. */
  concluido?: boolean;
  style?: StyleProp<ViewStyle>;
  testID?: string;
};

/** Tamanho da seta: quem monta o card deixa este espaço livre à direita do título. */
export const ESPACO_DA_SETA = 24;

/**
 * Card "bento" que é um botão de verdade: o card inteiro é a área de toque
 * (bem maior que 44 pt) e o leitor de tela lê uma frase só.
 */
export function CartaoToque({
  rotuloAcessivel,
  dica,
  onPress,
  children,
  seta = true,
  concluido = false,
  style,
  testID,
}: Props) {
  const c = useCores();

  return (
    <Pressable
      onPress={onPress}
      accessibilityRole="button"
      accessibilityLabel={rotuloAcessivel}
      accessibilityHint={dica}
      testID={testID}
      style={({ pressed }) => [
        estilos.cartao,
        { backgroundColor: c.superficie },
        style,
        concluido && estilos.concluido,
        pressed && estilos.pressionado,
      ]}
    >
      {children}
      {seta ? (
        <View style={estilos.seta} pointerEvents="none">
          <MaterialCommunityIcons
            name={concluido ? 'check' : 'arrow-top-right'}
            size={24}
            color={c.texto}
          />
        </View>
      ) : null}
    </Pressable>
  );
}

const estilos = StyleSheet.create({
  cartao: {
    borderRadius: raio.lg,
    borderCurve: 'continuous',
    padding: espaco.md,
    gap: espaco.xs,
    minHeight: 96,
  },
  concluido: {
    opacity: 0.6,
  },
  pressionado: {
    opacity: 0.8,
    transform: [{ scale: 0.98 }],
  },
  seta: {
    position: 'absolute',
    top: espaco.md - 2,
    right: espaco.md - 2,
  },
});
