import { StyleSheet, View } from 'react-native';

import { useCores } from '../theme/useCores';

type Props = {
  /** De 0 a 1 */
  valor: number;
  cor?: string;
  corTrilho?: string;
  rotuloAcessivel: string;
};

/** Barra reta e inclinada, no estilo "pista de corrida". */
export function BarraProgresso({ valor, cor, corTrilho, rotuloAcessivel }: Props) {
  const c = useCores();
  const porcentagem = Math.round(Math.min(Math.max(valor, 0), 1) * 100);

  return (
    <View
      accessibilityRole="progressbar"
      accessibilityLabel={rotuloAcessivel}
      accessibilityValue={{ min: 0, max: 100, now: porcentagem }}
      style={[estilos.trilho, { backgroundColor: corTrilho ?? c.superficieSecundaria }]}
    >
      <View
        style={[
          estilos.preenchimento,
          { width: `${porcentagem}%`, backgroundColor: cor ?? c.destaque },
        ]}
      />
    </View>
  );
}

const estilos = StyleSheet.create({
  trilho: {
    height: 20,
    overflow: 'hidden',
    transform: [{ skewX: '-18deg' }],
  },
  preenchimento: {
    height: '100%',
  },
});
