import Ionicons from '@expo/vector-icons/Ionicons';
import MaterialCommunityIcons from '@expo/vector-icons/MaterialCommunityIcons';
import { Tabs } from 'expo-router';

import { BarraAbas, type IconeDaAba } from '@/shared/ui/BarraAbas';

const ICONES: Record<string, IconeDaAba> = {
  index: ({ cor, tamanho }) => <Ionicons name="home" color={cor} size={tamanho} />,
  plano: ({ cor, tamanho }) => (
    <MaterialCommunityIcons name="calendar-star" color={cor} size={tamanho} />
  ),
  // O cérebro fica com o coach: é a parte que pensa e conversa
  coach: ({ cor, tamanho }) => <MaterialCommunityIcons name="brain" color={cor} size={tamanho} />,
  ajustes: ({ cor, tamanho }) => <Ionicons name="settings" color={cor} size={tamanho} />,
};

export default function LayoutAbas() {
  return (
    <Tabs
      tabBar={(props) => <BarraAbas {...props} icones={ICONES} />}
      screenOptions={{ headerShown: false }}
    >
      <Tabs.Screen name="index" options={{ title: 'início' }} />
      <Tabs.Screen
        name="plano"
        options={{ title: 'plano', tabBarAccessibilityLabel: 'plano: monte sua semana e a dieta' }}
      />
      <Tabs.Screen
        name="coach"
        options={{ title: 'coach', tabBarAccessibilityLabel: 'coach: converse com a IA' }}
      />
      <Tabs.Screen name="ajustes" options={{ title: 'ajustes' }} />
    </Tabs>
  );
}
