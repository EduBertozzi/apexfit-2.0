import Ionicons from '@expo/vector-icons/Ionicons';
import { useMemo } from 'react';
import { StyleSheet, View } from 'react-native';

import { ChipsMacros } from '@/features/nutricao/components/ChipsMacros';
import { formatarNumero } from '@/shared/lib/numero';
import type { CorCategoria } from '@/shared/theme/tokens';
import { espaco, raio } from '@/shared/theme/tokens';
import { useCategorias, useCores } from '@/shared/theme/useCores';
import { Cartao, Texto } from '@/shared/ui';

import type { PlanoDieta } from '../contrato';
import { limparPlano, separarQuantidade } from '../texto';

/** Cada refeição ganha uma cor pastel, na ordem do dia, só para separar visualmente. */
const CORES_REFEICAO: CorCategoria[] = ['peito', 'aquecimento', 'braco', 'abdominal', 'perna'];

type Item = PlanoDieta['refeicoes'][number]['itens'][number];

/**
 * Linha de um alimento. O nome ocupa a largura que sobra (e quebra em
 * palavras, nunca letra por letra); a medida curta ("250 g") fica na
 * direita com largura limitada e a medida caseira vai embaixo do nome.
 */
function LinhaItem({ item, primeiro }: { item: Item; primeiro: boolean }) {
  const c = useCores();
  const { principal, detalhe } = separarQuantidade(item.quantidade);

  return (
    <View
      style={[
        estilos.item,
        !primeiro && { borderTopColor: c.borda, borderTopWidth: StyleSheet.hairlineWidth },
      ]}
      accessible
      accessibilityLabel={`${item.alimento}, ${item.quantidade}`}
    >
      <View style={estilos.nomeItem}>
        <Texto style={estilos.alimento}>{item.alimento}</Texto>
        {detalhe ? (
          <Texto variante="legenda" secundario>
            {detalhe}
          </Texto>
        ) : null}
      </View>
      {principal ? (
        <Texto variante="rotulo" style={estilos.quantidade}>
          {principal}
        </Texto>
      ) : null}
    </View>
  );
}

export function PlanoDietaDetalhe({ plano: original }: { plano: PlanoDieta }) {
  const c = useCores();
  const categorias = useCategorias();
  // Planos salvos antes da limpeza podem ter markdown da IA
  const plano = useMemo(() => limparPlano(original), [original]);

  return (
    <View style={estilos.container}>
      <Cartao variante="heroi">
        <Texto variante="rotulo" style={{ color: c.textoHeroiSecundario }}>
          meta do dia
        </Texto>
        <View style={estilos.linhaTotal}>
          <Texto variante="gigante" style={{ color: c.textoHeroi }}>
            {formatarNumero(plano.caloriasDia)}
          </Texto>
          <Texto variante="subtitulo" style={{ color: c.textoHeroiSecundario }}>
            kcal
          </Texto>
        </View>
        <ChipsMacros macros={plano.macros} />
        <Texto style={[estilos.resumo, { color: c.textoHeroi }]}>{plano.resumo}</Texto>
      </Cartao>

      {plano.refeicoes.map((refeicao, indice) => {
        const cor = CORES_REFEICAO[indice % CORES_REFEICAO.length];

        return (
          <Cartao key={`${indice}-${refeicao.horario}-${refeicao.nome}`}>
            <View style={estilos.cabecalhoRefeicao}>
              <Texto
                variante="subtitulo"
                accessibilityRole="header"
                style={[estilos.nomeRefeicao, { color: categorias.texto[cor] }]}
              >
                {refeicao.nome}
              </Texto>
              <View style={[estilos.horario, { backgroundColor: c.superficieSecundaria }]}>
                <Ionicons name="time-outline" size={14} color={c.textoSecundario} />
                <Texto variante="legenda" secundario>
                  {refeicao.horario}
                </Texto>
              </View>
            </View>
            <View style={[estilos.kcal, { backgroundColor: categorias.fundo[cor] }]}>
              <Texto variante="legenda" style={{ color: c.textoSobreDestaque }}>
                {formatarNumero(refeicao.calorias)} kcal
              </Texto>
            </View>

            <View style={estilos.itens}>
              {refeicao.itens.map((item, i) => (
                <LinhaItem key={`${i}-${item.alimento}`} item={item} primeiro={i === 0} />
              ))}
            </View>

            {refeicao.substituicoes.length > 0 ? (
              <View style={[estilos.trocas, { backgroundColor: c.superficieSecundaria }]}>
                <Texto variante="legenda" secundario>
                  pode trocar
                </Texto>
                {refeicao.substituicoes.map((troca, i) => (
                  <View key={`${i}-${troca}`} style={estilos.troca}>
                    <Ionicons
                      name="swap-horizontal"
                      size={14}
                      color={c.textoSecundario}
                      style={estilos.iconeTroca}
                    />
                    <Texto variante="legenda" style={estilos.textoTroca}>
                      {troca}
                    </Texto>
                  </View>
                ))}
              </View>
            ) : null}
          </Cartao>
        );
      })}

      {plano.dicas.length > 0 ? (
        <Cartao titulo="dicas">
          {plano.dicas.map((dica) => (
            <View key={dica} style={estilos.dica}>
              <Ionicons
                name="checkmark-circle"
                size={18}
                color={categorias.texto.aquecimento}
                style={estilos.icone}
              />
              <Texto style={estilos.textoDica}>{dica}</Texto>
            </View>
          ))}
        </Cartao>
      ) : null}

      <Texto variante="legenda" secundario style={estilos.aviso}>
        {plano.aviso}
      </Texto>
    </View>
  );
}

const estilos = StyleSheet.create({
  container: {
    gap: espaco.md,
  },
  linhaTotal: {
    flexDirection: 'row',
    alignItems: 'baseline',
    gap: espaco.sm,
    marginBottom: espaco.xs,
  },
  resumo: {
    marginTop: espaco.xs,
  },
  cabecalhoRefeicao: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: espaco.sm,
  },
  nomeRefeicao: {
    flex: 1,
    minWidth: 0,
  },
  kcal: {
    alignSelf: 'flex-start',
    paddingHorizontal: espaco.sm + 2,
    paddingVertical: 2,
    borderRadius: raio.total,
  },
  horario: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: espaco.xs,
    paddingHorizontal: espaco.sm + 2,
    paddingVertical: espaco.xs,
    borderRadius: raio.total,
  },
  itens: {
    marginTop: espaco.xs,
  },
  item: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: espaco.md,
    paddingVertical: espaco.sm,
  },
  // flexBasis 'auto' + minWidth 0: o nome nunca encolhe até uma letra por linha
  nomeItem: {
    flexGrow: 1,
    flexShrink: 1,
    flexBasis: 'auto',
    minWidth: 0,
    gap: 2,
  },
  alimento: {
    flexShrink: 1,
  },
  quantidade: {
    flexShrink: 0,
    maxWidth: '40%',
    textAlign: 'right',
  },
  trocas: {
    gap: espaco.xs,
    padding: espaco.sm + 2,
    borderRadius: raio.md,
  },
  troca: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: espaco.xs + 2,
  },
  iconeTroca: {
    marginTop: 2,
  },
  textoTroca: {
    flex: 1,
    minWidth: 0,
  },
  dica: {
    flexDirection: 'row',
    gap: espaco.sm,
    alignItems: 'flex-start',
  },
  icone: {
    marginTop: 3,
  },
  textoDica: {
    flex: 1,
  },
  aviso: {
    paddingHorizontal: espaco.xs,
  },
});
