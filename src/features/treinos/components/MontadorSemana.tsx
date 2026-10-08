import Ionicons from '@expo/vector-icons/Ionicons';
import { useState, type ReactNode } from 'react';
import { Pressable, StyleSheet, View } from 'react-native';

import { borda, espaco, familia, raio } from '@/shared/theme/tokens';
import { useCategorias, useCores } from '@/shared/theme/useCores';
import { CampoTexto, Interruptor, Texto } from '@/shared/ui';

import { OPCOES_AQUECIMENTO, soPorTempo, textoValorAquecimento } from '../aquecimento';
import { REGIOES } from '../catalogo';
import {
  AREAS_TREINO,
  EQUIPAMENTOS_TREINO,
  LIMITES_MONTADOR,
  NIVEIS_TREINO,
  type AreaTreino,
  type DiaMontado,
  type ItemAquecimento,
  type NivelTreino,
} from '../contratoIa';
import { NOME_GRUPO } from '../grupos';
import { MEDIDAS } from '../montagem';
import {
  contadoresCircuito,
  contadorExercicios,
  DIAS_DA_SEMANA,
  diasParaCopiar,
  NOME_EQUIPAMENTO,
  NOME_NIVEL,
  nomeDoDia,
  opcoesCardio,
  resumoDoDia,
  rotuloDoDia,
  siglaDoDia,
  textoNoDia,
} from '../montadorIa';
import { useTreinosIaStore } from '../storeIa';
import { ContadorCompacto } from './ContadorCompacto';
import { Pilula } from './Pilula';

/** Áreas com regiões para escolher (cardio é um aparelho só, não precisa). */
function temRegioes(area: AreaTreino): boolean {
  return area !== 'cardio' && REGIOES[area].length > 1;
}

function Rotulo({ children }: { children: ReactNode }) {
  return (
    <Texto variante="rotulo" secundario>
      {children}
    </Texto>
  );
}

/**
 * Montador da semana da central de IA: dias de treino, o que treinar em cada
 * dia (áreas e regiões), nível, equipamento, o que evitar e o aquecimento.
 * Só mostra e repassa os toques para a store; as regras ficam em `montadorIa`.
 */
export function MontadorSemana() {
  const c = useCores();
  const escolhas = useTreinosIaStore((state) => state.escolhas);
  const alternarDia = useTreinosIaStore((state) => state.alternarDia);
  const mudarEscolhas = useTreinosIaStore((state) => state.mudarEscolhas);
  const ligarAquecimento = useTreinosIaStore((state) => state.ligarAquecimento);
  const alternarAquecimento = useTreinosIaStore((state) => state.alternarAquecimento);

  // Dia aberto para editar; ao marcar um dia novo, ele abre sozinho
  const [aberto, setAberto] = useState<number | null>(() => escolhas.dias[0]?.dia ?? null);
  const marcados = escolhas.dias.map((dia) => dia.dia);

  function tocarDia(dia: number) {
    const marcando = !marcados.includes(dia);

    alternarDia(dia);
    setAberto(marcando ? dia : aberto === dia ? null : aberto);
  }

  return (
    <View style={estilos.raiz}>
      <View style={estilos.secao}>
        <Rotulo>dias de treino</Rotulo>
        <View style={estilos.dias}>
          {DIAS_DA_SEMANA.map((dia) => {
            const marcado = marcados.includes(dia);

            return (
              <Pressable
                key={dia}
                onPress={() => tocarDia(dia)}
                accessibilityRole="checkbox"
                accessibilityLabel={nomeDoDia(dia)}
                accessibilityState={{ checked: marcado }}
                hitSlop={4}
                testID={`montador-dia-${dia}`}
                style={({ pressed }) => [
                  estilos.bolinha,
                  { backgroundColor: marcado ? c.destaque : c.superficieSecundaria },
                  pressed && { opacity: 0.75 },
                ]}
              >
                <Texto
                  variante="legenda"
                  style={[estilos.sigla, { color: marcado ? c.textoSobreDestaque : c.texto }]}
                >
                  {siglaDoDia(dia)}
                </Texto>
              </Pressable>
            );
          })}
        </View>
      </View>

      {escolhas.dias.length === 0 ? (
        <Texto variante="legenda" secundario>
          marque os dias em que você treina.
        </Texto>
      ) : (
        <View style={estilos.secao}>
          <Rotulo>o que treinar em cada dia</Rotulo>
          {escolhas.dias.map((dia) => (
            <LinhaDia
              key={dia.dia}
              dia={dia}
              nivel={escolhas.nivel}
              aberto={aberto === dia.dia}
              copiarDe={diasParaCopiar(escolhas, dia.dia)}
              onAbrir={() => setAberto(aberto === dia.dia ? null : dia.dia)}
            />
          ))}
        </View>
      )}

      <View style={estilos.secao}>
        <Rotulo>seu nível</Rotulo>
        <View style={estilos.pilulas}>
          {NIVEIS_TREINO.map((nivel) => (
            <Pilula
              key={nivel}
              rotulo={NOME_NIVEL[nivel]}
              selecionada={escolhas.nivel === nivel}
              onPress={() => mudarEscolhas({ nivel })}
              rotuloAcessivel={`nível ${NOME_NIVEL[nivel]}`}
              testID={`nivel-${nivel}`}
            />
          ))}
        </View>
      </View>

      <View style={estilos.secao}>
        <Rotulo>equipamento</Rotulo>
        <View style={estilos.pilulas}>
          {EQUIPAMENTOS_TREINO.map((equipamento) => (
            <Pilula
              key={equipamento}
              rotulo={NOME_EQUIPAMENTO[equipamento]}
              selecionada={escolhas.equipamento === equipamento}
              onPress={() => mudarEscolhas({ equipamento })}
              rotuloAcessivel={`equipamento: ${NOME_EQUIPAMENTO[equipamento]}`}
              testID={`equipamento-${equipamento}`}
            />
          ))}
        </View>
      </View>

      <View style={estilos.secao}>
        <Interruptor
          rotulo="aquecimento"
          descricao="no começo de cada treino"
          valor={escolhas.aquecimento.ativo}
          onMudar={ligarAquecimento}
          testID="aquecimento-ligado"
        />
        {escolhas.aquecimento.ativo ? (
          <Aquecimento itens={escolhas.aquecimento.itens} onAlternar={alternarAquecimento} />
        ) : null}
      </View>

      <CampoTexto
        rotulo="evitar"
        opcional
        value={escolhas.evitar}
        onChangeText={(evitar) => mudarEscolhas({ evitar })}
        placeholder="ex: dor no joelho, leg press"
        maxLength={LIMITES_MONTADOR.evitar}
        testID="montador-evitar"
      />
      <CampoTexto
        rotulo="mais alguma coisa?"
        opcional
        value={escolhas.livre}
        onChangeText={(livre) => mudarEscolhas({ livre })}
        placeholder="ex: quero focar em glúteo"
        maxLength={LIMITES_MONTADOR.livre}
        multiline
        testID="montador-livre"
      />
    </View>
  );
}

/** Um dia marcado: a linha com o resumo e, aberta, as áreas e regiões. */
function LinhaDia({
  dia,
  nivel,
  aberto,
  copiarDe,
  onAbrir,
}: {
  dia: DiaMontado;
  nivel: NivelTreino;
  aberto: boolean;
  copiarDe: number[];
  onAbrir: () => void;
}) {
  const c = useCores();
  const cat = useCategorias();
  const alternarArea = useTreinosIaStore((state) => state.alternarArea);
  const alternarRegiao = useTreinosIaStore((state) => state.alternarRegiao);
  const copiarDia = useTreinosIaStore((state) => state.copiarDia);
  const vazio = dia.areas.length === 0;

  return (
    <View
      style={[
        estilos.dia,
        { borderColor: aberto ? c.textoSecundario : c.borda },
        vazio && !aberto && { borderColor: c.erro },
      ]}
    >
      <Pressable
        onPress={onAbrir}
        accessibilityRole="button"
        accessibilityLabel={rotuloDoDia(dia, nivel)}
        accessibilityHint={aberto ? 'fecha as escolhas do dia' : 'abre para escolher as áreas'}
        accessibilityState={{ expanded: aberto }}
        testID={`montador-linha-${dia.dia}`}
        style={({ pressed }) => [estilos.cabecalhoDia, pressed && { opacity: 0.75 }]}
      >
        <View style={estilos.textosDia}>
          <Texto style={estilos.nomeDia}>{nomeDoDia(dia.dia)}</Texto>
          <Texto variante="legenda" secundario numberOfLines={aberto ? undefined : 1}>
            {resumoDoDia(dia, nivel)}
          </Texto>
        </View>
        <Ionicons name={aberto ? 'chevron-up' : 'chevron-down'} size={20} color={c.texto} />
      </Pressable>

      {aberto ? (
        <View style={estilos.corpoDia}>
          <View style={estilos.pilulas}>
            {AREAS_TREINO.map((area) => (
              <Pilula
                key={area}
                rotulo={NOME_GRUPO[area]}
                selecionada={dia.areas.some((item) => item.area === area)}
                corSelecionada={cat.fundo[area]}
                corTextoSelecionada={c.textoSobreDestaque}
                onPress={() => alternarArea(dia.dia, area)}
                rotuloAcessivel={`${NOME_GRUPO[area]} na ${nomeDoDia(dia.dia)}`}
                testID={`area-${dia.dia}-${area}`}
              />
            ))}
          </View>

          {dia.areas
            .filter((item) => temRegioes(item.area))
            .map((item) => (
              <View key={item.area} style={estilos.regioes}>
                <Texto variante="legenda" secundario>
                  {item.regioes.length === 0
                    ? `${NOME_GRUPO[item.area]}: completo. toque para focar numa região`
                    : `${NOME_GRUPO[item.area]}: foco em`}
                </Texto>
                <View style={estilos.pilulas}>
                  {REGIOES[item.area].map((regiao) => {
                    const marcada = item.regioes.includes(regiao.id);

                    return (
                      <Pressable
                        key={regiao.id}
                        onPress={() => alternarRegiao(dia.dia, item.area, regiao.id)}
                        accessibilityRole="checkbox"
                        accessibilityLabel={`${NOME_GRUPO[item.area]}, ${regiao.nome}`}
                        accessibilityState={{ checked: marcada }}
                        testID={`regiao-${dia.dia}-${item.area}-${regiao.id}`}
                        style={({ pressed }) => [
                          estilos.regiao,
                          {
                            borderColor: cat.fundo[item.area],
                            backgroundColor: marcada ? cat.fundo[item.area] : 'transparent',
                          },
                          pressed && { opacity: 0.75 },
                        ]}
                      >
                        {marcada ? (
                          <Ionicons name="checkmark" size={14} color={c.textoSobreDestaque} />
                        ) : null}
                        <Texto
                          variante="legenda"
                          style={[
                            estilos.textoRegiao,
                            { color: marcada ? c.textoSobreDestaque : c.texto },
                          ]}
                        >
                          {regiao.nome}
                        </Texto>
                      </Pressable>
                    );
                  })}
                </View>
              </View>
            ))}

          <ExerciciosDoDia dia={dia} nivel={nivel} />
          <CardioDoDia dia={dia} />

          {copiarDe.length > 0 ? (
            <View style={estilos.copiar}>
              <Texto variante="legenda" secundario>
                igual a
              </Texto>
              {copiarDe.map((de) => (
                <Pressable
                  key={de}
                  onPress={() => copiarDia(de, dia.dia)}
                  accessibilityRole="button"
                  accessibilityLabel={`copiar o treino de ${nomeDoDia(de)}`}
                  hitSlop={6}
                  testID={`copiar-${de}-para-${dia.dia}`}
                  style={({ pressed }) => [
                    estilos.botaoCopiar,
                    { borderColor: c.borda },
                    pressed && { opacity: 0.6 },
                  ]}
                >
                  <Ionicons name="copy-outline" size={14} color={c.texto} />
                  <Texto variante="legenda">{siglaDoDia(de)}</Texto>
                </Pressable>
              ))}
            </View>
          ) : null}
        </View>
      ) : null}
    </View>
  );
}

/** Contador "exercícios" do dia (sem o aquecimento) e o atalho de voltar ao padrão. */
function ExerciciosDoDia({ dia, nivel }: { dia: DiaMontado; nivel: NivelTreino }) {
  const c = useCores();
  const passoExercicios = useTreinosIaStore((state) => state.passoExercicios);
  const exerciciosPadrao = useTreinosIaStore((state) => state.exerciciosPadrao);
  const contador = contadorExercicios(dia, nivel);

  if (!contador.visivel) {
    return null;
  }

  return (
    <View style={[estilos.itemAquecimento, { borderTopColor: c.borda }]}>
      <ContadorCompacto
        rotulo="exercícios"
        emLinha
        valorTexto={String(contador.valor)}
        podeMenos={contador.podeMenos}
        podeMais={contador.podeMais}
        onMenos={() => passoExercicios(dia.dia, -1)}
        onMais={() => passoExercicios(dia.dia, 1)}
        rotuloAcessivel={contador.rotuloAcessivel}
        valorAcessivel={contador.valorAcessivel}
        rotuloMenos={contador.rotuloMenos}
        rotuloMais={contador.rotuloMais}
        testID={`exercicios-${dia.dia}`}
      />
      <View style={estilos.legendaExercicios}>
        <Texto variante="legenda" secundario style={estilos.textoLegenda}>
          {contador.legenda}
        </Texto>
        {contador.padrao ? null : (
          <Pressable
            onPress={() => exerciciosPadrao(dia.dia)}
            accessibilityRole="button"
            accessibilityLabel={`voltar ao padrão do nível ${textoNoDia(dia.dia)}`}
            hitSlop={8}
            testID={`exercicios-${dia.dia}-padrao`}
            style={({ pressed }) => pressed && { opacity: 0.6 }}
          >
            <Texto variante="legenda" style={estilos.voltarPadrao}>
              usar o padrão
            </Texto>
          </Pressable>
        )}
      </View>
    </View>
  );
}

/** Cardio do dia: contínuo ou em circuito (com exercícios, segundos e voltas). */
function CardioDoDia({ dia }: { dia: DiaMontado }) {
  const c = useCores();
  const cat = useCategorias();
  const modoCardio = useTreinosIaStore((state) => state.modoCardio);
  const passoCircuito = useTreinosIaStore((state) => state.passoCircuito);
  const cardio = opcoesCardio(dia);

  if (!cardio.visivel) {
    return null;
  }

  return (
    <View style={[estilos.itemAquecimento, { borderTopColor: c.borda }]}>
      <Rotulo>cardio</Rotulo>
      <View style={estilos.medidas}>
        {cardio.opcoes.map((opcao) => (
          <Pilula
            key={opcao.modo}
            esticar
            rotulo={opcao.rotulo}
            selecionada={opcao.selecionada}
            corSelecionada={cat.fundo.cardio}
            corTextoSelecionada={c.textoSobreDestaque}
            onPress={() => modoCardio(dia.dia, opcao.modo)}
            rotuloAcessivel={opcao.rotuloAcessivel}
            testID={`cardio-${dia.dia}-${opcao.modo}`}
          />
        ))}
      </View>
      <Texto variante="legenda" secundario>
        {cardio.legenda}
      </Texto>
      {contadoresCircuito(dia).map((contador) => (
        <ContadorCompacto
          key={contador.campo}
          rotulo={contador.rotulo}
          emLinha
          valorTexto={contador.valorTexto}
          podeMenos={contador.podeMenos}
          podeMais={contador.podeMais}
          onMenos={() => passoCircuito(dia.dia, contador.campo, -1)}
          onMais={() => passoCircuito(dia.dia, contador.campo, 1)}
          rotuloAcessivel={contador.rotuloAcessivel}
          rotuloMenos={contador.rotuloMenos}
          rotuloMais={contador.rotuloMais}
          testID={`circuito-${dia.dia}-${contador.campo}`}
        />
      ))}
    </View>
  );
}

/** Exercícios de aquecimento: marcar vários e, em cada um, repetições ou minutos. */
function Aquecimento({
  itens,
  onAlternar,
}: {
  itens: readonly ItemAquecimento[];
  onAlternar: (nome: string) => void;
}) {
  const c = useCores();
  const cat = useCategorias();
  const medidaAquecimento = useTreinosIaStore((state) => state.medidaAquecimento);
  const passoAquecimento = useTreinosIaStore((state) => state.passoAquecimento);
  const cheio = itens.length >= LIMITES_MONTADOR.itensAquecimento;

  return (
    <View style={estilos.secao}>
      <Texto variante="legenda" secundario>
        escolha um ou mais
      </Texto>
      <View style={estilos.pilulas}>
        {OPCOES_AQUECIMENTO.map((nome) => {
          const marcado = itens.some((item) => item.nome === nome);

          return (
            <Pilula
              key={nome}
              rotulo={nome}
              selecionada={marcado}
              corSelecionada={cat.fundo.aquecimento}
              corTextoSelecionada={c.textoSobreDestaque}
              onPress={() => (marcado || !cheio ? onAlternar(nome) : undefined)}
              rotuloAcessivel={`aquecimento: ${nome}`}
              testID={`aquecimento-${nome}`}
            />
          );
        })}
      </View>

      {itens.map((item) => (
        <View key={item.nome} style={[estilos.itemAquecimento, { borderTopColor: c.borda }]}>
          <ContadorCompacto
            rotulo={item.nome}
            emLinha
            valorTexto={item.medida === 'tempo' ? `${item.valor} min` : `${item.valor} rep`}
            podeMenos={
              item.valor >
              (item.medida === 'tempo'
                ? LIMITES_MONTADOR.minutosAquecimento.min
                : LIMITES_MONTADOR.repeticoesAquecimento.min)
            }
            podeMais={
              item.valor <
              (item.medida === 'tempo'
                ? LIMITES_MONTADOR.minutosAquecimento.max
                : LIMITES_MONTADOR.repeticoesAquecimento.max)
            }
            onMenos={() => passoAquecimento(item.nome, -1)}
            onMais={() => passoAquecimento(item.nome, 1)}
            testID={`valor-${item.nome}`}
          />
          {soPorTempo(item.nome) ? (
            <Texto variante="legenda" secundario>
              {`sempre por tempo: ${textoValorAquecimento(item)}`}
            </Texto>
          ) : (
            <View style={estilos.medidas}>
              {MEDIDAS.map((medida) => (
                <Pilula
                  key={medida.valor}
                  esticar
                  rotulo={medida.rotulo}
                  selecionada={item.medida === medida.valor}
                  onPress={() => medidaAquecimento(item.nome, medida.valor)}
                  rotuloAcessivel={`${item.nome} por ${medida.rotulo}`}
                  testID={`medida-${item.nome}-${medida.valor}`}
                />
              ))}
            </View>
          )}
        </View>
      ))}
    </View>
  );
}

const TAMANHO_DIA = 40;

const estilos = StyleSheet.create({
  raiz: {
    gap: espaco.lg,
  },
  secao: {
    gap: espaco.sm,
  },
  dias: {
    flexDirection: 'row',
    justifyContent: 'space-between',
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
  pilulas: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: espaco.sm,
  },
  dia: {
    borderWidth: borda.fina,
    borderRadius: raio.md,
    borderCurve: 'continuous',
  },
  cabecalhoDia: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: espaco.sm,
    minHeight: 56,
    paddingHorizontal: espaco.md,
    paddingVertical: espaco.sm,
  },
  textosDia: {
    flex: 1,
    gap: 2,
  },
  nomeDia: {
    fontFamily: familia.corpoForte,
  },
  corpoDia: {
    gap: espaco.md,
    paddingHorizontal: espaco.md,
    paddingBottom: espaco.md,
  },
  regioes: {
    gap: espaco.xs,
  },
  regiao: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: espaco.xs,
    minHeight: 36,
    paddingHorizontal: espaco.sm + 4,
    borderRadius: raio.total,
    borderWidth: borda.grossa,
  },
  textoRegiao: {
    fontFamily: familia.corpoMedio,
  },
  copiar: {
    flexDirection: 'row',
    alignItems: 'center',
    flexWrap: 'wrap',
    gap: espaco.sm,
  },
  botaoCopiar: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: espaco.xs,
    minHeight: 32,
    paddingHorizontal: espaco.sm + 2,
    borderRadius: raio.total,
    borderWidth: borda.fina,
  },
  itemAquecimento: {
    gap: espaco.sm,
    paddingTop: espaco.sm,
    borderTopWidth: StyleSheet.hairlineWidth,
  },
  legendaExercicios: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: espaco.sm,
  },
  textoLegenda: {
    flex: 1,
  },
  voltarPadrao: {
    fontFamily: familia.corpoForte,
    textDecorationLine: 'underline',
  },
  medidas: {
    flexDirection: 'row',
    gap: espaco.sm,
  },
});
