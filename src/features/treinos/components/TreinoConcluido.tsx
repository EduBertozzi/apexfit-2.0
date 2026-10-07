import { StyleSheet, View } from 'react-native';

import { espaco } from '@/shared/theme/tokens';
import { useCores } from '@/shared/theme/useCores';
import { Botao, Cartao, Marcado, Texto } from '@/shared/ui';

import { progressoDaSessao } from '../logica';
import type { Sessao, Treino } from '../types';

type Props = {
  treino: Treino;
  sessao: Sessao;
  proximo: Treino | null;
  naSemana: number;
  onVoltar: () => void;
};

/** Tela de vitória depois de finalizar o treino. */
export function TreinoConcluido({ treino, sessao, proximo, naSemana, onVoltar }: Props) {
  const c = useCores();
  const { feitos, total } = progressoDaSessao(sessao, treino);

  return (
    <View style={estilos.container} accessibilityLiveRegion="polite">
      <Texto variante="gigante" accessibilityRole="header">
        treino{'\n'}
        <Marcado>feito.</Marcado>
      </Texto>

      <Cartao variante="heroi">
        <Texto variante="rotulo" style={{ color: c.textoHeroiSecundario }}>
          {treino.nome}
          {treino.foco ? `, ${treino.foco}` : ''}
        </Texto>
        <Texto variante="subtitulo" style={{ color: c.textoHeroi }}>
          {feitos} de {total} exercícios
        </Texto>

        <View style={estilos.semana}>
          <Texto variante="destaque" style={{ color: c.destaque }}>
            {naSemana}
          </Texto>
          <Texto variante="rotulo" style={[estilos.textoSemana, { color: c.textoHeroi }]}>
            {naSemana === 1 ? 'treino nesta semana' : 'treinos nesta semana'}
          </Texto>
        </View>
      </Cartao>

      {proximo ? (
        <Texto secundario>
          Próximo: {proximo.nome}
          {proximo.foco ? `, ${proximo.foco}` : ''}. Descansa e volta com tudo.
        </Texto>
      ) : null}

      <Botao titulo="voltar" onPress={onVoltar} />
    </View>
  );
}

const estilos = StyleSheet.create({
  container: {
    gap: espaco.md,
  },
  semana: {
    flexDirection: 'row',
    alignItems: 'baseline',
    gap: espaco.sm,
    marginTop: espaco.xs,
  },
  textoSemana: {
    flexShrink: 1,
  },
});
