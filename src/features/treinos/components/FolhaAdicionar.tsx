import Ionicons from '@expo/vector-icons/Ionicons';
import { useState } from 'react';
import { Pressable, ScrollView, StyleSheet, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { espaco, familia, raio } from '@/shared/theme/tokens';
import { useCategorias, useCores } from '@/shared/theme/useCores';
import { Botao, CampoTexto, Texto } from '@/shared/ui';

import {
  exerciciosDe,
  GRUPOS_MUSCULACAO,
  regioesComMisto,
  semRepetidos,
  sugerir,
  type ExercicioCatalogo,
} from '../catalogo';
import { NOME_GRUPO } from '../grupos';
import {
  ABAS,
  alternarDia,
  alternarSelecao,
  desmarcarUltimo,
  grupoInicial,
  marcarMaisUm,
  mesmosDias,
  MINUTOS_INICIAIS,
  montarCardio,
  montarMusculacao,
  NOME_LOCAL,
  outrosTreinosNoDia,
  padraoDaRegiao,
  passo,
  PASSOS,
  QUANTIDADE_INICIAL,
  regiaoInicial,
  textoBotaoSalvar,
  validarNomeLivre,
  type Aba,
} from '../montagem';
import { NOME_DIA, SIGLAS_DIA } from '../semana';
import type { DadosExercicio, GrupoMuscular, Treino } from '../types';
import { ContadorCompacto } from './ContadorCompacto';
import { GrupoAbas, Pilula } from './Pilula';
import { minusculaInicial } from '@/shared/lib/texto';

export type ResultadoFolha = {
  exercicios: DadosExercicio[];
  /** Só vem quando os dias mudaram. */
  dias?: number[];
};

type Props = {
  treino: Treino;
  /** Todos os treinos, para mostrar quem já ocupa cada dia da semana. */
  treinos: readonly Treino[];
  aba?: Aba;
  onSalvar: (resultado: ResultadoFolha) => void;
  onCancelar: () => void;
};

/**
 * Folha "adicionar exercício": escolhe grupo e região, marca exercícios do
 * catálogo (ou digita um nome), ajusta séries e repetições; também tem cardio
 * em minutos e o plano semanal (dias em que este treino acontece).
 */
export function FolhaAdicionar({ treino, treinos, aba: abaInicial, onSalvar, onCancelar }: Props) {
  const c = useCores();
  const cat = useCategorias();
  const insets = useSafeAreaInsets();
  const nomesNoTreino = treino.exercicios.map((exercicio) => exercicio.nome);

  const [aba, setAba] = useState<Aba>(abaInicial ?? 'musculacao');
  const [grupo, setGrupo] = useState<GrupoMuscular>(() => grupoInicial(treino));
  const [regiao, setRegiao] = useState<string | undefined>(() =>
    regiaoInicial(grupoInicial(treino)),
  );
  const [selecionados, setSelecionados] = useState<string[]>(() =>
    (abaInicial ?? 'musculacao') === 'musculacao'
      ? sugerir(
          grupoInicial(treino),
          regiaoInicial(grupoInicial(treino)),
          QUANTIDADE_INICIAL,
          nomesNoTreino,
        ).map((item) => item.nome)
      : [],
  );
  const [padrao] = useState(() =>
    padraoDaRegiao(grupoInicial(treino), regiaoInicial(grupoInicial(treino))),
  );
  const [series, setSeries] = useState(padrao.series);
  const [repeticoes, setRepeticoes] = useState(padrao.repeticoes);
  const [nomeLivre, setNomeLivre] = useState('');
  const [cardio, setCardio] = useState<string[]>([]);
  const [minutos, setMinutos] = useState(MINUTOS_INICIAIS);
  const [dias, setDias] = useState<number[]>(treino.dias ?? []);

  const disponiveis = semRepetidos(exerciciosDe(grupo, regiao), nomesNoTreino);
  const opcoesCardio = semRepetidos(exerciciosDe('cardio'), nomesNoTreino);
  const exercicios = [
    ...montarMusculacao({ selecionados, nomeLivre, grupo, series, repeticoes }),
    ...montarCardio({ selecionados: cardio, minutos }),
  ];
  const diasMudaram = !mesmosDias(dias, treino.dias);
  const podeSalvar = exercicios.length > 0 || diasMudaram;
  const erroNome = validarNomeLivre(nomeLivre).erro;

  function escolher(novoGrupo: GrupoMuscular, novaRegiao: string | undefined) {
    const quantidade = selecionados.length || QUANTIDADE_INICIAL;
    const novoPadrao = padraoDaRegiao(novoGrupo, novaRegiao);

    setGrupo(novoGrupo);
    setRegiao(novaRegiao);
    setSelecionados(
      sugerir(novoGrupo, novaRegiao, quantidade, nomesNoTreino).map((item) => item.nome),
    );
    setSeries(novoPadrao.series);
    setRepeticoes(novoPadrao.repeticoes);
  }

  function salvar() {
    onSalvar({ exercicios, dias: diasMudaram ? dias : undefined });
  }

  return (
    <View style={[estilos.raiz, { backgroundColor: c.superficie }]}>
      <ScrollView
        contentContainerStyle={estilos.conteudo}
        keyboardShouldPersistTaps="handled"
        nestedScrollEnabled
      >
        <Texto variante="titulo" accessibilityRole="header">
          adicionar exercício
        </Texto>

        <GrupoAbas rotulo="tipo">
          {ABAS.map((item) => (
            <Pilula
              key={item.valor}
              papel="tab"
              esticar
              rotulo={item.rotulo}
              selecionada={aba === item.valor}
              onPress={() => setAba(item.valor)}
              testID={`aba-${item.valor}`}
            />
          ))}
        </GrupoAbas>

        {aba === 'musculacao' ? (
          <>
            <Rotulo>grupo muscular</Rotulo>
            <ScrollView
              horizontal
              showsHorizontalScrollIndicator={false}
              contentContainerStyle={estilos.pilulas}
            >
              {GRUPOS_MUSCULACAO.map((item) => (
                <Pilula
                  key={item}
                  rotulo={NOME_GRUPO[item]}
                  selecionada={grupo === item}
                  corSelecionada={cat.fundo[item]}
                  corTextoSelecionada={c.textoSobreDestaque}
                  onPress={() => escolher(item, regiaoInicial(item))}
                  testID={`grupo-${item}`}
                />
              ))}
            </ScrollView>

            <Rotulo>região específica</Rotulo>
            <ScrollView
              horizontal
              showsHorizontalScrollIndicator={false}
              contentContainerStyle={estilos.pilulas}
            >
              {regioesComMisto(grupo).map((item) => (
                <Pilula
                  key={item.id}
                  rotulo={item.nome}
                  selecionada={regiao === item.id}
                  onPress={() => escolher(grupo, item.id)}
                  testID={`regiao-${item.id}`}
                />
              ))}
            </ScrollView>

            <ContadorCompacto
              rotulo="quantidade de exercícios"
              emLinha
              valorTexto={String(selecionados.length)}
              podeMenos={selecionados.length > 0}
              podeMais={disponiveis.some((item) => !selecionados.includes(item.nome))}
              onMenos={() => setSelecionados(desmarcarUltimo(selecionados))}
              onMais={() => setSelecionados(marcarMaisUm(disponiveis, selecionados))}
              testID="quantidade"
            />

            <ListaMarcavel
              itens={disponiveis}
              selecionados={selecionados}
              cor={cat.fundo[grupo]}
              vazio="Todos os exercícios desta região já estão no treino."
              onAlternar={(nome) => setSelecionados(alternarSelecao(selecionados, nome))}
            />

            <View style={estilos.dupla}>
              <View style={estilos.metade}>
                <ContadorCompacto
                  rotulo="séries"
                  valorTexto={String(series)}
                  podeMenos={series > PASSOS.series.min}
                  podeMais={series < PASSOS.series.max}
                  onMenos={() => setSeries(passo(series, -1, PASSOS.series))}
                  onMais={() => setSeries(passo(series, 1, PASSOS.series))}
                  testID="series"
                />
              </View>
              <View style={estilos.metade}>
                <ContadorCompacto
                  rotulo="repetições"
                  valorTexto={String(repeticoes)}
                  podeMenos={repeticoes > PASSOS.repeticoes.min}
                  podeMais={repeticoes < PASSOS.repeticoes.max}
                  onMenos={() => setRepeticoes(passo(repeticoes, -1, PASSOS.repeticoes))}
                  onMais={() => setRepeticoes(passo(repeticoes, 1, PASSOS.repeticoes))}
                  testID="repeticoes"
                />
              </View>
            </View>

            <CampoTexto
              rotulo="ou digite o nome"
              opcional
              value={nomeLivre}
              onChangeText={setNomeLivre}
              placeholder="ex: supino reto"
              erro={erroNome}
              dica={`Entra em ${NOME_GRUPO[grupo]}, com as mesmas séries e repetições.`}
              returnKeyType="done"
              testID="nome-livre"
            />
          </>
        ) : null}

        {aba === 'cardio' ? (
          <>
            <Rotulo>escolha o cardio</Rotulo>
            <ListaMarcavel
              itens={opcoesCardio}
              selecionados={cardio}
              cor={cat.fundo.cardio}
              vazio="Todos os cardios já estão no treino."
              onAlternar={(nome) => setCardio(alternarSelecao(cardio, nome))}
            />
            <ContadorCompacto
              rotulo="minutos"
              emLinha
              valorTexto={`${minutos} min`}
              podeMenos={minutos > PASSOS.minutos.min}
              podeMais={minutos < PASSOS.minutos.max}
              onMenos={() => setMinutos(passo(minutos, -1, PASSOS.minutos))}
              onMais={() => setMinutos(passo(minutos, 1, PASSOS.minutos))}
              testID="minutos"
            />
          </>
        ) : null}

        {aba === 'plano' ? (
          <>
            <Texto secundario>
              Em quais dias da semana o {minusculaInicial(treino.nome)} acontece? No dia marcado,
              ele vira o treino de hoje. Sem dia marcado, segue o rodízio.
            </Texto>
            <View style={estilos.dias}>
              {SIGLAS_DIA.map((sigla, dia) => {
                const marcado = dias.includes(dia);
                const outros = outrosTreinosNoDia(treinos, treino.id, dia);

                return (
                  <View key={sigla} style={estilos.dia}>
                    <Pressable
                      onPress={() => setDias(alternarDia(dias, dia))}
                      accessibilityRole="checkbox"
                      accessibilityLabel={
                        outros.length > 0
                          ? `${NOME_DIA[dia]}, também tem ${outros.join(' e ')}`
                          : NOME_DIA[dia]
                      }
                      accessibilityState={{ checked: marcado }}
                      testID={`dia-${dia}`}
                      style={({ pressed }) => [
                        estilos.bolinha,
                        {
                          backgroundColor: marcado ? c.destaque : c.superficieSecundaria,
                        },
                        pressed && { opacity: 0.75 },
                      ]}
                    >
                      <Texto
                        variante="rotulo"
                        style={[estilos.sigla, { color: marcado ? c.textoSobreDestaque : c.texto }]}
                      >
                        {sigla}
                      </Texto>
                    </Pressable>
                    {outros.length > 0 ? (
                      <Texto
                        variante="legenda"
                        secundario
                        numberOfLines={1}
                        style={estilos.outro}
                        importantForAccessibility="no"
                        accessibilityElementsHidden
                      >
                        {outros[0]}
                      </Texto>
                    ) : null}
                  </View>
                );
              })}
            </View>
          </>
        ) : null}
      </ScrollView>

      <View
        style={[
          estilos.rodape,
          { paddingBottom: Math.max(insets.bottom, espaco.md), borderTopColor: c.borda },
        ]}
      >
        <View style={estilos.metade}>
          <Botao titulo="cancelar" variante="secundario" onPress={onCancelar} />
        </View>
        <View style={estilos.principal}>
          <Botao
            titulo={textoBotaoSalvar(aba, exercicios.length)}
            onPress={salvar}
            desabilitado={!podeSalvar}
          />
        </View>
      </View>
    </View>
  );
}

function Rotulo({ children }: { children: string }) {
  return (
    <Texto variante="rotulo" secundario style={estilos.rotulo}>
      {children}
    </Texto>
  );
}

function ListaMarcavel({
  itens,
  selecionados,
  cor,
  vazio,
  onAlternar,
}: {
  itens: readonly ExercicioCatalogo[];
  selecionados: readonly string[];
  /** Fundo do check marcado (cor do grupo). */
  cor: string;
  vazio: string;
  onAlternar: (nome: string) => void;
}) {
  const c = useCores();

  if (itens.length === 0) {
    return <Texto secundario>{vazio}</Texto>;
  }

  return (
    <View style={[estilos.lista, { backgroundColor: c.superficieSecundaria }]}>
      {itens.map((item, indice) => {
        const marcado = selecionados.includes(item.nome);

        return (
          <Pressable
            key={item.nome}
            onPress={() => onAlternar(item.nome)}
            accessibilityRole="checkbox"
            accessibilityLabel={`${item.nome}, ${NOME_LOCAL[item.local]}`}
            accessibilityState={{ checked: marcado }}
            testID={`sugestao-${item.nome}`}
            style={({ pressed }) => [
              estilos.item,
              indice > 0 && { borderTopWidth: StyleSheet.hairlineWidth, borderTopColor: c.borda },
              pressed && { opacity: 0.7 },
            ]}
          >
            <View
              style={[
                estilos.check,
                marcado
                  ? { backgroundColor: cor, borderColor: cor }
                  : { borderColor: c.textoSecundario },
              ]}
            >
              {marcado ? (
                <Ionicons name="checkmark" size={18} color={c.textoSobreDestaque} />
              ) : null}
            </View>
            <View style={estilos.textoItem}>
              <Texto variante="corpo" style={estilos.nomeItem}>
                {item.nome}
              </Texto>
              <Texto variante="legenda" secundario>
                {NOME_LOCAL[item.local]}
              </Texto>
            </View>
          </Pressable>
        );
      })}
    </View>
  );
}

const TAMANHO_DIA = 44;

const estilos = StyleSheet.create({
  raiz: {
    flex: 1,
  },
  conteudo: {
    padding: espaco.lg,
    gap: espaco.md,
  },
  rotulo: {
    marginBottom: -espaco.sm,
  },
  pilulas: {
    gap: espaco.sm,
    paddingRight: espaco.md,
  },
  lista: {
    borderRadius: raio.md,
    borderCurve: 'continuous',
    overflow: 'hidden',
  },
  item: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: espaco.md,
    minHeight: 56,
    paddingHorizontal: espaco.md,
    paddingVertical: espaco.sm,
  },
  check: {
    width: 26,
    height: 26,
    borderRadius: raio.total,
    borderWidth: 2,
    alignItems: 'center',
    justifyContent: 'center',
  },
  textoItem: {
    flex: 1,
  },
  nomeItem: {
    fontFamily: familia.corpoMedio,
  },
  dupla: {
    flexDirection: 'row',
    gap: espaco.md,
  },
  metade: {
    flex: 1,
  },
  principal: {
    flex: 2,
  },
  dias: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  dia: {
    alignItems: 'center',
    gap: espaco.xs,
    width: TAMANHO_DIA,
  },
  bolinha: {
    width: TAMANHO_DIA,
    height: TAMANHO_DIA,
    borderRadius: raio.total,
    alignItems: 'center',
    justifyContent: 'center',
  },
  sigla: {
    fontFamily: familia.corpoForte,
  },
  outro: {
    textAlign: 'center',
  },
  rodape: {
    flexDirection: 'row',
    gap: espaco.sm,
    paddingHorizontal: espaco.lg,
    paddingTop: espaco.md,
    borderTopWidth: StyleSheet.hairlineWidth,
  },
});
