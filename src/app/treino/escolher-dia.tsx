import { router, useLocalSearchParams } from 'expo-router';
import { AccessibilityInfo } from 'react-native';

import { FolhaEscolherDia } from '@/features/treinos/components/FolhaEscolherDia';
import { lerDia, opcoesDoDia, tituloDaFolha } from '@/features/treinos/planoSemana';
import { useTreinosStore } from '@/features/treinos/store';
import { Botao, Cartao, Tela } from '@/shared/ui';

/** Folha nativa (formSheet) de "minha semana": `dia` de 0 (domingo) a 6 (sábado). */
export default function EscolherDia() {
  const { dia: parametro } = useLocalSearchParams<{ dia?: string }>();
  const treinos = useTreinosStore((state) => state.treinos);
  const atribuirDia = useTreinosStore((state) => state.atribuirDia);
  const novoTreino = useTreinosStore((state) => state.novoTreino);
  const dia = lerDia(parametro);
  const titulo = dia === null ? null : tituloDaFolha(dia);

  if (dia === null || titulo === null) {
    return (
      <Tela bordas={['bottom']}>
        <Cartao titulo="dia não encontrado" variante="tracejado">
          <Botao titulo="voltar" onPress={() => router.back()} />
        </Cartao>
      </Tela>
    );
  }

  const opcoes = opcoesDoDia(treinos, dia);

  return (
    <FolhaEscolherDia
      titulo={titulo}
      opcoes={opcoes}
      onEscolher={(treinoId) => {
        atribuirDia(dia, treinoId);
        const escolhida = opcoes.find((opcao) => opcao.treinoId === treinoId);
        AccessibilityInfo.announceForAccessibility(`${titulo}: ${escolhida?.titulo ?? ''}`);
        router.back();
      }}
      onNovoTreino={() => {
        const id = novoTreino();
        atribuirDia(dia, id);
        router.back();
        router.push({ pathname: '/treino/[id]', params: { id } });
      }}
    />
  );
}
