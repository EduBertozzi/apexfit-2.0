import { router } from 'expo-router';
import { StyleSheet, View } from 'react-native';

import { metaAguaEfetiva } from '@/features/ajustes/logica';
import { useAjustesStore } from '@/features/ajustes/store';
import {
  calcularNecessidades,
  NOME_NIVEL_ATIVIDADE,
  NOME_OBJETIVO,
  NOME_SEXO,
} from '@/features/nutricao/calculos';
import { calcularMetaAguaMl } from '@/features/perfil/calculos';
import { usePerfilStore } from '@/features/perfil/store';
import { formatarNumero } from '@/shared/lib/numero';
import { espaco, familia } from '@/shared/theme/tokens';
import { Botao, Cartao, Tela, Texto } from '@/shared/ui';

function Linha({ rotulo, valor }: { rotulo: string; valor: string }) {
  return (
    <View style={estilos.linha}>
      <Texto secundario>{rotulo}</Texto>
      <Texto style={estilos.valor}>{valor}</Texto>
    </View>
  );
}

export default function PerfilTela() {
  const perfil = usePerfilStore((state) => state.perfil);
  const metaManualMl = useAjustesStore((state) => state.metaAguaManualMl);

  if (!perfil) {
    return null;
  }

  const necessidades = calcularNecessidades(perfil);
  const naoInformado = 'Não informado';

  return (
    <Tela>
      <Texto variante="titulo" accessibilityRole="header">
        {perfil.nome}
      </Texto>

      <Cartao titulo="Seus dados">
        <Linha rotulo="Idade" valor={`${perfil.idade} anos`} />
        <Linha rotulo="Sexo" valor={perfil.sexo ? NOME_SEXO[perfil.sexo] : naoInformado} />
        <Linha rotulo="Altura" valor={`${formatarNumero(perfil.alturaCm)} cm`} />
        <Linha rotulo="Peso" valor={`${formatarNumero(perfil.pesoKg, 1)} kg`} />
        <Linha
          rotulo="Gordura corporal"
          valor={
            perfil.percentualGordura === undefined
              ? 'Não informado'
              : `${formatarNumero(perfil.percentualGordura, 1)}%`
          }
        />
        <Linha
          rotulo={metaManualMl === null ? 'Meta de água' : 'Meta de água (manual)'}
          valor={`${formatarNumero(metaAguaEfetiva(calcularMetaAguaMl(perfil.pesoKg), metaManualMl))} ml`}
        />
        {perfil.restricoes ? (
          <View style={estilos.bloco}>
            <Texto secundario>Saúde e restrições</Texto>
            <Texto>{perfil.restricoes}</Texto>
          </View>
        ) : null}
      </Cartao>

      <Cartao titulo="Rotina e metas">
        <Linha
          rotulo="Atividade"
          valor={
            perfil.nivelAtividade
              ? NOME_NIVEL_ATIVIDADE[perfil.nivelAtividade].split(' (')[0]
              : naoInformado
          }
        />
        <Linha
          rotulo="Objetivo"
          valor={perfil.objetivo ? NOME_OBJETIVO[perfil.objetivo] : naoInformado}
        />
        {necessidades ? (
          <>
            <Linha rotulo="Metabolismo basal" valor={`${formatarNumero(necessidades.tmb)} kcal`} />
            <Linha
              rotulo="Gasto diário"
              valor={`${formatarNumero(necessidades.gastoDiario)} kcal`}
            />
            <Linha
              rotulo="Meta de calorias"
              valor={`${formatarNumero(necessidades.metaCalorias)} kcal`}
            />
          </>
        ) : null}
      </Cartao>

      <Botao titulo="Editar perfil" onPress={() => router.push('/editar-perfil')} />
    </Tela>
  );
}

const estilos = StyleSheet.create({
  linha: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingVertical: espaco.xs,
  },
  valor: {
    fontFamily: familia.corpoForte,
  },
  bloco: {
    gap: espaco.xs,
    paddingTop: espaco.xs,
  },
});
