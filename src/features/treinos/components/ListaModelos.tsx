import { AccessibilityInfo, StyleSheet, View } from 'react-native';

import { espaco } from '@/shared/theme/tokens';
import { Botao, Cartao, Texto } from '@/shared/ui';

import { MODELOS, type ModeloTreino } from '../modelos';
import { useTreinosStore } from '../store';

type Props = {
  /** Chamado depois de adicionar, ex: para voltar à tela anterior. */
  onUsado?: (modelo: ModeloTreino) => void;
};

/** Fichas prontas: um toque adiciona todos os treinos do modelo. */
export function ListaModelos({ onUsado }: Props) {
  const usarModelo = useTreinosStore((state) => state.usarModelo);

  function usar(modelo: ModeloTreino) {
    usarModelo(modelo);
    AccessibilityInfo.announceForAccessibility(
      `${modelo.nome} adicionado: ${modelo.treinos.length} treinos.`,
    );
    onUsado?.(modelo);
  }

  return (
    <View style={estilos.lista}>
      {MODELOS.map((modelo) => (
        <Cartao key={modelo.id}>
          <View style={estilos.cabecalho}>
            <Texto variante="subtitulo" accessibilityRole="header" style={estilos.nome}>
              {modelo.nome}
            </Texto>
            <Texto variante="rotulo" secundario>
              {modelo.frequencia}
            </Texto>
          </View>
          <Texto secundario>{modelo.descricao}</Texto>
          <View style={estilos.treinos}>
            {modelo.treinos.map((treino, indice) => (
              <Texto key={treino.nome} variante="legenda">
                {indice + 1}. {treino.foco} ({treino.exercicios?.length ?? 0} exercícios)
              </Texto>
            ))}
          </View>
          <Botao
            titulo="Usar este modelo"
            descricaoAcessivel={`Usar o modelo ${modelo.nome}`}
            onPress={() => usar(modelo)}
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
  cabecalho: {
    flexDirection: 'row',
    alignItems: 'baseline',
    justifyContent: 'space-between',
    gap: espaco.sm,
  },
  nome: {
    flexShrink: 1,
  },
  treinos: {
    gap: 2,
  },
});
