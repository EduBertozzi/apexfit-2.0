import { StyleSheet, View } from 'react-native';

import { raio } from '../theme/tokens';
import { useCores } from '../theme/useCores';

type Props = {
  /** De 0 a 1 */
  valor: number;
  cor?: string;
  corTrilho?: string;
  rotuloAcessivel: string;
  /** Espessura da barra. Padrão 12. */
  altura?: number;
};

/** Barra de progresso em pílula: trilho arredondado e preenchimento com as pontas redondas. */
export function BarraProgresso({ valor, cor, corTrilho, rotuloAcessivel, altura = 12 }: Props) {
  const c = useCores();
  const porcentagem = Math.round(Math.min(Math.max(valor, 0), 1) * 100);

  return (
    <View
      accessibilityRole="progressbar"
      accessibilityLabel={rotuloAcessivel}
      accessibilityValue={{ min: 0, max: 100, now: porcentagem }}
      style={[
        estilos.trilho,
        { height: altura, backgroundColor: corTrilho ?? c.superficieSecundaria },
      ]}
    >
      {porcentagem > 0 ? (
        <View
          style={[
            estilos.preenchimento,
            {
              // Nunca menor que a própria altura, para a ponta continuar redonda
              width: `${porcentagem}%`,
              minWidth: altura,
              backgroundColor: cor ?? c.destaque,
            },
          ]}
        />
      ) : null}
    </View>
  );
}

const estilos = StyleSheet.create({
  trilho: {
    borderRadius: raio.total,
    overflow: 'hidden',
  },
  preenchimento: {
    height: '100%',
    borderRadius: raio.total,
  },
});
