import Ionicons from '@expo/vector-icons/Ionicons';
import { StyleSheet, Text, View } from 'react-native';

import { borda, espaco, familia, fonte, raio, semana } from '@/shared/theme/tokens';

import { rotuloDaBolinha, type BolinhaDaSemana } from '../sequencia';

/** Cores das bolinhas: a tela usa as do tema; o cartão de compartilhar, as do escuro. */
export type PaletaBolinhas = {
  /** Fundo da bolinha vazia (perdido, futuro, descanso). */
  vazio: string;
  /** Contorno de hoje. */
  contorno: string;
  /** Sigla embaixo e ícone do descanso. */
  rotulo: string;
};

type Props = {
  bolinhas: readonly BolinhaDaSemana[];
  paleta: PaletaBolinhas;
  /** Diâmetro de cada bolinha. Padrão 36. */
  tamanho?: number;
  /** Desliga a fonte grande do sistema (no cartão que vira imagem). */
  tamanhoFixo?: boolean;
};

/**
 * A semana em 7 bolinhas, como no Duolingo: check verde nos dias que contaram,
 * lua no descanso do plano (neutro, não quebra) e hoje contornado.
 */
export function BolinhasSemana({ bolinhas, paleta, tamanho = 36, tamanhoFixo = false }: Props) {
  return (
    <View style={estilos.linha}>
      {bolinhas.map((bolinha) => {
        const feito = bolinha.estado === 'feito';

        return (
          <View
            key={bolinha.chave}
            accessible
            accessibilityLabel={rotuloDaBolinha(bolinha)}
            style={estilos.dia}
          >
            <View
              style={[
                estilos.bolinha,
                {
                  width: tamanho,
                  height: tamanho,
                  backgroundColor: feito ? semana.completo : paleta.vazio,
                  borderColor: bolinha.hoje ? paleta.contorno : 'transparent',
                },
              ]}
            >
              {feito ? (
                <Ionicons name="checkmark" size={tamanho * 0.6} color={semana.texto} />
              ) : bolinha.estado === 'descanso' ? (
                <Ionicons name="moon" size={tamanho * 0.42} color={paleta.rotulo} />
              ) : null}
            </View>
            <Text
              allowFontScaling={!tamanhoFixo}
              maxFontSizeMultiplier={1.3}
              style={[
                estilos.sigla,
                {
                  color: paleta.rotulo,
                  fontSize: Math.max(fonte.micro, tamanho * 0.36),
                  lineHeight: Math.max(fonte.micro, tamanho * 0.36) * 1.3,
                },
              ]}
            >
              {bolinha.sigla}
            </Text>
          </View>
        );
      })}
    </View>
  );
}

const estilos = StyleSheet.create({
  linha: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  dia: {
    alignItems: 'center',
    gap: espaco.xs,
  },
  bolinha: {
    borderRadius: raio.total,
    borderWidth: borda.grossa,
    alignItems: 'center',
    justifyContent: 'center',
  },
  sigla: {
    fontFamily: familia.rotulo,
  },
});
