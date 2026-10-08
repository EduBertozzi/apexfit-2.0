import { useEffect, useRef, useState } from 'react';
import { Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';

import { espaco, familia, fonte, raio, semana } from '@/shared/theme/tokens';
import { useCores } from '@/shared/theme/useCores';

import { rotuloDoDia, type DiaDaSemana, type EstadoDia } from '../semana';

type Props = {
  /** Dias da faixa (semana passada, atual e próxima), de domingo a sábado. */
  dias: readonly DiaDaSemana[];
  /** Frase com a semana toda, lida junto da legenda. */
  resumo: string;
  /** Dia escolhido (AAAA-MM-DD): a seção de treino abaixo mostra esse dia. */
  selecionado: string;
  onSelecionar: (chave: string) => void;
};

/** Pílulas largas como no desenho; a faixa rola para o lado em vez de espremer. */
const LARGURA_PILULA = 62;
const ESPACO_PILULAS = 10;
/** Um respiro extra antes de cada domingo separa as semanas. */
const ESPACO_SEMANA = 10;
const TAMANHO_CIRCULO = 44;

type CoresDia = { fundo: string; rotulo: string; circulo: string; numero: string };

function Legenda({ resumo, comDescanso }: { resumo: string; comDescanso: boolean }) {
  const c = useCores();
  const itens = [
    { cor: semana.completo, texto: 'completo' },
    { cor: semana.parcial, texto: 'metade' },
    { cor: semana.fraco, texto: 'pouco ou nada' },
    // Só aparece quando a semana tem dia de descanso no plano
    ...(comDescanso ? [{ cor: c.superficieSecundaria, texto: 'descanso' }] : []),
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
 * Os dias em pílulas que rolam para o lado (semana passada, atual e próxima):
 * a cor diz o status (verde, amarelo, vermelho; hoje em branco; futuro em cinza)
 * e a legenda explica. Abre com o dia escolhido no meio; tocar num dia troca a
 * seção de treino logo abaixo para esse dia.
 */
export function FaixaSemana({ dias, resumo, selecionado, onSelecionar }: Props) {
  const c = useCores();
  const rolagem = useRef<ScrollView>(null);
  const [largura, setLargura] = useState(0);
  const posicoes = useRef<Record<string, number>>({});
  const [medidas, setMedidas] = useState(0);
  const jaCentralizou = useRef(false);

  // Centraliza o dia escolhido: na abertura sem animação, depois (ex: "voltar
  // para hoje") com animação. Espera a largura e a posição da pílula existirem.
  useEffect(() => {
    const x = posicoes.current[selecionado];

    if (x === undefined || largura === 0) {
      return;
    }

    rolagem.current?.scrollTo({
      x: Math.max(x - (largura - LARGURA_PILULA) / 2, 0),
      animated: jaCentralizou.current,
    });
    jaCentralizou.current = true;
  }, [selecionado, largura, medidas]);

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
    // Descanso do plano: neutro, mas com número legível (o dia já passou)
    descanso: {
      fundo: c.superficieSecundaria,
      rotulo: c.textoSecundario,
      circulo: c.superficie,
      numero: c.texto,
    },
  };

  return (
    <View style={estilos.container}>
      <ScrollView
        ref={rolagem}
        horizontal
        showsHorizontalScrollIndicator={false}
        onLayout={(evento) => setLargura(evento.nativeEvent.layout.width)}
        contentContainerStyle={estilos.faixa}
        accessibilityLabel="dias, role para o lado"
      >
        {dias.map((dia, indice) => {
          const cor = cores[dia.estado];
          const marcado = dia.chave === selecionado;

          return (
            <Pressable
              key={dia.chave}
              testID={`dia-${dia.chave}`}
              accessibilityRole="button"
              accessibilityLabel={rotuloDoDia(dia)}
              accessibilityState={{ selected: marcado }}
              onPress={() => onSelecionar(dia.chave)}
              onLayout={(evento) => {
                posicoes.current[dia.chave] = evento.nativeEvent.layout.x;

                if (dia.chave === selecionado) {
                  setMedidas((total) => total + 1);
                }
              }}
              // Metade do espaço entre pílulas de cada lado: a área de toque não tem buraco
              hitSlop={{ left: ESPACO_PILULAS / 2, right: ESPACO_PILULAS / 2 }}
              style={({ pressed }) => [
                estilos.pilula,
                indice > 0 && dia.sigla === 'dom' && { marginLeft: ESPACO_SEMANA },
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
      </ScrollView>

      <Legenda resumo={resumo} comDescanso={dias.some((dia) => dia.estado === 'descanso')} />
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
    width: LARGURA_PILULA,
    minHeight: 92,
    borderRadius: raio.md,
    borderCurve: 'continuous',
    borderWidth: 2,
    borderColor: 'transparent',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: espaco.sm,
    gap: espaco.sm,
  },
  sigla: {
    fontFamily: familia.display,
    fontSize: 16,
  },
  circulo: {
    width: TAMANHO_CIRCULO,
    height: TAMANHO_CIRCULO,
    borderRadius: raio.total,
    alignItems: 'center',
    justifyContent: 'center',
  },
  numero: {
    fontFamily: familia.display,
    fontSize: 18,
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
