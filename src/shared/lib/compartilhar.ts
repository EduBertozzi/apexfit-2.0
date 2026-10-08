import * as Sharing from 'expo-sharing';
import type { RefObject } from 'react';
import type { View } from 'react-native';
import { captureRef } from 'react-native-view-shot';

import type { ResultadoCompartilhar } from './resultadoCompartilhar';

export type OpcoesCompartilhar = {
  /** Nome do arquivo (usado no navegador). */
  arquivo?: string;
  /** Título do menu de compartilhar. */
  titulo?: string;
  /** Tamanho final da imagem em pixels (ex: 1080 x 1920 para stories). */
  largura?: number;
  altura?: number;
};

/** No celular não há nada para pré-carregar (no navegador, carrega o html2canvas). */
export function prepararCaptura() {}

/**
 * Captura a View como PNG e abre o menu de compartilhar do sistema
 * (o Instagram aparece lá, com a opção de stories).
 * Mesma abordagem do Hertz: react-native-view-shot e expo-sharing.
 */
export async function compartilharView(
  ref: RefObject<View | null>,
  { titulo = 'Apex', largura, altura }: OpcoesCompartilhar = {},
): Promise<ResultadoCompartilhar> {
  if (!ref.current) {
    return 'erro';
  }

  if (!(await Sharing.isAvailableAsync())) {
    return 'indisponivel';
  }

  let uri: string;

  try {
    uri = await captureRef(ref, { format: 'png', quality: 1, width: largura, height: altura });
  } catch {
    return 'erro';
  }

  try {
    await Sharing.shareAsync(uri, {
      mimeType: 'image/png',
      dialogTitle: titulo,
      UTI: 'public.png',
    });
  } catch {
    return 'indisponivel';
  }

  return 'compartilhado';
}
