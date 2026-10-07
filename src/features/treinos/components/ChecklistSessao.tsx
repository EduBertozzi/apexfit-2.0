import Ionicons from '@expo/vector-icons/Ionicons';
import * as Haptics from 'expo-haptics';
import { AccessibilityInfo, Platform, Pressable, StyleSheet, View } from 'react-native';

import { useAjustesStore } from '@/features/ajustes/store';
import { chaveDoDia } from '@/shared/lib/data';
import { borda, espaco, familia, fonte, raio } from '@/shared/theme/tokens';
import { useCategorias, useCores } from '@/shared/theme/useCores';
import { BarraProgresso, Botao, Cartao, Texto } from '@/shared/ui';

import { agruparPorGrupo, NOME_GRUPO, textoEsquema } from '../grupos';
import {
  podeFinalizar,
  progressoDaSessao,
  resumoExercicio,
  resumoExercicioAcessivel,
  textoTreinosNaSemana,
  treinosNaSemana,
} from '../logica';
import { useTreinosStore } from '../store';
import type { Exercicio, Sessao, Treino } from '../types';
import { IconeGrupo } from './IconeGrupo';

function vibrar(tipo: 'leve' | 'sucesso') {
  // Vibração não existe no navegador
  if (Platform.OS === 'web') {
    return;
  }

  if (tipo === 'sucesso') {
    Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
  } else {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
  }
}

type ItemProps = {
  exercicio: Exercicio;
  feito: boolean;
  /** Cor do grupo: a caixinha marcada fica nela. */
  corGrupo: string;
  onAlternar: () => void;
};

function ItemChecklist({ exercicio, feito, corGrupo, onAlternar }: ItemProps) {
  const c = useCores();

  return (
    <Pressable
      onPress={onAlternar}
      accessibilityRole="checkbox"
      accessibilityState={{ checked: feito }}
      accessibilityLabel={`${exercicio.nome}, ${resumoExercicioAcessivel(exercicio)}`}
      accessibilityHint={exercicio.observacao}
      testID={`exercicio-${exercicio.id}`}
      style={({ pressed }) => [
        estilos.item,
        { backgroundColor: feito ? c.superficieSecundaria : c.superficie },
        pressed && { opacity: 0.75 },
      ]}
    >
      <View
        style={[
          estilos.caixa,
          {
            borderColor: feito ? corGrupo : c.textoSecundario,
            backgroundColor: feito ? corGrupo : 'transparent',
          },
        ]}
      >
        {feito ? <Ionicons name="checkmark" size={22} color={c.fundo} /> : null}
      </View>
      <View style={estilos.textos}>
        <Texto
          style={[estilos.nome, feito && { textDecorationLine: 'line-through' }]}
          secundario={feito}
        >
          {exercicio.nome}
        </Texto>
        <Texto variante="rotulo" secundario>
          {resumoExercicio(exercicio)}
        </Texto>
        {exercicio.observacao ? (
          <Texto variante="legenda" secundario>
            {exercicio.observacao}
          </Texto>
        ) : null}
      </View>
    </Pressable>
  );
}

type Props = {
  treino: Treino;
  sessao: Sessao;
};

/** O treino rolando: marcar exercícios (por grupo, na cor do grupo), ver o progresso e finalizar. */
export function ChecklistSessao({ treino, sessao }: Props) {
  const cat = useCategorias();
  const alternar = useTreinosStore((state) => state.alternarExercicio);
  const finalizar = useTreinosStore((state) => state.finalizarTreino);
  const vibracaoLigada = useAjustesStore((state) => state.vibracao);

  const progresso = progressoDaSessao(sessao, treino);
  const liberado = podeFinalizar(sessao);
  const blocos = agruparPorGrupo(treino.exercicios);

  function alternarExercicio(exercicioId: string) {
    alternar(exercicioId);

    if (vibracaoLigada) {
      vibrar('leve');
    }
  }

  function finalizarTreino() {
    if (!finalizar()) {
      return;
    }

    // Lê da store já atualizada para o número incluir o treino de agora
    const semana = treinosNaSemana(useTreinosStore.getState().sessoes, chaveDoDia(new Date()));

    AccessibilityInfo.announceForAccessibility(
      `Treino finalizado! ${textoTreinosNaSemana(semana)}.`,
    );

    if (vibracaoLigada) {
      vibrar('sucesso');
    }
  }

  return (
    <View style={estilos.container}>
      <View>
        <Texto variante="titulo" style={estilos.titulo} accessibilityRole="header">
          {treino.nome}
        </Texto>
        {treino.foco ? <Texto secundario>{treino.foco}</Texto> : null}
      </View>

      <Cartao>
        <View style={estilos.linhaProgresso}>
          <Texto variante="rotulo">progresso</Texto>
          <Texto variante="rotulo" accessibilityLiveRegion="polite">
            {progresso.feitos} de {progresso.total}
          </Texto>
        </View>
        <BarraProgresso
          valor={progresso.fracao}
          rotuloAcessivel={`${progresso.feitos} de ${progresso.total} exercícios feitos`}
        />
      </Cartao>

      {treino.exercicios.length === 0 ? (
        <Texto secundario>Este treino ainda não tem exercícios. Volte e adicione alguns.</Texto>
      ) : null}

      {blocos.map((bloco) => {
        const cor = cat.texto[bloco.grupo];

        return (
          <View key={bloco.grupo} style={estilos.lista}>
            <View style={estilos.cabecalhoGrupo}>
              <IconeGrupo grupo={bloco.grupo} cor={cor} />
              <Texto
                variante="subtitulo"
                style={[estilos.nomeGrupo, { color: cor }]}
                accessibilityRole="header"
              >
                {NOME_GRUPO[bloco.grupo]}
              </Texto>
              <Texto variante="rotulo" style={{ color: cor }}>
                {textoEsquema(bloco.esquema)}
              </Texto>
            </View>
            {bloco.exercicios.map((exercicio) => (
              <ItemChecklist
                key={exercicio.id}
                exercicio={exercicio}
                feito={sessao.concluidos.includes(exercicio.id)}
                corGrupo={cor}
                onAlternar={() => alternarExercicio(exercicio.id)}
              />
            ))}
          </View>
        );
      })}

      <Botao
        titulo={progresso.completo ? 'finalizar treino' : 'finalizar assim mesmo'}
        variante={progresso.completo ? 'destaque' : 'primario'}
        onPress={finalizarTreino}
        desabilitado={!liberado}
      />
      {!liberado ? (
        <Texto variante="legenda" secundario>
          Marque pelo menos um exercício para finalizar.
        </Texto>
      ) : null}
    </View>
  );
}

const estilos = StyleSheet.create({
  container: {
    gap: espaco.md,
  },
  titulo: {
    fontFamily: familia.display,
  },
  linhaProgresso: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  lista: {
    gap: espaco.sm,
  },
  cabecalhoGrupo: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: espaco.sm,
    marginTop: espaco.sm,
  },
  nomeGrupo: {
    flex: 1,
    fontFamily: familia.displayLeve,
  },
  item: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: espaco.md,
    minHeight: 64,
    padding: espaco.md,
    borderRadius: raio.md,
    borderCurve: 'continuous',
  },
  caixa: {
    width: 32,
    height: 32,
    borderWidth: borda.grossa,
    borderRadius: raio.total,
    alignItems: 'center',
    justifyContent: 'center',
  },
  textos: {
    flex: 1,
    gap: 2,
  },
  nome: {
    fontFamily: familia.corpoForte,
    fontSize: fonte.corpo,
  },
});
