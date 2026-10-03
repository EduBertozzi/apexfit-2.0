import { StyleSheet, View } from 'react-native';

import { raio } from '../theme/tokens';
import { useCores } from '../theme/useCores';

type Props = {
  /** De 0 a 1 */
  valor: number;
  cor?: string;
  rotuloAcessivel: string;
};

export function BarraProgresso({ valor, cor, rotuloAcessivel }: Props) {
  const c = useCores();
  const porcentagem = Math.round(Math.min(Math.max(valor, 0), 1) * 100);

  return (
    <View
      accessibilityRole="progressbar"
      accessibilityLabel={rotuloAcessivel}
      accessibilityValue={{ min: 0, max: 100, now: porcentagem }}
      style={[estilos.trilho, { backgroundColor: c.superficieSecundaria }]}
    >
      <View
        style={[
          estilos.preenchimento,
          { width: `${porcentagem}%`, backgroundColor: cor ?? c.primaria },
        ]}
      />
    </View>
  );
}

const estilos = StyleSheet.create({
  trilho: {
    height: 12,
    borderRadius: raio.total,
    overflow: 'hidden',
  },
  preenchimento: {
    height: '100%',
    borderRadius: raio.total,
  },
});
