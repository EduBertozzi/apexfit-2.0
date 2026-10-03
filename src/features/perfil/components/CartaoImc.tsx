import { formatarNumero } from '@/shared/lib/numero';
import { Cartao, Texto } from '@/shared/ui';

import { calcularImc, classificarImc, NOME_FAIXA_IMC } from '../calculos';
import type { Perfil } from '../types';

export function CartaoImc({ perfil }: { perfil: Perfil }) {
  const imc = calcularImc(perfil.pesoKg, perfil.alturaCm);
  const faixa = classificarImc(imc, perfil.idade);

  return (
    <Cartao titulo="IMC">
      <Texto variante="destaque">{formatarNumero(imc, 1)}</Texto>
      {faixa ? (
        <Texto secundario>{NOME_FAIXA_IMC[faixa]}</Texto>
      ) : (
        <Texto variante="legenda" secundario>
          Para menores de 18 anos, o IMC é avaliado com curvas de crescimento. Converse com um
          profissional de saúde.
        </Texto>
      )}
    </Cartao>
  );
}
