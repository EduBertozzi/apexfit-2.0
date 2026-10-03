import { ActivityIndicator, Pressable, StyleSheet, Text } from 'react-native';

import { espaco, fonte, raio } from '../theme/tokens';
import { useCores } from '../theme/useCores';

type Variante = 'primario' | 'secundario' | 'perigo' | 'texto';

type Props = {
  titulo: string;
  onPress: () => void;
  variante?: Variante;
  desabilitado?: boolean;
  carregando?: boolean;
  /** Texto lido pelo leitor de tela, quando o título sozinho não explica (ex: "+250 ml"). */
  descricaoAcessivel?: string;
};

export function Botao({
  titulo,
  onPress,
  variante = 'primario',
  desabilitado = false,
  carregando = false,
  descricaoAcessivel,
}: Props) {
  const c = useCores();
  const inativo = desabilitado || carregando;

  const fundo = {
    primario: c.primaria,
    secundario: c.primariaSuave,
    perigo: 'transparent',
    texto: 'transparent',
  }[variante];

  const corTexto = {
    primario: c.textoSobrePrimaria,
    secundario: c.primaria,
    perigo: c.erro,
    texto: c.primaria,
  }[variante];

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
        variante === 'perigo' && { borderWidth: 1, borderColor: c.erro },
        pressed && { opacity: 0.75 },
        inativo && { opacity: 0.45 },
      ]}
    >
      {carregando ? (
        <ActivityIndicator color={corTexto} />
      ) : (
        <Text style={[estilos.titulo, { color: corTexto }]}>{titulo}</Text>
      )}
    </Pressable>
  );
}

const estilos = StyleSheet.create({
  base: {
    minHeight: 48,
    paddingHorizontal: espaco.lg,
    borderRadius: raio.md,
    alignItems: 'center',
    justifyContent: 'center',
  },
  titulo: {
    fontSize: fonte.corpo,
    fontWeight: '700',
  },
});
