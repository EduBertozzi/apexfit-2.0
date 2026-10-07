import { useEffect, useRef, useState } from 'react';
import { Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import Svg, { Circle } from 'react-native-svg';

import { espaco, familia, fonte, raio, semana } from '@/shared/theme/tokens';
import { useCores } from '@/shared/theme/useCores';

import { resumoDoDia, rotuloDoDia, type DiaDaSemana, type EstadoDia } from '../semana';

type Props = {
  dias: readonly DiaDaSemana[];
  /** Frase com a semana toda, lida junto da legenda. */
  resumo: string;
};

const LARGURA_PILULA = 60;
const TAMANHO_ANEL = 50;
const ESPESSURA_ANEL = 3;
const RAIO_ANEL = (TAMANHO_ANEL - ESPESSURA_ANEL) / 2;
const VOLTA = 2 * Math.PI * RAIO_ANEL;
const TAMANHO_CIRCULO = TAMANHO_ANEL - ESPESSURA_ANEL * 2 - 4;

type CoresDia = { fundo: string; rotulo: string; circulo: string; numero: string };

/** Anel em volta do número: quanto do treino foi feito naquele dia. Não depende só da cor. */
function Anel({ fracao, cor }: { fracao: number; cor: string }) {
  const preenchido = Math.min(Math.max(fracao, 0), 1);
  const centro = TAMANHO_ANEL / 2;

  return (
    <Svg width={TAMANHO_ANEL} height={TAMANHO_ANEL} style={StyleSheet.absoluteFill}>
      <Circle
        cx={centro}
        cy={centro}
        r={RAIO_ANEL}
        stroke={cor}
        strokeOpacity={0.18}
        strokeWidth={ESPESSURA_ANEL}
        fill="none"
      />
      {preenchido > 0 ? (
        <Circle
          cx={centro}
          cy={centro}
          r={RAIO_ANEL}
          stroke={cor}
          strokeWidth={ESPESSURA_ANEL}
          strokeLinecap="round"
          strokeDasharray={`${VOLTA} ${VOLTA}`}
          strokeDashoffset={VOLTA * (1 - preenchido)}
          // Começa no topo, como um relógio
          transform={`rotate(-90 ${centro} ${centro})`}
          fill="none"
        />
      ) : null}
    </Svg>
  );
}

function Legenda({ resumo }: { resumo: string }) {
  const c = useCores();
  const itens = [
    { cor: semana.completo, texto: 'completo' },
    { cor: semana.parcial, texto: 'metade' },
    { cor: semana.fraco, texto: 'pouco' },
  ];

  return (
    <View accessible accessibilityLabel={resumo} style={estilos.legenda}>
      {itens.map((item) => (
        <View key={item.texto} style={estilos.itemLegenda}>
          <View style={[estilos.ponto, { backgroundColor: item.cor }]} />
          <Text style={[estilos.textoLegenda, { color: c.textoSecundario }]}>{item.texto}</Text>
        </View>
      ))}
    </View>
  );
}

/**
 * Os 7 dias da semana em pílulas: a cor diz o status (verde, amarelo, vermelho;
 * hoje em branco; futuro em cinza) e o anel mostra quanto foi feito. Tocar num dia
 * mostra o resumo dele embaixo. Rola na horizontal e já abre mostrando hoje.
 */
export function FaixaSemana({ dias, resumo }: Props) {
  const c = useCores();
  const rolagem = useRef<ScrollView>(null);
  const [larguraVisivel, setLarguraVisivel] = useState(0);
  const [xDeHoje, setXDeHoje] = useState<number | null>(null);

  // Só dá para centralizar hoje quando as duas medidas existem (vêm em ordens diferentes)
  useEffect(() => {
    if (xDeHoje !== null && larguraVisivel > 0) {
      const x = xDeHoje - (larguraVisivel - LARGURA_PILULA) / 2;
      rolagem.current?.scrollTo({ x: Math.max(x, 0), animated: false });
    }
  }, [xDeHoje, larguraVisivel]);
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
      <ScrollView
        ref={rolagem}
        horizontal
        onLayout={(evento) => setLarguraVisivel(evento.nativeEvent.layout.width)}
        showsHorizontalScrollIndicator={false}
        contentContainerStyle={estilos.faixa}
      >
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
              onLayout={
                dia.estado === 'hoje'
                  ? (evento) => setXDeHoje(evento.nativeEvent.layout.x)
                  : undefined
              }
              style={({ pressed }) => [
                estilos.pilula,
                { backgroundColor: cor.fundo },
                // Dia tocado ganha um contorno, sem mudar o tamanho da pílula
                marcado && dia.estado !== 'hoje' && { borderColor: c.texto },
                pressed && { opacity: 0.8 },
              ]}
            >
              <Text maxFontSizeMultiplier={1.3} style={[estilos.sigla, { color: cor.rotulo }]}>
                {dia.sigla}
              </Text>
              <View style={estilos.anel}>
                {dia.estado !== 'futuro' ? (
                  <Anel fracao={dia.fracao ?? 0} cor={cor.rotulo} />
                ) : null}
                <View style={[estilos.circulo, { backgroundColor: cor.circulo }]}>
                  <Text maxFontSizeMultiplier={1.3} style={[estilos.numero, { color: cor.numero }]}>
                    {dia.dia}
                  </Text>
                </View>
              </View>
            </Pressable>
          );
        })}
      </ScrollView>

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
    gap: espaco.grade,
  },
  pilula: {
    width: LARGURA_PILULA,
    borderRadius: raio.md,
    borderCurve: 'continuous',
    borderWidth: 2,
    borderColor: 'transparent',
    alignItems: 'center',
    paddingTop: espaco.sm,
    paddingBottom: espaco.xs + 1,
    gap: espaco.xs,
  },
  sigla: {
    fontFamily: familia.display,
    fontSize: 16,
  },
  anel: {
    width: TAMANHO_ANEL,
    height: TAMANHO_ANEL,
    alignItems: 'center',
    justifyContent: 'center',
  },
  circulo: {
    width: TAMANHO_CIRCULO,
    height: TAMANHO_CIRCULO,
    borderRadius: TAMANHO_CIRCULO / 2,
    alignItems: 'center',
    justifyContent: 'center',
  },
  numero: {
    fontFamily: familia.display,
    fontSize: 17,
  },
  legenda: {
    flexDirection: 'row',
    gap: espaco.md,
  },
  itemLegenda: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: espaco.xs + 2,
  },
  ponto: {
    width: 10,
    height: 10,
    borderRadius: 5,
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
