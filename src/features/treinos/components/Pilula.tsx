import type { ReactNode } from 'react';
import { Pressable, StyleSheet, Text, View, type AccessibilityRole } from 'react-native';

import { espaco, familia, fonte, raio } from '@/shared/theme/tokens';
import { useCores } from '@/shared/theme/useCores';

type Props = {
  rotulo: string;
  selecionada: boolean;
  onPress: () => void;
  /** Fundo quando selecionada (ex: cor do grupo). Padrão: pílula clara, como na referência. */
  corSelecionada?: string;
  /** Texto quando selecionada. Padrão: o contrário do fundo. */
  corTextoSelecionada?: string;
  /** 'tab' nas abas; 'button' (com estado selecionado) nos filtros. */
  papel?: Extract<AccessibilityRole, 'tab' | 'button'>;
  /** Ocupa o espaço que sobrar (abas). */
  esticar?: boolean;
  rotuloAcessivel?: string;
  testID?: string;
};

/** Pílula de escolha usada na folha de montar treino (abas, grupos e regiões). */
export function Pilula({
  rotulo,
  selecionada,
  onPress,
  corSelecionada,
  corTextoSelecionada,
  papel = 'button',
  esticar = false,
  rotuloAcessivel,
  testID,
}: Props) {
  const c = useCores();
  const fundo = selecionada ? (corSelecionada ?? c.texto) : c.superficieSecundaria;
  const corTexto = selecionada ? (corTextoSelecionada ?? c.fundo) : c.texto;

  return (
    <Pressable
      onPress={onPress}
      accessibilityRole={papel}
      accessibilityLabel={rotuloAcessivel ?? rotulo}
      accessibilityState={{ selected: selecionada }}
      testID={testID}
      style={({ pressed }) => [
        estilos.pilula,
        esticar && estilos.esticar,
        { backgroundColor: fundo },
        pressed && { opacity: 0.75 },
      ]}
    >
      <Text style={[estilos.texto, { color: corTexto }]} numberOfLines={1}>
        {rotulo}
      </Text>
    </Pressable>
  );
}

/** Linha de pílulas que se divide o espaço igualmente (abas no topo da folha). */
export function GrupoAbas({ children, rotulo }: { children: ReactNode; rotulo: string }) {
  const c = useCores();

  return (
    <View
      accessibilityRole="tablist"
      accessibilityLabel={rotulo}
      style={[estilos.abas, { backgroundColor: c.superficieSecundaria }]}
    >
      {children}
    </View>
  );
}

const estilos = StyleSheet.create({
  pilula: {
    minHeight: 44,
    paddingHorizontal: espaco.md + 2,
    borderRadius: raio.total,
    alignItems: 'center',
    justifyContent: 'center',
  },
  esticar: {
    flex: 1,
    paddingHorizontal: espaco.sm,
  },
  texto: {
    fontFamily: familia.corpoForte,
    fontSize: fonte.rotulo,
  },
  abas: {
    flexDirection: 'row',
    borderRadius: raio.total,
    padding: espaco.xs,
    gap: espaco.xs,
  },
});
