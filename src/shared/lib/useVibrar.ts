import * as Haptics from 'expo-haptics';
import { useCallback } from 'react';
import { Platform } from 'react-native';

import { useAjustesStore } from '@/features/ajustes/store';

export type TipoVibracao = 'leve' | 'sucesso';

/**
 * Vibração curta de resposta ao toque. Só vibra com "vibração" ligada em
 * Ajustes e fora do navegador (lá não existe).
 */
export function useVibrar(): (tipo: TipoVibracao) => void {
  const ligada = useAjustesStore((state) => state.vibracao);

  return useCallback(
    (tipo: TipoVibracao) => {
      if (!ligada || Platform.OS === 'web') {
        return;
      }

      const vibracao =
        tipo === 'sucesso'
          ? Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success)
          : Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);

      // Aparelho sem motor de vibração: tudo bem, segue sem
      vibracao?.catch?.(() => undefined);
    },
    [ligada],
  );
}
