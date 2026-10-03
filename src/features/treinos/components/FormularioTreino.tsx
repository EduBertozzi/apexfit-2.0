import { zodResolver } from '@hookform/resolvers/zod';
import { Controller, useForm } from 'react-hook-form';
import { StyleSheet, View } from 'react-native';

import { espaco } from '@/shared/theme/tokens';
import { CampoTexto } from '@/shared/ui';

import {
  treinoParaFormulario,
  treinoSchema,
  type DadosFormularioTreino,
  type FormularioTreinoValores,
} from '../schema';
import type { Treino } from '../types';

type Props = {
  treino: Treino;
  onSalvar: (dados: DadosFormularioTreino) => void;
};

/**
 * Nome e foco do treino. Salva sozinho ao sair do campo (se estiver válido),
 * para combinar com os exercícios, que também salvam na hora.
 */
export function FormularioTreino({ treino, onSalvar }: Props) {
  const {
    control,
    handleSubmit,
    setFocus,
    formState: { errors },
  } = useForm<FormularioTreinoValores, unknown, DadosFormularioTreino>({
    resolver: zodResolver(treinoSchema),
    defaultValues: treinoParaFormulario(treino),
    mode: 'onTouched',
  });

  const salvar = handleSubmit(onSalvar);

  return (
    <View style={estilos.container}>
      <Controller
        control={control}
        name="nome"
        render={({ field }) => (
          <CampoTexto
            ref={field.ref}
            rotulo="Nome do treino"
            value={field.value}
            onChangeText={field.onChange}
            onBlur={() => {
              field.onBlur();
              salvar();
            }}
            erro={errors.nome?.message}
            placeholder="Treino A"
            returnKeyType="next"
            onSubmitEditing={() => setFocus('foco')}
            testID="treino-nome"
          />
        )}
      />
      <Controller
        control={control}
        name="foco"
        render={({ field }) => (
          <CampoTexto
            ref={field.ref}
            rotulo="Foco"
            value={field.value}
            onChangeText={field.onChange}
            onBlur={() => {
              field.onBlur();
              salvar();
            }}
            erro={errors.foco?.message}
            placeholder="Ex: Peito e tríceps"
            opcional
            returnKeyType="done"
            onSubmitEditing={() => salvar()}
            testID="treino-foco"
          />
        )}
      />
    </View>
  );
}

const estilos = StyleSheet.create({
  container: {
    gap: espaco.md,
  },
});
