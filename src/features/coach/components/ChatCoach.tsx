import Ionicons from '@expo/vector-icons/Ionicons';
import { router } from 'expo-router';
import { useRef, useState } from 'react';
import {
  ActivityIndicator,
  KeyboardAvoidingView,
  Platform,
  Pressable,
  ScrollView,
  StyleSheet,
  TextInput,
  View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { primeiroNome } from '@/features/perfil/calculos';
import { usePerfilStore } from '@/features/perfil/store';
import { confirmar } from '@/shared/lib/confirmar';
import { espaco, familia, fonte, raio } from '@/shared/theme/tokens';
import { useCores } from '@/shared/theme/useCores';
import { Texto } from '@/shared/ui';

import { LIMITES_COACH } from '../contrato';
import { dadosAtuais } from '../contextoAtual';
import { useCoachStore, type MensagemChat } from '../store';
import { CartaoProposta } from './CartaoProposta';

const SUGESTOES = [
  'monta minha dieta',
  'troca o café da manhã',
  'monta meu treino',
  'o que comer antes do treino?',
  'como estou na água hoje?',
];

const TAMANHO_BOTAO = 44;

function BotaoRedondo({
  icone,
  rotulo,
  onPress,
}: {
  icone: 'chevron-back' | 'trash-outline';
  rotulo: string;
  onPress: () => void;
}) {
  const c = useCores();

  return (
    <Pressable
      onPress={onPress}
      accessibilityRole="button"
      accessibilityLabel={rotulo}
      hitSlop={4}
      style={({ pressed }) => [
        estilos.botaoRedondo,
        { backgroundColor: c.superficie },
        pressed && { opacity: 0.75 },
      ]}
    >
      <Ionicons name={icone} size={icone === 'chevron-back' ? 24 : 20} color={c.texto} />
    </Pressable>
  );
}

function Bolha({ mensagem, digitando }: { mensagem: MensagemChat; digitando: boolean }) {
  const c = useCores();
  const doUsuario = mensagem.papel === 'usuario';
  const aplicarProposta = useCoachStore((state) => state.aplicarProposta);
  const recusarProposta = useCoachStore((state) => state.recusarProposta);
  const desfazerProposta = useCoachStore((state) => state.desfazerProposta);

  return (
    <View
      // Com proposta, os botões dentro da bolha precisam ser alcançáveis pelo leitor de tela
      accessible={!mensagem.proposta}
      accessibilityLabel={`${doUsuario ? 'Você' : 'Coach'}: ${mensagem.texto || 'digitando'}`}
      style={[
        estilos.bolha,
        doUsuario
          ? [estilos.bolhaUsuario, { backgroundColor: c.destaque }]
          : [estilos.bolhaCoach, { backgroundColor: c.superficie }],
      ]}
    >
      {!doUsuario ? (
        <Texto variante="legenda" secundario>
          {mensagem.demo ? 'coach · modo demonstração' : 'coach'}
        </Texto>
      ) : null}
      <Texto
        style={doUsuario && { color: c.textoSobreDestaque }}
        selectable
        accessibilityLiveRegion={doUsuario ? undefined : 'polite'}
      >
        {mensagem.texto || (digitando ? 'pensando...' : '')}
      </Texto>
      {mensagem.proposta ? (
        <CartaoProposta
          proposta={mensagem.proposta}
          bloqueada={digitando}
          onAplicar={() => aplicarProposta(mensagem.id)}
          onRecusar={() => recusarProposta(mensagem.id)}
          onDesfazer={() => desfazerProposta(mensagem.id)}
        />
      ) : null}
      {mensagem.dietaAtualizada ? (
        <Pressable
          onPress={() => router.push('/dieta')}
          accessibilityRole="button"
          accessibilityLabel="Dieta atualizada. Ver dieta"
          style={({ pressed }) => [
            estilos.chipDieta,
            { backgroundColor: c.destaque },
            pressed && { opacity: 0.75 },
          ]}
        >
          <Texto variante="rotulo" style={{ color: c.textoSobreDestaque }}>
            ver dieta atualizada
          </Texto>
          <Ionicons name="arrow-forward" size={16} color={c.textoSobreDestaque} />
        </Pressable>
      ) : null}
      {mensagem.treinosAtualizados ? (
        <Pressable
          onPress={() => router.push('/')}
          accessibilityRole="button"
          accessibilityLabel="Treinos atualizados. Ver na tela inicial"
          style={[estilos.chipDieta, { backgroundColor: c.destaque }]}
        >
          <Texto variante="rotulo" style={{ color: c.textoSobreDestaque }}>
            ver treinos atualizados
          </Texto>
        </Pressable>
      ) : null}
    </View>
  );
}

/** Tela do coach: barra própria com voltar, conversa em bolhas e campo em pílula. */
export function ChatCoach() {
  const c = useCores();
  const perfil = usePerfilStore((state) => state.perfil);
  const mensagens = useCoachStore((state) => state.mensagens);
  const respondendo = useCoachStore((state) => state.respondendo);
  const erro = useCoachStore((state) => state.erro);
  const enviar = useCoachStore((state) => state.enviar);
  const limpar = useCoachStore((state) => state.limpar);

  const [texto, setTexto] = useState('');
  const rolagem = useRef<ScrollView>(null);

  function mandar(conteudo: string) {
    const dados = dadosAtuais();

    if (!dados || conteudo.trim() === '' || respondendo) {
      return;
    }

    setTexto('');
    enviar(conteudo, dados);
  }

  async function apagarConversa() {
    if (
      await confirmar('apagar conversa?', 'o histórico com o coach some deste aparelho.', 'apagar')
    ) {
      limpar();
    }
  }

  function voltar() {
    // Aberto por link direto não tem para onde voltar: vai para o início
    if (router.canGoBack()) {
      router.back();
    } else {
      router.replace('/');
    }
  }

  const nome = perfil ? primeiroNome(perfil.nome) : '';
  const podeEnviar = texto.trim() !== '' && !respondendo;

  return (
    <SafeAreaView edges={['top', 'bottom']} style={[estilos.raiz, { backgroundColor: c.fundo }]}>
      <KeyboardAvoidingView
        style={estilos.raiz}
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
      >
        <View style={estilos.topo}>
          <BotaoRedondo icone="chevron-back" rotulo="Voltar" onPress={voltar} />
          <Texto variante="subtitulo" accessibilityRole="header" style={estilos.tituloTopo}>
            coach
          </Texto>
          {mensagens.length > 0 ? (
            <BotaoRedondo icone="trash-outline" rotulo="Limpar conversa" onPress={apagarConversa} />
          ) : (
            // Mantém o título centralizado quando não há botão de limpar
            <View style={estilos.botaoRedondo} />
          )}
        </View>

        <ScrollView
          ref={rolagem}
          contentContainerStyle={estilos.conversa}
          onContentSizeChange={() => rolagem.current?.scrollToEnd({ animated: true })}
          keyboardShouldPersistTaps="handled"
          keyboardDismissMode="interactive"
        >
          {mensagens.length === 0 ? (
            <View style={estilos.vazio}>
              <Texto variante="titulo">fala, {nome}!</Texto>
              <Texto secundario>
                sou seu coach. sei suas metas, sua água, sua dieta e seus treinos. pergunte o que
                quiser ou peça para eu montar ou mudar a dieta e os treinos: eu mostro a proposta e
                você decide se aplica.
              </Texto>
              <View style={estilos.sugestoes}>
                {SUGESTOES.map((sugestao) => (
                  <Pressable
                    key={sugestao}
                    onPress={() => mandar(sugestao)}
                    accessibilityRole="button"
                    style={({ pressed }) => [
                      estilos.sugestao,
                      { backgroundColor: c.superficie },
                      pressed && { opacity: 0.75 },
                    ]}
                  >
                    <Texto variante="rotulo">{sugestao}</Texto>
                  </Pressable>
                ))}
              </View>
            </View>
          ) : null}

          {mensagens.map((mensagem, i) => (
            <Bolha
              key={mensagem.id}
              mensagem={mensagem}
              digitando={respondendo && i === mensagens.length - 1}
            />
          ))}

          {erro ? (
            <Texto variante="legenda" style={{ color: c.erro }} accessibilityLiveRegion="polite">
              {erro}
            </Texto>
          ) : null}
        </ScrollView>

        <View style={estilos.compositor}>
          <View style={[estilos.pilula, { backgroundColor: c.superficie }]}>
            <TextInput
              value={texto}
              onChangeText={setTexto}
              placeholder="escreva para o coach"
              placeholderTextColor={c.textoSecundario}
              selectionColor={c.textoSecundario}
              accessibilityLabel="Mensagem para o coach"
              multiline
              maxLength={LIMITES_COACH.texto}
              style={[estilos.entrada, { color: c.texto }]}
            />
            <Pressable
              onPress={() => mandar(texto)}
              disabled={!podeEnviar}
              accessibilityRole="button"
              accessibilityLabel="Enviar"
              accessibilityState={{ disabled: !podeEnviar, busy: respondendo }}
              style={({ pressed }) => [
                estilos.enviar,
                { backgroundColor: c.destaque },
                pressed && { opacity: 0.75 },
                !podeEnviar && !respondendo && { opacity: 0.4 },
              ]}
            >
              {respondendo ? (
                <ActivityIndicator color={c.textoSobreDestaque} />
              ) : (
                <Ionicons name="arrow-up" size={24} color={c.textoSobreDestaque} />
              )}
            </Pressable>
          </View>
        </View>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

const estilos = StyleSheet.create({
  raiz: {
    flex: 1,
  },
  topo: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: espaco.sm,
    paddingHorizontal: espaco.md,
    paddingVertical: espaco.sm,
  },
  tituloTopo: {
    flex: 1,
    textAlign: 'center',
  },
  botaoRedondo: {
    width: TAMANHO_BOTAO,
    height: TAMANHO_BOTAO,
    borderRadius: raio.total,
    alignItems: 'center',
    justifyContent: 'center',
  },
  conversa: {
    padding: espaco.md,
    gap: espaco.sm,
    width: '100%',
    maxWidth: 560,
    alignSelf: 'center',
  },
  vazio: {
    gap: espaco.sm,
    paddingVertical: espaco.lg,
  },
  sugestoes: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: espaco.sm,
    marginTop: espaco.md,
  },
  sugestao: {
    minHeight: TAMANHO_BOTAO,
    justifyContent: 'center',
    paddingHorizontal: espaco.md + 2,
    borderRadius: raio.total,
  },
  bolha: {
    maxWidth: '85%',
    paddingHorizontal: espaco.md + 2,
    paddingVertical: espaco.sm + 4,
    borderRadius: raio.lg,
    borderCurve: 'continuous',
    gap: espaco.xs,
  },
  bolhaUsuario: {
    alignSelf: 'flex-end',
    borderBottomRightRadius: espaco.sm,
  },
  bolhaCoach: {
    alignSelf: 'flex-start',
    borderBottomLeftRadius: espaco.sm,
  },
  chipDieta: {
    alignSelf: 'flex-start',
    flexDirection: 'row',
    alignItems: 'center',
    gap: espaco.xs,
    minHeight: TAMANHO_BOTAO,
    paddingHorizontal: espaco.md,
    marginTop: espaco.xs,
    borderRadius: raio.total,
  },
  compositor: {
    width: '100%',
    maxWidth: 560 + espaco.md * 2,
    alignSelf: 'center',
    paddingHorizontal: espaco.md,
    paddingTop: espaco.xs,
    paddingBottom: espaco.sm,
  },
  pilula: {
    flexDirection: 'row',
    alignItems: 'flex-end',
    gap: espaco.sm,
    borderRadius: raio.lg,
    borderCurve: 'continuous',
    padding: 6,
    paddingLeft: espaco.md + 2,
  },
  entrada: {
    flex: 1,
    minHeight: TAMANHO_BOTAO,
    maxHeight: 140,
    paddingTop: 11,
    paddingBottom: 11,
    fontFamily: familia.corpo,
    fontSize: fonte.corpo,
    ...Platform.select({ web: { outlineWidth: 0 } }),
  },
  enviar: {
    width: TAMANHO_BOTAO,
    height: TAMANHO_BOTAO,
    borderRadius: raio.total,
    alignItems: 'center',
    justifyContent: 'center',
  },
});
