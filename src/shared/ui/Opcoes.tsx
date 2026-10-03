import { Pressable, StyleSheet, View } from 'react-native';

import { borda, espaco, raio } from '../theme/tokens';
import { useCores } from '../theme/useCores';
import { Texto } from './Texto';

export type Opcao = {
  valor: string;
  rotulo: string;
  descricao?: string;
};

type Props = {
  rotulo: string;
  opcoes: readonly Opcao[];
  valor: string;
  onMudar: (valor: string) => void;
  erro?: string;
  /** "linha" para opções curtas lado a lado; "coluna" para opções com descrição. */
  direcao?: 'linha' | 'coluna';
  testID?: string;
};

/** Escolha única (tipo "radio"), com o mesmo visual dos campos de texto. */
export function Opcoes({ rotulo, opcoes, valor, onMudar, erro, direcao = 'linha', testID }: Props) {
  const c = useCores();

  return (
    <View style={estilos.container} testID={testID}>
      <Texto variante="rotulo">{rotulo}</Texto>

      <View
        accessibilityRole="radiogroup"
        accessibilityLabel={rotulo}
        style={direcao === 'linha' ? estilos.linha : estilos.coluna}
      >
        {opcoes.map((opcao) => {
          const marcada = opcao.valor === valor;

          return (
            <Pressable
              key={opcao.valor}
              onPress={() => onMudar(opcao.valor)}
              accessibilityRole="radio"
              accessibilityLabel={opcao.rotulo}
              accessibilityHint={opcao.descricao}
              accessibilityState={{ checked: marcada }}
              style={({ pressed }) => [
                estilos.opcao,
                direcao === 'linha' && estilos.opcaoLinha,
                {
                  borderColor: erro ? c.erro : marcada ? c.texto : c.textoSecundario,
                  backgroundColor: marcada ? c.destaque : c.superficie,
                },
                pressed && { opacity: 0.75 },
              ]}
            >
              <Texto
                variante="subtitulo"
                style={[estilos.textoOpcao, marcada && { color: c.textoSobreDestaque }]}
              >
                {opcao.rotulo}
              </Texto>
              {opcao.descricao ? (
                <Texto
                  variante="legenda"
                  secundario={!marcada}
                  style={marcada && { color: c.textoSobreDestaque }}
                >
                  {opcao.descricao}
                </Texto>
              ) : null}
            </Pressable>
          );
        })}
      </View>

      {erro ? (
        <Texto variante="legenda" style={{ color: c.erro }} accessibilityLiveRegion="polite">
          {erro}
        </Texto>
      ) : null}
    </View>
  );
}

const estilos = StyleSheet.create({
  container: {
    gap: espaco.xs,
  },
  linha: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: espaco.sm,
  },
  coluna: {
    gap: espaco.sm,
  },
  opcao: {
    minHeight: 48,
    borderWidth: borda.grossa,
    borderRadius: raio.sm,
    paddingHorizontal: espaco.md,
    paddingVertical: espaco.sm,
    justifyContent: 'center',
  },
  opcaoLinha: {
    flexGrow: 1,
    alignItems: 'center',
  },
  textoOpcao: {
    fontSize: 18,
    lineHeight: 22,
  },
});
