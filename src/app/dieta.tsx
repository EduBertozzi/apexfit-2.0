import { ActivityIndicator, StyleSheet, View } from 'react-native';

import { PlanoDietaDetalhe } from '@/features/dieta/components/PlanoDietaDetalhe';
import { useDietaStore } from '@/features/dieta/store';
import { usePerfilStore } from '@/features/perfil/store';
import { espaco } from '@/shared/theme/tokens';
import { useCores } from '@/shared/theme/useCores';
import { Botao, Tela, Texto } from '@/shared/ui';

export default function Dieta() {
  const c = useCores();
  const perfil = usePerfilStore((state) => state.perfil);
  const plano = useDietaStore((state) => state.plano);
  const gerando = useDietaStore((state) => state.gerando);
  const erro = useDietaStore((state) => state.erro);
  const gerar = useDietaStore((state) => state.gerar);

  if (!perfil) {
    return null;
  }

  return (
    <Tela bordas={['bottom']}>
      {gerando && !plano ? (
        <View style={estilos.carregando}>
          <ActivityIndicator size="large" color={c.texto} />
          <Texto variante="subtitulo">Montando seu plano</Texto>
          <Texto secundario style={estilos.centro}>
            A IA está calculando as refeições com as suas metas. Leva uns 30 segundos.
          </Texto>
        </View>
      ) : null}

      {erro ? (
        <Texto style={{ color: c.erro }} accessibilityLiveRegion="polite">
          {erro}
        </Texto>
      ) : null}

      {plano ? <PlanoDietaDetalhe plano={plano} /> : null}

      {!gerando || plano ? (
        <Botao
          titulo={plano ? 'Gerar outro plano' : 'Tentar de novo'}
          variante={plano ? 'secundario' : 'primario'}
          onPress={() => gerar(perfil)}
          carregando={gerando}
        />
      ) : null}
    </Tela>
  );
}

const estilos = StyleSheet.create({
  carregando: {
    alignItems: 'center',
    gap: espaco.md,
    paddingVertical: espaco.xl,
  },
  centro: {
    textAlign: 'center',
  },
});
