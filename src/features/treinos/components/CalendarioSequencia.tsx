import Ionicons from '@expo/vector-icons/Ionicons';
import { useRef, useState } from 'react';
import { FlatList, Pressable, StyleSheet, Text, View } from 'react-native';

import { espaco, familia, fonte, raio, semana } from '@/shared/theme/tokens';
import { useCores } from '@/shared/theme/useCores';
import { AnelProgresso, Cartao, Texto } from '@/shared/ui';

import type { MarcasDosDias } from '../semana';
import {
  rotuloDoDiaDoCalendario,
  textoTreinosNoMes,
  type DiaDoCalendario,
  type EstadoDoCalendario,
} from '../sequencia';
import { useMesDaSequencia, useMesesDaSequencia } from '../useSequencia';

const INICIAIS = ['d', 's', 't', 'q', 'q', 's', 's'];
/** Sempre 6 linhas: todas as páginas têm a mesma altura ao deslizar. */
const CASAS = 42;
/** Largura usada até a medida real chegar (cartão num celular de 360 px). */
const LARGURA_INICIAL = 296;
const ANEL_MAXIMO = 46;
/** Respiro entre as linhas (e lugar para o ponto de hoje). */
const RESPIRO_LINHA = 8;

type Props = {
  hoje: Date;
};

/**
 * Calendário da sequência: um mês por página, deslizando para o lado (ou pelas
 * setas), do mês do primeiro treino até o de hoje. Cada dia tem um anel com
 * quanto do treino foi feito, nas cores da faixa da semana.
 */
export function CalendarioSequencia({ hoje }: Props) {
  const c = useCores();
  const { meses, marcas } = useMesesDaSequencia(hoje);
  const [indice, setIndice] = useState(meses.length - 1);
  const [largura, setLargura] = useState(0);
  const lista = useRef<FlatList<{ ano: number; mes: number }>>(null);
  const atual = Math.min(Math.max(indice, 0), meses.length - 1);
  const visivel = meses[atual];
  const mes = useMesDaSequencia(visivel.ano, visivel.mes, hoje, marcas);
  const larguraPagina = largura > 0 ? largura : LARGURA_INICIAL;
  const casa = Math.floor(larguraPagina / 7);

  const ir = (delta: number) => {
    const novo = Math.min(Math.max(atual + delta, 0), meses.length - 1);

    setIndice(novo);
    lista.current?.scrollToIndex({ index: novo, animated: true });
  };

  return (
    <Cartao style={estilos.cartao}>
      <View style={estilos.topo}>
        <SetaMes
          icone="chevron-back"
          rotulo="mês anterior"
          ativo={atual > 0}
          onPress={() => ir(-1)}
        />
        <Texto
          variante="subtitulo"
          accessibilityRole="header"
          accessibilityLiveRegion="polite"
          style={estilos.titulo}
        >
          {mes.titulo}
        </Texto>
        <SetaMes
          icone="chevron-forward"
          rotulo="próximo mês"
          ativo={atual < meses.length - 1}
          onPress={() => ir(1)}
        />
      </View>

      <View
        style={estilos.linha}
        accessibilityElementsHidden
        importantForAccessibility="no-hide-descendants"
      >
        {INICIAIS.map((inicial, posicao) => (
          <View key={posicao} style={[estilos.inicialCasa, { width: casa }]}>
            <Text
              maxFontSizeMultiplier={1.3}
              style={[estilos.inicial, { color: c.textoSecundario }]}
            >
              {inicial}
            </Text>
          </View>
        ))}
      </View>

      <View onLayout={(evento) => setLargura(Math.floor(evento.nativeEvent.layout.width))}>
        {largura > 0 ? (
          <FlatList
            ref={lista}
            data={meses}
            horizontal
            pagingEnabled
            showsHorizontalScrollIndicator={false}
            keyExtractor={(item) => `${item.ano}-${item.mes}`}
            getItemLayout={(_, posicao) => ({
              length: largura,
              offset: largura * posicao,
              index: posicao,
            })}
            initialScrollIndex={atual}
            initialNumToRender={2}
            windowSize={3}
            onMomentumScrollEnd={(evento) =>
              setIndice(Math.round(evento.nativeEvent.contentOffset.x / largura))
            }
            accessibilityLabel="meses, deslize para o lado"
            renderItem={({ item }) => (
              <PaginaMes
                ano={item.ano}
                mes={item.mes}
                hoje={hoje}
                marcas={marcas}
                largura={largura}
              />
            )}
          />
        ) : (
          <PaginaMes
            ano={visivel.ano}
            mes={visivel.mes}
            hoje={hoje}
            marcas={marcas}
            largura={larguraPagina}
          />
        )}
      </View>

      <Texto variante="legenda" secundario accessibilityLiveRegion="polite">
        {textoTreinosNoMes(mes.treinos)}
      </Texto>
      <Legenda />
    </Cartao>
  );
}

function PaginaMes({
  ano,
  mes,
  hoje,
  marcas,
  largura,
}: {
  ano: number;
  mes: number;
  hoje: Date;
  marcas: MarcasDosDias;
  largura: number;
}) {
  const dados = useMesDaSequencia(ano, mes, hoje, marcas);
  const casa = Math.floor(largura / 7);
  const anel = Math.min(casa - 4, ANEL_MAXIMO);
  const sobra = CASAS - dados.deslocamento - dados.dias.length;

  return (
    <View style={[estilos.grade, { width: largura }]}>
      {Array.from({ length: dados.deslocamento }, (_, posicao) => (
        <View key={`antes-${posicao}`} style={{ width: casa, height: casa + RESPIRO_LINHA }} />
      ))}
      {dados.dias.map((dia) => (
        <CasaDoDia key={dia.chave} dia={dia} mes={dados.mes} casa={casa} anel={anel} />
      ))}
      {Array.from({ length: Math.max(sobra, 0) }, (_, posicao) => (
        <View key={`depois-${posicao}`} style={{ width: casa, height: casa + RESPIRO_LINHA }} />
      ))}
    </View>
  );
}

type CoresCasa = { fundo?: string; arco: string; trilho: string; numero: string };

function CasaDoDia({
  dia,
  mes,
  casa,
  anel,
}: {
  dia: DiaDoCalendario;
  mes: number;
  casa: number;
  anel: number;
}) {
  const c = useCores();
  const pastel = (fundo: string, arco: string): CoresCasa => ({
    fundo,
    arco,
    trilho: semana.trilho,
    numero: semana.texto,
  });
  const cores: Record<EstadoDoCalendario, CoresCasa> = {
    completo: pastel(semana.completo, semana.anel.completo),
    parcial: pastel(semana.parcial, semana.anel.parcial),
    fraco: pastel(semana.fraco, semana.anel.fraco),
    congelado: pastel(c.congelado, semana.anel.congelado),
    descanso: {
      fundo: c.superficieSecundaria,
      arco: c.textoSecundario,
      trilho: 'transparent',
      numero: c.texto,
    },
    // Hoje em branco (o inverso no claro), como na faixa da semana da tela inicial
    hoje: { fundo: c.texto, arco: c.fundo, trilho: 'transparent', numero: c.fundo },
    futuro: { arco: c.textoSecundario, trilho: c.superficieSecundaria, numero: c.textoSecundario },
    vazio: { arco: 'transparent', trilho: 'transparent', numero: c.textoSecundario },
  };
  // Hoje fica em branco enquanto não tem treino registrado (mesmo sendo descanso)
  const semTreinoAinda = !['completo', 'parcial', 'fraco', 'congelado'].includes(dia.estado);
  const cor = dia.hoje && semTreinoAinda ? cores.hoje : cores[dia.estado];

  return (
    <View
      accessible
      accessibilityLabel={rotuloDoDiaDoCalendario(dia, mes)}
      style={[estilos.casa, { width: casa, height: casa + RESPIRO_LINHA }]}
    >
      <AnelProgresso
        tamanho={anel}
        espessura={3}
        margem={2}
        fracao={dia.fracao}
        corArco={cor.arco}
        corTrilho={cor.trilho}
        fundo={cor.fundo}
      >
        <Text
          maxFontSizeMultiplier={1.2}
          style={[
            estilos.numero,
            dia.hoje && estilos.numeroHoje,
            { color: cor.numero, fontSize: Math.min(fonte.rotulo, anel * 0.4) },
          ]}
        >
          {dia.dia}
        </Text>
      </AnelProgresso>
      {dia.estado === 'congelado' ? (
        <View style={[estilos.selo, { backgroundColor: semana.circulo }]}>
          <Ionicons name="snow" size={10} color={semana.anel.congelado} />
        </View>
      ) : null}
      {dia.hoje ? <View style={[estilos.pontoHoje, { backgroundColor: c.texto }]} /> : null}
    </View>
  );
}

function SetaMes({
  icone,
  rotulo,
  ativo,
  onPress,
}: {
  icone: 'chevron-back' | 'chevron-forward';
  rotulo: string;
  ativo: boolean;
  onPress: () => void;
}) {
  const c = useCores();

  return (
    <Pressable
      onPress={onPress}
      disabled={!ativo}
      accessibilityRole="button"
      accessibilityLabel={rotulo}
      accessibilityState={{ disabled: !ativo }}
      hitSlop={4}
      style={({ pressed }) => [
        estilos.seta,
        { backgroundColor: c.superficieSecundaria },
        pressed && { opacity: 0.75 },
        !ativo && { opacity: 0.35 },
      ]}
    >
      <Ionicons name={icone} size={22} color={c.texto} />
    </Pressable>
  );
}

function Legenda() {
  const c = useCores();
  const itens = [
    { cor: semana.completo, texto: 'completo' },
    { cor: semana.parcial, texto: 'metade' },
    { cor: semana.fraco, texto: 'pouco ou nada' },
    { cor: c.superficieSecundaria, texto: 'descanso' },
    { cor: c.congelado, texto: 'congelado' },
  ];

  return (
    <View
      style={estilos.legenda}
      accessibilityElementsHidden
      importantForAccessibility="no-hide-descendants"
    >
      {itens.map((item) => (
        <View key={item.texto} style={estilos.itemLegenda}>
          <View style={[estilos.pontoLegenda, { backgroundColor: item.cor }]} />
          <Texto variante="legenda" secundario>
            {item.texto}
          </Texto>
        </View>
      ))}
      <Texto variante="legenda" secundario>
        o anel mostra quanto do treino foi feito
      </Texto>
    </View>
  );
}

const estilos = StyleSheet.create({
  // Um pouco menos de respiro nas laterais: sobra espaço para as casas do mês
  cartao: {
    paddingHorizontal: espaco.md - 4,
  },
  topo: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: espaco.sm,
    paddingHorizontal: 4,
  },
  titulo: {
    flexShrink: 1,
    textAlign: 'center',
  },
  seta: {
    width: 44,
    height: 44,
    borderRadius: raio.total,
    alignItems: 'center',
    justifyContent: 'center',
  },
  linha: {
    flexDirection: 'row',
  },
  inicialCasa: {
    alignItems: 'center',
  },
  grade: {
    flexDirection: 'row',
    flexWrap: 'wrap',
  },
  casa: {
    alignItems: 'center',
    justifyContent: 'center',
  },
  inicial: {
    fontFamily: familia.rotulo,
    fontSize: fonte.legenda,
  },
  numero: {
    fontFamily: familia.corpoMedio,
  },
  numeroHoje: {
    fontFamily: familia.display,
  },
  selo: {
    position: 'absolute',
    top: 0,
    right: 0,
    width: 16,
    height: 16,
    borderRadius: raio.total,
    alignItems: 'center',
    justifyContent: 'center',
  },
  pontoHoje: {
    position: 'absolute',
    bottom: 0,
    width: 4,
    height: 4,
    borderRadius: raio.total,
  },
  legenda: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    columnGap: espaco.md,
    rowGap: espaco.xs,
    paddingHorizontal: 4,
  },
  itemLegenda: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: espaco.xs,
  },
  pontoLegenda: {
    width: 12,
    height: 12,
    borderRadius: raio.total,
  },
});
