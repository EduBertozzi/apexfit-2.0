import { router } from 'expo-router';
import { ActivityIndicator, StyleSheet, View } from 'react-native';

import { PlanoDietaDetalhe } from '@/features/dieta/components/PlanoDietaDetalhe';
import { planoDesatualizado } from '@/features/dieta/logica';
import { useDietaStore } from '@/features/dieta/store';
import { calcularNecessidades } from '@/features/nutricao/calculos';
import { usePerfilStore } from '@/features/perfil/store';
import { espaco } from '@/shared/theme/tokens';
import { useCores } from '@/shared/theme/useCores';
import { Botao, Cartao, Tela, Texto } from '@/shared/ui';

export default function Dieta() {
  const c = useCores();
  const perfil = usePerfilStore((state) => state.perfil);
  const plano = useDietaStore((state) => state.plano);
  const origem = useDietaStore((state) => state.origem);
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
            A IA está montando as refeições com as suas metas. Pode levar até 1 minuto.
          </Texto>
        </View>
      ) : null}

      {erro ? (
        <Texto style={{ color: c.erro }} accessibilityLiveRegion="polite">
          {erro}
        </Texto>
      ) : null}

      {plano &&
      planoDesatualizado(plano.caloriasDia, calcularNecessidades(perfil)?.metaCalorias ?? null) ? (
        <Cartao titulo="Plano desatualizado" variante="tracejado">
          <Texto>
            Seu perfil mudou depois que este plano foi feito. Gere um novo para bater com a sua meta
            atual.
          </Texto>
        </Cartao>
      ) : null}

      {plano ? (
        <Botao
          titulo="Mudar algo com o coach"
          variante="destaque"
          onPress={() => router.push('/coach')}
        />
      ) : null}

      {plano && origem === 'demo' ? (
        <Texto variante="legenda" secundario>
          Modo demonstração: sem IA disponível, o próprio app montou este plano com as suas metas.
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
