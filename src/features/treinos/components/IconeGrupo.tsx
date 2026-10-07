import MaterialCommunityIcons from '@expo/vector-icons/MaterialCommunityIcons';
import type { ComponentProps } from 'react';

import type { GrupoMuscular } from '../types';

type NomeIcone = ComponentProps<typeof MaterialCommunityIcons>['name'];

/** Um ícone por grupo muscular, como no desenho de referência. */
export const ICONE_GRUPO: Record<GrupoMuscular, NomeIcone> = {
  aquecimento: 'timer-outline',
  peito: 'weight-lifter',
  costas: 'human-handsup',
  ombro: 'kettlebell',
  braco: 'dumbbell',
  perna: 'seat-legroom-normal',
  abdominal: 'stomach',
  cardio: 'heart-pulse',
  outro: 'dots-horizontal-circle-outline',
};

/** Decorativo: o nome do grupo sempre aparece em texto ao lado. */
export function IconeGrupo({
  grupo,
  cor,
  tamanho = 24,
}: {
  grupo: GrupoMuscular;
  cor: string;
  tamanho?: number;
}) {
  return (
    <MaterialCommunityIcons
      name={ICONE_GRUPO[grupo]}
      size={tamanho}
      color={cor}
      accessibilityElementsHidden
      importantForAccessibility="no"
    />
  );
}
