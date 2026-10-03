import Ionicons from '@expo/vector-icons/Ionicons';
import * as Haptics from 'expo-haptics';
import { AccessibilityInfo, Platform, Pressable, StyleSheet, View } from 'react-native';

import { useAjustesStore } from '@/features/ajustes/store';
import { chaveDoDia } from '@/shared/lib/data';
import { borda, espaco, familia, fonte, raio } from '@/shared/theme/tokens';
import { useCores } from '@/shared/theme/useCores';
import { BarraProgresso, Botao, Cartao, Texto } from '@/shared/ui';

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
  onAlternar: () => void;
};

function ItemChecklist({ exercicio, feito, onAlternar }: ItemProps) {
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
        {
          borderColor: c.borda,
          backgroundColor: feito ? c.superficieSecundaria : c.superficie,
        },
        pressed && { opacity: 0.75 },
      ]}
    >
      <View
        style={[
          estilos.caixa,
          { borderColor: c.texto, backgroundColor: feito ? c.destaque : 'transparent' },
        ]}
      >
        {feito ? <Ionicons name="checkmark" size={22} color={c.textoSobreDestaque} /> : null}
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

/** O treino rolando: marcar exercícios, ver o progresso e finalizar. */
export function ChecklistSessao({ treino, sessao }: Props) {
  const alternar = useTreinosStore((state) => state.alternarExercicio);
  const finalizar = useTreinosStore((state) => state.finalizarTreino);
  const vibracaoLigada = useAjustesStore((state) => state.vibracao);

  const progresso = progressoDaSessao(sessao, treino);
  const liberado = podeFinalizar(sessao);

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
        <Texto variante="titulo" accessibilityRole="header">
          {treino.nome}
        </Texto>
        {treino.foco ? <Texto secundario>{treino.foco}</Texto> : null}
      </View>

      <Cartao>
        <View style={estilos.linhaProgresso}>
          <Texto variante="rotulo">Progresso</Texto>
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

      <View style={estilos.lista}>
        {treino.exercicios.map((exercicio) => (
          <ItemChecklist
            key={exercicio.id}
            exercicio={exercicio}
            feito={sessao.concluidos.includes(exercicio.id)}
            onAlternar={() => alternarExercicio(exercicio.id)}
          />
        ))}
      </View>

      <Botao
        titulo={progresso.completo ? 'Finalizar treino' : 'Finalizar assim mesmo'}
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
  linhaProgresso: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  lista: {
    gap: espaco.sm,
  },
  item: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: espaco.md,
    minHeight: 64,
    padding: espaco.md,
    borderWidth: borda.grossa,
    borderRadius: raio.sm,
  },
  caixa: {
    width: 32,
    height: 32,
    borderWidth: borda.grossa,
    borderRadius: raio.sm,
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
