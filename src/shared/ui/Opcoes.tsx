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
  /**
   * Só em linha: pílulas menores, do tamanho do texto e sem o ícone de check;
   * quebram para a linha de baixo quando não cabem. A marcada fica só no menta.
   */
  compacto?: boolean;
  testID?: string;
};

/**
 * Escolha única (tipo "radio"). Em linha vira pílulas; em coluna, cartões arredondados.
 * A marcada ganha fundo menta com texto escuro e um ícone de check,
 * para não depender só da cor.
 */
export function Opcoes({
  rotulo,
  opcoes,
  valor,
  onMudar,
  erro,
  direcao = 'linha',
  compacto = false,
  testID,
}: Props) {
  const c = useCores();
  const emLinha = direcao === 'linha';
  const pilulaCompacta = emLinha && compacto;

  return (
    <View style={estilos.container} testID={testID}>
      <Texto variante="rotulo" secundario style={estilos.rotulo}>
        {rotulo}
      </Texto>

      <View
        accessibilityRole="radiogroup"
        accessibilityLabel={rotulo}
        style={emLinha ? [estilos.linha, pilulaCompacta && estilos.linhaCompacta] : estilos.coluna}
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
                pilulaCompacta && estilos.opcaoCompacta,
                {
                  backgroundColor: marcada ? c.destaque : c.superficieSecundaria,
                  borderColor: erro && !marcada ? c.erro : 'transparent',
                },
                pressed && { opacity: 0.75 },
              ]}
            >
              <View style={emLinha ? estilos.conteudoLinha : estilos.conteudoColuna}>
                <Texto
                  variante={pilulaCompacta ? 'legenda' : emLinha ? 'rotulo' : 'corpo'}
                  style={[estilos.textoOpcao, { color: corTexto }]}
                  // Compacta: rótulo numa linha só; a pílula cresce com o texto e quebra a fileira
                  numberOfLines={pilulaCompacta ? 1 : undefined}
                  maxFontSizeMultiplier={pilulaCompacta ? 1.4 : undefined}
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
              {marcada && !pilulaCompacta ? (
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
  linhaCompacta: {
    gap: espaco.xs + 2,
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
  opcaoCompacta: {
    // Largura pelo conteúdo (nunca espremida); mínimo de 48 para o toque
    flexGrow: 0,
    flexShrink: 0,
    minWidth: 48,
    minHeight: 40,
    paddingHorizontal: espaco.sm + 4,
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
