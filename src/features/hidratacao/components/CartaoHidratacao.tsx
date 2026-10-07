import Ionicons from '@expo/vector-icons/Ionicons';
import { useState } from 'react';
import { AccessibilityInfo, Pressable, StyleSheet, View } from 'react-native';
import Animated from 'react-native-reanimated';

import { formatarNumero } from '@/shared/lib/numero';
import { useVibrar } from '@/shared/lib/vibracao';
import { espaco, raio } from '@/shared/theme/tokens';
import { useCategorias, useCores } from '@/shared/theme/useCores';
import { BarraProgresso, Cartao, Texto } from '@/shared/ui';
import { useEntrada } from '@/shared/ui/animacao';

import { bateuMetaAgora, PORCOES_ML, progresso } from '../logica';
import { useAguaDoDia, useHidratacaoStore } from '../store';

type Props = {
  metaMl: number;
};

const TAMANHO_BOTAO = 52;

/** Faixa "meta batida": entra crescendo com uma mola. */
function FaixaMetaBatida({ cor }: { cor: string }) {
  const c = useCores();
  const entrada = useEntrada();

  return (
    <Animated.View style={[estilos.comemoracao, { backgroundColor: cor }, entrada]}>
      <Ionicons name="checkmark-circle" size={18} color={c.textoSobreDestaque} />
      <Texto variante="rotulo" style={{ color: c.textoSobreDestaque }}>
        meta batida, boa!
      </Texto>
    </Animated.View>
  );
}

/** Água de hoje: total, barra de progresso, copos rápidos e desfazer. */
export function CartaoHidratacao({ metaMl }: Props) {
  const c = useCores();
  const categorias = useCategorias();
  const { totalMl, podeDesfazer } = useAguaDoDia();
  const adicionar = useHidratacaoStore((state) => state.adicionar);
  const desfazer = useHidratacaoStore((state) => state.desfazer);
  const vibrar = useVibrar();
  const [comemorando, setComemorando] = useState(false);

  const fracao = progresso(totalMl, metaMl);
  const faltamMl = Math.max(metaMl - totalMl, 0);
  // Azul pastel como fundo (com texto escuro); a versão forte para ícone e texto no modo claro
  const corAgua = c.agua;
  const corAguaTexto = categorias.texto.agua;

  function beber(ml: number) {
    const { antesMl, depoisMl } = adicionar(ml);
    const bateu = bateuMetaAgora(antesMl, depoisMl, metaMl);

    setComemorando(bateu);

    if (bateu) {
      // A live region só funciona no Android; no iPhone o anúncio é explícito
      AccessibilityInfo.announceForAccessibility('Meta de água batida! Boa!');
    }

    vibrar(bateu ? 'sucesso' : 'leve');
  }

  function desfazerUltimo() {
    desfazer();
    setComemorando(false);
  }

  return (
    <Cartao>
      <View style={estilos.linhaTopo}>
        <View style={estilos.titulo}>
          <Ionicons name="water" size={22} color={corAguaTexto} />
          <Texto variante="rotulo" style={{ color: corAguaTexto }} accessibilityRole="header">
            água de hoje
          </Texto>
        </View>
        <Texto variante="rotulo" secundario>
          {Math.round(fracao * 100)}%
        </Texto>
      </View>

      <View style={estilos.linhaTotal}>
        <Texto variante="gigante" testID="agua-total">
          {formatarNumero(totalMl)}
        </Texto>
        <Texto variante="subtitulo" secundario>
          / {formatarNumero(metaMl)} ml
        </Texto>
      </View>

      <BarraProgresso
        valor={fracao}
        cor={corAgua}
        altura={14}
        mola={comemorando}
        rotuloAcessivel={`Água de hoje: ${totalMl} de ${metaMl} mililitros`}
      />

      {comemorando ? (
        <FaixaMetaBatida cor={corAgua} />
      ) : (
        <Texto variante="legenda" secundario accessibilityLiveRegion="polite">
          {faltamMl > 0
            ? `Faltam ${formatarNumero(faltamMl)} ml para a meta`
            : 'Meta do dia concluída'}
        </Texto>
      )}

      <View style={estilos.botoes}>
        {PORCOES_ML.map((ml) => (
          <Pressable
            key={ml}
            onPress={() => beber(ml)}
            accessibilityRole="button"
            accessibilityLabel={`Adicionar ${ml} mililitros`}
            style={({ pressed }) => [
              estilos.copo,
              { backgroundColor: corAgua },
              pressed && { opacity: 0.75 },
            ]}
          >
            <Texto variante="rotulo" style={{ color: c.textoSobreDestaque }}>
              +{ml} ml
            </Texto>
          </Pressable>
        ))}
        <Pressable
          onPress={desfazerUltimo}
          disabled={!podeDesfazer}
          accessibilityRole="button"
          accessibilityLabel="Desfazer último"
          accessibilityState={{ disabled: !podeDesfazer }}
          style={({ pressed }) => [
            estilos.desfazer,
            { backgroundColor: c.superficieSecundaria },
            pressed && { opacity: 0.75 },
            !podeDesfazer && { opacity: 0.4 },
          ]}
        >
          <Ionicons name="arrow-undo" size={22} color={c.texto} />
        </Pressable>
      </View>
    </Cartao>
  );
}

const estilos = StyleSheet.create({
  linhaTopo: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  titulo: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: espaco.xs + 2,
  },
  linhaTotal: {
    flexDirection: 'row',
    alignItems: 'baseline',
    flexWrap: 'wrap',
    gap: espaco.xs + 2,
  },
  comemoracao: {
    flexDirection: 'row',
    alignItems: 'center',
    alignSelf: 'flex-start',
    gap: espaco.xs + 2,
    paddingHorizontal: espaco.md - 4,
    paddingVertical: espaco.xs + 2,
    borderRadius: raio.total,
  },
  botoes: {
    flexDirection: 'row',
    gap: espaco.sm,
    marginTop: espaco.sm,
  },
  copo: {
    flex: 1,
    minHeight: TAMANHO_BOTAO,
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: raio.total,
  },
  desfazer: {
    width: TAMANHO_BOTAO,
    height: TAMANHO_BOTAO,
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: raio.total,
  },
});
