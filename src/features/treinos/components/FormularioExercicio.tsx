import { zodResolver } from '@hookform/resolvers/zod';
import { Controller, useForm } from 'react-hook-form';
import { StyleSheet, View } from 'react-native';

import { espaco } from '@/shared/theme/tokens';
import { Botao, CampoTexto, Opcoes, Texto } from '@/shared/ui';

import { NOME_GRUPO, ORDEM_GRUPOS } from '../grupos';
import { EXERCICIO_VAZIO, exercicioSchema, type FormularioExercicioValores } from '../schema';
import type { DadosExercicio } from '../types';

const OPCOES_GRUPO = ORDEM_GRUPOS.map((grupo) => ({ valor: grupo, rotulo: NOME_GRUPO[grupo] }));

type Props = {
  valoresIniciais?: FormularioExercicioValores;
  textoBotao: string;
  onSalvar: (dados: DadosExercicio) => void;
  onCancelar: () => void;
};

type NomeCampoTexto = Exclude<keyof FormularioExercicioValores, 'grupo'>;

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
    nome: NomeCampoTexto,
    config: {
      rotulo: string;
      proximo?: NomeCampoTexto;
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
      {campo('nome', { rotulo: 'exercício', placeholder: 'ex: supino reto', proximo: 'series' })}

      <Controller
        control={control}
        name="grupo"
        render={({ field }) => (
          <View style={estilos.grupo}>
            <Opcoes
              rotulo="grupo"
              opcoes={OPCOES_GRUPO}
              valor={field.value}
              onMudar={field.onChange}
              erro={errors.grupo?.message}
              testID="exercicio-grupo"
            />
            <Texto variante="legenda" secundario>
              define o card e a cor na tela inicial. se não escolher, o app adivinha pelo nome.
            </Texto>
          </View>
        )}
      />

      <View style={estilos.linha}>
        <View style={estilos.series}>
          {campo('series', { rotulo: 'séries', teclado: 'number-pad', proximo: 'repeticoes' })}
        </View>
        <View style={estilos.repeticoes}>
          {campo('repeticoes', {
            rotulo: 'repetições',
            placeholder: '8 a 12',
            proximo: 'cargaKg',
          })}
        </View>
      </View>
      <Texto variante="legenda" secundario>
        no cardio, escreva o tempo: 10 min.
      </Texto>

      {campo('cargaKg', {
        rotulo: 'carga',
        teclado: 'decimal-pad',
        sufixo: 'kg',
        placeholder: '22,5',
        opcional: true,
        dica: 'deixe em branco se for com o peso do corpo.',
        proximo: 'observacao',
      })}

      {campo('observacao', {
        rotulo: 'observação',
        placeholder: 'ex: descer devagar',
        opcional: true,
      })}

      <View style={estilos.linha}>
        <View style={estilos.botao}>
          <Botao titulo="cancelar" variante="secundario" onPress={onCancelar} />
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
  grupo: {
    gap: espaco.xs,
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
