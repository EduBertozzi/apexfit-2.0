import Ionicons from '@expo/vector-icons/Ionicons';
import { router } from 'expo-router';
import { StyleSheet, View } from 'react-native';

import type { Perfil } from '@/features/perfil/types';
import { formatarNumero } from '@/shared/lib/numero';
import { espaco } from '@/shared/theme/tokens';
import { useCategorias } from '@/shared/theme/useCores';
import { Botao, Cartao, Texto } from '@/shared/ui';

import { calcularNecessidades } from '../calculos';
import { ChipsMacros } from './ChipsMacros';

/** Calorias e macros do dia. Se o perfil é antigo e falta dado, convida a completar. */
export function CartaoMetas({ perfil }: { perfil: Perfil }) {
  const categorias = useCategorias();
  const necessidades = calcularNecessidades(perfil);

  if (!necessidades) {
    return (
      <Cartao titulo="calorias do dia" variante="tracejado">
        <Texto variante="subtitulo">falta pouco</Texto>
        <Texto secundario>
          Diga seu sexo, nível de atividade e objetivo para o app calcular suas calorias e liberar a
          dieta com IA.
        </Texto>
        <Botao titulo="completar perfil" onPress={() => router.push('/editar-perfil')} />
      </Cartao>
    );
  }

  const { metaCalorias, gastoDiario, tmb, macros } = necessidades;

  return (
    <Cartao>
      <View style={estilos.cabecalho}>
        <Ionicons name="flame" size={20} color={categorias.texto.cardio} />
        <Texto
          variante="rotulo"
          style={{ color: categorias.texto.cardio }}
          accessibilityRole="header"
        >
          calorias do dia
        </Texto>
      </View>
      <View style={estilos.linhaTotal}>
        <Texto variante="destaque">{formatarNumero(metaCalorias)}</Texto>
        <Texto variante="rotulo" secundario>
          kcal
        </Texto>
      </View>
      <Texto variante="legenda" secundario>
        Gasto diário {formatarNumero(gastoDiario)} kcal, metabolismo basal {formatarNumero(tmb)}{' '}
        kcal.
      </Texto>
      <View style={estilos.chips}>
        <ChipsMacros macros={macros} />
      </View>
    </Cartao>
  );
}

const estilos = StyleSheet.create({
  cabecalho: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: espaco.xs + 2,
  },
  linhaTotal: {
    flexDirection: 'row',
    alignItems: 'baseline',
    gap: espaco.sm,
  },
  chips: {
    marginTop: espaco.xs,
  },
});
