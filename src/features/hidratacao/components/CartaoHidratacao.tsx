import * as Haptics from 'expo-haptics';
import { useState } from 'react';
import { Platform, StyleSheet, View } from 'react-native';

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
  const [comemorando, setComemorando] = useState(false);

  const fracao = progresso(totalMl, metaMl);
  const faltamMl = Math.max(metaMl - totalMl, 0);

  function beber(ml: number) {
    const { antesMl, depoisMl } = adicionar(ml);
    const bateu = bateuMetaAgora(antesMl, depoisMl, metaMl);

    setComemorando(bateu);
    vibrar(bateu ? 'sucesso' : 'leve');
  }

  function desfazerUltimo() {
    desfazer();
    setComemorando(false);
  }

  return (
    <Cartao titulo="Hidratação">
      <View style={estilos.linhaTotal}>
        <Texto variante="destaque" testID="agua-total">
          {formatarNumero(totalMl)}
        </Texto>
        <Texto secundario>/ {formatarNumero(metaMl)} ml</Texto>
      </View>

      <BarraProgresso
        valor={fracao}
        cor={c.agua}
        rotuloAcessivel={`Água de hoje: ${totalMl} de ${metaMl} mililitros`}
      />

      <Texto variante="legenda" secundario accessibilityLiveRegion="polite">
        {comemorando
          ? '🎉 Meta de água batida! Boa!'
          : faltamMl > 0
            ? `Faltam ${formatarNumero(faltamMl)} ml para a meta`
            : 'Meta do dia concluída'}
      </Texto>

      <View style={estilos.botoes}>
        {PORCOES_ML.map((ml) => (
          <View key={ml} style={estilos.botao}>
            <Botao
              titulo={`+${ml} ml`}
              descricaoAcessivel={`Adicionar ${ml} mililitros`}
              variante="secundario"
              onPress={() => beber(ml)}
            />
          </View>
        ))}
      </View>

      <Botao
        titulo="Desfazer último"
        variante="texto"
        onPress={desfazerUltimo}
        desabilitado={!podeDesfazer}
      />
    </Cartao>
  );
}

const estilos = StyleSheet.create({
  linhaTotal: {
    flexDirection: 'row',
    alignItems: 'baseline',
    gap: espaco.sm,
  },
  botoes: {
    flexDirection: 'row',
    gap: espaco.sm,
    marginTop: espaco.xs,
  },
  botao: {
    flex: 1,
  },
});
