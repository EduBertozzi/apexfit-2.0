import type { StyleProp, ViewStyle } from 'react-native';

import { formatarNumero } from '@/shared/lib/numero';
import { Cartao, Texto } from '@/shared/ui';

import { calcularImc, classificarImc, NOME_FAIXA_IMC } from '../calculos';
import type { Perfil } from '../types';

type Props = {
  perfil: Perfil;
  style?: StyleProp<ViewStyle>;
};

export function CartaoImc({ perfil, style }: Props) {
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
        <Texto variante="rotulo">{NOME_FAIXA_IMC[faixa]}</Texto>
      ) : (
        <Texto variante="legenda" secundario>
          Para menores de 18 anos, o IMC é avaliado com curvas de crescimento. Converse com um
          profissional de saúde.
        </Texto>
      )}
    </Cartao>
  );
}
