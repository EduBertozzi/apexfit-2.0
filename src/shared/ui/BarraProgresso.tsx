import { useEffect } from 'react';
import { StyleSheet, View } from 'react-native';
import Animated, {
  Easing,
  useAnimatedStyle,
  useReducedMotion,
  useSharedValue,
  withSpring,
  withTiming,
} from 'react-native-reanimated';

import { movimento, raio } from '../theme/tokens';
import { useCores } from '../theme/useCores';

type Props = {
  /** De 0 a 1 */
  valor: number;
  cor?: string;
  corTrilho?: string;
  rotuloAcessivel: string;
  /** Espessura da barra. Padrão 12. */
  altura?: number;
  /** Quando ligado, a próxima mudança de valor enche a barra com uma mola (ex.: meta batida). */
  mola?: boolean;
  /** Desliza o preenchimento quando o valor muda (ex.: cada copo de água). */
  animado?: boolean;
};

/** Barra de progresso em pílula: trilho arredondado e preenchimento com as pontas redondas. */
export function BarraProgresso({
  valor,
  cor,
  corTrilho,
  rotuloAcessivel,
  altura = 12,
  mola = false,
  animado = false,
}: Props) {
  const c = useCores();
  const reduzir = useReducedMotion();
  const porcentagem = Math.round(Math.min(Math.max(valor, 0), 1) * 100);
  const largura = useSharedValue(porcentagem);

  useEffect(() => {
    // Nada se move com "reduzir movimento" ligado; a mola vence quando os dois estão ligados
    largura.set(
      reduzir
        ? porcentagem
        : mola
          ? withSpring(porcentagem, movimento.mola)
          : animado
            ? withTiming(porcentagem, { duration: 420, easing: Easing.out(Easing.cubic) })
            : porcentagem,
    );
  }, [porcentagem, mola, animado, reduzir, largura]);

  // A mola pode passar um pouco de 100%: o trilho corta o excesso
  const estiloLargura = useAnimatedStyle(() => ({ width: `${Math.max(largura.get(), 0)}%` }));

  return (
    <View
      accessibilityRole="progressbar"
      accessibilityLabel={rotuloAcessivel}
      accessibilityValue={{ min: 0, max: 100, now: porcentagem }}
      style={[
        estilos.trilho,
        { height: altura, backgroundColor: corTrilho ?? c.superficieSecundaria },
      ]}
    >
      {porcentagem > 0 ? (
        <Animated.View
          style={[
            estilos.preenchimento,
            {
              // Nunca menor que a própria altura, para a ponta continuar redonda
              minWidth: altura,
              backgroundColor: cor ?? c.destaque,
            },
            estiloLargura,
          ]}
        />
      ) : null}
    </View>
  );
}

const estilos = StyleSheet.create({
  trilho: {
    borderRadius: raio.total,
    overflow: 'hidden',
  },
  preenchimento: {
    height: '100%',
    borderRadius: raio.total,
  },
});
