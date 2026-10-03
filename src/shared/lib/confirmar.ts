import { Alert, Platform } from 'react-native';

/**
 * Pergunta de confirmação que funciona no celular e no navegador
 * (no web, o Alert com botões do React Native não aparece).
 */
export function confirmar(
  titulo: string,
  mensagem: string,
  textoConfirmar: string,
): Promise<boolean> {
  if (Platform.OS === 'web') {
    return Promise.resolve(window.confirm(`${titulo}\n\n${mensagem}`));
  }

  return new Promise((resolve) => {
    Alert.alert(titulo, mensagem, [
      { text: 'Cancelar', style: 'cancel', onPress: () => resolve(false) },
      { text: textoConfirmar, style: 'destructive', onPress: () => resolve(true) },
    ]);
  });
}
