import { router } from 'expo-router';
import { ActivityIndicator, StyleSheet, View } from 'react-native';

import { PlanoDietaDetalhe } from '@/features/dieta/components/PlanoDietaDetalhe';
import { planoDesatualizado } from '@/features/dieta/logica';
import { useDietaStore } from '@/features/dieta/store';
import { calcularNecessidades } from '@/features/nutricao/calculos';
import { usePerfilStore } from '@/features/perfil/store';
import { espaco, raio } from '@/shared/theme/tokens';
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
        <Cartao>
          <View style={estilos.carregando}>
            <ActivityIndicator size="large" color={c.texto} />
            <Texto variante="subtitulo">montando seu plano</Texto>
            <Texto secundario style={estilos.centro}>
              a IA está montando as refeições com as suas metas. pode levar até 1 minuto.
            </Texto>
          </View>
        </Cartao>
      ) : null}

      {erro ? (
        <Texto style={{ color: c.erro }} accessibilityLiveRegion="polite">
          {erro}
        </Texto>
      ) : null}

      {plano &&
      planoDesatualizado(plano.caloriasDia, calcularNecessidades(perfil)?.metaCalorias ?? null) ? (
        <Cartao titulo="plano desatualizado" variante="tracejado">
          <Texto>
            seu perfil mudou depois que este plano foi feito. gere um novo para bater com a sua meta
            atual.
          </Texto>
        </Cartao>
      ) : null}

      {plano && origem === 'demo' ? (
        <View style={estilos.demo}>
          <View style={[estilos.selo, { backgroundColor: c.superficieSecundaria }]}>
            <Texto variante="legenda">modo demonstração</Texto>
          </View>
          <Texto variante="legenda" secundario>
            sem IA disponível, o próprio app montou este plano com as suas metas.
          </Texto>
        </View>
      ) : null}

      {plano ? <PlanoDietaDetalhe plano={plano} /> : null}

      {plano ? (
        <Botao
          titulo="mudar algo com o coach"
          variante="destaque"
          onPress={() => router.push('/coach')}
        />
      ) : null}

      {!gerando || plano ? (
        <Botao
          titulo={plano ? 'gerar outro plano' : 'tentar de novo'}
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
    paddingVertical: espaco.lg,
  },
  centro: {
    textAlign: 'center',
  },
  demo: {
    gap: espaco.xs,
    paddingHorizontal: espaco.xs,
  },
  selo: {
    alignSelf: 'flex-start',
    paddingHorizontal: espaco.sm + 2,
    paddingVertical: espaco.xs,
    borderRadius: raio.total,
  },
});
