import type { ReactNode } from 'react';
import { StyleSheet, View } from 'react-native';
import Svg, { Circle } from 'react-native-svg';

type Props = {
  /** Diâmetro total, com o anel. */
  tamanho: number;
  /** Grossura do anel. */
  espessura: number;
  /** De 0 a 1 (fora disso é cortado). `null` ou 0 desenha só o trilho. */
  fracao: number | null;
  corArco: string;
  /** Cor do que falta; `transparent` esconde o trilho. */
  corTrilho: string;
  /** Disco do tamanho todo, atrás do anel (ex: o círculo do número). */
  fundo?: string;
  /** Distância do anel até a borda do disco (o anel fica por dentro). */
  margem?: number;
  /** Fica no centro (o número do dia). */
  children?: ReactNode;
};

/**
 * Anel de progresso circular (SVG): começa no topo e anda no sentido do relógio.
 * Só desenha; a cor e a fração vêm de quem usa. O rótulo para o leitor de tela
 * fica no componente de fora (o anel é decorativo).
 */
export function AnelProgresso({
  tamanho,
  espessura,
  fracao,
  corArco,
  corTrilho,
  fundo,
  margem = 0,
  children,
}: Props) {
  const centro = tamanho / 2;
  const raio = Math.max((tamanho - espessura) / 2 - margem, 0);
  const circunferencia = 2 * Math.PI * raio;
  const parte = Math.min(Math.max(fracao ?? 0, 0), 1);
  const cheio = parte >= 1;

  return (
    <View style={{ width: tamanho, height: tamanho }}>
      <Svg width={tamanho} height={tamanho} style={StyleSheet.absoluteFill}>
        {fundo ? <Circle cx={centro} cy={centro} r={centro} fill={fundo} /> : null}
        <Circle
          cx={centro}
          cy={centro}
          r={raio}
          stroke={corTrilho}
          strokeWidth={espessura}
          fill="none"
        />
        {parte > 0 ? (
          <Circle
            cx={centro}
            cy={centro}
            r={raio}
            stroke={corArco}
            strokeWidth={espessura}
            fill="none"
            // Ponta redonda só no arco aberto; cheio fecha sem emenda
            strokeLinecap={cheio ? 'butt' : 'round'}
            strokeDasharray={cheio ? undefined : `${circunferencia * parte} ${circunferencia}`}
            // Começa no topo; o atributo SVG evita o transform-origin que o navegador rejeita
            transform={`rotate(-90 ${centro} ${centro})`}
          />
        ) : null}
      </Svg>
      <View style={estilos.centro}>{children}</View>
    </View>
  );
}

const estilos = StyleSheet.create({
  centro: {
    position: 'absolute',
    top: 0,
    right: 0,
    bottom: 0,
    left: 0,
    alignItems: 'center',
    justifyContent: 'center',
  },
});
