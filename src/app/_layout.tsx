import {
  Lexend_400Regular,
  Lexend_500Medium,
  Lexend_600SemiBold,
  Lexend_700Bold,
} from '@expo-google-fonts/lexend';
import { useFonts } from 'expo-font';
import { DarkTheme, DefaultTheme, router, Stack, ThemeProvider } from 'expo-router';
import * as SplashScreen from 'expo-splash-screen';
import { StatusBar } from 'expo-status-bar';
import { useEffect } from 'react';
import { Appearance, Platform } from 'react-native';

import { useAjustesStore } from '@/features/ajustes/store';
import { configurarExibicaoComAppAberto } from '@/features/lembretes/notificacoes';
import { usePerfilStore } from '@/features/perfil/store';
import { useDadosCarregados } from '@/hooks/useDadosCarregados';
import { familia, fonte, raio } from '@/shared/theme/tokens';
import { useCores, useEsquema } from '@/shared/theme/useCores';
import { BotaoVoltar } from '@/shared/ui/BotaoVoltar';

SplashScreen.preventAutoHideAsync();

// Lembrete de água que chega com o app aberto também aparece na tela
configurarExibicaoComAppAberto();

// Os nomes das chaves viram o fontFamily (ver `familia` em theme/tokens.ts)
const FONTES = {
  Lexend_400Regular,
  Lexend_500Medium,
  Lexend_600SemiBold,
  Lexend_700Bold,
};

export default function RootLayout() {
  const dadosCarregados = useDadosCarregados();
  const [fontesCarregadas, erroFontes] = useFonts(FONTES);
  // Se a fonte falhar, o app abre com a fonte do sistema em vez de travar na splash
  const carregado = dadosCarregados && (fontesCarregadas || erroFontes !== null);
  const temPerfil = usePerfilStore((state) => state.perfil !== null);
  const preferenciaTema = useAjustesStore((state) => state.tema);
  const esquema = useEsquema();
  const c = useCores();

  // Faz teclado, alertas e seletores nativos seguirem o tema escolhido em Ajustes
  useEffect(() => {
    if (Platform.OS === 'web') {
      return;
    }

    Appearance.setColorScheme(
      preferenciaTema === 'sistema'
        ? 'unspecified'
        : preferenciaTema === 'claro'
          ? 'light'
          : 'dark',
    );
  }, [preferenciaTema]);

  useEffect(() => {
    if (carregado) {
      SplashScreen.hideAsync();
    }
  }, [carregado]);

  if (!carregado) {
    return null;
  }

  // Cores da navegação (header, abas) vindas dos nossos tokens
  const base = esquema === 'escuro' ? DarkTheme : DefaultTheme;
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
      <StatusBar style={esquema === 'escuro' ? 'light' : 'dark'} />
      <Stack
        // Cabeçalho "transparente": mesma cor do fundo da tela, sem sombra nem linha
        screenOptions={({ navigation }) => ({
          headerShown: false,
          // Voltar redondo no lugar da seta nativa (some quando não há para onde voltar)
          headerLeft: () =>
            navigation.canGoBack() ? <BotaoVoltar onPress={() => router.back()} /> : null,
          headerStyle: { backgroundColor: c.fundo },
          headerShadowVisible: false,
          headerTintColor: c.texto,
          headerTitleStyle: {
            fontFamily: familia.displayLeve,
            fontSize: fonte.cabecalho,
            color: c.texto,
          },
          contentStyle: { backgroundColor: c.fundo },
        })}
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
            options={{ presentation: 'modal', headerShown: true, title: 'editar perfil' }}
          />
          <Stack.Screen
            name="treinos"
            options={{ headerShown: true, title: 'treinos', headerBackTitle: 'voltar' }}
          />
          <Stack.Screen
            name="perfil"
            options={{ headerShown: true, title: 'perfil', headerBackTitle: 'início' }}
          />
          <Stack.Screen name="coach" options={{ headerShown: false }} />
          <Stack.Screen
            name="dieta"
            options={{ headerShown: true, title: 'sua dieta', headerBackTitle: 'início' }}
          />
          <Stack.Screen
            name="agua"
            options={{ headerShown: true, title: 'água', headerBackTitle: 'início' }}
          />
          <Stack.Screen
            name="sequencia"
            options={{ headerShown: true, title: 'sequência', headerBackTitle: 'início' }}
          />
          <Stack.Screen
            name="peso"
            options={{ headerShown: true, title: 'peso', headerBackTitle: 'perfil' }}
          />
          <Stack.Screen
            name="treino/[id]"
            options={{ headerShown: true, title: 'editar treino', headerBackTitle: 'treinos' }}
          />
          <Stack.Screen
            name="treino/adicionar"
            options={{
              presentation: 'formSheet',
              sheetGrabberVisible: true,
              sheetAllowedDetents: [0.75, 1],
              sheetCornerRadius: raio.lg,
              contentStyle: { backgroundColor: c.superficie },
            }}
          />
          <Stack.Screen
            name="treino/sessao"
            options={{ headerShown: true, title: 'treino de hoje', headerBackTitle: 'voltar' }}
          />
          <Stack.Screen
            name="treino/modelos"
            options={{ headerShown: true, title: 'modelos prontos', headerBackTitle: 'treinos' }}
          />
        </Stack.Protected>
      </Stack>
    </ThemeProvider>
  );
}
