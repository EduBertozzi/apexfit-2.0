import { StyleSheet, View } from 'react-native';

import { espaco } from '@/shared/theme/tokens';
import { Botao } from '@/shared/ui';

type Props = {
  /** Nome do item, para o leitor de tela: "Subir Supino". */
  nome: string;
  primeiro: boolean;
  ultimo: boolean;
  onSubir: () => void;
  onDescer: () => void;
  onEditar?: () => void;
  onRemover?: () => void;
};

/** Botões de ícone para reordenar, editar e remover um item da lista. */
export function BotoesOrdem({
  nome,
  primeiro,
  ultimo,
  onSubir,
  onDescer,
  onEditar,
  onRemover,
}: Props) {
  return (
    <View style={estilos.linha}>
      <View style={estilos.botao}>
        <Botao
          titulo={`Subir ${nome}`}
          icone="arrow-up"
          variante="secundario"
          onPress={onSubir}
          desabilitado={primeiro}
        />
      </View>
      <View style={estilos.botao}>
        <Botao
          titulo={`Descer ${nome}`}
          icone="arrow-down"
          variante="secundario"
          onPress={onDescer}
          desabilitado={ultimo}
        />
      </View>
      {onEditar ? (
        <View style={estilos.botao}>
          <Botao
            titulo={`Editar ${nome}`}
            icone="create-outline"
            variante="secundario"
            onPress={onEditar}
          />
        </View>
      ) : null}
      {onRemover ? (
        <View style={estilos.botao}>
          <Botao
            titulo={`Remover ${nome}`}
            icone="trash-outline"
            variante="perigo"
            onPress={onRemover}
          />
        </View>
      ) : null}
    </View>
  );
}

const estilos = StyleSheet.create({
  linha: {
    flexDirection: 'row',
    justifyContent: 'flex-end',
    gap: espaco.sm,
  },
  botao: {
    width: 56,
  },
});
