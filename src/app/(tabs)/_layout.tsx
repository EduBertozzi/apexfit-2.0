import Ionicons from '@expo/vector-icons/Ionicons';
import { Tabs } from 'expo-router';
import type { ComponentProps } from 'react';
import { StyleSheet, View } from 'react-native';

import { borda, familia, raio } from '@/shared/theme/tokens';
import { useCores } from '@/shared/theme/useCores';

type NomeIcone = ComponentProps<typeof Ionicons>['name'];

/** Ícone da aba: a aba ativa ganha uma "pílula" menta atrás do ícone. */
function IconeAba({ nome, focado }: { nome: NomeIcone; focado: boolean }) {
  const c = useCores();

  return (
    <View style={[estilos.pilula, focado && { backgroundColor: c.destaque }]}>
      <Ionicons name={nome} size={22} color={focado ? c.textoSobreDestaque : c.textoSecundario} />
    </View>
  );
}

export default function LayoutAbas() {
  const c = useCores();

  return (
    <Tabs
      screenOptions={{
        headerShown: false,
        tabBarActiveTintColor: c.texto,
        tabBarInactiveTintColor: c.textoSecundario,
        tabBarStyle: {
          backgroundColor: c.superficie,
          borderTopWidth: borda.grossa,
          borderTopColor: c.borda,
          paddingTop: 6,
        },
        tabBarLabelStyle: {
          fontFamily: familia.display,
          fontSize: 13,
          lineHeight: 18,
          paddingRight: 2,
          textTransform: 'uppercase',
        },
      }}
    >
      <Tabs.Screen
        name="index"
        options={{
          title: 'Hoje',
          tabBarIcon: ({ focused }) => <IconeAba nome="flash" focado={focused} />,
        }}
      />
      <Tabs.Screen
        name="treinos"
        options={{
          title: 'Treinos',
          tabBarIcon: ({ focused }) => (
            <IconeAba nome={focused ? 'barbell' : 'barbell-outline'} focado={focused} />
          ),
        }}
      />
      <Tabs.Screen
        name="perfil"
        options={{
          title: 'Perfil',
          tabBarIcon: ({ focused }) => (
            <IconeAba nome={focused ? 'person' : 'person-outline'} focado={focused} />
          ),
        }}
      />
      <Tabs.Screen
        name="ajustes"
        options={{
          title: 'Ajustes',
          tabBarIcon: ({ focused }) => (
            <IconeAba nome={focused ? 'settings' : 'settings-outline'} focado={focused} />
          ),
        }}
      />
    </Tabs>
  );
}

const estilos = StyleSheet.create({
  pilula: {
    width: 56,
    height: 30,
    borderRadius: raio.sm,
    alignItems: 'center',
    justifyContent: 'center',
  },
});
