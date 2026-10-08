import Ionicons from '@expo/vector-icons/Ionicons';
import { router } from 'expo-router';
import { useState } from 'react';
import {
  AccessibilityInfo,
  Pressable,
  StyleSheet,
  Text,
  View,
  type AccessibilityActionEvent,
  type StyleProp,
  type ViewStyle,
} from 'react-native';
import Animated from 'react-native-reanimated';

import { useVibrar } from '@/shared/lib/vibracao';
import { espaco, familia, fonte, raio } from '@/shared/theme/tokens';
import { useCategorias, useCores } from '@/shared/theme/useCores';
import { BarraProgresso } from '@/shared/ui';
import { SetaCartao } from '@/shared/ui/SetaCartao';
import { usePop } from '@/shared/ui/animacao';

import {
  anuncioAguaAdicionada,
  anuncioAguaDesfeita,
  dicaAguaCartao,
  textoAguaCartao,
} from '../formato';
import { bateuMetaAgora, PORCAO_RAPIDA_ML, progresso } from '../logica';
import { useAguaDoDia, useHidratacaoStore } from '../store';

const ACOES_ACESSIVEIS = [{ name: 'desfazer', label: 'desfazer o último copo' }];

/**
 * Card de água da tela inicial: um toque soma um copo de 250 ml na hora,
 * tocar e segurar desfaz o último. A seta (botão separado) abre a tela de água.
 */
export function CartaoAguaInicio({
  metaMl,
  style,
}: {
  metaMl: number;
  style?: StyleProp<ViewStyle>;
}) {
  const c = useCores();
  const cat = useCategorias();
  const { totalMl } = useAguaDoDia();
  const adicionar = useHidratacaoStore((state) => state.adicionar);
  const desfazer = useHidratacaoStore((state) => state.desfazer);
  const vibrar = useVibrar();
  const [pressionado, setPressionado] = useState(false);
  const texto = textoAguaCartao(totalMl, metaMl);
  const popTotal = usePop(totalMl);

  function beber() {
    const { antesMl, depoisMl } = adicionar(PORCAO_RAPIDA_ML);
    const bateu = bateuMetaAgora(antesMl, depoisMl, metaMl);

    vibrar(bateu ? 'sucesso' : 'leve');
    AccessibilityInfo.announceForAccessibility(
      anuncioAguaAdicionada(PORCAO_RAPIDA_ML, depoisMl, metaMl, bateu),
    );
  }

  function desfazerUltimo() {
    const { removidoMl, depoisMl } = desfazer();

    if (removidoMl !== null) {
      vibrar('leve');
    }

    AccessibilityInfo.announceForAccessibility(anuncioAguaDesfeita(removidoMl, depoisMl, metaMl));
  }

  function acaoAcessivel(evento: AccessibilityActionEvent) {
    if (evento.nativeEvent.actionName === 'desfazer') {
      desfazerUltimo();
    }
  }

  return (
    <View
      style={[
        estilos.cartao,
        { backgroundColor: c.superficie },
        style,
        pressionado && estilos.pressionado,
      ]}
    >
      <Pressable
        onPress={beber}
        onLongPress={desfazerUltimo}
        delayLongPress={450}
        onPressIn={() => setPressionado(true)}
        onPressOut={() => setPressionado(false)}
        accessibilityRole="button"
        accessibilityLabel={texto.acessivel}
        accessibilityHint={dicaAguaCartao(PORCAO_RAPIDA_ML)}
        accessibilityActions={ACOES_ACESSIVEIS}
        onAccessibilityAction={acaoAcessivel}
        testID="cartao-agua"
        style={estilos.conteudo}
      >
        <Ionicons name="water" size={36} color={cat.texto.agua} />

        <View style={estilos.textos}>
          <Animated.View style={[estilos.valores, popTotal]}>
            <Text maxFontSizeMultiplier={1.3} style={[estilos.total, { color: c.texto }]}>
              {texto.total}
            </Text>
            <Text maxFontSizeMultiplier={1.3} style={[estilos.meta, { color: c.textoSecundario }]}>
              {` ${texto.meta}`}
            </Text>
          </Animated.View>
          <Text maxFontSizeMultiplier={1.3} style={[estilos.rotulo, { color: c.textoSecundario }]}>
            água
          </Text>
        </View>

        <View style={[estilos.dica, { backgroundColor: c.agua }]}>
          <Text
            maxFontSizeMultiplier={1.3}
            style={[estilos.textoDica, { color: c.textoSobreDestaque }]}
          >
            +{PORCAO_RAPIDA_ML}
          </Text>
        </View>

        {/* Ocupa a sobra de altura do card com algo útil: quanto da meta já foi */}
        <View style={estilos.base}>
          <BarraProgresso
            valor={progresso(totalMl, metaMl)}
            cor={c.agua}
            corTrilho={c.superficieSecundaria}
            altura={8}
            animado
            rotuloAcessivel={texto.acessivel}
          />
        </View>
      </Pressable>

      <SetaCartao
        onPress={() => router.push('/agua')}
        rotulo="abrir a tela de água"
        dica="mostra o histórico e outros tamanhos de copo"
        testID="abrir-agua"
      />
    </View>
  );
}

const estilos = StyleSheet.create({
  cartao: {
    borderRadius: raio.lg,
    borderCurve: 'continuous',
    minHeight: 96,
  },
  pressionado: {
    opacity: 0.85,
    transform: [{ scale: 0.98 }],
  },
  conteudo: {
    flex: 1,
    padding: espaco.md,
    gap: espaco.sm,
  },
  textos: {
    gap: 0,
  },
  valores: {
    flexDirection: 'row',
    alignItems: 'baseline',
    flexWrap: 'wrap',
    alignSelf: 'flex-start',
  },
  total: {
    fontFamily: familia.display,
    fontSize: 30,
  },
  meta: {
    fontFamily: familia.corpo,
    fontSize: fonte.rotulo,
  },
  rotulo: {
    fontFamily: familia.corpo,
    fontSize: fonte.rotulo,
  },
  dica: {
    alignSelf: 'flex-start',
    borderRadius: raio.total,
    paddingHorizontal: espaco.sm + 2,
    paddingVertical: 2,
  },
  textoDica: {
    fontFamily: familia.corpoForte,
    fontSize: fonte.legenda,
  },
  base: {
    marginTop: 'auto',
    paddingTop: espaco.xs,
  },
});
