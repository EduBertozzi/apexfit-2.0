import { zodResolver } from '@hookform/resolvers/zod';
import { Controller, useForm } from 'react-hook-form';
import { StyleSheet, View } from 'react-native';

import { espaco } from '@/shared/theme/tokens';
import { Botao, CampoTexto } from '@/shared/ui';

import { EXERCICIO_VAZIO, exercicioSchema, type FormularioExercicioValores } from '../schema';
import type { DadosExercicio } from '../types';

type Props = {
  valoresIniciais?: FormularioExercicioValores;
  textoBotao: string;
  onSalvar: (dados: DadosExercicio) => void;
  onCancelar: () => void;
};

type NomeCampo = keyof FormularioExercicioValores;

/** Formulário de um exercício. Toda regra está em `schema.ts`; aqui só exibimos. */
export function FormularioExercicio({
  valoresIniciais = EXERCICIO_VAZIO,
  textoBotao,
  onSalvar,
  onCancelar,
}: Props) {
  const {
    control,
    handleSubmit,
    setFocus,
    formState: { errors },
  } = useForm<FormularioExercicioValores, unknown, DadosExercicio>({
    resolver: zodResolver(exercicioSchema),
    defaultValues: valoresIniciais,
    mode: 'onTouched',
  });

  const enviar = handleSubmit(onSalvar);

  function campo(
    nome: NomeCampo,
    config: {
      rotulo: string;
      proximo?: NomeCampo;
      placeholder?: string;
      teclado?: 'default' | 'number-pad' | 'decimal-pad';
      sufixo?: string;
      dica?: string;
      opcional?: boolean;
    },
  ) {
    return (
      <Controller
        control={control}
        name={nome}
        render={({ field }) => (
          <CampoTexto
            ref={field.ref}
            rotulo={config.rotulo}
            value={field.value}
            onChangeText={field.onChange}
            onBlur={field.onBlur}
            erro={errors[nome]?.message}
            placeholder={config.placeholder}
            keyboardType={config.teclado ?? 'default'}
            sufixo={config.sufixo}
            dica={config.dica}
            opcional={config.opcional}
            returnKeyType={config.proximo ? 'next' : 'done'}
            onSubmitEditing={() => (config.proximo ? setFocus(config.proximo) : enviar())}
            testID={`exercicio-${nome}`}
          />
        )}
      />
    );
  }

  return (
    <View style={estilos.container}>
      {campo('nome', { rotulo: 'Exercício', placeholder: 'Ex: Supino reto', proximo: 'series' })}

      <View style={estilos.linha}>
        <View style={estilos.series}>
          {campo('series', { rotulo: 'Séries', teclado: 'number-pad', proximo: 'repeticoes' })}
        </View>
        <View style={estilos.repeticoes}>
          {campo('repeticoes', {
            rotulo: 'Repetições',
            placeholder: '8 a 12',
            proximo: 'cargaKg',
          })}
        </View>
      </View>

      {campo('cargaKg', {
        rotulo: 'Carga',
        teclado: 'decimal-pad',
        sufixo: 'kg',
        placeholder: '22,5',
        opcional: true,
        dica: 'Deixe em branco se for com o peso do corpo.',
        proximo: 'observacao',
      })}

      {campo('observacao', {
        rotulo: 'Observação',
        placeholder: 'Ex: descer devagar',
        opcional: true,
      })}

      <View style={estilos.linha}>
        <View style={estilos.botao}>
          <Botao titulo="Cancelar" variante="secundario" onPress={onCancelar} />
        </View>
        <View style={estilos.botao}>
          <Botao titulo={textoBotao} onPress={enviar} />
        </View>
      </View>
    </View>
  );
}

const estilos = StyleSheet.create({
  container: {
    gap: espaco.md,
  },
  linha: {
    flexDirection: 'row',
    gap: espaco.sm,
  },
  series: {
    flex: 2,
  },
  repeticoes: {
    flex: 3,
  },
  botao: {
    flex: 1,
  },
});
