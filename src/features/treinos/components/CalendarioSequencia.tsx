import Ionicons from '@expo/vector-icons/Ionicons';
import { useState } from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';

import { borda, espaco, familia, fonte, raio, semana } from '@/shared/theme/tokens';
import { useCores } from '@/shared/theme/useCores';
import { Cartao, Texto } from '@/shared/ui';

import {
  mesVizinho,
  rotuloDoDiaDoCalendario,
  textoTreinosNoMes,
  type DiaDoCalendario,
  type EstadoDoCalendario,
} from '../sequencia';
import { useMesDaSequencia } from '../useSequencia';

const INICIAIS = ['d', 's', 't', 'q', 'q', 's', 's'];

type Props = {
  hoje: Date;
};

/** Calendário do mês com as cores da faixa da semana. Volta até o mês do primeiro treino. */
export function CalendarioSequencia({ hoje }: Props) {
  const c = useCores();
  const [visivel, setVisivel] = useState({ ano: hoje.getFullYear(), mes: hoje.getMonth() });
  const mes = useMesDaSequencia(visivel.ano, visivel.mes, hoje);
  const ir = (delta: number) => setVisivel(mesVizinho(visivel.ano, visivel.mes, delta));

  const fundoDe: Record<EstadoDoCalendario, string> = {
    completo: semana.completo,
    parcial: semana.parcial,
    fraco: semana.fraco,
    descanso: c.superficieSecundaria,
    hoje: 'transparent',
    futuro: 'transparent',
    vazio: 'transparent',
  };
  const pintado = (dia: DiaDoCalendario) =>
    dia.estado === 'completo' || dia.estado === 'parcial' || dia.estado === 'fraco';

  return (
    <Cartao>
      <View style={estilos.topo}>
        <SetaMes
          icone="chevron-back"
          rotulo="mês anterior"
          ativo={mes.temAnterior}
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
          ativo={mes.temProximo}
          onPress={() => ir(1)}
        />
      </View>

      <View
        style={estilos.grade}
        accessibilityElementsHidden
        importantForAccessibility="no-hide-descendants"
      >
        {INICIAIS.map((inicial, indice) => (
          <View key={indice} style={estilos.casa}>
            <Text
              maxFontSizeMultiplier={1.3}
              style={[estilos.inicial, { color: c.textoSecundario }]}
            >
              {inicial}
            </Text>
          </View>
        ))}
      </View>

      <View style={estilos.grade}>
        {Array.from({ length: mes.deslocamento }, (_, indice) => (
          <View key={`vazio-${indice}`} style={estilos.casa} />
        ))}
        {mes.dias.map((dia) => (
          <View
            key={dia.chave}
            accessible
            accessibilityLabel={rotuloDoDiaDoCalendario(dia, mes.mes)}
            style={estilos.casa}
          >
            <View
              style={[
                estilos.dia,
                {
                  backgroundColor: fundoDe[dia.estado],
                  borderColor: dia.hoje ? c.texto : 'transparent',
                },
              ]}
            >
              <Text
                maxFontSizeMultiplier={1.3}
                style={[
                  estilos.numero,
                  {
                    color: pintado(dia)
                      ? semana.texto
                      : dia.estado === 'hoje' || dia.estado === 'descanso'
                        ? c.texto
                        : c.textoSecundario,
                  },
                ]}
              >
                {dia.dia}
              </Text>
            </View>
          </View>
        ))}
      </View>

      <Texto variante="legenda" secundario accessibilityLiveRegion="polite">
        {textoTreinosNoMes(mes.treinos)}
      </Texto>
      <Legenda />
    </Cartao>
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
    </View>
  );
}

const estilos = StyleSheet.create({
  topo: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: espaco.sm,
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
  grade: {
    flexDirection: 'row',
    flexWrap: 'wrap',
  },
  casa: {
    width: `${100 / 7}%`,
    aspectRatio: 1,
    padding: 3,
    alignItems: 'center',
    justifyContent: 'center',
  },
  dia: {
    width: '100%',
    height: '100%',
    borderRadius: raio.total,
    borderWidth: borda.grossa,
    alignItems: 'center',
    justifyContent: 'center',
  },
  inicial: {
    fontFamily: familia.rotulo,
    fontSize: fonte.legenda,
  },
  numero: {
    fontFamily: familia.corpoMedio,
    fontSize: fonte.rotulo,
  },
  legenda: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: espaco.md,
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
