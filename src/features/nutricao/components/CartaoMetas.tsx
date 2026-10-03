import { router } from 'expo-router';
import { StyleSheet, View } from 'react-native';

import type { Perfil } from '@/features/perfil/types';
import { formatarNumero } from '@/shared/lib/numero';
import { borda, espaco } from '@/shared/theme/tokens';
import { useCores } from '@/shared/theme/useCores';
import { Botao, Cartao, Texto } from '@/shared/ui';

import { calcularNecessidades } from '../calculos';

function Macro({ rotulo, gramas }: { rotulo: string; gramas: number }) {
  return (
    <View style={estilos.macro} accessible accessibilityLabel={`${rotulo}: ${gramas} gramas`}>
      <Texto variante="rotulo" secundario>
        {rotulo}
      </Texto>
      <Texto variante="subtitulo">{gramas} g</Texto>
    </View>
  );
}

/** Calorias e macros do dia. Se o perfil é antigo e falta dado, convida a completar. */
export function CartaoMetas({ perfil }: { perfil: Perfil }) {
  const c = useCores();
  const necessidades = calcularNecessidades(perfil);

  if (!necessidades) {
    return (
      <Cartao titulo="Calorias do dia" variante="tracejado">
        <Texto variante="subtitulo">Falta pouco</Texto>
        <Texto secundario>
          Diga seu sexo, nível de atividade e objetivo para o app calcular suas calorias e liberar a
          dieta com IA.
        </Texto>
        <Botao titulo="Completar perfil" onPress={() => router.push('/editar-perfil')} />
      </Cartao>
    );
  }

  const { metaCalorias, gastoDiario, tmb, macros } = necessidades;

  return (
    <Cartao titulo="Calorias do dia">
      <View style={estilos.linhaTotal}>
        <Texto variante="destaque">{formatarNumero(metaCalorias)}</Texto>
        <Texto variante="rotulo">kcal</Texto>
      </View>
      <Texto variante="legenda" secundario>
        Gasto diário {formatarNumero(gastoDiario)} kcal, metabolismo basal {formatarNumero(tmb)}{' '}
        kcal.
      </Texto>

      <View style={[estilos.macros, { borderTopColor: c.superficieSecundaria }]}>
        <Macro rotulo="Proteína" gramas={macros.proteinaG} />
        <Macro rotulo="Carboidrato" gramas={macros.carboidratoG} />
        <Macro rotulo="Gordura" gramas={macros.gorduraG} />
      </View>
    </Cartao>
  );
}

const estilos = StyleSheet.create({
  linhaTotal: {
    flexDirection: 'row',
    alignItems: 'baseline',
    gap: espaco.sm,
  },
  macros: {
    flexDirection: 'row',
    borderTopWidth: borda.grossa,
    paddingTop: espaco.sm,
    marginTop: espaco.xs,
  },
  macro: {
    flex: 1,
  },
});
