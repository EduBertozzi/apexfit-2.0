import { useEffect, useRef } from 'react';
import {
  Easing,
  useAnimatedStyle,
  useReducedMotion,
  useSharedValue,
  withSequence,
  withSpring,
  withTiming,
} from 'react-native-reanimated';

/** Quanto a peça cresce no "pop" antes de voltar ao tamanho normal. */
const ESCALA_POP = 1.2;

/**
 * Um "pop" rápido (cresce e volta com mola) quando `valor` muda depois da
 * primeira renderização. `ligado = false` pula a vez (ex: só no marcar, não no
 * desmarcar). Com "reduzir movimento" ligado no celular, não anima nada.
 */
export function usePop(valor: unknown, ligado = true) {
  const reduzir = useReducedMotion();
  const escala = useSharedValue(1);
  const anterior = useRef(valor);

  useEffect(() => {
    if (Object.is(anterior.current, valor)) {
      return;
    }

    anterior.current = valor;

    if (!ligado || reduzir) {
      return;
    }

    escala.set(
      withSequence(
        withTiming(ESCALA_POP, { duration: 90, easing: Easing.out(Easing.quad) }),
        withSpring(1, { damping: 14, stiffness: 320 }),
      ),
    );
  }, [valor, ligado, reduzir, escala]);

  return useAnimatedStyle(() => ({ transform: [{ scale: escala.get() }] }));
}
