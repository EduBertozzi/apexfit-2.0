import Ionicons from '@expo/vector-icons/Ionicons';
import { router } from 'expo-router';
import { Pressable, StyleSheet, View } from 'react-native';

import { espaco, raio } from '@/shared/theme/tokens';
import { useCores } from '@/shared/theme/useCores';
import { Texto } from '@/shared/ui';

import { podeDesfazer, type Proposta } from '../proposta';

const ALTURA_MINIMA = 44;

type Props = {
  proposta: Proposta;
  /** Enquanto o coach escreve, os botões esperam a resposta terminar. */
  bloqueada?: boolean;
  onAplicar: () => void;
  onRecusar: () => void;
  onDesfazer: () => void;
};

function Pilula({
  rotulo,
  descricao,
  onPress,
  forte = false,
  desabilitada = false,
  icone,
}: {
  rotulo: string;
  descricao?: string;
  onPress: () => void;
  forte?: boolean;
  desabilitada?: boolean;
  icone?: 'arrow-forward';
}) {
  const c = useCores();
  const corTexto = forte ? c.textoSobreDestaque : c.texto;

  return (
    <Pressable
      onPress={onPress}
      disabled={desabilitada}
      accessibilityRole="button"
      accessibilityLabel={descricao ?? rotulo}
      accessibilityState={{ disabled: desabilitada }}
      hitSlop={4}
      style={({ pressed }) => [
        estilos.pilula,
        { backgroundColor: forte ? c.destaque : c.primariaSuave },
        pressed && { opacity: 0.75 },
        desabilitada && { opacity: 0.45 },
      ]}
    >
      <Texto variante="rotulo" style={{ color: corTexto }}>
        {rotulo}
      </Texto>
      {icone ? <Ionicons name={icone} size={16} color={corTexto} /> : null}
    </Pressable>
  );
}

/**
 * Proposta do coach dentro da bolha: o resumo e os botões "aplicar" e
 * "não, obrigado". Depois de aplicar, mostra "aplicado" com "desfazer".
 */
export function CartaoProposta({
  proposta,
  bloqueada = false,
  onAplicar,
  onRecusar,
  onDesfazer,
}: Props) {
  const c = useCores();
  const { resumo, estado } = proposta;
  const deDieta = proposta.tipo === 'dieta';
  const assunto = deDieta ? 'dieta' : 'treinos';

  return (
    <View style={[estilos.cartao, { backgroundColor: c.fundo }]}>
      <Texto variante="legenda" secundario>
        {deDieta ? 'proposta de dieta' : 'proposta de treinos'}
      </Texto>
      <Texto variante="rotulo">{resumo.titulo}</Texto>

      {resumo.mudancas.length > 0 ? (
        <View style={estilos.lista}>
          {resumo.mudancas.map((linha, i) => (
            <Texto key={`${i}-${linha}`}>{linha}</Texto>
          ))}
        </View>
      ) : null}

      <View style={estilos.lista}>
        {resumo.linhas.map((linha, i) => (
          <Texto key={`${i}-${linha}`} variante="legenda" secundario>
            {linha}
          </Texto>
        ))}
      </View>

      {estado === 'pendente' ? (
        <View style={estilos.botoes}>
          <Pilula
            rotulo="aplicar"
            descricao={`Aplicar a proposta de ${assunto}`}
            onPress={onAplicar}
            desabilitada={bloqueada}
            forte
          />
          <Pilula
            rotulo="não, obrigado"
            descricao={`Não aplicar a proposta de ${assunto}`}
            onPress={onRecusar}
            desabilitada={bloqueada}
          />
        </View>
      ) : null}

      {estado === 'aplicado' ? (
        <View style={estilos.botoes}>
          <Texto variante="rotulo" accessibilityLiveRegion="polite" style={estilos.estado}>
            aplicado
          </Texto>
          {podeDesfazer(proposta) ? (
            <Pilula
              rotulo="desfazer"
              descricao={`Desfazer e voltar ${deDieta ? 'a dieta' : 'os treinos'} de antes`}
              onPress={onDesfazer}
            />
          ) : null}
          <Pilula
            rotulo={deDieta ? 'ver dieta' : 'ver treinos'}
            onPress={() => router.push(deDieta ? '/dieta' : '/treinos')}
            icone="arrow-forward"
            forte
          />
        </View>
      ) : null}

      {estado === 'descartado' ? (
        <Texto variante="rotulo" secundario accessibilityLiveRegion="polite" style={estilos.estado}>
          descartado
        </Texto>
      ) : null}
    </View>
  );
}

const estilos = StyleSheet.create({
  cartao: {
    gap: espaco.xs,
    marginTop: espaco.xs,
    padding: espaco.md,
    borderRadius: raio.md,
    borderCurve: 'continuous',
  },
  lista: {
    gap: 2,
  },
  botoes: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    alignItems: 'center',
    gap: espaco.sm,
    marginTop: espaco.xs,
  },
  pilula: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: espaco.xs,
    minHeight: ALTURA_MINIMA,
    paddingHorizontal: espaco.md,
    borderRadius: raio.total,
  },
  estado: {
    paddingVertical: espaco.sm + 2,
  },
});
