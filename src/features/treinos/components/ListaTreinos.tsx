import { router } from 'expo-router';
import { Pressable, StyleSheet, View } from 'react-native';

import { espaco } from '@/shared/theme/tokens';
import { Cartao, Marcado, Texto } from '@/shared/ui';

import { proximoTreino, resumoTreino } from '../logica';
import { useTreinosStore } from '../store';
import { BotoesOrdem } from './BotoesOrdem';

/** Todos os treinos, na ordem do rodízio. Tocar abre a edição. */
export function ListaTreinos() {
  const treinos = useTreinosStore((state) => state.treinos);
  const sessoes = useTreinosStore((state) => state.sessoes);
  const mover = useTreinosStore((state) => state.moverTreino);

  const proximo = proximoTreino(treinos, sessoes);

  function abrir(id: string) {
    router.push({ pathname: '/treino/[id]', params: { id } });
  }

  return (
    <View style={estilos.lista}>
      <Texto variante="subtitulo" accessibilityRole="header">
        Seus treinos
      </Texto>
      <Texto variante="legenda" secundario>
        O app segue esta ordem: depois do último treino feito, vem o próximo da lista.
      </Texto>

      {treinos.map((treino, indice) => (
        <Cartao key={treino.id}>
          <Pressable
            onPress={() => abrir(treino.id)}
            accessibilityRole="button"
            accessibilityLabel={`${treino.nome}, ${resumoTreino(treino)}${treino.id === proximo?.id ? ', próximo da fila' : ''}`}
            accessibilityHint="Abre para editar"
            style={({ pressed }) => [estilos.toque, pressed && { opacity: 0.75 }]}
          >
            <View style={estilos.linhaNome}>
              <Texto variante="subtitulo" style={estilos.nome}>
                {treino.nome}
              </Texto>
              {treino.id === proximo?.id ? (
                <Texto variante="rotulo">
                  <Marcado>Próximo</Marcado>
                </Texto>
              ) : null}
            </View>
            <Texto secundario>{resumoTreino(treino)}</Texto>
          </Pressable>
          <BotoesOrdem
            nome={treino.nome}
            primeiro={indice === 0}
            ultimo={indice === treinos.length - 1}
            onSubir={() => mover(treino.id, 'cima')}
            onDescer={() => mover(treino.id, 'baixo')}
            onEditar={() => abrir(treino.id)}
          />
        </Cartao>
      ))}
    </View>
  );
}

const estilos = StyleSheet.create({
  lista: {
    gap: espaco.md,
  },
  toque: {
    minHeight: 44,
    gap: 2,
  },
  linhaNome: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: espaco.sm,
  },
  nome: {
    flexShrink: 1,
  },
});
