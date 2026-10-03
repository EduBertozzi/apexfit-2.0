import { router, useLocalSearchParams } from 'expo-router';

import { EditorExercicios } from '@/features/treinos/components/EditorExercicios';
import { FormularioTreino } from '@/features/treinos/components/FormularioTreino';
import { useTreinosStore } from '@/features/treinos/store';
import { confirmar } from '@/shared/lib/confirmar';
import { Botao, Cartao, Tela, Texto } from '@/shared/ui';

export default function EditarTreino() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const treino = useTreinosStore((state) => state.treinos.find((item) => item.id === id));
  const editarTreino = useTreinosStore((state) => state.editarTreino);
  const removerTreino = useTreinosStore((state) => state.removerTreino);
  const comecarTreino = useTreinosStore((state) => state.comecarTreino);

  if (!treino) {
    return (
      <Tela bordas={['bottom']}>
        <Cartao titulo="Treino não encontrado" variante="tracejado">
          <Texto>Ele pode ter sido apagado.</Texto>
          <Botao titulo="Voltar" onPress={() => router.back()} />
        </Cartao>
      </Tela>
    );
  }

  async function apagar(treinoId: string, nome: string) {
    const confirmado = await confirmar(
      `Apagar ${nome}?`,
      'O treino e os exercícios dele somem. Os treinos já feitos continuam contando na semana.',
      'Apagar',
    );

    if (confirmado) {
      router.back();
      removerTreino(treinoId);
    }
  }

  function comecar(treinoId: string) {
    comecarTreino(treinoId);
    router.replace('/treino/sessao');
  }

  return (
    <Tela bordas={['bottom']}>
      <FormularioTreino
        key={treino.id}
        treino={treino}
        onSalvar={(dados) => editarTreino(treino.id, dados)}
      />

      <EditorExercicios treino={treino} />

      {treino.exercicios.length > 0 ? (
        <Botao titulo="Começar este treino" onPress={() => comecar(treino.id)} />
      ) : null}

      <Botao
        titulo="Apagar treino"
        variante="perigo"
        onPress={() => apagar(treino.id, treino.nome)}
      />
    </Tela>
  );
}
