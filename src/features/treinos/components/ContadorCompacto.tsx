import Ionicons from '@expo/vector-icons/Ionicons';
import { Pressable, StyleSheet, View } from 'react-native';

import { espaco, raio } from '@/shared/theme/tokens';
import { useCores } from '@/shared/theme/useCores';
import { Texto } from '@/shared/ui';

type Props = {
  rotulo: string;
  valorTexto: string;
  onMenos: () => void;
  onMais: () => void;
  podeMenos?: boolean;
  podeMais?: boolean;
  /** Rótulo à esquerda e botões à direita, numa linha só (ex: quantidade). */
  emLinha?: boolean;
  /** Para o leitor de tela, quando o rótulo visível não basta (ex: "6 exercícios na segunda"). */
  rotuloAcessivel?: string;
  /** O que o leitor de tela fala como valor. Padrão: `valorTexto`. */
  valorAcessivel?: string;
  /** Nome dos botões para o leitor de tela. Padrão: "diminuir/aumentar <rótulo>". */
  rotuloMenos?: string;
  rotuloMais?: string;
  testID?: string;
};

const TAMANHO = 44;

function Botao({
  icone,
  rotulo,
  onPress,
  ativo,
  testID,
}: {
  icone: 'remove' | 'add';
  rotulo: string;
  onPress: () => void;
  ativo: boolean;
  testID?: string;
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
      testID={testID}
      style={({ pressed }) => [
        estilos.botao,
        { backgroundColor: c.superficieSecundaria },
        pressed && { opacity: 0.75 },
        !ativo && { opacity: 0.4 },
      ]}
    >
      <Ionicons name={icone} size={22} color={c.texto} />
    </Pressable>
  );
}

/**
 * Versão compacta do `Contador` (botões de 44 px e valor menor), para caber
 * dois lado a lado na folha. Para o leitor de tela é um controle ajustável.
 */
export function ContadorCompacto({
  rotulo,
  valorTexto,
  onMenos,
  onMais,
  podeMenos = true,
  podeMais = true,
  emLinha = false,
  rotuloAcessivel,
  valorAcessivel,
  rotuloMenos,
  rotuloMais,
  testID,
}: Props) {
  return (
    <View style={[estilos.container, emLinha && estilos.containerLinha]}>
      <Texto
        variante="rotulo"
        secundario
        style={emLinha && estilos.rotuloLinha}
        importantForAccessibility="no"
        accessibilityElementsHidden
      >
        {rotulo}
      </Texto>
      <View
        accessible
        accessibilityRole="adjustable"
        accessibilityLabel={rotuloAcessivel ?? rotulo}
        accessibilityValue={{ text: valorAcessivel ?? valorTexto }}
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
        <Botao
          icone="remove"
          rotulo={rotuloMenos ?? `diminuir ${rotulo}`}
          onPress={onMenos}
          ativo={podeMenos}
          testID={testID && `${testID}-menos`}
        />
        <Texto variante="subtitulo" style={estilos.valor} testID={testID && `${testID}-valor`}>
          {valorTexto}
        </Texto>
        <Botao
          icone="add"
          rotulo={rotuloMais ?? `aumentar ${rotulo}`}
          onPress={onMais}
          ativo={podeMais}
          testID={testID && `${testID}-mais`}
        />
      </View>
    </View>
  );
}

const estilos = StyleSheet.create({
  container: {
    gap: espaco.sm,
  },
  containerLinha: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  rotuloLinha: {
    flex: 1,
  },
  linha: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: espaco.sm,
  },
  botao: {
    width: TAMANHO,
    height: TAMANHO,
    borderRadius: raio.total,
    alignItems: 'center',
    justifyContent: 'center',
  },
  valor: {
    minWidth: 56,
    textAlign: 'center',
  },
});
