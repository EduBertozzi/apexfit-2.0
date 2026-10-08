import Ionicons from '@expo/vector-icons/Ionicons';
import { Pressable, ScrollView, StyleSheet, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { espaco, familia, raio } from '@/shared/theme/tokens';
import { useCores } from '@/shared/theme/useCores';
import { Botao, Texto } from '@/shared/ui';

import type { OpcaoDoDia } from '../planoSemana';

type Props = {
  titulo: string;
  opcoes: readonly OpcaoDoDia[];
  onEscolher: (treinoId: string | null) => void;
  onNovoTreino: () => void;
};

/** Folha nativa: escolhe o treino de um dia da semana (ou descanso). */
export function FolhaEscolherDia({ titulo, opcoes, onEscolher, onNovoTreino }: Props) {
  const c = useCores();
  const insets = useSafeAreaInsets();

  return (
    <ScrollView
      contentContainerStyle={[estilos.conteudo, { paddingBottom: insets.bottom + espaco.lg }]}
    >
      <Texto variante="subtitulo" accessibilityRole="header" style={estilos.titulo}>
        {titulo}
      </Texto>

      <View accessibilityRole="radiogroup" accessibilityLabel={titulo} style={estilos.lista}>
        {opcoes.map((opcao) => (
          <Pressable
            key={opcao.treinoId ?? 'descanso'}
            onPress={() => onEscolher(opcao.treinoId)}
            accessibilityRole="radio"
            accessibilityState={{ checked: opcao.marcado }}
            accessibilityLabel={opcao.detalhe ? `${opcao.titulo}, ${opcao.detalhe}` : opcao.titulo}
            testID={`opcao-${opcao.treinoId ?? 'descanso'}`}
            style={({ pressed }) => [
              estilos.opcao,
              { backgroundColor: opcao.marcado ? c.destaque : c.superficieSecundaria },
              pressed && { opacity: 0.75 },
            ]}
          >
            <View style={estilos.textos}>
              <Texto
                variante="corpo"
                style={[estilos.nome, opcao.marcado && { color: c.textoSobreDestaque }]}
              >
                {opcao.titulo}
              </Texto>
              {opcao.detalhe ? (
                <Texto
                  variante="legenda"
                  secundario={!opcao.marcado}
                  style={opcao.marcado && { color: c.textoSobreDestaque }}
                >
                  {opcao.detalhe}
                </Texto>
              ) : null}
            </View>
            {opcao.marcado ? (
              <Ionicons name="checkmark-circle" size={24} color={c.textoSobreDestaque} />
            ) : null}
          </Pressable>
        ))}
      </View>

      <Botao titulo="novo treino" variante="secundario" onPress={onNovoTreino} />
    </ScrollView>
  );
}

const estilos = StyleSheet.create({
  conteudo: {
    padding: espaco.lg,
    gap: espaco.md,
  },
  titulo: {
    fontFamily: familia.displayLeve,
  },
  lista: {
    gap: espaco.sm,
  },
  opcao: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: espaco.md,
    minHeight: 56,
    paddingHorizontal: espaco.md + 4,
    paddingVertical: espaco.sm,
    borderRadius: raio.md,
    borderCurve: 'continuous',
  },
  textos: {
    flex: 1,
  },
  nome: {
    fontFamily: familia.corpoMedio,
  },
});
