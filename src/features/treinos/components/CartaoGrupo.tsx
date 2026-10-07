import { StyleSheet, Text, View, type StyleProp, type ViewStyle } from 'react-native';

import { espaco, familia, fonte } from '@/shared/theme/tokens';
import { useCategorias, useCores } from '@/shared/theme/useCores';
import { CartaoToque, ESPACO_DA_SETA } from '@/shared/ui/CartaoToque';

import {
  blocoCompleto,
  emDuasColunas,
  limitarLista,
  NOME_GRUPO,
  nomeNoCard,
  rotuloDoBloco,
  textoEsquema,
  type BlocoDoTreino,
} from '../grupos';
import type { Exercicio } from '../types';
import { IconeGrupo } from './IconeGrupo';

/** Linhas de exercício por card: a grade fica alinhada e o resto vira "+N". */
const MAXIMO_LINHAS = 3;
const MAXIMO_INTEIRO = 4;

type Props = {
  bloco: BlocoDoTreino;
  /** Ids dos exercícios já marcados hoje. */
  concluidos: readonly string[];
  onPress: () => void;
  /** Card de largura toda (aquecimento): esquema na mesma linha do título e nomes em duas colunas. */
  inteiro?: boolean;
  style?: StyleProp<ViewStyle>;
};

function NomeExercicio({
  exercicio,
  feito,
  alinhar = 'esquerda',
}: {
  exercicio: Exercicio;
  feito: boolean;
  alinhar?: 'esquerda' | 'direita';
}) {
  const c = useCores();

  return (
    <View style={[estilos.nomeLinha, alinhar === 'direita' && estilos.nomeDireita]}>
      <Text
        numberOfLines={1}
        ellipsizeMode="tail"
        maxFontSizeMultiplier={1.4}
        style={[
          estilos.nome,
          { color: feito ? c.textoSecundario : c.texto },
          feito && estilos.riscado,
          alinhar === 'direita' && estilos.textoDireita,
          estilos.encolher,
        ]}
      >
        {nomeNoCard(exercicio.nome)}
      </Text>
    </View>
  );
}

/** "+2 exercícios" quando a lista não cabe no card. */
function Mais({
  resto,
  alinhar = 'esquerda',
}: {
  resto: number;
  alinhar?: 'esquerda' | 'direita';
}) {
  const c = useCores();

  if (resto === 0) {
    return null;
  }

  return (
    <Text
      numberOfLines={1}
      maxFontSizeMultiplier={1.4}
      style={[
        estilos.nome,
        { color: c.textoSecundario },
        alinhar === 'direita' && estilos.textoDireita,
      ]}
    >
      {resto === 1 ? '+1 exercício' : `+${resto} exercícios`}
    </Text>
  );
}

/** Card de um grupo do treino de hoje: ícone, nome e esquema na cor do grupo, e os exercícios. */
export function CartaoGrupo({ bloco, concluidos, onPress, inteiro = false, style }: Props) {
  const cat = useCategorias();
  const cor = cat.texto[bloco.grupo];
  const feito = (exercicio: Exercicio) => concluidos.includes(exercicio.id);
  const completo = blocoCompleto(bloco, concluidos);
  const esquema = (
    <Text maxFontSizeMultiplier={1.4} style={[estilos.esquema, { color: cor }]}>
      {textoEsquema(bloco.esquema)}
    </Text>
  );

  const titulo = (
    <View style={estilos.titulo}>
      <IconeGrupo grupo={bloco.grupo} cor={cor} />
      <Text
        maxFontSizeMultiplier={1.4}
        numberOfLines={1}
        style={[estilos.nomeGrupo, estilos.encolher, { color: cor }]}
      >
        {NOME_GRUPO[bloco.grupo]}
      </Text>
    </View>
  );

  if (inteiro) {
    const { visiveis, resto } = limitarLista(bloco.exercicios, MAXIMO_INTEIRO);
    const [esquerda, direita] = emDuasColunas(resto > 0 ? [...visiveis, null] : visiveis);

    return (
      <CartaoToque
        rotuloAcessivel={rotuloDoBloco(bloco, concluidos)}
        dica="Abre o treino de hoje"
        onPress={onPress}
        concluido={completo}
        style={style}
        testID={`grupo-${bloco.grupo}`}
      >
        <View style={[estilos.linhaTopo, { marginRight: ESPACO_DA_SETA + espaco.sm }]}>
          {titulo}
          {esquema}
        </View>
        <View style={estilos.colunas}>
          <View style={estilos.coluna}>
            {esquerda.map((exercicio) =>
              exercicio ? (
                <NomeExercicio key={exercicio.id} exercicio={exercicio} feito={feito(exercicio)} />
              ) : (
                <Mais key="mais" resto={resto} />
              ),
            )}
          </View>
          <View style={estilos.coluna}>
            {direita.map((exercicio) =>
              exercicio ? (
                <NomeExercicio
                  key={exercicio.id}
                  exercicio={exercicio}
                  feito={feito(exercicio)}
                  alinhar="direita"
                />
              ) : (
                <Mais key="mais" resto={resto} alinhar="direita" />
              ),
            )}
          </View>
        </View>
      </CartaoToque>
    );
  }

  const { visiveis, resto } = limitarLista(bloco.exercicios, MAXIMO_LINHAS);

  return (
    <CartaoToque
      rotuloAcessivel={rotuloDoBloco(bloco, concluidos)}
      dica="Abre o treino de hoje"
      onPress={onPress}
      concluido={completo}
      style={style}
      testID={`grupo-${bloco.grupo}`}
    >
      <View style={{ marginRight: ESPACO_DA_SETA }}>{titulo}</View>
      {esquema}
      <View style={estilos.lista}>
        {visiveis.map((exercicio) => (
          <NomeExercicio key={exercicio.id} exercicio={exercicio} feito={feito(exercicio)} />
        ))}
        <Mais resto={resto} />
      </View>
    </CartaoToque>
  );
}

const estilos = StyleSheet.create({
  linhaTopo: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: espaco.sm,
  },
  titulo: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: espaco.xs + 2,
    flexShrink: 1,
  },
  nomeGrupo: {
    fontFamily: familia.displayLeve,
    fontSize: fonte.subtitulo,
  },
  esquema: {
    fontFamily: familia.displayLeve,
    fontSize: fonte.subtitulo,
  },
  encolher: {
    flexShrink: 1,
  },
  lista: {
    marginTop: espaco.sm,
    gap: 2,
  },
  colunas: {
    flexDirection: 'row',
    gap: espaco.md,
    marginTop: espaco.sm,
  },
  coluna: {
    flex: 1,
    gap: 2,
  },
  nomeLinha: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: espaco.xs,
  },
  nomeDireita: {
    justifyContent: 'flex-end',
  },
  nome: {
    fontFamily: familia.corpo,
    fontSize: fonte.corpo + 1,
    lineHeight: (fonte.corpo + 1) * 1.3,
  },
  riscado: {
    textDecorationLine: 'line-through',
  },
  textoDireita: {
    textAlign: 'right',
  },
});
