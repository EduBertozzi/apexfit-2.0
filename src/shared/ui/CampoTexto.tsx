import { forwardRef, useState } from 'react';
import { Platform, StyleSheet, TextInput, View, type TextInputProps } from 'react-native';

import { borda, espaco, familia, fonte, raio } from '../theme/tokens';
import { useCores, useEsquema } from '../theme/useCores';
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
 * Campo preenchido e arredondado, com rótulo SEMPRE visível em cima
 * (na v1 o texto sumia ao digitar porque era só placeholder).
 * O fundo é `superficieSecundaria` com um contorno discreto, para o campo
 * aparecer tanto sobre o card quanto sobre o fundo da tela. No foco ganha um
 * anel (menta no escuro, texto no claro) e, com erro, anel vermelho e a
 * mensagem logo embaixo.
 */
export const CampoTexto = forwardRef<TextInput, Props>(function CampoTexto(
  { rotulo, erro, dica, sufixo, opcional = false, onFocus, onBlur, multiline, ...props },
  ref,
) {
  const c = useCores();
  const escuro = useEsquema() === 'escuro';
  const [focado, setFocado] = useState(false);

  const corAnel = erro ? c.erro : focado ? (escuro ? c.destaque : c.texto) : c.bordaCampo;

  return (
    <View style={estilos.container}>
      <Texto variante="rotulo" secundario style={estilos.rotulo}>
        {rotulo}
        {opcional ? (
          <Texto variante="rotulo" secundario>
            {'  (opcional)'}
          </Texto>
        ) : null}
      </Texto>

      <View
        style={[
          estilos.caixa,
          { borderColor: corAnel, backgroundColor: c.superficieSecundaria },
          multiline && estilos.caixaMultilinha,
        ]}
      >
        <TextInput
          ref={ref}
          accessibilityLabel={rotulo}
          accessibilityHint={erro ?? dica}
          placeholderTextColor={c.textoSecundario}
          selectionColor={escuro ? c.destaque : c.texto}
          cursorColor={escuro ? c.destaque : c.texto}
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
        <Texto
          variante="legenda"
          style={[estilos.mensagem, { color: c.erro }]}
          accessibilityLiveRegion="polite"
        >
          {erro}
        </Texto>
      ) : dica ? (
        <Texto variante="legenda" secundario style={estilos.mensagem}>
          {dica}
        </Texto>
      ) : null}
    </View>
  );
});

const estilos = StyleSheet.create({
  container: {
    gap: espaco.sm,
  },
  rotulo: {
    paddingHorizontal: espaco.xs,
  },
  caixa: {
    flexDirection: 'row',
    alignItems: 'center',
    minHeight: 56,
    // Borda sempre com a mesma largura (discreta no repouso) para o campo não "pular" no foco
    borderWidth: borda.grossa,
    borderRadius: raio.md,
    borderCurve: 'continuous',
    paddingHorizontal: espaco.md + 2,
  },
  caixaMultilinha: {
    alignItems: 'flex-start',
    paddingVertical: espaco.sm,
  },
  input: {
    flex: 1,
    fontFamily: familia.corpo,
    fontSize: fonte.corpo,
    paddingVertical: espaco.sm,
    // No navegador, tira o contorno padrão: o foco já aparece no anel da caixa
    ...Platform.select({ web: { outlineWidth: 0 } }),
  },
  inputMultilinha: {
    minHeight: 96,
    textAlignVertical: 'top',
  },
  sufixo: {
    marginLeft: espaco.sm,
  },
  mensagem: {
    paddingHorizontal: espaco.xs,
  },
});
