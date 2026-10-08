import { useEffect, useState } from 'react';
import { Modal, Pressable, StyleSheet, View } from 'react-native';

import { ouvirConfirmacoes, type PedidoConfirmacao } from '../lib/confirmar';
import { espaco, raio } from '../theme/tokens';
import { useCores } from '../theme/useCores';
import { Botao } from './Botao';
import { Texto } from './Texto';

/**
 * Mostra as perguntas feitas com `confirmar()` num cartão no estilo do app.
 * Fica montado no layout raiz; folhas e modais nativos montam o seu também.
 */
export function DialogoConfirmacao() {
  const c = useCores();
  const [pedido, setPedido] = useState<PedidoConfirmacao | null>(null);
  // Separado do pedido para o texto não sumir durante o fade de saída
  const [aberto, setAberto] = useState(false);

  useEffect(
    () =>
      ouvirConfirmacoes((novo) => {
        // Uma pergunta por vez: se chegar outra, a anterior conta como "cancelar"
        setPedido((atual) => {
          atual?.responder(false);
          return novo;
        });
        setAberto(true);
      }),
    [],
  );

  function responder(confirmado: boolean) {
    pedido?.responder(confirmado);
    setAberto(false);
  }

  return (
    <Modal
      visible={aberto}
      transparent
      animationType="fade"
      statusBarTranslucent
      onRequestClose={() => responder(false)}
    >
      <View style={estilos.fundo}>
        <Pressable
          style={StyleSheet.absoluteFill}
          onPress={() => responder(false)}
          accessibilityLabel="fechar"
          accessibilityRole="button"
        />
        {pedido ? (
          <View
            accessibilityViewIsModal
            style={[estilos.cartao, { backgroundColor: c.superficie }]}
            testID="dialogo-confirmacao"
          >
            <Texto variante="subtitulo" accessibilityRole="header">
              {pedido.titulo}
            </Texto>
            <Texto secundario>{pedido.mensagem}</Texto>
            <View style={estilos.botoes}>
              <View style={estilos.botao}>
                <Botao titulo="cancelar" variante="secundario" onPress={() => responder(false)} />
              </View>
              <View style={estilos.botao}>
                <Botao
                  titulo={pedido.textoConfirmar}
                  variante="perigo"
                  onPress={() => responder(true)}
                />
              </View>
            </View>
          </View>
        ) : null}
      </View>
    </Modal>
  );
}

const estilos = StyleSheet.create({
  fundo: {
    flex: 1,
    justifyContent: 'center',
    padding: espaco.lg,
    backgroundColor: 'rgba(0, 0, 0, 0.55)',
  },
  cartao: {
    width: '100%',
    maxWidth: 420,
    alignSelf: 'center',
    borderRadius: raio.lg,
    padding: espaco.lg,
    gap: espaco.sm,
  },
  botoes: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: espaco.sm,
    marginTop: espaco.md,
  },
  botao: {
    flexGrow: 1,
    flexBasis: 120,
  },
});
