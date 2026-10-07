import Ionicons from '@expo/vector-icons/Ionicons';
import { Pressable, StyleSheet } from 'react-native';

import { raio } from '../theme/tokens';
import { useCores } from '../theme/useCores';

const TAMANHO = 44;

/** Botão redondo de voltar do cabeçalho: círculo na cor de superfície com a seta. */
export function BotaoVoltar({ onPress }: { onPress: () => void }) {
  const c = useCores();

  return (
    <Pressable
      onPress={onPress}
      accessibilityRole="button"
      accessibilityLabel="voltar"
      hitSlop={4}
      style={({ pressed }) => [
        estilos.botao,
        { backgroundColor: c.superficie },
        pressed && { opacity: 0.75 },
      ]}
    >
      <Ionicons name="chevron-back" size={24} color={c.texto} />
    </Pressable>
  );
}

const estilos = StyleSheet.create({
  botao: {
    width: TAMANHO,
    height: TAMANHO,
    borderRadius: raio.total,
    alignItems: 'center',
    justifyContent: 'center',
  },
});
