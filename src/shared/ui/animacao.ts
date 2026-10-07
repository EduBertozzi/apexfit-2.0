import { useEffect, useRef } from 'react';
import {
  useAnimatedStyle,
  useReducedMotion,
  useSharedValue,
  withSequence,
  withSpring,
  withTiming,
  type SharedValue,
} from 'react-native-reanimated';

import { movimento } from '../theme/tokens';

/**
 * Peças de animação do app. Todas respeitam o "reduzir movimento" do sistema:
 * com ele ligado, o estado final aparece direto, sem animar.
 */

/** Escala do "pop": cresce um pouco e volta. */
const ESCALA_POP = 1.25;
/** De onde nasce o que entra com `useEntrada`. */
const ESCALA_ENTRADA = 0.6;

/**
 * Pulinho (cresce e volta, 2 x `movimento.rapido`) quando `ativo` passa de falso para verdadeiro.
 * Não anima na primeira renderização nem ao desmarcar.
 */
export function usePop(ativo: boolean) {
  const reduzir = useReducedMotion();
  const escala = useSharedValue(1);
  const anterior = useRef(ativo);

  useEffect(() => {
    const ligou = ativo && !anterior.current;
    anterior.current = ativo;

    if (!ligou || reduzir) {
      return;
    }

    escala.set(
      withSequence(
        withTiming(ESCALA_POP, { duration: movimento.rapido }),
        withTiming(1, { duration: movimento.rapido }),
      ),
    );
  }, [ativo, reduzir, escala]);

  return useAnimatedStyle(() => ({ transform: [{ scale: escala.get() }] }));
}

/**
 * Entrada com mola: aparece crescendo (de 60% a 100%) e ganhando opacidade.
 * Com `ativo` falso (ou movimento reduzido) já nasce no lugar.
 */
export function useEntrada(ativo = true) {
  const reduzir = useReducedMotion();
  const animar = ativo && !reduzir;
  const progresso = useSharedValue(animar ? 0 : 1);

  useEffect(() => {
    progresso.set(animar ? withSpring(1, movimento.molaPop) : 1);
  }, [animar, progresso]);

  return useAnimatedStyle(() => {
    const p = progresso.get();

    return {
      opacity: Math.min(Math.max(p, 0), 1),
      transform: [{ scale: ESCALA_ENTRADA + (1 - ESCALA_ENTRADA) * p }],
    };
  });
}

/**
 * Vai de 0 a 1 (ou volta) em `movimento.medio` quando `ativo` muda.
 * Nasce já no valor certo, sem animar; serve para trocar cores com `interpolateColor`.
 */
export function useTransicao(ativo: boolean): SharedValue<number> {
  const reduzir = useReducedMotion();
  const progresso = useSharedValue(ativo ? 1 : 0);

  useEffect(() => {
    const alvo = ativo ? 1 : 0;
    progresso.set(reduzir ? alvo : withTiming(alvo, { duration: movimento.medio }));
  }, [ativo, reduzir, progresso]);

  return progresso;
}
