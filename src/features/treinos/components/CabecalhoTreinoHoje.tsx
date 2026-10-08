import Ionicons from '@expo/vector-icons/Ionicons';
import { router } from 'expo-router';
import { Pressable, StyleSheet, View } from 'react-native';

import { espaco, familia } from '@/shared/theme/tokens';
import { useCategorias } from '@/shared/theme/useCores';
import { Botao, Texto } from '@/shared/ui';

import { textoSequencia } from '../semana';

type Props = {
  /** "quarta" */
  nomeDoDia: string;
  /** "treino de hoje", "treino de amanhã", "treino de sexta"... */
  titulo: string;
  /** Aparece quando o dia escolhido não é hoje. */
  onVoltarParaHoje?: () => void;
  /** "Treino A, Peito e tríceps" */
  legenda: string;
  sequencia: number;
};

/** "quarta / treino de hoje" à esquerda e a chama com os dias de sequência à direita. */
export function CabecalhoTreinoHoje({
  nomeDoDia,
  titulo,
  legenda,
  sequencia,
  onVoltarParaHoje,
}: Props) {
  const cat = useCategorias();

  return (
    <View style={estilos.container}>
      <View style={estilos.linha}>
        <View style={estilos.titulos}>
          <Texto variante="rotulo" secundario>
            {nomeDoDia}
          </Texto>
          <Texto variante="titulo" style={estilos.titulo} accessibilityRole="header">
            {titulo}
          </Texto>
        </View>
        <Pressable
          onPress={() => router.push('/sequencia')}
          accessibilityRole="button"
          accessibilityLabel="ver sua sequência"
          accessibilityHint={textoSequencia(sequencia)}
          hitSlop={8}
          style={({ pressed }) => [estilos.sequencia, pressed && { opacity: 0.75 }]}
        >
          <Ionicons name="flame" size={34} color={cat.texto.cardio} />
          <Texto variante="titulo" style={estilos.numero}>
            {sequencia}
          </Texto>
        </Pressable>
      </View>
      <Texto variante="legenda" secundario numberOfLines={2} accessibilityLiveRegion="polite">
        {legenda}
      </Texto>
      {onVoltarParaHoje ? (
        <Botao
          titulo="voltar para hoje"
          variante="secundario"
          onPress={onVoltarParaHoje}
          descricaoAcessivel="voltar para o treino de hoje"
        />
      ) : null}
    </View>
  );
}

const estilos = StyleSheet.create({
  container: {
    gap: espaco.xs,
    marginTop: espaco.sm,
  },
  linha: {
    flexDirection: 'row',
    alignItems: 'flex-end',
    justifyContent: 'space-between',
    gap: espaco.md,
  },
  titulos: {
    flexShrink: 1,
  },
  titulo: {
    fontFamily: familia.display,
  },
  sequencia: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: espaco.xs,
    minHeight: 44,
  },
  numero: {
    fontFamily: familia.displayLeve,
  },
});
