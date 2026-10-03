import { useState } from 'react';
import { Pressable, StyleSheet, View } from 'react-native';
import Svg, { Circle, Line, Polyline } from 'react-native-svg';

import { chaveDoDia } from '@/shared/lib/data';
import { borda, espaco, raio } from '@/shared/theme/tokens';
import { useCores } from '@/shared/theme/useCores';
import { Texto } from '@/shared/ui';

import {
  descreverGrafico,
  PERIODOS,
  pontosGrafico,
  rotuloData,
  type Periodo,
  type PontoGrafico,
  type RegistroPeso,
} from '../logica';

type Props = {
  registros: readonly RegistroPeso[];
  /** Versão pequena para o cartão: sem seletor de período e sem legendas. */
  mini?: boolean;
  periodoInicial?: Periodo;
};

const ALTURA = { normal: 160, mini: 64 } as const;
/** Respiro nas bordas para os pontos não serem cortados. */
const MARGEM = 6;

function paraTela(ponto: PontoGrafico, largura: number, altura: number) {
  return {
    x: MARGEM + ponto.x * (largura - MARGEM * 2),
    y: MARGEM + (1 - ponto.y) * (altura - MARGEM * 2),
  };
}

function caminho(pontos: readonly PontoGrafico[], largura: number, altura: number): string {
  return pontos
    .map((ponto) => {
      const { x, y } = paraTela(ponto, largura, altura);
      return `${x},${y}`;
    })
    .join(' ');
}

/**
 * Gráfico de linha do peso, feito para fundo escuro (cartão herói):
 * pontos dos registros em cinza e a tendência de 7 dias em menta.
 * Para o leitor de tela vira um resumo em texto.
 */
export function GraficoPeso({ registros, mini = false, periodoInicial = 30 }: Props) {
  const c = useCores();
  const [periodo, setPeriodo] = useState<Periodo>(periodoInicial);
  const [largura, setLargura] = useState(0);

  const hoje = chaveDoDia(new Date());
  const dados = pontosGrafico(registros, hoje, periodo);
  const altura = mini ? ALTURA.mini : ALTURA.normal;
  const ultimo = dados.pontos[dados.pontos.length - 1];
  const posicaoUltimo = ultimo ? paraTela(ultimo, largura, altura) : null;

  return (
    <View style={estilos.container}>
      {mini ? null : (
        <View accessibilityRole="radiogroup" accessibilityLabel="Período" style={estilos.periodos}>
          {PERIODOS.map((dias) => {
            const marcado = dias === periodo;

            return (
              <Pressable
                key={dias}
                onPress={() => setPeriodo(dias)}
                accessibilityRole="radio"
                accessibilityLabel={`Últimos ${dias} dias`}
                accessibilityState={{ checked: marcado }}
                style={({ pressed }) => [
                  estilos.periodo,
                  {
                    backgroundColor: marcado ? c.destaque : 'transparent',
                    borderColor: marcado ? c.destaque : c.bordaHeroi,
                  },
                  pressed && { opacity: 0.75 },
                ]}
              >
                <Texto
                  variante="rotulo"
                  style={{ color: marcado ? c.textoSobreDestaque : c.textoHeroi }}
                >
                  {dias} dias
                </Texto>
              </Pressable>
            );
          })}
        </View>
      )}

      <View
        accessible
        accessibilityRole="image"
        accessibilityLabel={descreverGrafico(registros, hoje, periodo)}
        onLayout={(evento) => setLargura(evento.nativeEvent.layout.width)}
        style={{ height: altura }}
      >
        {dados.pontos.length === 0 ? (
          <View style={[estilos.vazio, { borderColor: c.trilhoHeroi }]}>
            <Texto variante="legenda" style={{ color: c.textoHeroiSecundario }}>
              Sem registros neste período.
            </Texto>
          </View>
        ) : largura > 0 ? (
          <Svg width={largura} height={altura}>
            {mini
              ? null
              : [0, 0.5, 1].map((nivel) => (
                  <Line
                    key={nivel}
                    x1={0}
                    x2={largura}
                    y1={MARGEM + nivel * (altura - MARGEM * 2)}
                    y2={MARGEM + nivel * (altura - MARGEM * 2)}
                    stroke={c.trilhoHeroi}
                    strokeWidth={borda.fina}
                  />
                ))}

            {dados.pontos.length > 1 ? (
              <Polyline
                points={caminho(dados.pontos, largura, altura)}
                fill="none"
                stroke={c.textoHeroiSecundario}
                strokeWidth={borda.fina}
              />
            ) : null}

            {mini
              ? null
              : dados.pontos.map((ponto) => {
                  const { x, y } = paraTela(ponto, largura, altura);
                  return (
                    <Circle key={ponto.data} cx={x} cy={y} r={3} fill={c.textoHeroiSecundario} />
                  );
                })}

            {dados.tendencia.length > 1 ? (
              <Polyline
                points={caminho(dados.tendencia, largura, altura)}
                fill="none"
                stroke={c.destaque}
                strokeWidth={3}
                strokeLinejoin="round"
                strokeLinecap="round"
              />
            ) : null}

            {posicaoUltimo ? (
              <Circle cx={posicaoUltimo.x} cy={posicaoUltimo.y} r={5} fill={c.destaque} />
            ) : null}
          </Svg>
        ) : null}

        {mini || dados.pontos.length === 0 ? null : (
          <>
            <Texto
              variante="legenda"
              style={[estilos.escala, estilos.escalaTopo, { color: c.textoHeroiSecundario }]}
            >
              {dados.maxKg} kg
            </Texto>
            <Texto
              variante="legenda"
              style={[estilos.escala, estilos.escalaBase, { color: c.textoHeroiSecundario }]}
            >
              {dados.minKg} kg
            </Texto>
          </>
        )}
      </View>

      {mini ? null : (
        <View style={estilos.eixoX} importantForAccessibility="no-hide-descendants">
          <Texto variante="legenda" style={{ color: c.textoHeroiSecundario }}>
            {rotuloData(dados.inicio)}
          </Texto>
          <View style={estilos.legenda}>
            <View style={[estilos.amostra, { backgroundColor: c.destaque }]} />
            <Texto variante="legenda" style={{ color: c.textoHeroiSecundario }}>
              Tendência 7 dias
            </Texto>
          </View>
          <Texto variante="legenda" style={{ color: c.textoHeroiSecundario }}>
            Hoje
          </Texto>
        </View>
      )}
    </View>
  );
}

const estilos = StyleSheet.create({
  container: {
    gap: espaco.sm,
  },
  periodos: {
    flexDirection: 'row',
    gap: espaco.sm,
  },
  periodo: {
    flex: 1,
    minHeight: 44,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: borda.grossa,
    borderRadius: raio.sm,
  },
  vazio: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: borda.fina,
    borderStyle: 'dashed',
    borderRadius: raio.sm,
  },
  escala: {
    position: 'absolute',
    left: 0,
  },
  escalaTopo: {
    top: MARGEM + 2,
  },
  escalaBase: {
    bottom: MARGEM + 2,
  },
  eixoX: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  legenda: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: espaco.xs,
  },
  amostra: {
    width: 14,
    height: 3,
  },
});
