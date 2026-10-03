import * as Haptics from 'expo-haptics';
import { useState } from 'react';
import { AccessibilityInfo, Platform, StyleSheet, View } from 'react-native';

import { useAjustesStore } from '@/features/ajustes/store';
import { formatarNumero } from '@/shared/lib/numero';
import { espaco } from '@/shared/theme/tokens';
import { useCores } from '@/shared/theme/useCores';
import { BarraProgresso, Botao, Cartao, Texto } from '@/shared/ui';

import { bateuMetaAgora, PORCOES_ML, progresso } from '../logica';
import { useAguaDoDia, useHidratacaoStore } from '../store';

type Props = {
  metaMl: number;
};

function vibrar(tipo: 'leve' | 'sucesso') {
  // Vibração não existe no navegador
  if (Platform.OS === 'web') {
    return;
  }

  if (tipo === 'sucesso') {
    Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
  } else {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
  }
}

export function CartaoHidratacao({ metaMl }: Props) {
  const c = useCores();
  const { totalMl, podeDesfazer } = useAguaDoDia();
  const adicionar = useHidratacaoStore((state) => state.adicionar);
  const desfazer = useHidratacaoStore((state) => state.desfazer);
  const vibracaoLigada = useAjustesStore((state) => state.vibracao);
  const [comemorando, setComemorando] = useState(false);

  const fracao = progresso(totalMl, metaMl);
  const faltamMl = Math.max(metaMl - totalMl, 0);

  function beber(ml: number) {
    const { antesMl, depoisMl } = adicionar(ml);
    const bateu = bateuMetaAgora(antesMl, depoisMl, metaMl);

    setComemorando(bateu);

    if (bateu) {
      // A live region só funciona no Android; no iPhone o anúncio é explícito
      AccessibilityInfo.announceForAccessibility('Meta de água batida! Boa!');
    }

    if (vibracaoLigada) {
      vibrar(bateu ? 'sucesso' : 'leve');
    }
  }

  function desfazerUltimo() {
    desfazer();
    setComemorando(false);
  }

  return (
    <Cartao variante="heroi">
      <View style={estilos.linhaTopo}>
        <Texto variante="rotulo" style={{ color: c.textoHeroi }} accessibilityRole="header">
          Hidratação
        </Texto>
        <Texto variante="destaque" style={{ color: c.destaque }}>
          {Math.round(fracao * 100)}%
        </Texto>
      </View>

      <BarraProgresso
        valor={fracao}
        cor={c.agua}
        corTrilho={c.trilhoHeroi}
        rotuloAcessivel={`Água de hoje: ${totalMl} de ${metaMl} mililitros`}
      />

      <View style={estilos.linhaTotal}>
        <Texto variante="subtitulo" style={{ color: c.textoHeroi }} testID="agua-total">
          {formatarNumero(totalMl)} ml
        </Texto>
        <Texto variante="rotulo" style={{ color: c.textoHeroiSecundario }}>
          Meta {formatarNumero(metaMl)}
        </Texto>
      </View>

      {comemorando ? (
        <View style={[estilos.comemoracao, { backgroundColor: c.destaque }]}>
          <Texto variante="subtitulo" style={{ color: c.textoSobreDestaque }}>
            Meta batida! Boa!
          </Texto>
        </View>
      ) : (
        <Texto
          variante="legenda"
          style={{ color: c.textoHeroiSecundario }}
          accessibilityLiveRegion="polite"
        >
          {faltamMl > 0
            ? `Faltam ${formatarNumero(faltamMl)} ml para a meta`
            : 'Meta do dia concluída'}
        </Texto>
      )}

      <View style={estilos.botoes}>
        {PORCOES_ML.map((ml) => (
          <View key={ml} style={estilos.botao}>
            <Botao
              titulo={`+${ml}`}
              descricaoAcessivel={`Adicionar ${ml} mililitros`}
              variante="destaque"
              onPress={() => beber(ml)}
            />
          </View>
        ))}
        <View style={estilos.botaoIcone}>
          <Botao
            titulo="Desfazer último"
            icone="arrow-undo"
            variante="heroi"
            onPress={desfazerUltimo}
            desabilitado={!podeDesfazer}
          />
        </View>
      </View>
    </Cartao>
  );
}

const estilos = StyleSheet.create({
  linhaTopo: {
    flexDirection: 'row',
    alignItems: 'baseline',
    justifyContent: 'space-between',
  },
  linhaTotal: {
    flexDirection: 'row',
    alignItems: 'baseline',
    justifyContent: 'space-between',
    marginTop: espaco.xs,
  },
  comemoracao: {
    paddingHorizontal: espaco.sm,
    paddingVertical: espaco.xs,
    alignSelf: 'flex-start',
  },
  botoes: {
    flexDirection: 'row',
    gap: espaco.sm,
    marginTop: espaco.xs,
  },
  botao: {
    flex: 1,
  },
  botaoIcone: {
    width: 56,
  },
});
