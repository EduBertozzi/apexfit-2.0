import { DarkTheme, DefaultTheme, Stack, ThemeProvider } from 'expo-router';
import * as SplashScreen from 'expo-splash-screen';
import { StatusBar } from 'expo-status-bar';
import { useEffect } from 'react';
import { useColorScheme } from 'react-native';

import { usePerfilStore } from '@/features/perfil/store';
import { useDadosCarregados } from '@/hooks/useDadosCarregados';
import { useCores } from '@/shared/theme/useCores';

SplashScreen.preventAutoHideAsync();

export default function RootLayout() {
  const carregado = useDadosCarregados();
  const temPerfil = usePerfilStore((state) => state.perfil !== null);
  const esquema = useColorScheme();
  const c = useCores();

  useEffect(() => {
    if (carregado) {
      SplashScreen.hideAsync();
    }
  }, [carregado]);

  if (!carregado) {
    return null;
  }

  // Cores da navegação (header, abas) vindas dos nossos tokens
  const base = esquema === 'dark' ? DarkTheme : DefaultTheme;
  const temaNavegacao = {
    ...base,
    colors: {
      ...base.colors,
      primary: c.primaria,
      background: c.fundo,
      card: c.superficie,
      text: c.texto,
      border: c.borda,
    },
  };

  return (
    <ThemeProvider value={temaNavegacao}>
      <StatusBar style="auto" />
      <Stack screenOptions={{ headerShown: false }}>
        {/* Sem perfil: só o onboarding existe */}
        <Stack.Protected guard={!temPerfil}>
          <Stack.Screen name="onboarding" />
        </Stack.Protected>

        {/* Com perfil: o app. Se o perfil for apagado, volta sozinho para o onboarding */}
        <Stack.Protected guard={temPerfil}>
          <Stack.Screen name="(tabs)" />
          <Stack.Screen
            name="editar-perfil"
            options={{ presentation: 'modal', headerShown: true, title: 'Editar perfil' }}
          />
        </Stack.Protected>
      </Stack>
    </ThemeProvider>
  );
}
