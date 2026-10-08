import { router } from 'expo-router';
import { useState } from 'react';

import { ChecklistSessao } from '@/features/treinos/components/ChecklistSessao';
import { PreviaTreino } from '@/features/treinos/components/PreviaTreino';
import { TreinoConcluido } from '@/features/treinos/components/TreinoConcluido';
import { useTreinoDoDia, useTreinosStore } from '@/features/treinos/store';
import { Botao, Cartao, Tela, Texto } from '@/shared/ui';

export default function SessaoDoDia() {
  const { situacao, naSemana } = useTreinoDoDia();
  const comecarTreino = useTreinosStore((state) => state.comecarTreino);
  // Só comemora se o treino foi finalizado nesta visita, não ao reabrir um treino já feito
  const [abriuSemTerminar] = useState(situacao.tipo !== 'concluido');

  if (situacao.tipo === 'em-andamento') {
    return (
      <Tela bordas={['bottom']}>
        <ChecklistSessao treino={situacao.treino} sessao={situacao.sessao} />
      </Tela>
    );
  }

  if (situacao.tipo === 'concluido') {
    return (
      <Tela bordas={['bottom']}>
        <TreinoConcluido
          treino={situacao.treino}
          sessao={situacao.sessao}
          proximo={situacao.proximo}
          naSemana={naSemana}
          onVoltar={() => router.back()}
          comemorar={abriuSemTerminar}
        />
      </Tela>
    );
  }

  if (situacao.tipo === 'sugerido') {
    const { treino } = situacao;

    return (
      <Tela bordas={['bottom']}>
        <PreviaTreino
          treino={treino}
          onComecar={() => comecarTreino(treino.id)}
          onEditar={() => router.push({ pathname: '/treino/[id]', params: { id: treino.id } })}
        />
      </Tela>
    );
  }

  return (
    <Tela bordas={['bottom']}>
      <Cartao titulo="nenhum treino ainda" variante="tracejado">
        <Texto>monte uma ficha com um modelo pronto ou peça para a IA montar.</Texto>
        <Botao titulo="ver treinos" onPress={() => router.replace('/treinos')} />
      </Cartao>
    </Tela>
  );
}
