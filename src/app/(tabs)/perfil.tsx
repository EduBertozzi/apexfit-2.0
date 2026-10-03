import { router } from 'expo-router';
import { StyleSheet, View } from 'react-native';

import { useDietaStore } from '@/features/dieta/store';
import { useHidratacaoStore } from '@/features/hidratacao/store';
import {
  calcularNecessidades,
  NOME_NIVEL_ATIVIDADE,
  NOME_OBJETIVO,
  NOME_SEXO,
} from '@/features/nutricao/calculos';
import { calcularMetaAguaMl } from '@/features/perfil/calculos';
import { usePerfilStore } from '@/features/perfil/store';
import { confirmar } from '@/shared/lib/confirmar';
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
  const apagarPerfil = usePerfilStore((state) => state.apagarPerfil);
  const apagarAgua = useHidratacaoStore((state) => state.apagarTudo);
  const apagarDieta = useDietaStore((state) => state.apagarTudo);

  if (!perfil) {
    return null;
  }

  const necessidades = calcularNecessidades(perfil);
  const naoInformado = 'Não informado';

  async function apagarDados() {
    const confirmado = await confirmar(
      'Apagar meus dados?',
      'Seu perfil, o histórico de água e a dieta serão apagados deste aparelho. Não dá para desfazer.',
      'Apagar',
    );

    if (confirmado) {
      apagarAgua();
      apagarDieta();
      // Sem perfil, o _layout volta sozinho para o onboarding
      apagarPerfil();
    }
  }

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
          rotulo="Meta de água"
          valor={`${formatarNumero(calcularMetaAguaMl(perfil.pesoKg))} ml`}
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

      <Cartao titulo="Privacidade">
        <Texto variante="legenda" secundario>
          Seus dados ficam salvos neste aparelho. Quando você pede a dieta com IA, o perfil é
          enviado ao servidor do ApexFit e à Anthropic (empresa da IA) só para montar o plano.
        </Texto>
        <Botao titulo="Apagar meus dados" variante="perigo" onPress={apagarDados} />
      </Cartao>
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
