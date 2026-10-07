import { StyleSheet, View } from 'react-native';

import { espaco, familia } from '@/shared/theme/tokens';
import { useCategorias } from '@/shared/theme/useCores';
import { Botao, Cartao, Texto } from '@/shared/ui';

import { agruparPorGrupo, NOME_GRUPO, textoEsquema } from '../grupos';
import { resumoExercicio, resumoTreino } from '../logica';
import type { Treino } from '../types';
import { IconeGrupo } from './IconeGrupo';
import { minusculaInicial } from '@/shared/lib/texto';

type Props = {
  treino: Treino;
  onComecar: () => void;
  onEditar: () => void;
};

/** O treino sugerido para hoje, ainda não começado: os grupos e o botão de começar. */
export function PreviaTreino({ treino, onComecar, onEditar }: Props) {
  const cat = useCategorias();
  const blocos = agruparPorGrupo(treino.exercicios);
  const vazio = treino.exercicios.length === 0;

  return (
    <View style={estilos.container}>
      <View>
        <Texto variante="titulo" style={estilos.titulo} accessibilityRole="header">
          {minusculaInicial(treino.nome)}
        </Texto>
        <Texto secundario>{resumoTreino(treino)}</Texto>
      </View>

      {blocos.map((bloco) => {
        const cor = cat.texto[bloco.grupo];

        return (
          <Cartao key={bloco.grupo}>
            <View style={estilos.cabecalho}>
              <IconeGrupo grupo={bloco.grupo} cor={cor} />
              <Texto
                variante="subtitulo"
                style={[estilos.nomeGrupo, { color: cor }]}
                accessibilityRole="header"
              >
                {NOME_GRUPO[bloco.grupo]}
              </Texto>
              <Texto variante="rotulo" style={{ color: cor }}>
                {textoEsquema(bloco.esquema)}
              </Texto>
            </View>
            {bloco.exercicios.map((exercicio) => (
              <View key={exercicio.id} style={estilos.exercicio}>
                <Texto style={estilos.encolher}>{exercicio.nome}</Texto>
                <Texto variante="rotulo" secundario>
                  {resumoExercicio(exercicio)}
                </Texto>
              </View>
            ))}
          </Cartao>
        );
      })}

      {vazio ? (
        <>
          <Texto secundario>Este treino ainda não tem exercícios.</Texto>
          <Botao titulo="adicionar exercícios" onPress={onEditar} />
        </>
      ) : (
        <>
          <Botao titulo="começar treino" variante="destaque" onPress={onComecar} />
          <Botao titulo="editar treino" variante="secundario" onPress={onEditar} />
        </>
      )}
    </View>
  );
}

const estilos = StyleSheet.create({
  container: {
    gap: espaco.md,
  },
  titulo: {
    fontFamily: familia.display,
  },
  cabecalho: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: espaco.sm,
  },
  nomeGrupo: {
    flex: 1,
    fontFamily: familia.displayLeve,
  },
  exercicio: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'baseline',
    gap: espaco.md,
  },
  encolher: {
    flexShrink: 1,
  },
});
