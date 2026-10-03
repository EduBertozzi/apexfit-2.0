import { StyleSheet, View } from 'react-native';

import { formatarNumero } from '@/shared/lib/numero';
import { borda, espaco } from '@/shared/theme/tokens';
import { useCores } from '@/shared/theme/useCores';
import { Cartao, Texto } from '@/shared/ui';

import type { PlanoDieta } from '../contrato';

function Numero({ rotulo, valor }: { rotulo: string; valor: string }) {
  return (
    <View style={estilos.numero}>
      <Texto variante="rotulo" style={{ opacity: 0.7 }}>
        {rotulo}
      </Texto>
      <Texto variante="subtitulo">{valor}</Texto>
    </View>
  );
}

export function PlanoDietaDetalhe({ plano }: { plano: PlanoDieta }) {
  const c = useCores();
  const corHeroi = { color: c.textoHeroi };

  return (
    <View style={estilos.container}>
      <Cartao variante="heroi">
        <Texto variante="rotulo" style={{ color: c.textoHeroiSecundario }}>
          Meta do dia
        </Texto>
        <Texto variante="destaque" style={{ color: c.destaque }}>
          {formatarNumero(plano.caloriasDia)} kcal
        </Texto>
        <View style={estilos.numeros}>
          <Numero rotulo="Proteína" valor={`${plano.macros.proteinaG} g`} />
          <Numero rotulo="Carbo" valor={`${plano.macros.carboidratoG} g`} />
          <Numero rotulo="Gordura" valor={`${plano.macros.gorduraG} g`} />
        </View>
        <Texto style={[corHeroi, estilos.resumo]}>{plano.resumo}</Texto>
      </Cartao>

      {plano.refeicoes.map((refeicao) => (
        <Cartao key={`${refeicao.horario}-${refeicao.nome}`}>
          <View style={estilos.cabecalhoRefeicao}>
            <Texto variante="subtitulo" style={estilos.nomeRefeicao}>
              {refeicao.nome}
            </Texto>
            <Texto variante="rotulo" secundario>
              {refeicao.horario}
            </Texto>
          </View>
          <Texto variante="rotulo">{formatarNumero(refeicao.calorias)} kcal</Texto>

          <View style={[estilos.itens, { borderTopColor: c.superficieSecundaria }]}>
            {refeicao.itens.map((item) => (
              <View key={item.alimento} style={estilos.item}>
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
      ))}

      {plano.dicas.length > 0 ? (
        <Cartao titulo="Dicas">
          {plano.dicas.map((dica) => (
            <View key={dica} style={estilos.dica}>
              <View style={[estilos.marcador, { backgroundColor: c.destaque }]} />
              <Texto style={estilos.textoDica}>{dica}</Texto>
            </View>
          ))}
        </Cartao>
      ) : null}

      <Texto variante="legenda" secundario>
        {plano.aviso}
      </Texto>
    </View>
  );
}

const estilos = StyleSheet.create({
  container: {
    gap: espaco.md,
  },
  numeros: {
    flexDirection: 'row',
    marginTop: espaco.xs,
  },
  numero: {
    flex: 1,
  },
  resumo: {
    marginTop: espaco.xs,
  },
  cabecalhoRefeicao: {
    flexDirection: 'row',
    alignItems: 'baseline',
    justifyContent: 'space-between',
    gap: espaco.sm,
  },
  nomeRefeicao: {
    flex: 1,
  },
  itens: {
    borderTopWidth: borda.grossa,
    paddingTop: espaco.sm,
    gap: espaco.sm,
  },
  item: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    gap: espaco.md,
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
  marcador: {
    width: 8,
    height: 8,
    marginTop: 7,
  },
  textoDica: {
    flex: 1,
  },
});
