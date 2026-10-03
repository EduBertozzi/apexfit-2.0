import Ionicons from '@expo/vector-icons/Ionicons';
import type { ComponentProps } from 'react';
import { ActivityIndicator, Pressable, StyleSheet, Text } from 'react-native';

import { borda, espaco, familia, raio } from '../theme/tokens';
import { useCores } from '../theme/useCores';

/**
 * - primario: ação principal da tela
 * - destaque: fundo menta (ações rápidas, ex: +250 ml)
 * - heroi: contorno claro, para usar dentro do cartão herói (fundo escuro)
 */
type Variante = 'primario' | 'destaque' | 'secundario' | 'heroi' | 'perigo' | 'texto';

type Props = {
  titulo: string;
  onPress: () => void;
  variante?: Variante;
  desabilitado?: boolean;
  carregando?: boolean;
  /** Texto lido pelo leitor de tela, quando o título sozinho não explica (ex: "+250 ml"). */
  descricaoAcessivel?: string;
  /** Mostra só este ícone; o `titulo` vira o texto do leitor de tela. */
  icone?: ComponentProps<typeof Ionicons>['name'];
};

export function Botao({
  titulo,
  onPress,
  variante = 'primario',
  desabilitado = false,
  carregando = false,
  descricaoAcessivel,
  icone,
}: Props) {
  const c = useCores();
  const inativo = desabilitado || carregando;

  const fundo = {
    primario: c.primaria,
    destaque: c.destaque,
    secundario: c.primariaSuave,
    heroi: 'transparent',
    perigo: 'transparent',
    texto: 'transparent',
  }[variante];

  const corTexto = {
    primario: c.textoSobrePrimaria,
    destaque: c.textoSobreDestaque,
    secundario: c.texto,
    heroi: c.textoHeroi,
    perigo: c.erro,
    texto: c.texto,
  }[variante];

  const corBorda = { heroi: c.bordaHeroi, perigo: c.erro }[variante as 'heroi' | 'perigo'];

  return (
    <Pressable
      onPress={onPress}
      disabled={inativo}
      accessibilityRole="button"
      accessibilityLabel={descricaoAcessivel ?? titulo}
      accessibilityState={{ disabled: inativo, busy: carregando }}
      style={({ pressed }) => [
        estilos.base,
        { backgroundColor: fundo },
        corBorda && { borderWidth: borda.grossa, borderColor: corBorda },
        pressed && { opacity: 0.75 },
        inativo && { opacity: 0.45 },
      ]}
    >
      {carregando ? (
        <ActivityIndicator color={corTexto} />
      ) : icone ? (
        <Ionicons name={icone} size={24} color={corTexto} />
      ) : (
        <Text
          style={[
            estilos.titulo,
            variante === 'texto' && estilos.tituloSublinhado,
            { color: corTexto },
          ]}
        >
          {titulo}
        </Text>
      )}
    </Pressable>
  );
}

const estilos = StyleSheet.create({
  base: {
    minHeight: 50,
    paddingHorizontal: espaco.md,
    borderRadius: raio.sm,
    alignItems: 'center',
    justifyContent: 'center',
  },
  titulo: {
    fontFamily: familia.display,
    fontSize: 20,
    textTransform: 'uppercase',
    // Itálico condensado "vaza" para a direita; sem isso a última letra é cortada
    paddingRight: 2,
  },
  tituloSublinhado: {
    textDecorationLine: 'underline',
  },
});
