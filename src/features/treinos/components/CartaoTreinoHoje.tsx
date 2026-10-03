import { router } from 'expo-router';
import type { StyleProp, ViewStyle } from 'react-native';

import { Botao, Cartao, Texto } from '@/shared/ui';

import { progressoDaSessao, resumoTreino } from '../logica';
import { useTreinoDoDia, useTreinosStore } from '../store';

/** Cartão compacto da aba Hoje: o próximo treino do rodízio, ou convite para montar um. */
export function CartaoTreinoHoje({ style }: { style?: StyleProp<ViewStyle> }) {
  const { situacao } = useTreinoDoDia();
  const comecarTreino = useTreinosStore((state) => state.comecarTreino);

  if (situacao.tipo === 'sem-treinos') {
    return (
      <Cartao titulo="Treino de hoje" variante="tracejado" style={style}>
        <Texto variante="subtitulo">Monte o seu</Texto>
        <Texto variante="legenda" secundario>
          Use um modelo pronto ou crie do zero.
        </Texto>
        <Botao titulo="Montar" variante="secundario" onPress={() => router.push('/treinos')} />
      </Cartao>
    );
  }

  const { treino } = situacao;

  if (situacao.tipo === 'concluido') {
    return (
      <Cartao titulo="Treino de hoje" style={style}>
        <Texto variante="subtitulo">Feito</Texto>
        <Texto variante="legenda" secundario>
          {treino.nome} concluído.
          {situacao.proximo ? ` Próximo: ${situacao.proximo.nome}.` : ''}
        </Texto>
        <Botao
          titulo="Resumo"
          variante="secundario"
          onPress={() => router.push('/treino/sessao')}
        />
      </Cartao>
    );
  }

  const emAndamento = situacao.tipo === 'em-andamento';
  const semExercicios = treino.exercicios.length === 0;

  function comecar() {
    comecarTreino(treino.id);
    router.push('/treino/sessao');
  }

  return (
    <Cartao titulo="Treino de hoje" style={style}>
      <Texto variante="subtitulo">{treino.nome}</Texto>
      <Texto variante="legenda" secundario numberOfLines={2}>
        {emAndamento
          ? `${progressoDaSessao(situacao.sessao, treino).feitos} de ${treino.exercicios.length} feitos`
          : resumoTreino(treino)}
      </Texto>
      {semExercicios ? (
        <Botao
          titulo="Editar"
          descricaoAcessivel={`Editar ${treino.nome}`}
          variante="secundario"
          onPress={() => router.push({ pathname: '/treino/[id]', params: { id: treino.id } })}
        />
      ) : (
        <Botao
          titulo={emAndamento ? 'Continuar' : 'Começar'}
          descricaoAcessivel={`${emAndamento ? 'Continuar' : 'Começar'} ${treino.nome}`}
          onPress={comecar}
        />
      )}
    </Cartao>
  );
}
