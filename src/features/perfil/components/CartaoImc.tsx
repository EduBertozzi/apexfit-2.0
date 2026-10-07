import { StyleSheet, View, type StyleProp, type ViewStyle } from 'react-native';

import { formatarNumero } from '@/shared/lib/numero';
import { espaco, raio } from '@/shared/theme/tokens';
import { useCores } from '@/shared/theme/useCores';
import { Cartao, Texto } from '@/shared/ui';

import { calcularImc, classificarImc, NOME_FAIXA_IMC } from '../calculos';
import type { Perfil } from '../types';

type Props = {
  perfil: Perfil;
  style?: StyleProp<ViewStyle>;
};

export function CartaoImc({ perfil, style }: Props) {
  const c = useCores();
  const imc = calcularImc(perfil.pesoKg, perfil.alturaCm);
  const faixa = classificarImc(imc, perfil.idade);

  return (
    <Cartao titulo="IMC" style={style}>
      <Texto
        variante="destaque"
        accessibilityLabel={`Índice de massa corporal: ${formatarNumero(imc, 1)}`}
      >
        {formatarNumero(imc, 1)}
      </Texto>
      {faixa ? (
        <View style={[estilos.faixa, { backgroundColor: c.superficieSecundaria }]}>
          <Texto variante="rotulo">{NOME_FAIXA_IMC[faixa].toLowerCase()}</Texto>
        </View>
      ) : (
        <Texto variante="legenda" secundario>
          Para menores de 18 anos, o IMC é avaliado com curvas de crescimento. Converse com um
          profissional de saúde.
        </Texto>
      )}
    </Cartao>
  );
}

const estilos = StyleSheet.create({
  faixa: {
    alignSelf: 'flex-start',
    paddingHorizontal: espaco.md - 4,
    paddingVertical: espaco.xs,
    borderRadius: raio.total,
  },
});
