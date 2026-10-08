import type { ReactNode } from 'react';
import { StyleSheet, View } from 'react-native';

import { Pilula } from '@/features/treinos/components/Pilula';
import { espaco } from '@/shared/theme/tokens';
import { CampoTexto, Texto } from '@/shared/ui';

import {
  ESTILOS_DIETA,
  LIMITES_PREFERENCIAS,
  NOME_ESTILO,
  NOME_ORCAMENTO,
  NOME_PREPARO,
  NOME_REFEICOES,
  NOME_SEM,
  ORCAMENTOS_DIETA,
  PREPAROS_DIETA,
  REFEICOES_DIETA,
  SEM_DIETA,
} from '../preferencias';
import { useDietaStore } from '../store';

function Secao({ rotulo, children }: { rotulo: string; children: ReactNode }) {
  return (
    <View style={estilos.secao}>
      <Texto variante="rotulo" secundario>
        {rotulo}
      </Texto>
      <View style={estilos.pilulas}>{children}</View>
    </View>
  );
}

/**
 * Opções da dieta na central de IA: refeições, estilo, o que tirar, orçamento,
 * preparo, o que evitar e observações. Só mostra e repassa para a store.
 */
export function OpcoesDieta() {
  const preferencias = useDietaStore((state) => state.preferencias);
  const mudar = useDietaStore((state) => state.mudarPreferencias);
  const alternarSem = useDietaStore((state) => state.alternarSem);

  return (
    <View style={estilos.raiz}>
      <Secao rotulo="refeições por dia">
        {REFEICOES_DIETA.map((refeicoes) => (
          <Pilula
            key={refeicoes}
            rotulo={NOME_REFEICOES[refeicoes]}
            selecionada={preferencias.refeicoes === refeicoes}
            onPress={() => mudar({ refeicoes })}
            rotuloAcessivel={
              refeicoes === 'auto' ? 'refeições automáticas' : `${refeicoes} refeições por dia`
            }
            testID={`dieta-refeicoes-${refeicoes}`}
          />
        ))}
      </Secao>

      <Secao rotulo="o que você come">
        {ESTILOS_DIETA.map((estilo) => (
          <Pilula
            key={estilo}
            rotulo={NOME_ESTILO[estilo]}
            selecionada={preferencias.estilo === estilo}
            onPress={() => mudar({ estilo })}
            testID={`dieta-estilo-${estilo}`}
          />
        ))}
        {SEM_DIETA.map((item) => (
          <Pilula
            key={item}
            rotulo={NOME_SEM[item]}
            selecionada={preferencias.sem.includes(item)}
            onPress={() => alternarSem(item)}
            testID={`dieta-sem-${item}`}
          />
        ))}
      </Secao>

      <Secao rotulo="orçamento">
        {ORCAMENTOS_DIETA.map((orcamento) => (
          <Pilula
            key={orcamento}
            rotulo={NOME_ORCAMENTO[orcamento]}
            selecionada={preferencias.orcamento === orcamento}
            onPress={() => mudar({ orcamento })}
            rotuloAcessivel={`orçamento ${NOME_ORCAMENTO[orcamento]}`}
            testID={`dieta-orcamento-${orcamento}`}
          />
        ))}
      </Secao>

      <Secao rotulo="preparo">
        {PREPAROS_DIETA.map((preparo) => (
          <Pilula
            key={preparo}
            rotulo={NOME_PREPARO[preparo]}
            selecionada={preferencias.preparo === preparo}
            onPress={() => mudar({ preparo })}
            rotuloAcessivel={`preparo: ${NOME_PREPARO[preparo]}`}
            testID={`dieta-preparo-${preparo}`}
          />
        ))}
      </Secao>

      <CampoTexto
        rotulo="não quero comer"
        opcional
        value={preferencias.evitar}
        onChangeText={(evitar) => mudar({ evitar })}
        placeholder="ex: peixe, beterraba"
        maxLength={LIMITES_PREFERENCIAS.evitar}
        testID="dieta-evitar"
      />
      <CampoTexto
        rotulo="observações"
        opcional
        value={preferencias.observacoes}
        onChangeText={(observacoes) => mudar({ observacoes })}
        placeholder="ex: almoço no trabalho, treino de manhã, gosto de doce à noite"
        maxLength={LIMITES_PREFERENCIAS.observacoes}
        multiline
        testID="dieta-observacoes"
      />
    </View>
  );
}

const estilos = StyleSheet.create({
  raiz: {
    gap: espaco.md,
  },
  secao: {
    gap: espaco.sm,
  },
  pilulas: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: espaco.sm,
  },
});
