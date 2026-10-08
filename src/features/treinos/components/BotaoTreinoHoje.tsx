import Ionicons from '@expo/vector-icons/Ionicons';
import { router } from 'expo-router';
import { Pressable, StyleSheet, Text } from 'react-native';

import { espaco, familia, fonte, raio } from '@/shared/theme/tokens';
import { useCores } from '@/shared/theme/useCores';

import { acaoTreinoHoje } from '../logica';
import { useTreinoDoDia } from '../store';

/**
 * Botão principal da tela inicial, embaixo de "treino de hoje":
 * "começar treino", "continuar treino · 3 de 11" ou "treino concluído" (apagado,
 * com check). Sempre abre o treino de hoje. Sem treino montado, não aparece.
 */
export function BotaoTreinoHoje({ hoje }: { hoje: Date }) {
  const c = useCores();
  const { situacao } = useTreinoDoDia(hoje);
  const acao = acaoTreinoHoje(situacao);

  if (!acao) {
    return null;
  }

  const concluido = acao.tipo === 'concluido';
  const corTexto = concluido ? c.textoSecundario : c.textoSobreDestaque;

  return (
    <Pressable
      onPress={() => router.push('/treino/sessao')}
      accessibilityRole="button"
      accessibilityLabel={acao.acessivel}
      accessibilityHint="abre o treino de hoje"
      testID="botao-treino-hoje"
      style={({ pressed }) => [
        estilos.botao,
        { backgroundColor: concluido ? c.superficie : c.destaque },
        pressed && estilos.pressionado,
      ]}
    >
      <Ionicons
        name={concluido ? 'checkmark-circle' : 'play'}
        size={22}
        color={corTexto}
        accessibilityElementsHidden
        importantForAccessibility="no"
      />
      <Text
        numberOfLines={1}
        maxFontSizeMultiplier={1.3}
        style={[estilos.texto, { color: corTexto }]}
      >
        {acao.texto}
      </Text>
    </Pressable>
  );
}

const estilos = StyleSheet.create({
  botao: {
    minHeight: 60,
    borderRadius: raio.total,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: espaco.sm,
    paddingHorizontal: espaco.lg,
  },
  pressionado: {
    opacity: 0.85,
    transform: [{ scale: 0.98 }],
  },
  texto: {
    flexShrink: 1,
    fontFamily: familia.display,
    fontSize: fonte.corpo + 1,
  },
});
