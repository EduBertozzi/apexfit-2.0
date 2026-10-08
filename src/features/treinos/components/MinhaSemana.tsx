import Ionicons from '@expo/vector-icons/Ionicons';
import { router } from 'expo-router';
import { AccessibilityInfo, Pressable, StyleSheet, View } from 'react-native';

import { espaco, familia, raio } from '@/shared/theme/tokens';
import { useCategorias, useCores } from '@/shared/theme/useCores';
import { Botao, Cartao, Texto } from '@/shared/ui';

import { rotuloDoDiaNoPlano, textoDoDia, type DiaDoPlano } from '../planoSemana';
import { usePlanoDaSemana, useTreinosStore } from '../store';

function abrirDia(dia: number) {
  router.push({ pathname: '/treino/escolher-dia', params: { dia: String(dia) } });
}

/** Tela "minha semana": cartão de explicação e as 7 linhas, domingo a sábado. */
export function MinhaSemana() {
  const { plano, resumo, semPlano, temTreinos } = usePlanoDaSemana();
  const distribuir = useTreinosStore((state) => state.distribuirAutomatico);

  function distribuirAgora() {
    distribuir();
    AccessibilityInfo.announceForAccessibility('treinos distribuídos pela semana');
  }

  return (
    <View style={estilos.container}>
      <Cartao>
        <Texto variante="subtitulo" accessibilityRole="header">
          cada dia com seu treino
        </Texto>
        <Texto secundario>Dias sem treino viram descanso. Toque num dia para trocar.</Texto>
        {semPlano && temTreinos ? (
          <Texto variante="legenda" secundario>
            Agora o app usa o rodízio A, B, C: depois do último treino feito, vem o próximo da
            lista. Distribua para cada dia ter o seu.
          </Texto>
        ) : null}
        <Texto variante="rotulo" accessibilityLiveRegion="polite">
          {resumo}
        </Texto>
        {temTreinos ? (
          <Botao titulo="distribuir automático" variante="secundario" onPress={distribuirAgora} />
        ) : null}
      </Cartao>

      <View style={estilos.lista}>
        {plano.map((entrada) => (
          <LinhaDoDia key={entrada.dia} entrada={entrada} />
        ))}
      </View>
    </View>
  );
}

function LinhaDoDia({ entrada }: { entrada: DiaDoPlano }) {
  const c = useCores();
  const cat = useCategorias();
  const { titulo, detalhe } = textoDoDia(entrada);
  const livre = entrada.tipo !== 'treino';

  return (
    <Pressable
      onPress={() => abrirDia(entrada.dia)}
      accessibilityRole="button"
      accessibilityLabel={rotuloDoDiaNoPlano(entrada)}
      accessibilityHint="Escolhe o treino deste dia"
      testID={`dia-${entrada.dia}`}
      style={({ pressed }) => [
        estilos.linha,
        { backgroundColor: c.superficie },
        pressed && estilos.pressionado,
      ]}
    >
      <View
        style={[estilos.sigla, { backgroundColor: livre ? c.superficieSecundaria : c.destaque }]}
      >
        <Texto
          variante="rotulo"
          style={[estilos.textoSigla, { color: livre ? c.texto : c.textoSobreDestaque }]}
        >
          {entrada.sigla}
        </Texto>
      </View>

      <View style={estilos.textos}>
        <Texto variante="legenda" secundario>
          {entrada.nome}
        </Texto>
        <Texto
          variante="corpo"
          numberOfLines={1}
          style={livre ? estilos.livre : estilos.nome}
          secundario={livre}
        >
          {titulo}
        </Texto>
        {detalhe ? (
          <Texto variante="legenda" secundario numberOfLines={1}>
            {detalhe}
          </Texto>
        ) : null}
        {entrada.grupos.length > 0 ? (
          <View style={estilos.bolinhas}>
            {entrada.grupos.map((grupo) => (
              <View key={grupo} style={[estilos.bolinha, { backgroundColor: cat.fundo[grupo] }]} />
            ))}
          </View>
        ) : null}
      </View>

      <Ionicons name="chevron-forward" size={20} color={c.textoSecundario} />
    </Pressable>
  );
}

const estilos = StyleSheet.create({
  container: {
    gap: espaco.md,
  },
  lista: {
    gap: espaco.sm,
  },
  linha: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: espaco.md,
    minHeight: 72,
    paddingHorizontal: espaco.md,
    paddingVertical: espaco.sm + 4,
    borderRadius: raio.lg,
    borderCurve: 'continuous',
  },
  pressionado: {
    opacity: 0.8,
    transform: [{ scale: 0.98 }],
  },
  sigla: {
    width: 48,
    height: 48,
    borderRadius: raio.total,
    alignItems: 'center',
    justifyContent: 'center',
  },
  textoSigla: {
    fontFamily: familia.displayLeve,
  },
  textos: {
    flex: 1,
    gap: 2,
  },
  nome: {
    fontFamily: familia.corpoForte,
  },
  livre: {
    fontFamily: familia.corpoMedio,
  },
  bolinhas: {
    flexDirection: 'row',
    gap: espaco.xs,
    marginTop: espaco.xs,
  },
  bolinha: {
    width: 10,
    height: 10,
    borderRadius: raio.total,
  },
});
