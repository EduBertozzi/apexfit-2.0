import MaterialCommunityIcons from '@expo/vector-icons/MaterialCommunityIcons';
import { Pressable, StyleSheet, View } from 'react-native';

import { espaco } from '../theme/tokens';
import { useCores } from '../theme/useCores';

/** Círculo da seta, no canto de cima à direita do card. */
const TAMANHO = 32;
/** Área de toque mínima (o círculo fica no meio dela). */
const ALVO = 44;
/** Distância do círculo até a borda do card. */
const RECUO = espaco.sm;

/**
 * Espaço que o conteúdo do card deixa livre à direita do título para não
 * ficar embaixo da seta (o card já tem `espaco.md` de respiro).
 */
export const ESPACO_DA_SETA = RECUO + TAMANHO - espaco.md + 2;

type Props = {
  /** Com `onPress`, a seta vira um botão redondo separado do resto do card. */
  onPress?: () => void;
  /** Frase do botão para o leitor de tela, ex: "abrir a tela de água". */
  rotulo?: string;
  dica?: string;
  /** Tudo feito: mostra um check no lugar da seta. */
  concluido?: boolean;
  testID?: string;
};

/** Seta "abrir" do canto dos cards: enfeite (card inteiro é o botão) ou botão próprio. */
export function SetaCartao({ onPress, rotulo, dica, concluido = false, testID }: Props) {
  const c = useCores();
  const icone = (
    <View style={[estilos.circulo, { backgroundColor: c.superficieSecundaria }]}>
      <MaterialCommunityIcons
        name={concluido ? 'check' : 'arrow-top-right'}
        size={20}
        color={c.texto}
      />
    </View>
  );

  if (!onPress) {
    return (
      <View
        style={[estilos.alvo, { pointerEvents: 'none' }]}
        accessibilityElementsHidden
        importantForAccessibility="no-hide-descendants"
      >
        {icone}
      </View>
    );
  }

  return (
    <Pressable
      onPress={onPress}
      accessibilityRole="button"
      accessibilityLabel={rotulo}
      accessibilityHint={dica}
      testID={testID}
      style={({ pressed }) => [estilos.alvo, pressed && estilos.pressionado]}
    >
      {icone}
    </Pressable>
  );
}

const estilos = StyleSheet.create({
  alvo: {
    position: 'absolute',
    top: RECUO - (ALVO - TAMANHO) / 2,
    right: RECUO - (ALVO - TAMANHO) / 2,
    width: ALVO,
    height: ALVO,
    alignItems: 'center',
    justifyContent: 'center',
  },
  circulo: {
    width: TAMANHO,
    height: TAMANHO,
    borderRadius: TAMANHO / 2,
    alignItems: 'center',
    justifyContent: 'center',
  },
  pressionado: {
    opacity: 0.7,
    transform: [{ scale: 0.94 }],
  },
});
