import { useState } from 'react';
import { AccessibilityInfo, StyleSheet, View } from 'react-native';

import { confirmar } from '@/shared/lib/confirmar';
import { espaco } from '@/shared/theme/tokens';
import { Botao, Cartao, Texto } from '@/shared/ui';

import { resumoExercicio, resumoExercicioAcessivel } from '../logica';
import { exercicioParaFormulario } from '../schema';
import { useTreinosStore } from '../store';
import type { DadosExercicio, Treino } from '../types';
import { BotoesOrdem } from './BotoesOrdem';
import { FormularioExercicio } from './FormularioExercicio';

/** 'novo' = formulário de adicionar aberto; id = editando aquele exercício. */
type Edicao = 'novo' | string | null;

/** Lista de exercícios do treino com adicionar, editar, remover e reordenar. */
export function EditorExercicios({ treino }: { treino: Treino }) {
  const adicionar = useTreinosStore((state) => state.adicionarExercicio);
  const editar = useTreinosStore((state) => state.editarExercicio);
  const remover = useTreinosStore((state) => state.removerExercicio);
  const mover = useTreinosStore((state) => state.moverExercicio);
  const [edicao, setEdicao] = useState<Edicao>(null);

  function salvarNovo(dados: DadosExercicio) {
    adicionar(treino.id, dados);
    setEdicao(null);
    AccessibilityInfo.announceForAccessibility(`${dados.nome} adicionado`);
  }

  function salvarEdicao(exercicioId: string, dados: DadosExercicio) {
    editar(treino.id, exercicioId, dados);
    setEdicao(null);
  }

  async function confirmarRemocao(exercicioId: string, nome: string) {
    const confirmado = await confirmar(
      `Remover ${nome}?`,
      'O exercício sai deste treino.',
      'Remover',
    );

    if (confirmado) {
      remover(treino.id, exercicioId);
    }
  }

  const total = treino.exercicios.length;

  return (
    <View style={estilos.container}>
      <Texto variante="subtitulo" accessibilityRole="header">
        Exercícios
      </Texto>

      {total === 0 && edicao === null ? (
        <Texto secundario>Nenhum exercício ainda. Adicione o primeiro e bora.</Texto>
      ) : null}

      {treino.exercicios.map((exercicio, indice) =>
        edicao === exercicio.id ? (
          <Cartao key={exercicio.id} titulo="Editar exercício">
            <FormularioExercicio
              valoresIniciais={exercicioParaFormulario(exercicio)}
              textoBotao="Salvar"
              onSalvar={(dados) => salvarEdicao(exercicio.id, dados)}
              onCancelar={() => setEdicao(null)}
            />
          </Cartao>
        ) : (
          <Cartao key={exercicio.id}>
            <View
              accessible
              accessibilityLabel={`${exercicio.nome}, ${resumoExercicioAcessivel(exercicio)}`}
            >
              <Texto variante="subtitulo">{exercicio.nome}</Texto>
              <Texto secundario>{resumoExercicio(exercicio)}</Texto>
              {exercicio.observacao ? (
                <Texto variante="legenda" secundario>
                  {exercicio.observacao}
                </Texto>
              ) : null}
            </View>
            <BotoesOrdem
              nome={exercicio.nome}
              primeiro={indice === 0}
              ultimo={indice === total - 1}
              onSubir={() => mover(treino.id, exercicio.id, 'cima')}
              onDescer={() => mover(treino.id, exercicio.id, 'baixo')}
              onEditar={() => setEdicao(exercicio.id)}
              onRemover={() => confirmarRemocao(exercicio.id, exercicio.nome)}
            />
          </Cartao>
        ),
      )}

      {edicao === 'novo' ? (
        <Cartao titulo="Novo exercício">
          <FormularioExercicio
            textoBotao="Adicionar"
            onSalvar={salvarNovo}
            onCancelar={() => setEdicao(null)}
          />
        </Cartao>
      ) : (
        <Botao
          titulo="Adicionar exercício"
          variante="secundario"
          onPress={() => setEdicao('novo')}
        />
      )}
    </View>
  );
}

const estilos = StyleSheet.create({
  container: {
    gap: espaco.md,
  },
});
