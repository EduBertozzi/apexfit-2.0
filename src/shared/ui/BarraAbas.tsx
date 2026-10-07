import type { Tabs } from 'expo-router';
import type { ComponentProps, ReactNode } from 'react';
import { Pressable, StyleSheet, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { espaco, raio } from '../theme/tokens';
import { useCores } from '../theme/useCores';

/** Props que o Expo Router passa para uma barra de abas própria. */
type BottomTabBarProps = Parameters<NonNullable<ComponentProps<typeof Tabs>['tabBar']>>[0];

export type IconeDaAba = (props: { cor: string; tamanho: number }) => ReactNode;

/**
 * Barra de abas flutuante: uma pílula escura com os ícones, e a aba ativa
 * ganha uma pílula menta atrás. Só ícones, então cada aba tem rótulo acessível.
 */
export function BarraAbas({
  state,
  descriptors,
  navigation,
  icones,
}: BottomTabBarProps & { icones: Record<string, IconeDaAba> }) {
  const c = useCores();
  const { bottom } = useSafeAreaInsets();

  return (
    <View style={[estilos.envoltorio, { paddingBottom: Math.max(bottom, espaco.md) }]}>
      <View style={[estilos.barra, { backgroundColor: c.superficie }]} accessibilityRole="tablist">
        {state.routes.map((rota, indice) => {
          const focada = state.index === indice;
          const { options } = descriptors[rota.key];
          const rotulo = typeof options.title === 'string' ? options.title : rota.name;
          const Icone = icones[rota.name];

          return (
            <Pressable
              key={rota.key}
              accessibilityRole="tab"
              accessibilityLabel={rotulo}
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
              {Icone ? (
                <Icone cor={focada ? c.textoSobreDestaque : c.textoSecundario} tamanho={28} />
              ) : null}
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
  barra: {
    flexDirection: 'row',
    borderRadius: raio.total,
    padding: 6,
    gap: 6,
    maxWidth: 560,
    width: '100%',
    alignSelf: 'center',
  },
  aba: {
    flex: 1,
    height: 60,
    borderRadius: raio.total,
    alignItems: 'center',
    justifyContent: 'center',
  },
});
