import MaterialCommunityIcons from '@expo/vector-icons/MaterialCommunityIcons';
import type { ComponentProps } from 'react';
import Svg, { Rect } from 'react-native-svg';

import type { GrupoMuscular } from '../types';

type NomeIcone = ComponentProps<typeof MaterialCommunityIcons>['name'];

/** Um ícone por grupo muscular. Abdômen tem desenho próprio (o pacote não tem um bom). */
export const ICONE_GRUPO: Record<Exclude<GrupoMuscular, 'abdominal'>, NomeIcone> = {
  aquecimento: 'timer-outline',
  peito: 'weight-lifter',
  costas: 'human-handsup',
  ombro: 'kettlebell',
  braco: 'dumbbell',
  perna: 'seat-legroom-normal',
  cardio: 'heart-pulse',
  outro: 'dots-horizontal-circle-outline',
};

/** "Tanquinho": seis gomos em duas colunas, no mesmo peso visual dos outros ícones. */
function IconeAbdomen({ cor, tamanho }: { cor: string; tamanho: number }) {
  const gomos = [4, 10, 16].flatMap((y, linha) => [
    // A última linha é um pouco mais estreita, como o abdômen afinando na cintura
    { x: linha === 2 ? 6 : 5, y, largura: linha === 2 ? 5.5 : 6.5 },
    { x: 12.5, y, largura: linha === 2 ? 5.5 : 6.5 },
  ]);

  return (
    <Svg
      width={tamanho}
      height={tamanho}
      viewBox="0 0 24 24"
      accessibilityElementsHidden
      importantForAccessibility="no"
    >
      {gomos.map((gomo) => (
        <Rect
          key={`${gomo.x}-${gomo.y}`}
          x={gomo.x}
          y={gomo.y}
          width={gomo.largura}
          height={4.5}
          rx={1.8}
          fill={cor}
        />
      ))}
    </Svg>
  );
}

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
  if (grupo === 'abdominal') {
    return <IconeAbdomen cor={cor} tamanho={tamanho} />;
  }

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
