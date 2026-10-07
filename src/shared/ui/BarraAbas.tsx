import type { Tabs } from 'expo-router';
import type { ComponentProps, ReactNode } from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import Svg, { Defs, LinearGradient, Rect, Stop } from 'react-native-svg';

import { espaco, familia, fonte, raio } from '../theme/tokens';
import { useCores } from '../theme/useCores';

/** Props que o Expo Router passa para uma barra de abas própria. */
type BottomTabBarProps = Parameters<NonNullable<ComponentProps<typeof Tabs>['tabBar']>>[0];

export type IconeDaAba = (props: { cor: string; tamanho: number }) => ReactNode;

/** Altura do degradê acima da base da barra: o conteúdo some aos poucos antes de chegar nela. */
const ALTURA_DEGRADE = 90;
const ID_DEGRADE = 'degradeBarraAbas';

/** Degradê vertical do fundo da tela (transparente em cima, opaco embaixo), atrás da barra. */
function Degrade({ cor, altura }: { cor: string; altura: number }) {
  return (
    <View pointerEvents="none" style={[estilos.degrade, { height: altura }]}>
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
 * (o `title` da aba). A aba ativa ganha uma pílula menta atrás dos dois.
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

  return (
    <View pointerEvents="box-none" style={[estilos.envoltorio, { paddingBottom: respiroBaixo }]}>
      <Degrade cor={c.fundo} altura={ALTURA_DEGRADE + respiroBaixo} />
      <View
        style={[
          estilos.barra,
          { backgroundColor: c.barra, borderColor: c.bordaBarra, boxShadow: c.sombraBarra },
        ]}
        accessibilityRole="tablist"
      >
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
                  navigation.navigate(rota.name, rota.params);
                }
              }}
              style={({ pressed }) => [
                estilos.aba,
                focada && { backgroundColor: c.destaque },
                pressed && { opacity: 0.75 },
              ]}
            >
              {Icone ? <Icone cor={cor} tamanho={24} /> : null}
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
    padding: 6,
    gap: 6,
    maxWidth: 560,
    width: '100%',
    alignSelf: 'center',
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
