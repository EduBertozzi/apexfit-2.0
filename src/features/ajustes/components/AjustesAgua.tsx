import { calcularMetaAguaMl, ML_POR_KG } from '@/features/perfil/calculos';
import { formatarNumero } from '@/shared/lib/numero';
import { Contador, Interruptor, Secao, Texto } from '@/shared/ui';

import { ajustarMetaManual, META_AGUA_MANUAL } from '../logica';
import { useAjustesStore } from '../store';

export function AjustesAgua({ pesoKg }: { pesoKg: number }) {
  const manualMl = useAjustesStore((state) => state.metaAguaManualMl);
  const vibracao = useAjustesStore((state) => state.vibracao);
  const definirMeta = useAjustesStore((state) => state.definirMetaAguaManual);
  const definirVibracao = useAjustesStore((state) => state.definirVibracao);

  const automaticaMl = calcularMetaAguaMl(pesoKg);

  return (
    <Secao titulo="água">
      <Interruptor
        rotulo="Escolher minha meta"
        descricao={`Automática: ${formatarNumero(automaticaMl)} ml (${ML_POR_KG} ml por kg)`}
        valor={manualMl !== null}
        onMudar={(ligado) => definirMeta(ligado ? automaticaMl : null)}
        testID="ajuste-meta-manual"
      />

      {manualMl !== null ? (
        <>
          <Contador
            rotulo="meta de água"
            valorTexto={`${formatarNumero(manualMl)} ml`}
            onMenos={() => definirMeta(ajustarMetaManual(manualMl, -1))}
            onMais={() => definirMeta(ajustarMetaManual(manualMl, 1))}
            podeMenos={manualMl > META_AGUA_MANUAL.min}
            podeMais={manualMl < META_AGUA_MANUAL.max}
          />
          <Texto variante="legenda" secundario>
            Ajuste de 250 em 250 ml, entre 1 e 6 litros. Se tiver orientação médica, siga ela.
          </Texto>
        </>
      ) : null}

      <Interruptor
        rotulo="Vibrar ao registrar"
        descricao="Toque leve a cada copo e um mais forte ao bater a meta."
        valor={vibracao}
        onMudar={definirVibracao}
        testID="ajuste-vibracao"
      />
    </Secao>
  );
}
