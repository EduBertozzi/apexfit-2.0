import { router } from 'expo-router';
import { StyleSheet, View } from 'react-native';

import { HeroiTreinoHoje } from '@/features/treinos/components/HeroiTreinoHoje';
import { ListaModelos } from '@/features/treinos/components/ListaModelos';
import { ListaTreinos } from '@/features/treinos/components/ListaTreinos';
import { useTreinosStore } from '@/features/treinos/store';
import { espaco } from '@/shared/theme/tokens';
import { Botao, Cartao, Tela, Texto } from '@/shared/ui';

export default function Treinos() {
  const temTreinos = useTreinosStore((state) => state.treinos.length > 0);
  const novoTreino = useTreinosStore((state) => state.novoTreino);

  function criarTreino() {
    const id = novoTreino();
    router.push({ pathname: '/treino/[id]', params: { id } });
  }

  return (
    <Tela>
      <Texto variante="titulo" accessibilityRole="header">
        Treinos
      </Texto>

      {temTreinos ? (
        <>
          <HeroiTreinoHoje />
          <ListaTreinos />
          <View style={estilos.linha}>
            <View style={estilos.metade}>
              <Botao titulo="Novo treino" variante="secundario" onPress={criarTreino} />
            </View>
            <View style={estilos.metade}>
              <Botao
                titulo="Usar um modelo"
                variante="secundario"
                onPress={() => router.push('/treino/modelos')}
              />
            </View>
          </View>
        </>
      ) : (
        <>
          <Cartao titulo="Nenhum treino ainda" variante="tracejado">
            <Texto variante="subtitulo">Bora montar sua ficha</Texto>
            <Texto secundario>
              Comece com um modelo pronto e ajuste as cargas, ou crie do zero.
            </Texto>
            <Botao titulo="Criar do zero" variante="secundario" onPress={criarTreino} />
          </Cartao>

          <Texto variante="subtitulo" accessibilityRole="header">
            Modelos prontos
          </Texto>
          <ListaModelos />
        </>
      )}
    </Tela>
  );
}

const estilos = StyleSheet.create({
  linha: {
    flexDirection: 'row',
    gap: espaco.sm,
  },
  metade: {
    flex: 1,
  },
});
