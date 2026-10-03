import { StyleSheet, Switch, View } from 'react-native';

import { espaco } from '../theme/tokens';
import { useCores } from '../theme/useCores';
import { Texto } from './Texto';

type Props = {
  rotulo: string;
  descricao?: string;
  valor: boolean;
  onMudar: (valor: boolean) => void;
  testID?: string;
};

/** Linha de configuração com liga/desliga. Tocar no texto não liga: só o Switch, como no sistema. */
export function Interruptor({ rotulo, descricao, valor, onMudar, testID }: Props) {
  const c = useCores();

  return (
    <View style={estilos.linha}>
      <View style={estilos.textos}>
        <Texto>{rotulo}</Texto>
        {descricao ? (
          <Texto variante="legenda" secundario>
            {descricao}
          </Texto>
        ) : null}
      </View>
      <Switch
        value={valor}
        onValueChange={onMudar}
        accessibilityLabel={rotulo}
        accessibilityHint={descricao}
        trackColor={{ false: c.superficieSecundaria, true: c.destaque }}
        thumbColor={valor ? c.textoSobreDestaque : c.textoSecundario}
        ios_backgroundColor={c.superficieSecundaria}
        testID={testID}
      />
    </View>
  );
}

const estilos = StyleSheet.create({
  linha: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: espaco.md,
    minHeight: 48,
  },
  textos: {
    flex: 1,
    gap: 2,
  },
});
