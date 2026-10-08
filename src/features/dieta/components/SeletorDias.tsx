import { Pressable, ScrollView, StyleSheet, View } from 'react-native';

import { espaco, familia, raio } from '@/shared/theme/tokens';
import { useCores } from '@/shared/theme/useCores';
import { Texto } from '@/shared/ui';

import type { DiaDoSeletor } from '../semana';

type Props = {
  dias: readonly DiaDoSeletor[];
  selecionado: number;
  onSelecionar: (dia: number) => void;
};

const LARGURA_PILULA = 52;

/**
 * Os 7 dias da semana em pílulas que rolam para o lado. A escolhida fica em
 * menta; hoje ganha a palavra "hoje" e o dia com plano próprio, um ponto.
 */
export function SeletorDias({ dias, selecionado, onSelecionar }: Props) {
  const c = useCores();

  return (
    <ScrollView
      horizontal
      showsHorizontalScrollIndicator={false}
      contentContainerStyle={estilos.linha}
      accessibilityRole="tablist"
    >
      {dias.map((dia) => {
        const marcado = dia.dia === selecionado;
        const corTexto = marcado ? c.textoSobreDestaque : c.texto;

        return (
          <Pressable
            key={dia.dia}
            onPress={() => onSelecionar(dia.dia)}
            accessibilityRole="tab"
            accessibilityState={{ selected: marcado }}
            accessibilityLabel={`${dia.nome}${dia.hoje ? ', hoje' : ''}${dia.proprio ? ', plano só deste dia' : ''}`}
            testID={`dia-dieta-${dia.dia}`}
            style={({ pressed }) => [
              estilos.pilula,
              { backgroundColor: marcado ? c.destaque : c.superficie },
              pressed && { opacity: 0.75 },
            ]}
          >
            <Texto
              variante="rotulo"
              numberOfLines={1}
              maxFontSizeMultiplier={1.3}
              style={[estilos.sigla, { color: corTexto }]}
            >
              {dia.sigla}
            </Texto>
            <Texto
              variante="legenda"
              numberOfLines={1}
              maxFontSizeMultiplier={1.2}
              style={{ color: marcado ? c.textoSobreDestaque : c.textoSecundario }}
            >
              {dia.hoje ? 'hoje' : ' '}
            </Texto>
            <View
              style={[
                estilos.ponto,
                {
                  backgroundColor: dia.proprio
                    ? marcado
                      ? c.textoSobreDestaque
                      : c.destaque
                    : 'transparent',
                },
              ]}
            />
          </Pressable>
        );
      })}
    </ScrollView>
  );
}

const estilos = StyleSheet.create({
  linha: {
    gap: espaco.xs + 2,
    paddingVertical: espaco.xs,
  },
  pilula: {
    width: LARGURA_PILULA,
    minHeight: 64,
    alignItems: 'center',
    justifyContent: 'center',
    gap: 2,
    paddingVertical: espaco.sm,
    borderRadius: raio.total,
    borderCurve: 'continuous',
  },
  sigla: {
    fontFamily: familia.corpoMedio,
  },
  ponto: {
    width: 6,
    height: 6,
    borderRadius: 3,
  },
});
