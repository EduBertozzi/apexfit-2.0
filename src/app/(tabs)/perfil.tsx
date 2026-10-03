import { router } from 'expo-router';
import { StyleSheet, View } from 'react-native';

import { useHidratacaoStore } from '@/features/hidratacao/store';
import { calcularMetaAguaMl } from '@/features/perfil/calculos';
import { usePerfilStore } from '@/features/perfil/store';
import { confirmar } from '@/shared/lib/confirmar';
import { formatarNumero } from '@/shared/lib/numero';
import { espaco } from '@/shared/theme/tokens';
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

  if (!perfil) {
    return null;
  }

  async function apagarDados() {
    const confirmado = await confirmar(
      'Apagar meus dados?',
      'Seu perfil e o histórico de água serão apagados deste aparelho. Não dá para desfazer.',
      'Apagar',
    );

    if (confirmado) {
      apagarAgua();
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

      <Botao titulo="Editar perfil" onPress={() => router.push('/editar-perfil')} />

      <Cartao titulo="Privacidade">
        <Texto variante="legenda" secundario>
          Seus dados ficam salvos apenas neste aparelho.
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
    fontWeight: '600',
  },
  bloco: {
    gap: espaco.xs,
    paddingTop: espaco.xs,
  },
});
