import MaterialCommunityIcons from '@expo/vector-icons/MaterialCommunityIcons';
import { router } from 'expo-router';
import { StyleSheet, Text, View, type StyleProp, type ViewStyle } from 'react-native';

import { textoDietaInicio } from '@/features/dieta/logica';
import { usePlanoDeHoje } from '@/features/dieta/store';
import type { Perfil } from '@/features/perfil/types';
import { espaco, familia, fonte, raio } from '@/shared/theme/tokens';
import { useCategorias, useCores } from '@/shared/theme/useCores';
import { CartaoToque, ESPACO_DA_SETA } from '@/shared/ui/CartaoToque';

import { calcularNecessidades } from '../calculos';

/**
 * Card de dieta da tela inicial (junta o antigo card de calorias): com plano,
 * "5 refeições · 2.970 kcal"; sem plano, a meta do dia e "montar dieta".
 * Perfil sem dados para a meta: leva para completar o perfil.
 */
export function CartaoDietaInicio({
  perfil,
  style,
}: {
  perfil: Perfil;
  style?: StyleProp<ViewStyle>;
}) {
  const c = useCores();
  const cat = useCategorias();
  const plano = usePlanoDeHoje();
  const meta = calcularNecessidades(perfil)?.metaCalorias ?? null;
  const texto = textoDietaInicio(plano, meta);

  return (
    <CartaoToque
      rotuloAcessivel={texto.acessivel}
      dica={texto.dicaToque}
      onPress={() => router.push(texto.destino)}
      style={[estilos.cartao, style]}
      testID="cartao-dieta"
    >
      {/* Amarelo da dieta, igual ao chip "dieta" da central de IA */}
      <MaterialCommunityIcons name="silverware-fork-knife" size={36} color={cat.texto.peito} />
      <View style={estilos.textos}>
        <Text
          maxFontSizeMultiplier={1.3}
          style={[estilos.titulo, { color: c.texto, marginRight: ESPACO_DA_SETA }]}
        >
          dieta
        </Text>
        <Text maxFontSizeMultiplier={1.3} style={[estilos.linha, { color: c.textoSecundario }]}>
          {texto.linha}
        </Text>
      </View>
      {texto.dica ? (
        <View style={[estilos.dica, { backgroundColor: cat.fundo.peito }]}>
          <Text
            maxFontSizeMultiplier={1.3}
            style={[estilos.textoDica, { color: c.textoSobreDestaque }]}
          >
            {texto.dica}
          </Text>
        </View>
      ) : null}
    </CartaoToque>
  );
}

const estilos = StyleSheet.create({
  cartao: {
    gap: espaco.sm,
  },
  textos: {
    gap: 2,
  },
  titulo: {
    fontFamily: familia.display,
    fontSize: fonte.subtitulo + 3,
  },
  linha: {
    fontFamily: familia.corpo,
    fontSize: fonte.rotulo,
  },
  dica: {
    alignSelf: 'flex-start',
    borderRadius: raio.total,
    paddingHorizontal: espaco.sm + 2,
    paddingVertical: 2,
  },
  textoDica: {
    fontFamily: familia.corpoForte,
    fontSize: fonte.legenda,
  },
});
