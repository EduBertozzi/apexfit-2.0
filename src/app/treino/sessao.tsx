import { router } from 'expo-router';

import { ChecklistSessao } from '@/features/treinos/components/ChecklistSessao';
import { TreinoConcluido } from '@/features/treinos/components/TreinoConcluido';
import { useTreinoDoDia } from '@/features/treinos/store';
import { Botao, Cartao, Tela, Texto } from '@/shared/ui';

export default function SessaoDoDia() {
  const { situacao, naSemana } = useTreinoDoDia();

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
        />
      </Tela>
    );
  }

  return (
    <Tela bordas={['bottom']}>
      <Cartao titulo="Nenhum treino rolando" variante="tracejado">
        <Texto>Escolha um treino na aba Treinos e toque em começar.</Texto>
        <Botao titulo="Ver treinos" onPress={() => router.replace('/treinos')} />
      </Cartao>
    </Tela>
  );
}
