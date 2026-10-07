import MaterialCommunityIcons from '@expo/vector-icons/MaterialCommunityIcons';
import { router } from 'expo-router';
import { StyleSheet, View } from 'react-native';

import { espaco, raio } from '@/shared/theme/tokens';
import { useCores } from '@/shared/theme/useCores';
import { Texto } from '@/shared/ui';
import { CartaoToque, ESPACO_DA_SETA } from '@/shared/ui/CartaoToque';

import { montarGrade } from '../grade';
import { agruparPorGrupo, type BlocoDoTreino } from '../grupos';
import { concluidosDeHoje, podeMarcarNoInicio } from '../logica';
import { useTreinoDoDia, useTreinosStore } from '../store';
import { CartaoGrupo } from './CartaoGrupo';
import { minusculaInicial } from '@/shared/lib/texto';

const abrirSessao = () => router.push('/treino/sessao');

/** Sem treino montado: convite para a IA montar ou para usar um modelo pronto. */
function ConviteTreino() {
  const c = useCores();

  return (
    <View style={estilos.linha}>
      <CartaoToque
        rotuloAcessivel="pedir para a IA montar seu treino"
        dica="Abre a aba da IA"
        onPress={() => router.push('/ia')}
        style={estilos.metade}
      >
        <MaterialCommunityIcons name="brain" size={28} color={c.texto} />
        <Texto variante="subtitulo" style={{ marginRight: ESPACO_DA_SETA }}>
          pedir para a IA montar
        </Texto>
        <Texto variante="legenda" secundario>
          conta seu objetivo e ela monta a ficha
        </Texto>
      </CartaoToque>
      <CartaoToque
        rotuloAcessivel="usar um modelo de treino pronto"
        dica="Abre os modelos prontos"
        onPress={() => router.push('/treino/modelos')}
        style={estilos.metade}
      >
        <MaterialCommunityIcons name="clipboard-list-outline" size={28} color={c.texto} />
        <Texto variante="subtitulo" style={{ marginRight: ESPACO_DA_SETA }}>
          usar um modelo
        </Texto>
        <Texto variante="legenda" secundario>
          ABC, full body ou superior e inferior
        </Texto>
      </CartaoToque>
    </View>
  );
}

/**
 * A grade "bento" do treino de hoje: só os cards de grupo muscular (aquecimento
 * em cima). Cada exercício se marca ali mesmo; a seta de cada card abre o treino.
 */
export function GradeTreinoHoje() {
  const c = useCores();
  const { situacao } = useTreinoDoDia();
  const marcar = useTreinosStore((state) => state.marcarExercicioDeHoje);

  const treino = situacao.tipo === 'sem-treinos' ? null : situacao.treino;
  const concluidos = concluidosDeHoje(situacao);
  const podeMarcar = podeMarcarNoInicio(situacao);
  const linhas = montarGrade(agruparPorGrupo(treino?.exercicios ?? []));

  function cartao(bloco: BlocoDoTreino, inteiro = false) {
    return (
      <CartaoGrupo
        bloco={bloco}
        concluidos={concluidos}
        onAbrir={abrirSessao}
        onAlternar={(exercicioId) => treino && marcar(treino.id, exercicioId)}
        podeMarcar={podeMarcar}
        inteiro={inteiro}
        style={estilos.cheio}
      />
    );
  }

  if (situacao.tipo === 'sugerido' && situacao.descanso) {
    return (
      <View style={estilos.grade}>
        <View
          accessible
          accessibilityLabel={`hoje é dia de descanso. próximo treino: ${minusculaInicial(situacao.treino.nome)}`}
          style={[estilos.descanso, { backgroundColor: c.superficie }]}
        >
          <MaterialCommunityIcons name="weather-night" size={28} color={c.agua} />
          <Texto variante="subtitulo">dia de descanso</Texto>
          <Texto secundario>
            recuperar também é treino. próximo: {minusculaInicial(situacao.treino.nome)}
          </Texto>
        </View>
      </View>
    );
  }

  return (
    <View style={estilos.grade}>
      {!treino ? <ConviteTreino /> : null}

      {treino && treino.exercicios.length === 0 ? (
        <CartaoToque
          rotuloAcessivel={`${minusculaInicial(treino.nome)} ainda não tem exercícios. Adicionar exercícios`}
          onPress={() => router.push({ pathname: '/treino/[id]', params: { id: treino.id } })}
        >
          <MaterialCommunityIcons name="playlist-plus" size={28} color={c.texto} />
          <Texto variante="subtitulo" style={{ marginRight: ESPACO_DA_SETA }}>
            adicionar exercícios
          </Texto>
          <Texto variante="legenda" secundario>
            {minusculaInicial(treino.nome)} ainda está vazio
          </Texto>
        </CartaoToque>
      ) : null}

      {linhas.map((linha) =>
        linha.tipo === 'inteira' ? (
          <View key={linha.bloco.grupo}>{cartao(linha.bloco, true)}</View>
        ) : (
          <View key={linha.blocos[0].grupo} style={estilos.linha}>
            <View style={estilos.metade}>{cartao(linha.blocos[0])}</View>
            <View style={estilos.metade}>{cartao(linha.blocos[1])}</View>
          </View>
        ),
      )}
    </View>
  );
}

const estilos = StyleSheet.create({
  grade: {
    gap: espaco.grade,
  },
  linha: {
    flexDirection: 'row',
    gap: espaco.grade,
  },
  metade: {
    flex: 1,
  },
  cheio: {
    flex: 1,
  },
  descanso: {
    borderRadius: raio.lg,
    borderCurve: 'continuous',
    padding: espaco.md,
    gap: espaco.xs,
  },
});
