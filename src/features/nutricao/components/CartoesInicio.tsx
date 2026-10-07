import MaterialCommunityIcons from '@expo/vector-icons/MaterialCommunityIcons';
import { router } from 'expo-router';
import { StyleSheet, Text, View } from 'react-native';

import type { Perfil } from '@/features/perfil/types';
import { formatarNumero } from '@/shared/lib/numero';
import { espaco, familia, fonte } from '@/shared/theme/tokens';
import { useCores } from '@/shared/theme/useCores';
import { CartaoToque, ESPACO_DA_SETA } from '@/shared/ui/CartaoToque';

import { calcularNecessidades } from '../calculos';

/** Calorias do dia na grade da tela inicial. Perfil incompleto: convida a completar. */
export function CartaoCaloriasInicio({ perfil }: { perfil: Perfil }) {
  const c = useCores();
  const necessidades = calcularNecessidades(perfil);

  if (!necessidades) {
    return (
      <CartaoToque
        rotuloAcessivel="calorias: complete o perfil para o app calcular sua meta"
        dica="Abre a edição do perfil"
        onPress={() => router.push('/editar-perfil')}
        style={estilos.cartao}
      >
        <MaterialCommunityIcons name="fire" size={32} color={c.texto} />
        <Text style={[estilos.titulo, { color: c.texto, marginRight: ESPACO_DA_SETA }]}>
          complete o perfil
        </Text>
        <Text style={[estilos.legenda, { color: c.textoSecundario }]}>para ver suas calorias</Text>
      </CartaoToque>
    );
  }

  const meta = formatarNumero(necessidades.metaCalorias);

  return (
    <CartaoToque
      rotuloAcessivel={`calorias: meta de ${meta} quilocalorias por dia`}
      dica="Abre o perfil com as suas metas"
      onPress={() => router.push('/perfil')}
      style={estilos.cartao}
    >
      <MaterialCommunityIcons name="fire" size={32} color={c.texto} />
      <View style={estilos.base}>
        <View style={estilos.valores}>
          <Text maxFontSizeMultiplier={1.3} style={[estilos.numero, { color: c.texto }]}>
            {meta}
          </Text>
          <Text maxFontSizeMultiplier={1.3} style={[estilos.legenda, { color: c.textoSecundario }]}>
            {' kcal'}
          </Text>
        </View>
        <Text style={[estilos.legenda, { color: c.textoSecundario }]}>meta do dia</Text>
      </View>
    </CartaoToque>
  );
}

/** Atalho para a dieta na tela inicial. */
export function CartaoDietaInicio() {
  const c = useCores();

  return (
    <CartaoToque
      rotuloAcessivel="dieta: ver seu plano de refeições"
      dica="Abre a dieta"
      onPress={() => router.push('/dieta')}
      style={estilos.cartao}
    >
      <MaterialCommunityIcons name="silverware-fork-knife" size={32} color={c.texto} />
      <View style={estilos.base}>
        <Text style={[estilos.titulo, { color: c.texto }]}>dieta</Text>
        <Text style={[estilos.legenda, { color: c.textoSecundario }]}>ver dieta</Text>
      </View>
    </CartaoToque>
  );
}

const estilos = StyleSheet.create({
  cartao: {
    flex: 1,
    justifyContent: 'space-between',
  },
  base: {
    marginTop: espaco.sm,
  },
  valores: {
    flexDirection: 'row',
    alignItems: 'baseline',
    flexWrap: 'wrap',
  },
  numero: {
    fontFamily: familia.display,
    fontSize: 30,
  },
  titulo: {
    fontFamily: familia.displayLeve,
    fontSize: fonte.subtitulo,
  },
  legenda: {
    fontFamily: familia.corpo,
    fontSize: fonte.rotulo,
  },
});
