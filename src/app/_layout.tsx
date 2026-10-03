import { Barlow_400Regular, Barlow_500Medium, Barlow_700Bold } from '@expo-google-fonts/barlow';
import {
  BarlowCondensed_700Bold,
  BarlowCondensed_800ExtraBold_Italic,
  BarlowCondensed_900Black_Italic,
} from '@expo-google-fonts/barlow-condensed';
import { useFonts } from 'expo-font';
import { DarkTheme, DefaultTheme, Stack, ThemeProvider } from 'expo-router';
import * as SplashScreen from 'expo-splash-screen';
import { StatusBar } from 'expo-status-bar';
import { useEffect } from 'react';
import { useColorScheme } from 'react-native';

import { usePerfilStore } from '@/features/perfil/store';
import { useDadosCarregados } from '@/hooks/useDadosCarregados';
import { familia } from '@/shared/theme/tokens';
import { useCores } from '@/shared/theme/useCores';

SplashScreen.preventAutoHideAsync();

// Os nomes das chaves viram o fontFamily (ver `familia` em theme/tokens.ts)
const FONTES = {
  Barlow_400Regular,
  Barlow_500Medium,
  Barlow_700Bold,
  BarlowCondensed_700Bold,
  BarlowCondensed_800ExtraBold_Italic,
  BarlowCondensed_900Black_Italic,
};

export default function RootLayout() {
  const dadosCarregados = useDadosCarregados();
  const [fontesCarregadas, erroFontes] = useFonts(FONTES);
  // Se a fonte falhar, o app abre com a fonte do sistema em vez de travar na splash
  const carregado = dadosCarregados && (fontesCarregadas || erroFontes !== null);
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
      <Stack
        screenOptions={{
          headerShown: false,
          headerTitleStyle: { fontFamily: familia.display, fontSize: 22 },
          headerShadowVisible: false,
        }}
      >
        {/* Sem perfil: só o onboarding existe */}
        <Stack.Protected guard={!temPerfil}>
          <Stack.Screen name="onboarding" />
        </Stack.Protected>

        {/* Com perfil: o app. Se o perfil for apagado, volta sozinho para o onboarding */}
        <Stack.Protected guard={temPerfil}>
          <Stack.Screen name="(tabs)" />
          <Stack.Screen
            name="editar-perfil"
            options={{ presentation: 'modal', headerShown: true, title: 'EDITAR PERFIL' }}
          />
          <Stack.Screen
            name="dieta"
            options={{ headerShown: true, title: 'SUA DIETA', headerBackTitle: 'Hoje' }}
          />
        </Stack.Protected>
      </Stack>
    </ThemeProvider>
  );
}
