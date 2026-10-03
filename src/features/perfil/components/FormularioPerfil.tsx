import { zodResolver } from '@hookform/resolvers/zod';
import { Controller, useForm } from 'react-hook-form';
import { StyleSheet, View, type KeyboardTypeOptions } from 'react-native';

import { espaco } from '@/shared/theme/tokens';
import { Botao, CampoTexto, Texto } from '@/shared/ui';

import { FORMULARIO_VAZIO, perfilSchema, type FormularioPerfilValores } from '../schema';
import type { Perfil } from '../types';

type Props = {
  valoresIniciais?: FormularioPerfilValores;
  textoBotao: string;
  onSalvar: (perfil: Perfil) => void;
};

type ConfigCampo = {
  nome: keyof FormularioPerfilValores;
  rotulo: string;
  placeholder?: string;
  teclado?: KeyboardTypeOptions;
  sufixo?: string;
  dica?: string;
  opcional?: boolean;
  multilinha?: boolean;
};

// A ordem aqui é a ordem na tela e a ordem do botão "próximo" do teclado
const CAMPOS_PESSOAIS: ConfigCampo[] = [
  { nome: 'nome', rotulo: 'Nome', placeholder: 'Como quer ser chamado?' },
  { nome: 'idade', rotulo: 'Idade', placeholder: '17', teclado: 'number-pad', sufixo: 'anos' },
];

const CAMPOS_CORPO: ConfigCampo[] = [
  { nome: 'alturaCm', rotulo: 'Altura', placeholder: '175', teclado: 'decimal-pad', sufixo: 'cm' },
  { nome: 'pesoKg', rotulo: 'Peso', placeholder: '70,5', teclado: 'decimal-pad', sufixo: 'kg' },
  {
    nome: 'percentualGordura',
    rotulo: 'Gordura corporal',
    placeholder: '18',
    teclado: 'decimal-pad',
    sufixo: '%',
    opcional: true,
    dica: 'Se não souber, deixe em branco.',
  },
  {
    nome: 'restricoes',
    rotulo: 'Saúde e restrições',
    placeholder: 'Ex: intolerância à lactose, lesão no joelho, hipertensão',
    opcional: true,
    multilinha: true,
  },
];

const ORDEM = [...CAMPOS_PESSOAIS, ...CAMPOS_CORPO].map((campo) => campo.nome);

/**
 * Formulário usado no onboarding e na edição do perfil.
 * Toda regra de validação está em `schema.ts`; aqui só exibimos.
 */
export function FormularioPerfil({
  valoresIniciais = FORMULARIO_VAZIO,
  textoBotao,
  onSalvar,
}: Props) {
  const {
    control,
    handleSubmit,
    setFocus,
    formState: { errors, isSubmitting },
  } = useForm<FormularioPerfilValores, unknown, Perfil>({
    resolver: zodResolver(perfilSchema),
    defaultValues: valoresIniciais,
    mode: 'onTouched',
  });

  const enviar = handleSubmit(onSalvar);

  function renderizarCampo(campo: ConfigCampo) {
    const indice = ORDEM.indexOf(campo.nome);
    const proximo = ORDEM[indice + 1];
    const ultimo = proximo === undefined;

    return (
      <Controller
        key={campo.nome}
        control={control}
        name={campo.nome}
        render={({ field }) => (
          <CampoTexto
            ref={field.ref}
            rotulo={campo.rotulo}
            value={field.value}
            onChangeText={field.onChange}
            onBlur={field.onBlur}
            erro={errors[campo.nome]?.message}
            placeholder={campo.placeholder}
            keyboardType={campo.teclado}
            sufixo={campo.sufixo}
            dica={campo.dica}
            opcional={campo.opcional}
            multiline={campo.multilinha}
            autoCapitalize={campo.nome === 'nome' ? 'words' : 'sentences'}
            returnKeyType={ultimo || campo.multilinha ? 'default' : 'next'}
            submitBehavior={campo.multilinha ? 'newline' : 'submit'}
            onSubmitEditing={() => {
              if (proximo) {
                setFocus(proximo);
              }
            }}
            testID={`campo-${campo.nome}`}
          />
        )}
      />
    );
  }

  return (
    <View style={estilos.container}>
      <View style={estilos.secao}>
        <Texto variante="subtitulo">Sobre você</Texto>
        {CAMPOS_PESSOAIS.map(renderizarCampo)}
      </View>

      <View style={estilos.secao}>
        <Texto variante="subtitulo">Seu corpo</Texto>
        <Texto variante="legenda" secundario>
          Usamos esses dados para calcular sua meta de água e seu IMC. Eles ficam só no seu celular.
        </Texto>
        {CAMPOS_CORPO.map(renderizarCampo)}
      </View>

      <Botao titulo={textoBotao} onPress={enviar} carregando={isSubmitting} />
    </View>
  );
}

const estilos = StyleSheet.create({
  container: {
    gap: espaco.lg,
  },
  secao: {
    gap: espaco.md,
  },
});
