import Ionicons from '@expo/vector-icons/Ionicons';
import { Pressable, StyleSheet, View } from 'react-native';

import { espaco, raio } from '../theme/tokens';
import { useCores } from '../theme/useCores';
import { Texto } from './Texto';

type Props = {
  rotulo: string;
  /** Texto do valor já formatado, ex: "3.000 ml". */
  valorTexto: string;
  onMenos: () => void;
  onMais: () => void;
  podeMenos?: boolean;
  podeMais?: boolean;
};

const TAMANHO_BOTAO = 52;

function BotaoRedondo({
  icone,
  rotulo,
  onPress,
  ativo,
}: {
  icone: 'remove' | 'add';
  rotulo: string;
  onPress: () => void;
  ativo: boolean;
}) {
  const c = useCores();

  return (
    <Pressable
      onPress={onPress}
      disabled={!ativo}
      accessibilityRole="button"
      accessibilityLabel={rotulo}
      accessibilityState={{ disabled: !ativo }}
      hitSlop={4}
      style={({ pressed }) => [
        estilos.botao,
        { backgroundColor: c.superficieSecundaria },
        pressed && { opacity: 0.75 },
        !ativo && { opacity: 0.4 },
      ]}
    >
      <Ionicons name={icone} size={26} color={c.texto} />
    </Pressable>
  );
}

/**
 * Valor com botões redondos de menos e mais. Para o leitor de tela é um só
 * controle "ajustável": deslizar para cima/baixo aumenta ou diminui.
 */
export function Contador({
  rotulo,
  valorTexto,
  onMenos,
  onMais,
  podeMenos = true,
  podeMais = true,
}: Props) {
  return (
    <View
      accessible
      accessibilityRole="adjustable"
      accessibilityLabel={rotulo}
      accessibilityValue={{ text: valorTexto }}
      accessibilityActions={[{ name: 'increment' }, { name: 'decrement' }]}
      onAccessibilityAction={(evento) => {
        if (evento.nativeEvent.actionName === 'increment' && podeMais) {
          onMais();
        }

        if (evento.nativeEvent.actionName === 'decrement' && podeMenos) {
          onMenos();
        }
      }}
      style={estilos.linha}
    >
      <BotaoRedondo
        icone="remove"
        rotulo={`Diminuir ${rotulo}`}
        onPress={onMenos}
        ativo={podeMenos}
      />
      <Texto variante="titulo" style={estilos.valor}>
        {valorTexto}
      </Texto>
      <BotaoRedondo icone="add" rotulo={`Aumentar ${rotulo}`} onPress={onMais} ativo={podeMais} />
    </View>
  );
}

const estilos = StyleSheet.create({
  linha: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: espaco.md,
  },
  botao: {
    width: TAMANHO_BOTAO,
    height: TAMANHO_BOTAO,
    borderRadius: raio.total,
    alignItems: 'center',
    justifyContent: 'center',
  },
  valor: {
    flex: 1,
    textAlign: 'center',
  },
});
