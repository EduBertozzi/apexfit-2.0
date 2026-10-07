import * as Haptics from 'expo-haptics';
import { useCallback } from 'react';
import { Platform } from 'react-native';

import { useAjustesStore } from '@/features/ajustes/store';

export type TipoVibracao = 'leve' | 'sucesso';

/** Vibra só com a opção ligada em Ajustes e fora do navegador (lá não existe vibração). */
export function deveVibrar(ligada: boolean, plataforma: string): boolean {
  return ligada && plataforma !== 'web';
}

function disparar(tipo: TipoVibracao) {
  if (tipo === 'sucesso') {
    void Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
  } else {
    void Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
  }
}

/** Devolve `vibrar(tipo)`, que já respeita a opção "vibração" dos Ajustes. */
export function useVibrar(): (tipo: TipoVibracao) => void {
  const ligada = useAjustesStore((state) => state.vibracao);

  return useCallback(
    (tipo: TipoVibracao) => {
      if (deveVibrar(ligada, Platform.OS)) {
        disparar(tipo);
      }
    },
    [ligada],
  );
}
