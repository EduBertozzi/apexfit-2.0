import { Controller, type Control, type FieldErrors } from 'react-hook-form';

import { CampoTexto, Opcoes } from '@/shared/ui';

import { CONFIG_CAMPOS, type NomeCampo } from '../campos';
import type { FormularioPerfilValores } from '../schema';
import type { Perfil } from '../types';

type Props = {
  nome: NomeCampo;
  control: Control<FormularioPerfilValores, unknown, Perfil>;
  errors: FieldErrors<FormularioPerfilValores>;
  /** Próximo campo de texto, para o botão "próximo" do teclado. */
  onProximo?: () => void;
  ultimo?: boolean;
  autoFocus?: boolean;
};

/** Desenha um campo do perfil (texto ou escolha) a partir de CONFIG_CAMPOS. */
export function CampoPerfil({ nome, control, errors, onProximo, ultimo, autoFocus }: Props) {
  const config = CONFIG_CAMPOS[nome];

  return (
    <Controller
      control={control}
      name={nome}
      render={({ field }) =>
        config.tipo === 'escolha' ? (
          <Opcoes
            rotulo={config.rotulo}
            opcoes={config.opcoes}
            valor={field.value}
            onMudar={field.onChange}
            erro={errors[nome]?.message}
            direcao={config.direcao}
            testID={`campo-${nome}`}
          />
        ) : (
          <CampoTexto
            ref={field.ref}
            rotulo={config.rotulo}
            value={field.value}
            onChangeText={field.onChange}
            onBlur={field.onBlur}
            erro={errors[nome]?.message}
            placeholder={config.placeholder}
            keyboardType={config.teclado}
            sufixo={config.sufixo}
            dica={config.dica}
            opcional={config.opcional}
            multiline={config.multilinha}
            autoFocus={autoFocus}
            autoCapitalize={nome === 'nome' ? 'words' : 'sentences'}
            returnKeyType={ultimo || config.multilinha ? 'default' : 'next'}
            submitBehavior={config.multilinha ? 'newline' : 'submit'}
            onSubmitEditing={onProximo}
            testID={`campo-${nome}`}
          />
        )
      }
    />
  );
}
