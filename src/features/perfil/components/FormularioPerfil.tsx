import { zodResolver } from '@hookform/resolvers/zod';
import { useForm } from 'react-hook-form';
import { StyleSheet, View } from 'react-native';

import { espaco } from '@/shared/theme/tokens';
import { Botao, Texto } from '@/shared/ui';

import { CONFIG_CAMPOS, SECOES_EDICAO, type NomeCampo } from '../campos';
import { FORMULARIO_VAZIO, perfilSchema, type FormularioPerfilValores } from '../schema';
import type { Perfil } from '../types';
import { CampoPerfil } from './CampoPerfil';

type Props = {
  valoresIniciais?: FormularioPerfilValores;
  textoBotao: string;
  onSalvar: (perfil: Perfil) => void;
};

// Ordem do botão "próximo" do teclado: só campos de texto, na ordem da tela
const ORDEM_TEXTO = SECOES_EDICAO.flatMap((secao) => secao.campos).filter(
  (nome) => CONFIG_CAMPOS[nome].tipo === 'texto',
);

/**
 * Formulário completo do perfil, numa tela só (usado na edição).
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

  function proximoDe(nome: NomeCampo): NomeCampo | undefined {
    const indice = ORDEM_TEXTO.indexOf(nome);

    return indice === -1 ? undefined : ORDEM_TEXTO[indice + 1];
  }

  return (
    <View style={estilos.container}>
      {SECOES_EDICAO.map((secao) => (
        <View key={secao.id} style={estilos.secao}>
          <Texto variante="subtitulo" accessibilityRole="header">
            {secao.titulo}
          </Texto>
          {secao.descricao ? (
            <Texto variante="legenda" secundario>
              {secao.descricao}
            </Texto>
          ) : null}
          {secao.campos.map((nome) => {
            const proximo = proximoDe(nome);

            return (
              <CampoPerfil
                key={nome}
                nome={nome}
                control={control}
                errors={errors}
                ultimo={proximo === undefined}
                onProximo={() => proximo && setFocus(proximo)}
              />
            );
          })}
        </View>
      ))}

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
