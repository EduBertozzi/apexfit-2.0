import { View } from 'react-native';
import Svg, { Path } from 'react-native-svg';

import { raio } from '../theme/tokens';
import { useCores } from '../theme/useCores';

type Props = {
  tamanho?: number;
};

/**
 * Símbolo do ApexFit: o "A" de pico com a barra para frente.
 * Sempre num quadrado escuro arredondado, como o ícone: o menta (`destaque`)
 * não funciona sobre fundo claro.
 */
export function Logo({ tamanho = 72 }: Props) {
  const c = useCores();

  return (
    <View
      accessibilityRole="image"
      accessibilityLabel="Logo do ApexFit"
      style={{
        width: tamanho,
        height: tamanho,
        borderRadius: raio.lg * (tamanho / 72),
        borderCurve: 'continuous',
        backgroundColor: c.heroi,
        overflow: 'hidden',
      }}
    >
      <Svg width={tamanho} height={tamanho} viewBox="0 0 1024 1024">
        <Path
          fill={c.destaque}
          transform="translate(-44 0)"
          d="M560 214 L800 806 L640 806 L528 530 L360 806 L200 806 Z M461 640 L912 640 L884 716 L415 716 Z"
        />
      </Svg>
    </View>
  );
}
