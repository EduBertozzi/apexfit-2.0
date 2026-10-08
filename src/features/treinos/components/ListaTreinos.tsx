import { router } from 'expo-router';
import { Pressable, StyleSheet, Text, View } from 'react-native';

import { chaveDoDia } from '@/shared/lib/data';
import { espaco, familia, fonte, raio } from '@/shared/theme/tokens';
import { useCategorias, useCores } from '@/shared/theme/useCores';
import { Cartao, Texto } from '@/shared/ui';

import { agruparPorGrupo, NOME_GRUPO } from '../grupos';
import { proximoTreino, resumoTreino, temDias } from '../logica';
import { useTreinosStore } from '../store';
import { BotoesOrdem } from './BotoesOrdem';
import { minusculaInicial } from '@/shared/lib/texto';

/** Todos os treinos, na ordem do rodízio. Tocar abre a edição. */
export function ListaTreinos() {
  const c = useCores();
  const cat = useCategorias();
  const treinos = useTreinosStore((state) => state.treinos);
  const sessoes = useTreinosStore((state) => state.sessoes);
  const mover = useTreinosStore((state) => state.moverTreino);

  const proximo = proximoTreino(treinos, sessoes, chaveDoDia(new Date()));

  function abrir(id: string) {
    router.push({ pathname: '/treino/[id]', params: { id } });
  }

  return (
    <View style={estilos.lista}>
      <Texto variante="subtitulo" accessibilityRole="header">
        seus treinos
      </Texto>
      <Texto variante="legenda" secundario>
        {treinos.some(temDias)
          ? 'cada treino vale nos dias marcados em "minha semana". os sem dia entram num rodízio, nesta ordem.'
          : 'o app segue esta ordem: depois do último treino feito, vem o próximo da lista.'}
      </Texto>

      {treinos.map((treino, indice) => {
        const ehProximo = treino.id === proximo?.id;
        const grupos = agruparPorGrupo(treino.exercicios).map((bloco) => bloco.grupo);

        return (
          <Cartao key={treino.id}>
            <Pressable
              onPress={() => abrir(treino.id)}
              accessibilityRole="button"
              accessibilityLabel={`${minusculaInicial(treino.nome)}, ${resumoTreino(treino)}${ehProximo ? ', próximo da fila' : ''}`}
              accessibilityHint="Abre para editar"
              style={({ pressed }) => [estilos.toque, pressed && { opacity: 0.75 }]}
            >
              <View style={estilos.linhaNome}>
                <Texto variante="subtitulo" style={estilos.nome}>
                  {minusculaInicial(treino.nome)}
                </Texto>
                {ehProximo ? (
                  <View style={[estilos.selo, { backgroundColor: c.destaque }]}>
                    <Text style={[estilos.textoSelo, { color: c.textoSobreDestaque }]}>
                      próximo
                    </Text>
                  </View>
                ) : null}
              </View>
              <Texto secundario>{resumoTreino(treino)}</Texto>
              {grupos.length > 0 ? (
                <View style={estilos.grupos}>
                  {grupos.map((grupo) => (
                    <View key={grupo} style={[estilos.selo, { backgroundColor: cat.fundo[grupo] }]}>
                      <Text style={[estilos.textoSelo, { color: c.textoSobreDestaque }]}>
                        {NOME_GRUPO[grupo]}
                      </Text>
                    </View>
                  ))}
                </View>
              ) : null}
            </Pressable>
            <BotoesOrdem
              nome={minusculaInicial(treino.nome)}
              primeiro={indice === 0}
              ultimo={indice === treinos.length - 1}
              onSubir={() => mover(treino.id, 'cima')}
              onDescer={() => mover(treino.id, 'baixo')}
              onEditar={() => abrir(treino.id)}
            />
          </Cartao>
        );
      })}
    </View>
  );
}

const estilos = StyleSheet.create({
  lista: {
    gap: espaco.md,
  },
  toque: {
    minHeight: 44,
    gap: espaco.xs,
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
  grupos: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: espaco.xs,
    marginTop: espaco.xs,
  },
  selo: {
    borderRadius: raio.total,
    paddingHorizontal: espaco.sm + 2,
    paddingVertical: 2,
  },
  textoSelo: {
    fontFamily: familia.rotulo,
    fontSize: fonte.legenda,
  },
});
