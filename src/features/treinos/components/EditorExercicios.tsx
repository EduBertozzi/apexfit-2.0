import Ionicons from '@expo/vector-icons/Ionicons';
import * as Haptics from 'expo-haptics';
import { router } from 'expo-router';
import { Platform, Pressable, StyleSheet, View } from 'react-native';
import { Gesture, GestureDetector, GestureHandlerRootView } from 'react-native-gesture-handler';
import Animated, {
  useAnimatedStyle,
  useSharedValue,
  withTiming,
  type SharedValue,
} from 'react-native-reanimated';
import { scheduleOnRN } from 'react-native-worklets';

import { espaco, familia, raio } from '@/shared/theme/tokens';
import { useCategorias, useCores } from '@/shared/theme/useCores';
import { Botao, Texto } from '@/shared/ui';

import { agruparPorGrupo, NOME_GRUPO, type BlocoDoTreino } from '../grupos';
import { resumoExercicio, resumoExercicioAcessivel } from '../logica';
import { posicaoNoGrupo, textoDias, textoDiasAcessivel } from '../montagem';
import { useTreinosStore } from '../store';
import type { Exercicio, Treino } from '../types';
import { IconeGrupo } from './IconeGrupo';

/** Altura fixa de cada linha: o arrastar calcula a nova posição por ela. */
const ALTURA_LINHA = 68;

function abrirFolha(treinoId: string, extra: { exercicio?: string; aba?: string } = {}) {
  router.push({ pathname: '/treino/adicionar', params: { id: treinoId, ...extra } });
}

function vibrar() {
  if (Platform.OS !== 'web') {
    Haptics.selectionAsync();
  }
}

/**
 * Exercícios do treino separados por grupo muscular. Tocar abre a edição;
 * segurar e arrastar muda a ordem dentro do grupo (no leitor de tela, as
 * ações "subir" e "descer" fazem o mesmo).
 */
export function EditorExercicios({ treino }: { treino: Treino }) {
  const blocos = agruparPorGrupo(treino.exercicios);

  return (
    <GestureHandlerRootView style={estilos.container}>
      <PlanoSemanal treino={treino} />

      <Texto variante="subtitulo" accessibilityRole="header">
        exercícios
      </Texto>

      {blocos.length === 0 ? (
        <Texto secundario>Nenhum exercício ainda. Adicione o primeiro e bora.</Texto>
      ) : (
        <Texto variante="legenda" secundario>
          Toque para editar. Segure e arraste para mudar a ordem.
        </Texto>
      )}

      {blocos.map((bloco) => (
        <BlocoGrupo key={bloco.grupo} treinoId={treino.id} bloco={bloco} />
      ))}

      <Botao
        titulo="adicionar exercício"
        variante="secundario"
        onPress={() => abrirFolha(treino.id)}
      />
    </GestureHandlerRootView>
  );
}

/** Linha "plano semanal: seg, qua e sex" que abre a folha na aba do plano. */
function PlanoSemanal({ treino }: { treino: Treino }) {
  const c = useCores();

  return (
    <Pressable
      onPress={() => abrirFolha(treino.id, { aba: 'plano' })}
      accessibilityRole="button"
      accessibilityLabel={`plano semanal: ${textoDiasAcessivel(treino.dias)}`}
      accessibilityHint="Escolhe os dias da semana deste treino"
      style={({ pressed }) => [
        estilos.plano,
        { backgroundColor: c.superficie },
        pressed && { opacity: 0.75 },
      ]}
    >
      <Ionicons name="calendar-outline" size={22} color={c.texto} />
      <View style={estilos.textoPlano}>
        <Texto variante="rotulo" secundario>
          plano semanal
        </Texto>
        <Texto variante="corpo" style={estilos.nome}>
          {textoDias(treino.dias)}
        </Texto>
      </View>
      <Ionicons name="chevron-forward" size={20} color={c.textoSecundario} />
    </Pressable>
  );
}

function BlocoGrupo({ treinoId, bloco }: { treinoId: string; bloco: BlocoDoTreino }) {
  const c = useCores();
  const cat = useCategorias();
  const reordenar = useTreinosStore((state) => state.reordenarNoGrupo);
  const mover = useTreinosStore((state) => state.moverNoGrupo);
  const arrastando = useSharedValue(-1);
  const deslocamento = useSharedValue(0);
  const nomeGrupo = NOME_GRUPO[bloco.grupo];
  const total = bloco.exercicios.length;

  return (
    <View style={[estilos.bloco, { backgroundColor: c.superficie }]}>
      <View style={estilos.cabecalho}>
        <View style={[estilos.icone, { backgroundColor: cat.fundo[bloco.grupo] }]}>
          <IconeGrupo grupo={bloco.grupo} cor={c.textoSobreDestaque} tamanho={20} />
        </View>
        <Texto
          variante="subtitulo"
          accessibilityRole="header"
          style={[estilos.nomeGrupo, { color: cat.texto[bloco.grupo] }]}
        >
          {nomeGrupo}
        </Texto>
        <Texto variante="legenda" secundario>
          {total === 1 ? '1 exercício' : `${total} exercícios`}
        </Texto>
      </View>

      <View style={{ height: total * ALTURA_LINHA }}>
        {bloco.exercicios.map((exercicio, indice) => (
          <LinhaExercicio
            key={exercicio.id}
            exercicio={exercicio}
            indice={indice}
            total={total}
            nomeGrupo={nomeGrupo}
            arrastando={arrastando}
            deslocamento={deslocamento}
            onAbrir={() => abrirFolha(treinoId, { exercicio: exercicio.id })}
            onSoltar={(destino) => reordenar(treinoId, exercicio.id, destino)}
            onMover={(direcao) => mover(treinoId, exercicio.id, direcao)}
          />
        ))}
      </View>
    </View>
  );
}

type PropsLinha = {
  exercicio: Exercicio;
  indice: number;
  total: number;
  nomeGrupo: string;
  /** Índice da linha sendo arrastada no grupo (-1 = nenhuma). */
  arrastando: SharedValue<number>;
  deslocamento: SharedValue<number>;
  onAbrir: () => void;
  onSoltar: (destino: number) => void;
  onMover: (direcao: 'cima' | 'baixo') => void;
};

function LinhaExercicio({
  exercicio,
  indice,
  total,
  nomeGrupo,
  arrastando,
  deslocamento,
  onAbrir,
  onSoltar,
  onMover,
}: PropsLinha) {
  const c = useCores();
  const pressionado = useSharedValue(0);

  const arrastar = Gesture.Pan()
    .activateAfterLongPress(300)
    .onStart(() => {
      arrastando.set(indice);
      deslocamento.set(0);
      scheduleOnRN(vibrar);
    })
    .onUpdate((evento) => {
      const minimo = -indice * ALTURA_LINHA;
      const maximo = (total - 1 - indice) * ALTURA_LINHA;

      deslocamento.set(Math.min(maximo, Math.max(minimo, evento.translationY)));
    })
    .onEnd(() => {
      const destino = Math.round(indice + deslocamento.get() / ALTURA_LINHA);

      if (destino !== indice) {
        scheduleOnRN(onSoltar, destino);
      }
    })
    .onFinalize(() => {
      arrastando.set(-1);
      deslocamento.set(0);
    });

  const tocar = Gesture.Tap()
    .maxDuration(280)
    .onBegin(() => {
      pressionado.set(1);
    })
    .onEnd((_evento, sucesso) => {
      if (sucesso) {
        scheduleOnRN(onAbrir);
      }
    })
    .onFinalize(() => {
      pressionado.set(0);
    });

  const gesto = Gesture.Race(arrastar, tocar);

  const estilo = useAnimatedStyle(() => {
    const ativo = arrastando.get();

    if (ativo === indice) {
      return {
        zIndex: 2,
        opacity: 1,
        transform: [{ translateY: deslocamento.get() }, { scale: 1.02 }],
      };
    }

    let y = 0;

    if (ativo !== -1) {
      const alvo = Math.round(ativo + deslocamento.get() / ALTURA_LINHA);

      if (ativo < indice && indice <= alvo) {
        y = -ALTURA_LINHA;
      } else if (alvo <= indice && indice < ativo) {
        y = ALTURA_LINHA;
      }
    }

    return {
      zIndex: 0,
      opacity: pressionado.get() ? 0.7 : 1,
      transform: [
        { translateY: ativo === -1 ? 0 : withTiming(y, { duration: 150 }) },
        { scale: 1 },
      ],
    };
  });

  const acoes = [
    { name: 'activate', label: 'editar' },
    ...(indice > 0 ? [{ name: 'subir', label: 'subir' }] : []),
    ...(indice < total - 1 ? [{ name: 'descer', label: 'descer' }] : []),
  ];

  return (
    <GestureDetector gesture={gesto}>
      <Animated.View
        accessible
        accessibilityRole="button"
        accessibilityLabel={`${exercicio.nome}, ${resumoExercicioAcessivel(exercicio)}, ${posicaoNoGrupo(indice, total, nomeGrupo)}`}
        accessibilityHint="Toque para editar. Use as ações subir e descer para mudar a ordem."
        accessibilityActions={acoes}
        onAccessibilityAction={(evento) => {
          const acao = evento.nativeEvent.actionName;

          if (acao === 'activate') {
            onAbrir();
          } else if (acao === 'subir') {
            onMover('cima');
          } else if (acao === 'descer') {
            onMover('baixo');
          }
        }}
        testID={`linha-${exercicio.nome}`}
        style={[
          estilos.linha,
          { top: indice * ALTURA_LINHA, backgroundColor: c.superficie },
          indice > 0 && { borderTopWidth: StyleSheet.hairlineWidth, borderTopColor: c.borda },
          estilo,
        ]}
      >
        <View style={estilos.textoLinha}>
          <Texto
            variante="corpo"
            numberOfLines={1}
            maxFontSizeMultiplier={1.3}
            style={estilos.nome}
          >
            {exercicio.nome}
          </Texto>
          <Texto variante="legenda" secundario numberOfLines={1} maxFontSizeMultiplier={1.3}>
            {resumoExercicio(exercicio)}
          </Texto>
        </View>
        <Ionicons
          name="reorder-three"
          size={24}
          color={c.textoSecundario}
          accessibilityElementsHidden
          importantForAccessibility="no"
        />
      </Animated.View>
    </GestureDetector>
  );
}

const estilos = StyleSheet.create({
  container: {
    gap: espaco.md,
  },
  plano: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: espaco.md,
    minHeight: 64,
    paddingHorizontal: espaco.lg - 4,
    paddingVertical: espaco.sm,
    borderRadius: raio.lg,
    borderCurve: 'continuous',
  },
  textoPlano: {
    flex: 1,
  },
  bloco: {
    borderRadius: raio.lg,
    borderCurve: 'continuous',
    paddingHorizontal: espaco.lg - 4,
    paddingTop: espaco.md,
    paddingBottom: espaco.xs,
  },
  cabecalho: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: espaco.sm,
    marginBottom: espaco.xs,
  },
  icone: {
    width: 36,
    height: 36,
    borderRadius: raio.total,
    alignItems: 'center',
    justifyContent: 'center',
  },
  nomeGrupo: {
    flex: 1,
    fontFamily: familia.displayLeve,
  },
  linha: {
    position: 'absolute',
    left: 0,
    right: 0,
    height: ALTURA_LINHA,
    flexDirection: 'row',
    alignItems: 'center',
    gap: espaco.md,
  },
  textoLinha: {
    flex: 1,
  },
  nome: {
    fontFamily: familia.corpoMedio,
  },
});
