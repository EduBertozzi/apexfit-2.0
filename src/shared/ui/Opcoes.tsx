import Ionicons from '@expo/vector-icons/Ionicons';
import { Pressable, StyleSheet, View } from 'react-native';

import { borda, espaco, familia, raio } from '../theme/tokens';
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
  /** "linha" para pílulas curtas lado a lado; "coluna" para cartões com descrição. */
  direcao?: 'linha' | 'coluna';
  testID?: string;
};

/**
 * Escolha única (tipo "radio"). Em linha vira pílulas; em coluna, cartões arredondados.
 * A marcada ganha fundo menta com texto escuro e um ícone de check,
 * para não depender só da cor.
 */
export function Opcoes({ rotulo, opcoes, valor, onMudar, erro, direcao = 'linha', testID }: Props) {
  const c = useCores();
  const emLinha = direcao === 'linha';

  return (
    <View style={estilos.container} testID={testID}>
      <Texto variante="rotulo" secundario style={estilos.rotulo}>
        {rotulo}
      </Texto>

      <View
        accessibilityRole="radiogroup"
        accessibilityLabel={rotulo}
        style={emLinha ? estilos.linha : estilos.coluna}
      >
        {opcoes.map((opcao) => {
          const marcada = opcao.valor === valor;
          const corTexto = marcada ? c.textoSobreDestaque : c.texto;

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
                emLinha ? estilos.opcaoLinha : estilos.opcaoColuna,
                {
                  backgroundColor: marcada ? c.destaque : c.superficieSecundaria,
                  borderColor: erro && !marcada ? c.erro : 'transparent',
                },
                pressed && { opacity: 0.75 },
              ]}
            >
              <View style={emLinha ? estilos.conteudoLinha : estilos.conteudoColuna}>
                <Texto
                  variante={emLinha ? 'rotulo' : 'corpo'}
                  style={[estilos.textoOpcao, { color: corTexto }]}
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
              </View>
              {marcada ? (
                <Ionicons
                  name="checkmark-circle"
                  size={emLinha ? 18 : 24}
                  color={c.textoSobreDestaque}
                />
              ) : null}
            </Pressable>
          );
        })}
      </View>

      {erro ? (
        <Texto
          variante="legenda"
          style={[estilos.rotulo, { color: c.erro }]}
          accessibilityLiveRegion="polite"
        >
          {erro}
        </Texto>
      ) : null}
    </View>
  );
}

const estilos = StyleSheet.create({
  container: {
    gap: espaco.sm,
  },
  rotulo: {
    paddingHorizontal: espaco.xs,
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
    flexDirection: 'row',
    alignItems: 'center',
    gap: espaco.sm,
    borderWidth: borda.grossa,
    borderCurve: 'continuous',
  },
  opcaoLinha: {
    flexGrow: 1,
    justifyContent: 'center',
    minHeight: 48,
    paddingHorizontal: espaco.md + 2,
    borderRadius: raio.total,
  },
  opcaoColuna: {
    minHeight: 64,
    paddingHorizontal: espaco.md + 4,
    paddingVertical: espaco.md - 4,
    borderRadius: raio.md,
  },
  conteudoLinha: {
    alignItems: 'center',
  },
  conteudoColuna: {
    flex: 1,
    gap: 2,
  },
  textoOpcao: {
    fontFamily: familia.corpoMedio,
  },
});
