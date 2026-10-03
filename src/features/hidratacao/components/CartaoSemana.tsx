import { StyleSheet, View } from 'react-native';

import { borda, espaco } from '@/shared/theme/tokens';
import { useCores } from '@/shared/theme/useCores';
import { Cartao, Texto } from '@/shared/ui';

import { historicoDeDias, sequenciaAtual } from '../historico';
import { useHidratacaoStore } from '../store';

const ALTURA_GRAFICO = 88;

function textoSequencia(dias: number): string {
  if (dias === 0) {
    return 'Bata a meta hoje para começar uma sequência.';
  }

  return dias === 1 ? '1 dia seguido batendo a meta.' : `${dias} dias seguidos batendo a meta.`;
}

/** Barras dos últimos 7 dias. Para o leitor de tela vira um resumo em texto. */
export function CartaoSemana({ metaMl }: { metaMl: number }) {
  const c = useCores();
  const registros = useHidratacaoStore((state) => state.registros);

  const hoje = new Date();
  const dias = historicoDeDias(registros, hoje, metaMl);
  const sequencia = sequenciaAtual(registros, hoje, metaMl);
  const diasBatidos = dias.filter((dia) => dia.bateu).length;

  const resumoAcessivel = `Últimos 7 dias: meta batida em ${diasBatidos} de 7. ${textoSequencia(sequencia)}`;

  return (
    <Cartao titulo="Água na semana">
      <View style={estilos.cabecalho}>
        <Texto variante="destaque">{sequencia}</Texto>
        <Texto variante="rotulo" style={estilos.textoSequencia}>
          {sequencia === 1 ? 'dia seguido' : 'dias seguidos'}
        </Texto>
      </View>

      <View
        accessible
        accessibilityRole="image"
        accessibilityLabel={resumoAcessivel}
        style={estilos.grafico}
      >
        {dias.map((dia) => (
          <View key={dia.chave} style={estilos.coluna}>
            <View style={[estilos.trilho, { backgroundColor: c.superficieSecundaria }]}>
              <View
                style={[
                  estilos.barra,
                  {
                    height: `${Math.max(dia.fracao * 100, dia.totalMl > 0 ? 6 : 0)}%`,
                    backgroundColor: dia.bateu ? c.destaque : c.textoSecundario,
                    borderColor: dia.bateu ? c.texto : 'transparent',
                  },
                ]}
              />
            </View>
            <Texto
              variante="rotulo"
              secundario={!dia.hoje}
              style={
                dia.hoje && {
                  backgroundColor: c.destaque,
                  color: c.textoSobreDestaque,
                  paddingHorizontal: 4,
                }
              }
            >
              {dia.inicial}
            </Texto>
          </View>
        ))}
      </View>

      <Texto variante="legenda" secundario>
        {textoSequencia(sequencia)} Meta batida em {diasBatidos} dos últimos 7 dias.
      </Texto>
    </Cartao>
  );
}

const estilos = StyleSheet.create({
  cabecalho: {
    flexDirection: 'row',
    alignItems: 'baseline',
    gap: espaco.sm,
  },
  textoSequencia: {
    flexShrink: 1,
  },
  grafico: {
    flexDirection: 'row',
    gap: espaco.sm,
    marginTop: espaco.xs,
  },
  coluna: {
    flex: 1,
    alignItems: 'center',
    gap: espaco.xs,
  },
  trilho: {
    width: '100%',
    height: ALTURA_GRAFICO,
    justifyContent: 'flex-end',
  },
  barra: {
    width: '100%',
    borderWidth: borda.grossa,
  },
});
