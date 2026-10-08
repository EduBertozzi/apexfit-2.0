import { StyleSheet, View } from 'react-native';

import { espaco, familia } from '@/shared/theme/tokens';
import { Cartao, Texto } from '@/shared/ui';

type Props = {
  recorde: number;
  noMes: number;
  total: number;
};

/** Três números lado a lado: recorde, treinos no mês e dias de treino no total. */
export function NumerosSequencia({ recorde, noMes, total }: Props) {
  const itens = [
    { valor: recorde, rotulo: 'maior sequência' },
    { valor: noMes, rotulo: 'treinos no mês' },
    { valor: total, rotulo: 'dias de treino no total' },
  ];

  return (
    <View style={estilos.linha}>
      {itens.map((item) => (
        <Cartao key={item.rotulo} style={estilos.cartao}>
          <View accessible accessibilityLabel={`${item.rotulo}: ${item.valor}`}>
            <Texto variante="titulo" style={estilos.valor}>
              {item.valor}
            </Texto>
            <Texto variante="legenda" secundario>
              {item.rotulo}
            </Texto>
          </View>
        </Cartao>
      ))}
    </View>
  );
}

const estilos = StyleSheet.create({
  linha: {
    flexDirection: 'row',
    gap: espaco.grade,
  },
  cartao: {
    flex: 1,
    padding: espaco.md,
  },
  valor: {
    fontFamily: familia.display,
  },
});
