import { router, useLocalSearchParams } from 'expo-router';
import { AccessibilityInfo } from 'react-native';

import { FolhaAdicionar } from '@/features/treinos/components/FolhaAdicionar';
import { FolhaEditarExercicio } from '@/features/treinos/components/FolhaEditarExercicio';
import { abaInicial } from '@/features/treinos/montagem';
import { useTreinosStore } from '@/features/treinos/store';
import { confirmar } from '@/shared/lib/confirmar';
import { Botao, Cartao, Tela, Texto } from '@/shared/ui';

/**
 * Folha nativa (formSheet) para montar o treino.
 * - `id`: o treino.
 * - `exercicio`: abre no modo de editar aquele exercício.
 * - `aba`: "musculacao", "cardio" ou "plano".
 */
export default function FolhaTreino() {
  const {
    id,
    exercicio: exercicioId,
    aba,
  } = useLocalSearchParams<{
    id: string;
    exercicio?: string;
    aba?: string;
  }>();
  const treinos = useTreinosStore((state) => state.treinos);
  const treino = treinos.find((item) => item.id === id);
  const adicionarExercicios = useTreinosStore((state) => state.adicionarExercicios);
  const editarExercicio = useTreinosStore((state) => state.editarExercicio);
  const removerExercicio = useTreinosStore((state) => state.removerExercicio);
  const definirDias = useTreinosStore((state) => state.definirDias);

  const exercicio = treino?.exercicios.find((item) => item.id === exercicioId);

  if (!treino || (exercicioId && !exercicio)) {
    return (
      <Tela bordas={['bottom']}>
        <Cartao titulo="não encontrado" variante="tracejado">
          <Texto>Ele pode ter sido apagado.</Texto>
          <Botao titulo="voltar" onPress={() => router.back()} />
        </Cartao>
      </Tela>
    );
  }

  if (exercicio) {
    return (
      <FolhaEditarExercicio
        exercicio={exercicio}
        onCancelar={() => router.back()}
        onSalvar={(dados) => {
          editarExercicio(treino.id, exercicio.id, dados);
          router.back();
        }}
        onRemover={async () => {
          const confirmado = await confirmar(
            `Remover ${exercicio.nome}?`,
            'O exercício sai deste treino.',
            'remover',
          );

          if (confirmado) {
            router.back();
            removerExercicio(treino.id, exercicio.id);
            AccessibilityInfo.announceForAccessibility(`${exercicio.nome} removido`);
          }
        }}
      />
    );
  }

  return (
    <FolhaAdicionar
      treino={treino}
      treinos={treinos}
      aba={abaInicial(aba)}
      onCancelar={() => router.back()}
      onSalvar={({ exercicios, dias }) => {
        if (exercicios.length > 0) {
          adicionarExercicios(treino.id, exercicios);
          AccessibilityInfo.announceForAccessibility(
            exercicios.length === 1
              ? `${exercicios[0].nome} adicionado`
              : `${exercicios.length} exercícios adicionados`,
          );
        }

        if (dias) {
          definirDias(treino.id, dias);
        }

        router.back();
      }}
    />
  );
}
