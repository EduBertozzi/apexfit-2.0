import { StyleSheet, View } from 'react-native';

import { espaco, raio } from '@/shared/theme/tokens';
import { useCores } from '@/shared/theme/useCores';
import { Cartao, Texto } from '@/shared/ui';

import { historicoDeDias, sequenciaAtual } from '../historico';
import { useHidratacaoStore } from '../store';

const ALTURA_GRAFICO = 96;
const TAMANHO_DIA = 32;

function textoSequencia(dias: number): string {
  if (dias === 0) {
    return 'bata a meta hoje para começar uma sequência.';
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
    <Cartao titulo="água na semana">
      <View style={estilos.cabecalho}>
        <Texto variante="destaque">{sequencia}</Texto>
        <Texto variante="rotulo" secundario style={estilos.textoSequencia}>
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
              {dia.totalMl > 0 ? (
                <View
                  style={[
                    estilos.barra,
                    {
                      height: `${Math.max(dia.fracao * 100, 12)}%`,
                      backgroundColor: dia.bateu ? c.agua : c.textoSecundario,
                    },
                  ]}
                />
              ) : null}
            </View>
            <View style={[estilos.dia, dia.hoje && { backgroundColor: c.texto }]}>
              <Texto
                variante="legenda"
                secundario={!dia.hoje}
                style={dia.hoje && { color: c.superficie }}
              >
                {dia.inicial}
              </Texto>
            </View>
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
    gap: espaco.sm,
  },
  trilho: {
    width: '100%',
    maxWidth: 36,
    height: ALTURA_GRAFICO,
    justifyContent: 'flex-end',
    borderRadius: raio.total,
    overflow: 'hidden',
  },
  barra: {
    width: '100%',
    borderRadius: raio.total,
  },
  dia: {
    width: TAMANHO_DIA,
    height: TAMANHO_DIA,
    borderRadius: raio.total,
    alignItems: 'center',
    justifyContent: 'center',
  },
});
