import { StyleSheet, View } from 'react-native';

import { espaco } from '../theme/tokens';
import { Botao } from './Botao';
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

/**
 * Valor com botões − e +. Para o leitor de tela é um só controle "ajustável":
 * deslizar para cima/baixo aumenta ou diminui.
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
      <View style={estilos.botao}>
        <Botao
          titulo={`Diminuir ${rotulo}`}
          icone="remove"
          variante="secundario"
          onPress={onMenos}
          desabilitado={!podeMenos}
        />
      </View>
      <Texto variante="titulo" style={estilos.valor}>
        {valorTexto}
      </Texto>
      <View style={estilos.botao}>
        <Botao
          titulo={`Aumentar ${rotulo}`}
          icone="add"
          variante="secundario"
          onPress={onMais}
          desabilitado={!podeMais}
        />
      </View>
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
    width: 56,
  },
  valor: {
    flex: 1,
    textAlign: 'center',
  },
});
