import { router } from 'expo-router';
import { StyleSheet, View } from 'react-native';

import { chaveDoDia } from '@/shared/lib/data';
import { espaco } from '@/shared/theme/tokens';
import { useCores } from '@/shared/theme/useCores';
import { Botao, Cartao, Texto } from '@/shared/ui';

import { formatarKg, resumoPeso, textoVariacao, variacaoPorExtenso } from '../logica';
import { usePesoStore } from '../store';
import { GraficoPeso } from './GraficoPeso';

/** Resumo do peso: atual, variação em 30 dias e mini gráfico. Leva para a tela de peso. */
export function CartaoPeso({ pesoPerfilKg }: { pesoPerfilKg: number }) {
  const c = useCores();
  const registros = usePesoStore((state) => state.registros);
  const resumo = resumoPeso(registros, chaveDoDia(new Date()), pesoPerfilKg);

  return (
    <Cartao titulo="peso" variante="heroi">
      <View style={estilos.cabecalho}>
        <Texto variante="destaque" style={{ color: c.textoHeroi }}>
          {formatarKg(resumo.atualKg)}
        </Texto>
        {resumo.variacao30 !== null ? (
          <Texto
            variante="rotulo"
            style={{ color: c.destaque }}
            accessibilityLabel={variacaoPorExtenso(resumo.variacao30, 30)}
          >
            {textoVariacao(resumo.variacao30)} em 30 dias
          </Texto>
        ) : null}
      </View>

      {resumo.temRegistros ? (
        <GraficoPeso registros={registros} mini />
      ) : (
        <Texto variante="legenda" style={{ color: c.textoHeroiSecundario }}>
          peso do seu perfil. registre toda semana para ver a evolução.
        </Texto>
      )}

      <Botao titulo="registrar peso" variante="destaque" onPress={() => router.push('/peso')} />
    </Cartao>
  );
}

const estilos = StyleSheet.create({
  cabecalho: {
    flexDirection: 'row',
    alignItems: 'baseline',
    flexWrap: 'wrap',
    gap: espaco.sm,
  },
});
