import MaterialCommunityIcons from '@expo/vector-icons/MaterialCommunityIcons';
import { router } from 'expo-router';
import type { ReactNode } from 'react';
import { StyleSheet, View } from 'react-native';

import { espaco } from '@/shared/theme/tokens';
import { useCores } from '@/shared/theme/useCores';
import { Texto } from '@/shared/ui';
import { CartaoToque, ESPACO_DA_SETA } from '@/shared/ui/CartaoToque';

import { caloriasNaGrade, montarGrade, type ItemGrade } from '../grade';
import { agruparPorGrupo } from '../grupos';
import { concluidosDeHoje } from '../logica';
import { useTreinoDoDia } from '../store';
import { CartaoGrupo } from './CartaoGrupo';

type Props = {
  /** Card quadrado de água (vem da feature de hidratação). */
  agua: ReactNode;
  /** Card de calorias (vem da feature de nutrição). */
  calorias: ReactNode;
  /** Card da dieta, sempre embaixo da grade. */
  dieta: ReactNode;
};

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
 * A grade "bento" do treino de hoje: um card por grupo muscular, aquecimento em
 * cima e a água no cantinho, igual ao desenho de referência.
 */
export function GradeTreinoHoje({ agua, calorias, dieta }: Props) {
  const c = useCores();
  const { situacao } = useTreinoDoDia();

  const treino = situacao.tipo === 'sem-treinos' ? null : situacao.treino;
  const concluidos = concluidosDeHoje(situacao);
  const linhas = montarGrade(agruparPorGrupo(treino?.exercicios ?? []));

  function item(itemGrade: ItemGrade, inteiro = false) {
    if (itemGrade.tipo === 'agua') {
      return agua;
    }

    if (itemGrade.tipo === 'calorias') {
      return calorias;
    }

    return (
      <CartaoGrupo
        bloco={itemGrade.bloco}
        concluidos={concluidos}
        onPress={abrirSessao}
        inteiro={inteiro}
        style={estilos.cheio}
      />
    );
  }

  return (
    <View style={estilos.grade}>
      {!treino ? <ConviteTreino /> : null}

      {treino && treino.exercicios.length === 0 ? (
        <CartaoToque
          rotuloAcessivel={`${treino.nome} ainda não tem exercícios. Adicionar exercícios`}
          onPress={() => router.push({ pathname: '/treino/[id]', params: { id: treino.id } })}
        >
          <MaterialCommunityIcons name="playlist-plus" size={28} color={c.texto} />
          <Texto variante="subtitulo" style={{ marginRight: ESPACO_DA_SETA }}>
            adicionar exercícios
          </Texto>
          <Texto variante="legenda" secundario>
            {treino.nome} ainda está vazio
          </Texto>
        </CartaoToque>
      ) : null}

      {linhas.map((linha, indice) =>
        linha.tipo === 'inteira' ? (
          <View key={indice}>{item(linha.item, true)}</View>
        ) : (
          <View key={indice} style={estilos.linha}>
            <View style={linha.largo ? estilos.largo : estilos.metade}>{item(linha.itens[0])}</View>
            <View style={linha.largo ? estilos.estreito : estilos.metade}>
              {item(linha.itens[1])}
            </View>
          </View>
        ),
      )}

      {caloriasNaGrade(linhas) ? (
        dieta
      ) : (
        <View style={estilos.linha}>
          <View style={estilos.metade}>{calorias}</View>
          <View style={estilos.metade}>{dieta}</View>
        </View>
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
  largo: {
    flex: 1.65,
  },
  estreito: {
    flex: 1,
  },
  cheio: {
    flex: 1,
  },
});
