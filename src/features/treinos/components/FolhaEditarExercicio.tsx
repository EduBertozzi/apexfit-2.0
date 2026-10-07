import { ScrollView, StyleSheet, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { espaco } from '@/shared/theme/tokens';
import { useCores } from '@/shared/theme/useCores';
import { Botao, Texto } from '@/shared/ui';

import { exercicioParaFormulario } from '../schema';
import type { DadosExercicio, Exercicio } from '../types';
import { FormularioExercicio } from './FormularioExercicio';

type Props = {
  exercicio: Exercicio;
  onSalvar: (dados: DadosExercicio) => void;
  onRemover: () => void;
  onCancelar: () => void;
};

/** A mesma folha, no modo de editar um exercício só: todos os campos e "remover exercício". */
export function FolhaEditarExercicio({ exercicio, onSalvar, onRemover, onCancelar }: Props) {
  const c = useCores();
  const insets = useSafeAreaInsets();

  return (
    <View style={[estilos.raiz, { backgroundColor: c.superficie }]}>
      <ScrollView
        contentContainerStyle={[
          estilos.conteudo,
          { paddingBottom: Math.max(insets.bottom, espaco.md) + espaco.md },
        ]}
        keyboardShouldPersistTaps="handled"
      >
        <Texto variante="titulo" accessibilityRole="header">
          editar exercício
        </Texto>
        <FormularioExercicio
          valoresIniciais={exercicioParaFormulario(exercicio)}
          textoBotao="salvar"
          onSalvar={onSalvar}
          onCancelar={onCancelar}
        />
        <Botao titulo="remover exercício" variante="perigo" onPress={onRemover} />
      </ScrollView>
    </View>
  );
}

const estilos = StyleSheet.create({
  raiz: {
    flex: 1,
  },
  conteudo: {
    padding: espaco.lg,
    gap: espaco.lg,
  },
});
