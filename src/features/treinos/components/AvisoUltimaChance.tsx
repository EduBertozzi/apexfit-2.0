import Ionicons from '@expo/vector-icons/Ionicons';
import { Pressable, StyleSheet, View } from 'react-native';

import { espaco, familia, raio, semana } from '@/shared/theme/tokens';
import { Texto } from '@/shared/ui';

import { useUltimaChance } from '../useUltimaChance';

type Props = {
  hoje: Date;
  /** Na tela inicial, tocar abre a página de sequência. */
  onPress?: () => void;
};

/**
 * "última chance": aparece quando hoje decide a sequência (quebraria ou gastaria
 * o último congelador). Também cuida da notificação das 20:00 e de guardar os
 * dias congelados, então fica montado mesmo quando não aparece.
 */
export function AvisoUltimaChance({ hoje, onPress }: Props) {
  const { mostrar, texto } = useUltimaChance(hoje);

  if (!mostrar) {
    return null;
  }

  const conteudo = (
    <>
      <View style={estilos.icone}>
        <Ionicons name="flame" size={22} color={semana.anel.fraco} />
      </View>
      <View style={estilos.textos}>
        <Texto variante="rotulo" style={[estilos.titulo, { color: semana.texto }]}>
          última chance
        </Texto>
        <Texto variante="legenda" style={{ color: semana.texto }}>
          {texto}
        </Texto>
      </View>
      {onPress ? <Ionicons name="chevron-forward" size={20} color={semana.texto} /> : null}
    </>
  );

  if (onPress) {
    return (
      <Pressable
        onPress={onPress}
        accessibilityRole="button"
        accessibilityLabel={`última chance: ${texto}`}
        accessibilityHint="abre sua sequência"
        style={({ pressed }) => [estilos.aviso, pressed && { opacity: 0.85 }]}
      >
        {conteudo}
      </Pressable>
    );
  }

  return (
    <View
      accessible
      accessibilityRole="alert"
      accessibilityLabel={`última chance: ${texto}`}
      style={estilos.aviso}
    >
      {conteudo}
    </View>
  );
}

const estilos = StyleSheet.create({
  // Fundo salmão da regra do calendário ("pouco ou nada"): o dia está em perigo
  aviso: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: espaco.sm + 4,
    backgroundColor: semana.fraco,
    borderRadius: raio.md,
    borderCurve: 'continuous',
    paddingVertical: espaco.sm + 4,
    paddingHorizontal: espaco.md,
    minHeight: 44,
  },
  icone: {
    width: 36,
    height: 36,
    borderRadius: raio.total,
    backgroundColor: semana.circulo,
    alignItems: 'center',
    justifyContent: 'center',
  },
  textos: {
    flex: 1,
    gap: 2,
  },
  titulo: {
    fontFamily: familia.display,
  },
});
