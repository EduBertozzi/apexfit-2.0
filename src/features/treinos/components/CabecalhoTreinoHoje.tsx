import Ionicons from '@expo/vector-icons/Ionicons';
import { StyleSheet, View } from 'react-native';

import { espaco, familia } from '@/shared/theme/tokens';
import { useCategorias } from '@/shared/theme/useCores';
import { Texto } from '@/shared/ui';

import { textoSequencia } from '../semana';

type Props = {
  /** "quarta" */
  nomeDoDia: string;
  /** "Treino A, Peito e tríceps" */
  legenda: string;
  sequencia: number;
};

/** "quarta / treino de hoje" à esquerda e a chama com os dias seguidos à direita. */
export function CabecalhoTreinoHoje({ nomeDoDia, legenda, sequencia }: Props) {
  const cat = useCategorias();

  return (
    <View style={estilos.container}>
      <View style={estilos.linha}>
        <View style={estilos.titulos}>
          <Texto variante="rotulo" secundario>
            {nomeDoDia}
          </Texto>
          <Texto variante="titulo" style={estilos.titulo} accessibilityRole="header">
            treino de hoje
          </Texto>
        </View>
        <View
          accessible
          accessibilityLabel={`sequência: ${textoSequencia(sequencia)}`}
          style={estilos.sequencia}
        >
          <Ionicons name="flame" size={34} color={cat.texto.cardio} />
          <Texto variante="titulo" style={estilos.numero}>
            {sequencia}
          </Texto>
        </View>
      </View>
      <Texto variante="legenda" secundario numberOfLines={2}>
        {legenda}
      </Texto>
    </View>
  );
}

const estilos = StyleSheet.create({
  container: {
    gap: 2,
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
