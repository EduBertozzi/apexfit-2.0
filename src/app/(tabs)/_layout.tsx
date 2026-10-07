import Ionicons from '@expo/vector-icons/Ionicons';
import MaterialCommunityIcons from '@expo/vector-icons/MaterialCommunityIcons';
import { Tabs } from 'expo-router';

import { BarraAbas, type IconeDaAba } from '@/shared/ui/BarraAbas';

const ICONES: Record<string, IconeDaAba> = {
  index: ({ cor, tamanho }) => <Ionicons name="home" color={cor} size={tamanho} />,
  ia: ({ cor, tamanho }) => <MaterialCommunityIcons name="brain" color={cor} size={tamanho} />,
  ajustes: ({ cor, tamanho }) => <Ionicons name="settings" color={cor} size={tamanho} />,
};

export default function LayoutAbas() {
  return (
    <Tabs
      tabBar={(props) => <BarraAbas {...props} icones={ICONES} />}
      screenOptions={{ headerShown: false }}
    >
      <Tabs.Screen name="index" options={{ title: 'início' }} />
      <Tabs.Screen name="ia" options={{ title: 'dieta, treinos com IA e coach' }} />
      <Tabs.Screen name="ajustes" options={{ title: 'ajustes' }} />
    </Tabs>
  );
}
