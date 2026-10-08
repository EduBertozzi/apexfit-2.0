import { router } from 'expo-router';
import { StyleSheet, View } from 'react-native';

import { CartaoMinhaSemana } from '@/features/treinos/components/CartaoMinhaSemana';
import { HeroiTreinoHoje } from '@/features/treinos/components/HeroiTreinoHoje';
import { ListaModelos } from '@/features/treinos/components/ListaModelos';
import { ListaTreinos } from '@/features/treinos/components/ListaTreinos';
import { useTreinosStore } from '@/features/treinos/store';
import { espaco, familia } from '@/shared/theme/tokens';
import { Botao, Cartao, Tela, Texto } from '@/shared/ui';

export default function Treinos() {
  const temTreinos = useTreinosStore((state) => state.treinos.length > 0);
  const novoTreino = useTreinosStore((state) => state.novoTreino);

  function criarTreino() {
    const id = novoTreino();
    router.push({ pathname: '/treino/[id]', params: { id } });
  }

  return (
    <Tela bordas={['bottom']}>
      <Texto variante="titulo" style={estilos.titulo} accessibilityRole="header">
        treinos
      </Texto>

      {temTreinos ? (
        <>
          <CartaoMinhaSemana />
          <HeroiTreinoHoje />
          <ListaTreinos />
          <View style={estilos.linha}>
            <View style={estilos.metade}>
              <Botao titulo="novo treino" variante="secundario" onPress={criarTreino} />
            </View>
            <View style={estilos.metade}>
              <Botao
                titulo="usar um modelo"
                variante="secundario"
                onPress={() => router.push('/treino/modelos')}
              />
            </View>
          </View>
        </>
      ) : (
        <>
          <Cartao titulo="nenhum treino ainda" variante="tracejado">
            <Texto variante="subtitulo">bora montar sua ficha</Texto>
            <Texto secundario>
              comece com um modelo pronto e ajuste as cargas, ou crie do zero.
            </Texto>
            <Botao titulo="criar do zero" variante="secundario" onPress={criarTreino} />
          </Cartao>

          <Texto variante="subtitulo" accessibilityRole="header">
            modelos prontos
          </Texto>
          <ListaModelos />
        </>
      )}
    </Tela>
  );
}

const estilos = StyleSheet.create({
  titulo: {
    fontFamily: familia.display,
  },
  linha: {
    flexDirection: 'row',
    gap: espaco.sm,
  },
  metade: {
    flex: 1,
  },
});
