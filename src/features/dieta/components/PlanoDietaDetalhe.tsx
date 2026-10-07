import Ionicons from '@expo/vector-icons/Ionicons';
import { StyleSheet, View } from 'react-native';

import { ChipsMacros } from '@/features/nutricao/components/ChipsMacros';
import { formatarNumero } from '@/shared/lib/numero';
import type { CorCategoria } from '@/shared/theme/tokens';
import { espaco, raio } from '@/shared/theme/tokens';
import { useCategorias, useCores } from '@/shared/theme/useCores';
import { Cartao, Texto } from '@/shared/ui';

import type { PlanoDieta } from '../contrato';

/** Cada refeição ganha uma cor pastel, na ordem do dia, só para separar visualmente. */
const CORES_REFEICAO: CorCategoria[] = ['peito', 'aquecimento', 'braco', 'abdominal', 'perna'];

export function PlanoDietaDetalhe({ plano }: { plano: PlanoDieta }) {
  const c = useCores();
  const categorias = useCategorias();

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
          <Cartao key={`${refeicao.horario}-${refeicao.nome}`}>
            <View style={estilos.cabecalhoRefeicao}>
              <Texto
                variante="subtitulo"
                accessibilityRole="header"
                style={[estilos.nomeRefeicao, { color: categorias.texto[cor] }]}
              >
                {refeicao.nome.toLowerCase()}
              </Texto>
              <View style={[estilos.horario, { backgroundColor: c.superficieSecundaria }]}>
                <Ionicons name="time-outline" size={14} color={c.textoSecundario} />
                <Texto variante="legenda" secundario>
                  {refeicao.horario}
                </Texto>
              </View>
            </View>
            <Texto variante="rotulo" secundario>
              {formatarNumero(refeicao.calorias)} kcal
            </Texto>

            <View style={estilos.itens}>
              {refeicao.itens.map((item, i) => (
                <View
                  key={item.alimento}
                  style={[
                    estilos.item,
                    i > 0 && { borderTopColor: c.borda, borderTopWidth: StyleSheet.hairlineWidth },
                  ]}
                >
                  <Texto style={estilos.alimento}>{item.alimento}</Texto>
                  <Texto secundario style={estilos.quantidade}>
                    {item.quantidade}
                  </Texto>
                </View>
              ))}
            </View>

            {refeicao.substituicoes.length > 0 ? (
              <Texto variante="legenda" secundario>
                Pode trocar: {refeicao.substituicoes.join('; ')}.
              </Texto>
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
    justifyContent: 'space-between',
    gap: espaco.md,
    paddingVertical: espaco.sm,
  },
  alimento: {
    flex: 1,
  },
  quantidade: {
    flexShrink: 1,
    textAlign: 'right',
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
