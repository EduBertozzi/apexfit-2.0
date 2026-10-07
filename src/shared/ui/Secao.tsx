import { Children, Fragment, isValidElement, type ReactNode } from 'react';
import { StyleSheet, View } from 'react-native';

import { espaco, raio } from '../theme/tokens';
import { useCores } from '../theme/useCores';
import { Texto } from './Texto';

type Props = {
  /** Título pequeno, fora do cartão, em minúsculas. */
  titulo: string;
  /** Texto de apoio embaixo do cartão. */
  rodape?: string;
  children: ReactNode;
};

/**
 * Grupo de ajustes no jeito do sistema (iPhone e Android): título pequeno em cima,
 * um cartão arredondado com as linhas separadas por uma linha fina, e um rodapé opcional.
 */
export function Secao({ titulo, rodape, children }: Props) {
  const c = useCores();
  const itens = Children.toArray(children).filter(isValidElement);

  return (
    <View style={estilos.secao}>
      <Texto variante="rotulo" secundario accessibilityRole="header" style={estilos.titulo}>
        {titulo}
      </Texto>
      <View style={[estilos.cartao, { backgroundColor: c.superficie }]}>
        {itens.map((item, indice) => (
          <Fragment key={item.key ?? indice}>
            {indice > 0 ? <View style={[estilos.divisor, { backgroundColor: c.borda }]} /> : null}
            <View style={estilos.item}>{item}</View>
          </Fragment>
        ))}
      </View>
      {rodape ? (
        <Texto variante="legenda" secundario style={estilos.titulo}>
          {rodape}
        </Texto>
      ) : null}
    </View>
  );
}

const estilos = StyleSheet.create({
  secao: {
    gap: espaco.sm,
  },
  titulo: {
    paddingHorizontal: espaco.md,
  },
  cartao: {
    borderRadius: raio.lg,
    borderCurve: 'continuous',
    paddingHorizontal: espaco.md + 4,
    paddingVertical: espaco.xs,
  },
  item: {
    paddingVertical: espaco.sm + 4,
    gap: espaco.sm,
  },
  divisor: {
    height: StyleSheet.hairlineWidth,
  },
});
