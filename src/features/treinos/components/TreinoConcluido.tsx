import Ionicons from '@expo/vector-icons/Ionicons';
import { useEffect } from 'react';
import { StyleSheet, View } from 'react-native';
import Animated, {
  Easing,
  useAnimatedStyle,
  useReducedMotion,
  useSharedValue,
  withTiming,
  type SharedValue,
} from 'react-native-reanimated';

import { pontosEmCirculo, type Ponto } from '@/shared/lib/geometria';
import { borda, espaco, movimento, raio, type CorCategoria } from '@/shared/theme/tokens';
import { useCategorias, useCores } from '@/shared/theme/useCores';
import { Botao, Cartao, Marcado, Texto } from '@/shared/ui';
import { useEntrada } from '@/shared/ui/animacao';

import { progressoDaSessao } from '../logica';
import type { Sessao, Treino } from '../types';
import { minusculaInicial } from '@/shared/lib/texto';

const TAMANHO_SELO = 72;
const TAMANHO_PONTO = 10;
/** Até onde os pontinhos voam a partir do centro do selo. */
const DISTANCIA_PONTOS = 60;
/** Quanto o anel cresce antes de sumir. */
const ESCALA_ANEL = 1.9;
const AREA = DISTANCIA_PONTOS * 2 + TAMANHO_PONTO;

const CORES_PONTOS: CorCategoria[] = [
  'aquecimento',
  'braco',
  'perna',
  'abdominal',
  'costas',
  'peito',
  'ombro',
  'cardio',
];
const PONTOS = pontosEmCirculo(CORES_PONTOS.length, DISTANCIA_PONTOS);

function PontoConfete({
  ponto,
  cor,
  progresso,
}: {
  ponto: Ponto;
  cor: string;
  progresso: SharedValue<number>;
}) {
  const estilo = useAnimatedStyle(() => {
    const p = progresso.get();

    return {
      // Some na última terça parte do caminho
      opacity: p === 0 ? 0 : Math.min(1, (1 - p) * 3),
      transform: [{ translateX: ponto.x * p }, { translateY: ponto.y * p }, { scale: 1 - p * 0.4 }],
    };
  });

  return <Animated.View style={[estilos.ponto, { backgroundColor: cor }, estilo]} />;
}

/**
 * Selo menta com check. Com `animar`, ele entra com mola, um anel se espalha
 * e pontinhos coloridos voam para fora, uma vez só (dura `movimento.comemoracao`).
 * Com "reduzir movimento" ligado, só o selo parado.
 */
function Comemoracao({ animar }: { animar: boolean }) {
  const c = useCores();
  const categorias = useCategorias();
  const reduzir = useReducedMotion();
  const ativo = animar && !reduzir;
  const entrada = useEntrada(ativo);
  const progresso = useSharedValue(0);

  useEffect(() => {
    if (ativo) {
      progresso.set(
        withTiming(1, { duration: movimento.comemoracao, easing: Easing.out(Easing.cubic) }),
      );
    }
  }, [ativo, progresso]);

  const anel = useAnimatedStyle(() => {
    const p = progresso.get();

    return {
      opacity: p === 0 ? 0 : 1 - p,
      transform: [{ scale: 1 + (ESCALA_ANEL - 1) * p }],
    };
  });

  return (
    <View
      style={estilos.area}
      // Enfeite: o leitor de tela já ouve o título e o anúncio de treino finalizado
      accessibilityElementsHidden
      importantForAccessibility="no-hide-descendants"
    >
      {ativo ? (
        <>
          <Animated.View style={[estilos.anel, { borderColor: c.destaque }, anel]} />
          {PONTOS.map((ponto, indice) => (
            <PontoConfete
              key={indice}
              ponto={ponto}
              cor={categorias.fundo[CORES_PONTOS[indice]]}
              progresso={progresso}
            />
          ))}
        </>
      ) : null}
      <Animated.View style={[estilos.selo, { backgroundColor: c.destaque }, entrada]}>
        <Ionicons name="checkmark" size={40} color={c.textoSobreDestaque} />
      </Animated.View>
    </View>
  );
}

type Props = {
  treino: Treino;
  sessao: Sessao;
  proximo: Treino | null;
  naSemana: number;
  onVoltar: () => void;
  /** Acabou de finalizar agora (não só abriu um treino já feito): toca a comemoração. */
  comemorar?: boolean;
};

/** Tela de vitória depois de finalizar o treino. */
export function TreinoConcluido({
  treino,
  sessao,
  proximo,
  naSemana,
  onVoltar,
  comemorar = false,
}: Props) {
  const c = useCores();
  const { feitos, total } = progressoDaSessao(sessao, treino);

  return (
    <View style={estilos.container} accessibilityLiveRegion="polite">
      <Comemoracao animar={comemorar} />

      <Texto variante="gigante" accessibilityRole="header">
        treino{'\n'}
        <Marcado>feito.</Marcado>
      </Texto>

      <Cartao variante="heroi">
        <Texto variante="rotulo" style={{ color: c.textoHeroiSecundario }}>
          {minusculaInicial(treino.nome)}
          {treino.foco ? `, ${minusculaInicial(treino.foco)}` : ''}
        </Texto>
        <Texto variante="subtitulo" style={{ color: c.textoHeroi }}>
          {feitos} de {total} exercícios
        </Texto>

        <View style={estilos.semana}>
          <Texto variante="destaque" style={{ color: c.destaque }}>
            {naSemana}
          </Texto>
          <Texto variante="rotulo" style={[estilos.textoSemana, { color: c.textoHeroi }]}>
            {naSemana === 1 ? 'treino nesta semana' : 'treinos nesta semana'}
          </Texto>
        </View>
      </Cartao>

      {proximo ? (
        <Texto secundario>
          Próximo: {minusculaInicial(proximo.nome)}
          {proximo.foco ? `, ${proximo.foco}` : ''}. Descansa e volta com tudo.
        </Texto>
      ) : null}

      <Botao titulo="voltar" onPress={onVoltar} />
    </View>
  );
}

const estilos = StyleSheet.create({
  container: {
    gap: espaco.md,
  },
  area: {
    width: AREA,
    height: AREA,
    alignSelf: 'center',
    alignItems: 'center',
    justifyContent: 'center',
    // O selo é o que importa; o resto do espaço é só para os pontinhos voarem
    marginVertical: -(AREA - TAMANHO_SELO) / 4,
  },
  selo: {
    width: TAMANHO_SELO,
    height: TAMANHO_SELO,
    borderRadius: raio.total,
    alignItems: 'center',
    justifyContent: 'center',
  },
  anel: {
    position: 'absolute',
    width: TAMANHO_SELO,
    height: TAMANHO_SELO,
    borderRadius: raio.total,
    borderWidth: borda.grossa,
  },
  ponto: {
    position: 'absolute',
    width: TAMANHO_PONTO,
    height: TAMANHO_PONTO,
    borderRadius: raio.total,
  },
  semana: {
    flexDirection: 'row',
    alignItems: 'baseline',
    gap: espaco.sm,
    marginTop: espaco.xs,
  },
  textoSemana: {
    flexShrink: 1,
  },
});
