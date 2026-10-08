import type { Tabs } from 'expo-router';
import { useEffect, useRef, useState, type ComponentProps, type ReactNode } from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import Animated, {
  useAnimatedStyle,
  useReducedMotion,
  useSharedValue,
  withSpring,
} from 'react-native-reanimated';
import { useKeyboardState } from 'react-native-keyboard-controller';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import Svg, { Defs, LinearGradient, Rect, Stop } from 'react-native-svg';

import { posicaoDaAba } from '../lib/posicaoAba';
import { useVibrar } from '../lib/vibracao';
import { espaco, familia, fonte, movimento, raio } from '../theme/tokens';
import { useCores } from '../theme/useCores';
import { usePop } from './animacao';

/** Props que o Expo Router passa para uma barra de abas própria. */
type BottomTabBarProps = Parameters<NonNullable<ComponentProps<typeof Tabs>['tabBar']>>[0];

export type IconeDaAba = (props: { cor: string; tamanho: number }) => ReactNode;

/** Altura da pílula da barra: aba de 60 mais o respiro de cima e de baixo. */
const ALTURA_PILULA = 60 + 6 * 2;

/**
 * Quanto uma tela de aba precisa reservar embaixo para o conteúdo não ficar
 * atrás da barra flutuante (com o teclado aberto a barra some: nada a reservar).
 */
export function useEspacoBarraAbas(): number {
  const { bottom } = useSafeAreaInsets();
  const tecladoAberto = useKeyboardState((estado) => estado.isVisible);

  return tecladoAberto ? 0 : ALTURA_PILULA + Math.max(bottom, espaco.md) + espaco.sm;
}

/** Altura do degradê acima da base da barra: o conteúdo some aos poucos antes de chegar nela. */
const ALTURA_DEGRADE = 90;
const ID_DEGRADE = 'degradeBarraAbas';
/** Respiro da pílula dentro da barra e vão entre as abas (iguais ao estilo `barra`). */
const RESPIRO = 6;
const VAO = 6;
/** Rápida e com quase nenhum balanço: a pílula para na aba sem ultrapassar. */
const MOLA_PILULA = { ...movimento.mola, damping: 24, stiffness: 260 };

/** Pílula menta que desliza até a aba ativa, com uma mola firme (sem passar da barra). */
function PilulaAtiva({
  larguraBarra,
  quantidade,
  indice,
  cor,
}: {
  larguraBarra: number;
  quantidade: number;
  indice: number;
  cor: string;
}) {
  const reduzir = useReducedMotion();
  const alvo = posicaoDaAba(larguraBarra, quantidade, indice, RESPIRO, VAO);
  const x = useSharedValue(alvo.x);
  const largura = useSharedValue(alvo.largura);
  const posicionada = useRef(false);

  useEffect(() => {
    if (alvo.largura === 0) {
      return;
    }

    // A primeira vez só posiciona; depois desliza (a não ser com "reduzir movimento")
    if (!posicionada.current || reduzir) {
      posicionada.current = true;
      x.set(alvo.x);
      largura.set(alvo.largura);
      return;
    }

    x.set(withSpring(alvo.x, MOLA_PILULA));
    largura.set(withSpring(alvo.largura, MOLA_PILULA));
  }, [alvo.x, alvo.largura, reduzir, x, largura]);

  const estilo = useAnimatedStyle(() => ({
    width: largura.get(),
    transform: [{ translateX: x.get() }],
  }));

  return (
    <Animated.View
      style={[estilos.pilula, { backgroundColor: cor, pointerEvents: 'none' }, estilo]}
    />
  );
}

/** Ícone da aba: dá um "pop" quando a aba fica ativa. */
function IconeAnimado({ focada, children }: { focada: boolean; children: ReactNode }) {
  const pop = usePop(focada, focada);

  return <Animated.View style={pop}>{children}</Animated.View>;
}

/** Degradê vertical do fundo da tela (transparente em cima, opaco embaixo), atrás da barra. */
function Degrade({ cor, altura }: { cor: string; altura: number }) {
  return (
    <View style={[estilos.degrade, { height: altura, pointerEvents: 'none' }]}>
      <Svg width="100%" height="100%">
        <Defs>
          <LinearGradient id={ID_DEGRADE} x1="0" y1="0" x2="0" y2="1">
            <Stop offset="0" stopColor={cor} stopOpacity={0} />
            <Stop offset="0.55" stopColor={cor} stopOpacity={0.85} />
            <Stop offset="1" stopColor={cor} stopOpacity={1} />
          </LinearGradient>
        </Defs>
        <Rect width="100%" height="100%" fill={`url(#${ID_DEGRADE})`} />
      </Svg>
    </View>
  );
}

/**
 * Barra de abas flutuante: uma pílula translúcida (com fio claro e sombra, para não se
 * misturar com os cards que passam por baixo) com ícone e um rótulo curto embaixo
 * (o `title` da aba). Uma pílula menta desliza até a aba ativa e o ícone dela dá um "pop".
 * O leitor de tela usa `tabBarAccessibilityLabel` quando existe (rótulo mais completo).
 */
export function BarraAbas({
  state,
  descriptors,
  navigation,
  icones,
}: BottomTabBarProps & { icones: Record<string, IconeDaAba> }) {
  const c = useCores();
  const { bottom } = useSafeAreaInsets();
  const respiroBaixo = Math.max(bottom, espaco.md);
  const vibrar = useVibrar();
  const [larguraBarra, setLarguraBarra] = useState(0);
  const medida = larguraBarra > 0;
  // Com o teclado aberto (ex: chat do coach) a barra sai do caminho
  const tecladoAberto = useKeyboardState((estado) => estado.isVisible);

  if (tecladoAberto) {
    return null;
  }

  return (
    <View style={[estilos.envoltorio, { paddingBottom: respiroBaixo, pointerEvents: 'box-none' }]}>
      <Degrade cor={c.fundo} altura={ALTURA_DEGRADE + respiroBaixo} />
      <View
        style={[
          estilos.barra,
          { backgroundColor: c.barra, borderColor: c.bordaBarra, boxShadow: c.sombraBarra },
        ]}
        accessibilityRole="tablist"
        onLayout={(evento) => setLarguraBarra(evento.nativeEvent.layout.width)}
      >
        <PilulaAtiva
          larguraBarra={larguraBarra}
          quantidade={state.routes.length}
          indice={state.index}
          cor={c.destaque}
        />
        {state.routes.map((rota, indice) => {
          const focada = state.index === indice;
          const { options } = descriptors[rota.key];
          const rotulo = typeof options.title === 'string' ? options.title : rota.name;
          const rotuloAcessivel = options.tabBarAccessibilityLabel ?? rotulo;
          const Icone = icones[rota.name];
          const cor = focada ? c.textoSobreDestaque : c.textoSecundario;

          return (
            <Pressable
              key={rota.key}
              accessibilityRole="tab"
              accessibilityLabel={rotuloAcessivel}
              accessibilityState={{ selected: focada }}
              onPress={() => {
                const evento = navigation.emit({
                  type: 'tabPress',
                  target: rota.key,
                  canPreventDefault: true,
                });

                if (!focada && !evento.defaultPrevented) {
                  vibrar('leve');
                  navigation.navigate(rota.name, rota.params);
                }
              }}
              style={({ pressed }) => [
                estilos.aba,
                // Antes de medir a barra a pílula não existe: a aba pinta o próprio fundo
                focada && !medida && { backgroundColor: c.destaque },
                pressed && { opacity: 0.75 },
              ]}
            >
              {Icone ? (
                <IconeAnimado focada={focada}>
                  <Icone cor={cor} tamanho={24} />
                </IconeAnimado>
              ) : null}
              <Text
                style={[estilos.rotulo, { color: cor }]}
                numberOfLines={1}
                maxFontSizeMultiplier={1.3}
              >
                {rotulo}
              </Text>
            </Pressable>
          );
        })}
      </View>
    </View>
  );
}

const estilos = StyleSheet.create({
  envoltorio: {
    position: 'absolute',
    left: 0,
    right: 0,
    bottom: 0,
    paddingHorizontal: espaco.md,
  },
  degrade: {
    position: 'absolute',
    left: 0,
    right: 0,
    bottom: 0,
  },
  barra: {
    flexDirection: 'row',
    borderRadius: raio.total,
    borderWidth: StyleSheet.hairlineWidth,
    padding: RESPIRO,
    gap: VAO,
    maxWidth: 560,
    width: '100%',
    alignSelf: 'center',
    overflow: 'hidden',
  },
  pilula: {
    position: 'absolute',
    top: RESPIRO,
    bottom: RESPIRO,
    left: 0,
    borderRadius: raio.total,
  },
  aba: {
    flex: 1,
    minHeight: 60,
    paddingVertical: espaco.xs + 2,
    paddingHorizontal: espaco.sm,
    borderRadius: raio.total,
    alignItems: 'center',
    justifyContent: 'center',
    gap: 2,
  },
  rotulo: {
    fontFamily: familia.rotulo,
    fontSize: fonte.micro,
    lineHeight: fonte.micro * 1.3,
  },
});
