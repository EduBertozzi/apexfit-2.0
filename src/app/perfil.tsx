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
import { Avatar } from '@/features/perfil/components/Avatar';
import { CartaoImc } from '@/features/perfil/components/CartaoImc';
import { usePerfilStore } from '@/features/perfil/store';
import { useFotoDoPerfil } from '@/features/perfil/useFotoDoPerfil';
import { CartaoPeso } from '@/features/peso/components/CartaoPeso';
import { formatarNumero } from '@/shared/lib/numero';
import { espaco, familia } from '@/shared/theme/tokens';
import { useCores } from '@/shared/theme/useCores';
import { Botao, Cartao, Tela, Texto } from '@/shared/ui';

function Linha({ rotulo, valor }: { rotulo: string; valor: string }) {
  return (
    <View style={estilos.linha} accessible accessibilityLabel={`${rotulo}: ${valor}`}>
      <Texto secundario>{rotulo}</Texto>
      <Texto style={estilos.valor}>{valor}</Texto>
    </View>
  );
}

export default function PerfilTela() {
  const c = useCores();
  const perfil = usePerfilStore((state) => state.perfil);
  const metaManualMl = useAjustesStore((state) => state.metaAguaManualMl);
  const foto = useFotoDoPerfil();

  if (!perfil) {
    return null;
  }

  const necessidades = calcularNecessidades(perfil);
  const naoInformado = 'não informado';

  return (
    <Tela bordas={['bottom']}>
      <View style={estilos.topo}>
        <Avatar nome={perfil.nome} fotoUri={perfil.fotoUri} tamanho={112} />
        <Texto variante="titulo" style={estilos.nome} accessibilityRole="header">
          {perfil.nome}
        </Texto>
        <View style={estilos.botoesFoto}>
          <View style={estilos.botaoFoto}>
            <Botao
              titulo="trocar foto"
              variante="secundario"
              onPress={foto.trocar}
              carregando={foto.carregando}
            />
          </View>
          {perfil.fotoUri ? (
            <View style={estilos.botaoFoto}>
              <Botao titulo="remover foto" variante="texto" onPress={foto.remover} />
            </View>
          ) : null}
        </View>
        {foto.erro ? (
          <Texto variante="legenda" style={{ color: c.erro }} accessibilityLiveRegion="polite">
            {foto.erro}
          </Texto>
        ) : null}
      </View>

      <Cartao titulo="seus dados">
        <Linha rotulo="idade" valor={`${perfil.idade} anos`} />
        <Linha rotulo="sexo" valor={perfil.sexo ? NOME_SEXO[perfil.sexo] : naoInformado} />
        <Linha rotulo="altura" valor={`${formatarNumero(perfil.alturaCm)} cm`} />
        <Linha rotulo="peso" valor={`${formatarNumero(perfil.pesoKg, 1)} kg`} />
        <Linha
          rotulo="gordura corporal"
          valor={
            perfil.percentualGordura === undefined
              ? naoInformado
              : `${formatarNumero(perfil.percentualGordura, 1)}%`
          }
        />
        <Linha
          rotulo={metaManualMl === null ? 'meta de água' : 'meta de água (manual)'}
          valor={`${formatarNumero(metaAguaEfetiva(calcularMetaAguaMl(perfil.pesoKg), metaManualMl))} ml`}
        />
        {perfil.restricoes ? (
          <View style={estilos.bloco}>
            <Texto secundario>saúde e restrições</Texto>
            <Texto>{perfil.restricoes}</Texto>
          </View>
        ) : null}
      </Cartao>

      <CartaoPeso pesoPerfilKg={perfil.pesoKg} />

      <CartaoImc perfil={perfil} />

      <Cartao titulo="rotina e metas">
        <Linha
          rotulo="atividade"
          valor={
            perfil.nivelAtividade
              ? NOME_NIVEL_ATIVIDADE[perfil.nivelAtividade].split(' (')[0]
              : naoInformado
          }
        />
        <Linha
          rotulo="objetivo"
          valor={perfil.objetivo ? NOME_OBJETIVO[perfil.objetivo] : naoInformado}
        />
        {necessidades ? (
          <>
            <Linha rotulo="metabolismo basal" valor={`${formatarNumero(necessidades.tmb)} kcal`} />
            <Linha
              rotulo="gasto diário"
              valor={`${formatarNumero(necessidades.gastoDiario)} kcal`}
            />
            <Linha
              rotulo="meta de calorias"
              valor={`${formatarNumero(necessidades.metaCalorias)} kcal`}
            />
          </>
        ) : null}
      </Cartao>

      <Botao titulo="editar perfil" onPress={() => router.push('/editar-perfil')} />
    </Tela>
  );
}

const estilos = StyleSheet.create({
  topo: {
    alignItems: 'center',
    gap: espaco.sm,
    paddingVertical: espaco.sm,
  },
  nome: {
    textAlign: 'center',
  },
  botoesFoto: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'center',
    gap: espaco.sm,
  },
  botaoFoto: {
    minWidth: 150,
  },
  linha: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    gap: espaco.md,
    paddingVertical: espaco.xs,
    minHeight: 32,
  },
  valor: {
    fontFamily: familia.corpoForte,
    flexShrink: 1,
    textAlign: 'right',
  },
  bloco: {
    gap: espaco.xs,
    paddingTop: espaco.xs,
  },
});
