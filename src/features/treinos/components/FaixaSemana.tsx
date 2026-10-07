import { useState } from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';

import { espaco, familia, fonte, raio, semana } from '@/shared/theme/tokens';
import { useCores } from '@/shared/theme/useCores';

import { resumoDoDia, rotuloDoDia, type DiaDaSemana, type EstadoDia } from '../semana';

type Props = {
  dias: readonly DiaDaSemana[];
  /** Frase com a semana toda, lida junto da legenda. */
  resumo: string;
};

/** Espaço entre as pílulas: pequeno, para os 7 dias caberem a partir de 320 px. */
const ESPACO_PILULAS = 6;
/** Círculo do número: encolhe junto da pílula em telas estreitas. */
const TAMANHO_CIRCULO = 32;

type CoresDia = { fundo: string; rotulo: string; circulo: string; numero: string };

function Legenda({ resumo }: { resumo: string }) {
  const c = useCores();
  const itens = [
    { cor: semana.completo, texto: 'completo' },
    { cor: semana.parcial, texto: 'metade' },
    { cor: semana.fraco, texto: 'pouco ou nada' },
  ];

  return (
    <View accessible accessibilityLabel={resumo} style={estilos.legenda}>
      {itens.map((item) => (
        <View key={item.texto} style={estilos.itemLegenda}>
          <View style={[estilos.ponto, { backgroundColor: item.cor }]} />
          <Text
            numberOfLines={1}
            maxFontSizeMultiplier={1.3}
            style={[estilos.textoLegenda, { color: c.textoSecundario }]}
          >
            {item.texto}
          </Text>
        </View>
      ))}
    </View>
  );
}

/**
 * Os 7 dias da semana em pílulas, todos visíveis sem rolar: a cor diz o status
 * (verde, amarelo, vermelho; hoje em branco; futuro em cinza) e a legenda explica.
 * Tocar num dia mostra o resumo dele embaixo.
 */
export function FaixaSemana({ dias, resumo }: Props) {
  const c = useCores();
  const chaveDeHoje = dias.find((dia) => dia.estado === 'hoje')?.chave;
  const [selecionado, setSelecionado] = useState(
    () => dias.find((dia) => dia.estado === 'hoje')?.chave ?? dias[0]?.chave,
  );
  const diaSelecionado = dias.find((dia) => dia.chave === selecionado);

  const doStatus = (fundo: string): CoresDia => ({
    fundo,
    rotulo: semana.texto,
    circulo: semana.circulo,
    numero: semana.texto,
  });
  const cores: Record<EstadoDia, CoresDia> = {
    completo: doStatus(semana.completo),
    parcial: doStatus(semana.parcial),
    fraco: doStatus(semana.fraco),
    // Hoje: "branco" no escuro (e o inverso no claro), com o círculo do número escuro
    hoje: { fundo: c.texto, rotulo: c.fundo, circulo: c.fundo, numero: c.texto },
    futuro: {
      fundo: c.superficie,
      rotulo: c.textoSecundario,
      circulo: c.superficieSecundaria,
      numero: c.textoSecundario,
    },
  };

  return (
    <View style={estilos.container}>
      <View style={estilos.faixa}>
        {dias.map((dia) => {
          const cor = cores[dia.estado];
          const marcado = dia.chave === selecionado;

          return (
            <Pressable
              key={dia.chave}
              testID={`dia-${dia.chave}`}
              accessibilityRole="button"
              accessibilityLabel={rotuloDoDia(dia)}
              accessibilityState={{ selected: marcado }}
              onPress={() => setSelecionado(dia.chave)}
              // Metade do espaço entre pílulas de cada lado: a área de toque não tem buraco
              hitSlop={{ left: ESPACO_PILULAS / 2, right: ESPACO_PILULAS / 2 }}
              style={({ pressed }) => [
                estilos.pilula,
                { backgroundColor: cor.fundo },
                // Dia tocado ganha um contorno, sem mudar o tamanho da pílula
                marcado && dia.estado !== 'hoje' && { borderColor: c.texto },
                pressed && { opacity: 0.8 },
              ]}
            >
              <Text
                numberOfLines={1}
                maxFontSizeMultiplier={1.2}
                style={[estilos.sigla, { color: cor.rotulo }]}
              >
                {dia.sigla}
              </Text>
              <View style={[estilos.circulo, { backgroundColor: cor.circulo }]}>
                <Text
                  numberOfLines={1}
                  maxFontSizeMultiplier={1.2}
                  style={[estilos.numero, { color: cor.numero }]}
                >
                  {dia.dia}
                </Text>
              </View>
            </Pressable>
          );
        })}
      </View>

      <Legenda resumo={resumo} />

      {/* Hoje já tem o resumo embaixo do título; aqui só aparece o dia tocado */}
      {diaSelecionado && diaSelecionado.chave !== chaveDeHoje ? (
        <Text
          accessibilityLiveRegion="polite"
          style={[estilos.resumoDia, { color: c.texto }]}
          numberOfLines={1}
        >
          {resumoDoDia(diaSelecionado)}
        </Text>
      ) : null}
    </View>
  );
}

const estilos = StyleSheet.create({
  container: {
    gap: espaco.sm,
  },
  faixa: {
    flexDirection: 'row',
    gap: ESPACO_PILULAS,
  },
  pilula: {
    flex: 1,
    minWidth: 0,
    minHeight: 68,
    borderRadius: raio.md,
    borderCurve: 'continuous',
    borderWidth: 2,
    borderColor: 'transparent',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: espaco.sm,
    paddingHorizontal: 2,
    gap: espaco.xs,
  },
  sigla: {
    fontFamily: familia.display,
    fontSize: 14,
  },
  circulo: {
    width: '100%',
    maxWidth: TAMANHO_CIRCULO,
    aspectRatio: 1,
    borderRadius: raio.total,
    alignItems: 'center',
    justifyContent: 'center',
  },
  numero: {
    fontFamily: familia.display,
    fontSize: 15,
  },
  // Cabe numa linha a partir de 320 px; com fonte grande, quebra em vez de cortar
  legenda: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    columnGap: espaco.sm + 4,
    rowGap: espaco.xs,
  },
  itemLegenda: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: espaco.xs,
  },
  ponto: {
    width: 8,
    height: 8,
    borderRadius: 4,
  },
  textoLegenda: {
    fontFamily: familia.corpo,
    fontSize: fonte.legenda,
  },
  resumoDia: {
    fontFamily: familia.corpoMedio,
    fontSize: fonte.rotulo,
  },
});
