import { View } from 'react-native';
import Svg, { Path } from 'react-native-svg';

import { raio } from '../theme/tokens';
import { useCores } from '../theme/useCores';

/** Verde da logo (Catppuccin), o mesmo dos ícones em `assets/`. */
const LOGO_COR = '#A6E3A1';

type Props = {
  tamanho?: number;
};

/**
 * Símbolo do ApexFit: o "A" de pico, sem traço, com as pontas arredondadas.
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
          d="M274 706 L512 318 L750 706"
          fill="none"
          stroke={LOGO_COR}
          strokeWidth={84}
          strokeLinecap="round"
          strokeLinejoin="round"
        />
      </Svg>
    </View>
  );
}
