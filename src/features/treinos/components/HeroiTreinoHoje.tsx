import { router } from 'expo-router';
import { StyleSheet, View } from 'react-native';

import { espaco } from '@/shared/theme/tokens';
import { useCores } from '@/shared/theme/useCores';
import { BarraProgresso, Botao, Cartao, Texto } from '@/shared/ui';

import { progressoDaSessao, resumoTreino } from '../logica';
import { useTreinoDoDia, useTreinosStore } from '../store';

/** Cartão herói da aba Treinos: o treino sugerido para hoje e a contagem da semana. */
export function HeroiTreinoHoje() {
  const c = useCores();
  const { situacao, naSemana } = useTreinoDoDia();
  const comecarTreino = useTreinosStore((state) => state.comecarTreino);

  if (situacao.tipo === 'sem-treinos') {
    return null;
  }

  const { treino } = situacao;
  const progresso =
    situacao.tipo === 'em-andamento' ? progressoDaSessao(situacao.sessao, treino) : null;
  const semExercicios = treino.exercicios.length === 0;

  function comecar() {
    comecarTreino(treino.id);
    router.push('/treino/sessao');
  }

  const rotulo = {
    sugerido: 'treino de hoje',
    'em-andamento': 'treino em andamento',
    concluido: 'treino de hoje feito',
  }[situacao.tipo];

  return (
    <Cartao variante="heroi">
      <View style={estilos.linhaTopo}>
        <Texto variante="rotulo" style={{ color: c.textoHeroi }} accessibilityRole="header">
          {rotulo}
        </Texto>
        <View
          accessible
          accessibilityLabel={`${naSemana} ${naSemana === 1 ? 'treino' : 'treinos'} nesta semana`}
          style={estilos.semana}
        >
          <Texto variante="destaque" style={{ color: c.destaque }}>
            {naSemana}
          </Texto>
          <Texto variante="rotulo" style={{ color: c.textoHeroiSecundario }}>
            na semana
          </Texto>
        </View>
      </View>

      <View>
        <Texto variante="titulo" style={{ color: c.textoHeroi }}>
          {treino.nome}
        </Texto>
        <Texto style={{ color: c.textoHeroiSecundario }}>{resumoTreino(treino)}</Texto>
      </View>

      {progresso ? (
        <BarraProgresso
          valor={progresso.fracao}
          cor={c.destaque}
          corTrilho={c.trilhoHeroi}
          rotuloAcessivel={`${progresso.feitos} de ${progresso.total} exercícios feitos`}
        />
      ) : null}

      {situacao.tipo === 'concluido' ? (
        <>
          <Texto style={{ color: c.textoHeroiSecundario }}>
            {situacao.proximo
              ? `Mandou bem. Próximo: ${situacao.proximo.nome}.`
              : 'Mandou bem. Descansa e volta amanhã.'}
          </Texto>
          <Botao
            titulo="ver resumo"
            variante="heroi"
            onPress={() => router.push('/treino/sessao')}
          />
        </>
      ) : (
        <>
          {semExercicios ? (
            <Texto variante="legenda" style={{ color: c.textoHeroiSecundario }}>
              Adicione exercícios a este treino para começar.
            </Texto>
          ) : null}
          <Botao
            titulo={situacao.tipo === 'em-andamento' ? 'continuar treino' : 'começar treino'}
            variante="destaque"
            onPress={comecar}
            desabilitado={semExercicios}
          />
        </>
      )}
    </Cartao>
  );
}

const estilos = StyleSheet.create({
  linhaTopo: {
    flexDirection: 'row',
    alignItems: 'baseline',
    justifyContent: 'space-between',
    gap: espaco.sm,
  },
  semana: {
    flexDirection: 'row',
    alignItems: 'baseline',
    gap: espaco.xs,
  },
});
