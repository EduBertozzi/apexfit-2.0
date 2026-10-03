import { forwardRef, useState } from 'react';
import { Platform, StyleSheet, TextInput, View, type TextInputProps } from 'react-native';

import { espaco, fonte, raio } from '../theme/tokens';
import { useCores } from '../theme/useCores';
import { Texto } from './Texto';

type Props = Omit<TextInputProps, 'style'> & {
  rotulo: string;
  erro?: string;
  dica?: string;
  /** Texto fixo à direita, ex: "kg", "cm". */
  sufixo?: string;
  opcional?: boolean;
};

/**
 * Campo com rótulo SEMPRE visível (na v1 o texto sumia ao digitar porque era só placeholder),
 * mensagem de erro embaixo do próprio campo e borda que muda no foco.
 */
export const CampoTexto = forwardRef<TextInput, Props>(function CampoTexto(
  { rotulo, erro, dica, sufixo, opcional = false, onFocus, onBlur, multiline, ...props },
  ref,
) {
  const c = useCores();
  const [focado, setFocado] = useState(false);

  const corBorda = erro ? c.erro : focado ? c.primaria : c.borda;

  return (
    <View style={estilos.container}>
      <Texto variante="legenda" style={estilos.rotulo}>
        {rotulo}
        {opcional ? (
          <Texto variante="legenda" secundario>
            {'  (opcional)'}
          </Texto>
        ) : null}
      </Texto>

      <View
        style={[
          estilos.caixa,
          { borderColor: corBorda, backgroundColor: c.superficie },
          focado && estilos.caixaFocada,
          multiline && estilos.caixaMultilinha,
        ]}
      >
        <TextInput
          ref={ref}
          accessibilityLabel={rotulo}
          accessibilityHint={erro ?? dica}
          placeholderTextColor={c.textoSecundario}
          multiline={multiline}
          style={[estilos.input, { color: c.texto }, multiline && estilos.inputMultilinha]}
          onFocus={(evento) => {
            setFocado(true);
            onFocus?.(evento);
          }}
          onBlur={(evento) => {
            setFocado(false);
            onBlur?.(evento);
          }}
          {...props}
        />
        {sufixo ? (
          <Texto secundario style={estilos.sufixo}>
            {sufixo}
          </Texto>
        ) : null}
      </View>

      {erro ? (
        <Texto variante="legenda" style={{ color: c.erro }} accessibilityLiveRegion="polite">
          {erro}
        </Texto>
      ) : dica ? (
        <Texto variante="legenda" secundario>
          {dica}
        </Texto>
      ) : null}
    </View>
  );
});

const estilos = StyleSheet.create({
  container: {
    gap: espaco.xs,
  },
  rotulo: {
    fontWeight: '600',
  },
  caixa: {
    flexDirection: 'row',
    alignItems: 'center',
    minHeight: 48,
    borderWidth: 1,
    borderRadius: raio.md,
    paddingHorizontal: espaco.md,
  },
  caixaFocada: {
    borderWidth: 2,
    paddingHorizontal: espaco.md - 1,
  },
  caixaMultilinha: {
    alignItems: 'flex-start',
    paddingVertical: espaco.sm,
  },
  input: {
    flex: 1,
    fontSize: fonte.corpo,
    paddingVertical: espaco.sm,
    // No navegador, tira o contorno padrão: o foco já aparece na borda da caixa
    ...Platform.select({ web: { outlineWidth: 0 } }),
  },
  inputMultilinha: {
    minHeight: 88,
    textAlignVertical: 'top',
  },
  sufixo: {
    marginLeft: espaco.sm,
  },
});
