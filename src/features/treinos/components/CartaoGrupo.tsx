import MaterialCommunityIcons from '@expo/vector-icons/MaterialCommunityIcons';
import { Pressable, StyleSheet, Text, View, type StyleProp, type ViewStyle } from 'react-native';
import Animated from 'react-native-reanimated';

import { useVibrar } from '@/shared/lib/vibracao';
import { espaco, familia, fonte, raio } from '@/shared/theme/tokens';
import { useCategorias, useCores } from '@/shared/theme/useCores';
import { ESPACO_DA_SETA, SetaCartao } from '@/shared/ui/SetaCartao';
import { usePop } from '@/shared/ui/animacao';

import {
  blocoCompleto,
  emDuasColunas,
  limitarLista,
  NOME_GRUPO,
  nomeNoCard,
  rotuloMarcarExercicio,
  rotuloTituloDoBloco,
  textoEsquema,
  type BlocoDoTreino,
} from '../grupos';
import type { Exercicio } from '../types';
import { IconeGrupo } from './IconeGrupo';

/** Linhas de exercício por card: a grade fica alinhada e o resto vira "+N". */
const MAXIMO_LINHAS = 3;
const MAXIMO_INTEIRO = 4;
/** Caixinha de marcar ao lado do nome. */
const TAMANHO_CAIXA = 22;

type Props = {
  bloco: BlocoDoTreino;
  /** Ids dos exercícios já marcados hoje. */
  concluidos: readonly string[];
  /** Seta do canto (e o "+N"): abre o treino de hoje. */
  onAbrir: () => void;
  /** Toque num exercício: marca ou desmarca direto da tela inicial. */
  onAlternar: (exercicioId: string) => void;
  /** Treino de hoje já finalizado: os nomes ficam só para ver. */
  podeMarcar?: boolean;
  /** Card de largura toda: esquema na mesma linha do título e nomes em duas colunas. */
  inteiro?: boolean;
  style?: StyleProp<ViewStyle>;
};

/** Um exercício do card: caixa de marcar de verdade (toque marca e desmarca). */
function LinhaExercicio({
  exercicio,
  feito,
  podeMarcar,
  soLeitura,
  onAlternar,
}: {
  exercicio: Exercicio;
  feito: boolean;
  podeMarcar: boolean;
  /** Dia sem marcação possível nem feita (ex: futuro): só o nome, sem caixa. */
  soLeitura: boolean;
  onAlternar: (exercicioId: string) => void;
}) {
  const c = useCores();
  const vibrar = useVibrar();
  // "Pop" só ao marcar; desmarcar é silencioso
  const pop = usePop(feito, feito);

  if (soLeitura) {
    return (
      <View style={estilos.linha} accessible accessibilityLabel={exercicio.nome}>
        <View style={estilos.caixaVazia}>
          <View style={[estilos.ponto, { backgroundColor: c.textoSecundario }]} />
        </View>
        <Text
          numberOfLines={2}
          ellipsizeMode="tail"
          maxFontSizeMultiplier={1.4}
          style={[estilos.nome, { color: c.texto }]}
        >
          {nomeNoCard(exercicio.nome)}
        </Text>
      </View>
    );
  }

  return (
    <Pressable
      onPress={() => {
        vibrar('leve');
        onAlternar(exercicio.id);
      }}
      disabled={!podeMarcar}
      accessibilityRole="checkbox"
      accessibilityLabel={rotuloMarcarExercicio(exercicio.nome, feito, podeMarcar)}
      accessibilityState={{ checked: feito, disabled: !podeMarcar }}
      testID={`marcar-${exercicio.id}`}
      style={({ pressed }) => [estilos.linha, pressed && estilos.linhaPressionada]}
    >
      <Animated.View
        style={[
          estilos.caixa,
          feito
            ? { backgroundColor: c.destaque, borderColor: c.destaque }
            : { borderColor: c.textoSecundario },
          pop,
        ]}
      >
        {feito ? (
          <MaterialCommunityIcons name="check-bold" size={14} color={c.textoSobreDestaque} />
        ) : null}
      </Animated.View>
      <Text
        numberOfLines={2}
        ellipsizeMode="tail"
        maxFontSizeMultiplier={1.4}
        style={[
          estilos.nome,
          { color: feito ? c.textoSecundario : c.texto },
          feito && estilos.riscado,
        ]}
      >
        {nomeNoCard(exercicio.nome)}
      </Text>
    </Pressable>
  );
}

/** "+2 exercícios" quando a lista não cabe no card: abre o treino com a lista toda. */
function Mais({ resto, onAbrir }: { resto: number; onAbrir: () => void }) {
  const c = useCores();

  if (resto === 0) {
    return null;
  }

  const texto = resto === 1 ? '+1 exercício' : `+${resto} exercícios`;

  return (
    <Pressable
      onPress={onAbrir}
      accessibilityRole="button"
      accessibilityLabel={`mais ${resto === 1 ? '1 exercício' : `${resto} exercícios`}, abrir o treino de hoje`}
      style={({ pressed }) => [estilos.linha, pressed && estilos.linhaPressionada]}
    >
      <Text
        numberOfLines={1}
        maxFontSizeMultiplier={1.4}
        style={[estilos.nome, { color: c.textoSecundario }]}
      >
        {texto}
      </Text>
    </Pressable>
  );
}

/**
 * Card de um grupo do treino de hoje: ícone, nome e esquema na cor do grupo, e
 * cada exercício como caixa de marcar. A seta redonda do canto abre o treino.
 */
export function CartaoGrupo({
  bloco,
  concluidos,
  onAbrir,
  onAlternar,
  podeMarcar = true,
  inteiro = false,
  style,
}: Props) {
  const c = useCores();
  const cat = useCategorias();
  const cor = cat.texto[bloco.grupo];
  const feito = (exercicio: Exercicio) => concluidos.includes(exercicio.id);
  const completo = blocoCompleto(bloco, concluidos);
  const { visiveis, resto } = limitarLista(
    bloco.exercicios,
    inteiro ? MAXIMO_INTEIRO : MAXIMO_LINHAS,
  );

  const linha = (exercicio: Exercicio) => (
    <LinhaExercicio
      key={exercicio.id}
      exercicio={exercicio}
      feito={feito(exercicio)}
      podeMarcar={podeMarcar}
      soLeitura={!podeMarcar && concluidos.length === 0}
      onAlternar={onAlternar}
    />
  );

  const esquema = (
    <Text maxFontSizeMultiplier={1.4} style={[estilos.esquema, { color: cor }]}>
      {textoEsquema(bloco.esquema)}
    </Text>
  );

  const titulo = (
    <View style={estilos.titulo}>
      <IconeGrupo grupo={bloco.grupo} cor={cor} tamanho={20} />
      <Text
        maxFontSizeMultiplier={1.4}
        numberOfLines={1}
        style={[estilos.nomeGrupo, estilos.encolher, { color: cor }]}
      >
        {NOME_GRUPO[bloco.grupo]}
      </Text>
    </View>
  );

  const [esquerda, direita] = emDuasColunas<Exercicio | null>(
    resto > 0 ? [...visiveis, null] : visiveis,
  );

  return (
    <View
      style={[
        estilos.cartao,
        { backgroundColor: c.superficie },
        completo && estilos.concluido,
        style,
      ]}
      testID={`grupo-${bloco.grupo}`}
    >
      {/* O título vira uma frase só para o leitor de tela */}
      <View
        accessible
        accessibilityRole="header"
        accessibilityLabel={rotuloTituloDoBloco(bloco, concluidos)}
        style={[
          inteiro ? estilos.linhaTopo : estilos.cabecalho,
          { marginRight: ESPACO_DA_SETA + (inteiro ? espaco.sm : 0) },
        ]}
      >
        {titulo}
        {esquema}
      </View>

      {inteiro ? (
        <View style={estilos.colunas}>
          {[esquerda, direita].map((coluna, indice) => (
            <View key={indice} style={estilos.coluna}>
              {coluna.map((exercicio) =>
                exercicio ? linha(exercicio) : <Mais key="mais" resto={resto} onAbrir={onAbrir} />,
              )}
            </View>
          ))}
        </View>
      ) : (
        <View style={estilos.lista}>
          {visiveis.map(linha)}
          <Mais resto={resto} onAbrir={onAbrir} />
        </View>
      )}

      <SetaCartao
        onPress={onAbrir}
        concluido={completo}
        rotulo={`abrir o treino de hoje, ${NOME_GRUPO[bloco.grupo]}`}
        testID={`abrir-${bloco.grupo}`}
      />
    </View>
  );
}

const estilos = StyleSheet.create({
  cartao: {
    borderRadius: raio.lg,
    borderCurve: 'continuous',
    padding: espaco.md,
    paddingBottom: espaco.sm,
    gap: espaco.xs,
    minHeight: 96,
  },
  concluido: {
    opacity: 0.6,
  },
  cabecalho: {
    gap: 2,
  },
  linhaTopo: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: espaco.sm,
  },
  titulo: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: espaco.xs,
    flexShrink: 1,
  },
  // Um pouco menor que o subtítulo: "abdômen" precisa caber ao lado do ícone e da seta
  nomeGrupo: {
    fontFamily: familia.displayLeve,
    fontSize: 19,
  },
  esquema: {
    fontFamily: familia.displayLeve,
    fontSize: 19,
  },
  encolher: {
    flexShrink: 1,
  },
  lista: {
    marginTop: espaco.xs,
  },
  colunas: {
    flexDirection: 'row',
    gap: espaco.md,
    marginTop: espaco.xs,
  },
  coluna: {
    flex: 1,
  },
  // Cada exercício tem 44 px de altura: dá para acertar com o dedo
  linha: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: espaco.sm,
    minHeight: 44,
  },
  linhaPressionada: {
    opacity: 0.6,
  },
  caixaVazia: {
    width: TAMANHO_CAIXA,
    height: TAMANHO_CAIXA,
    alignItems: 'center',
    justifyContent: 'center',
  },
  ponto: {
    width: 6,
    height: 6,
    borderRadius: 3,
  },
  caixa: {
    width: TAMANHO_CAIXA,
    height: TAMANHO_CAIXA,
    borderRadius: TAMANHO_CAIXA / 2,
    borderWidth: 2,
    alignItems: 'center',
    justifyContent: 'center',
  },
  nome: {
    flexShrink: 1,
    fontFamily: familia.corpo,
    fontSize: fonte.corpo - 1,
    lineHeight: (fonte.corpo - 1) * 1.25,
  },
  riscado: {
    textDecorationLine: 'line-through',
  },
});
