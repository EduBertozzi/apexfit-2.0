import { router } from 'expo-router';
import { useRef, useState } from 'react';
import {
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
import { borda, espaco, familia, fonte, raio } from '@/shared/theme/tokens';
import { useCores } from '@/shared/theme/useCores';
import { Botao, Marcado, Texto } from '@/shared/ui';

import { LIMITES_COACH } from '../contrato';
import { dadosAtuais } from '../contextoAtual';
import { useCoachStore, type MensagemChat } from '../store';

const SUGESTOES = [
  'Monta minha dieta',
  'Troca o café da manhã',
  'O que comer antes do treino?',
  'Como estou na água hoje?',
];

function Bolha({ mensagem, digitando }: { mensagem: MensagemChat; digitando: boolean }) {
  const c = useCores();
  const doUsuario = mensagem.papel === 'usuario';

  return (
    <View
      accessible
      accessibilityLabel={`${doUsuario ? 'Você' : 'Coach'}: ${mensagem.texto || 'digitando'}`}
      style={[
        estilos.bolha,
        doUsuario
          ? [estilos.bolhaUsuario, { backgroundColor: c.primaria }]
          : [estilos.bolhaCoach, { backgroundColor: c.superficie, borderColor: c.borda }],
      ]}
    >
      {!doUsuario ? (
        <Texto variante="rotulo" secundario>
          {mensagem.demo ? 'Coach · modo demonstração' : 'Coach'}
        </Texto>
      ) : null}
      <Texto
        style={doUsuario && { color: c.textoSobrePrimaria }}
        selectable
        accessibilityLiveRegion={doUsuario ? undefined : 'polite'}
      >
        {mensagem.texto || (digitando ? 'Pensando...' : '')}
      </Texto>
      {mensagem.dietaAtualizada ? (
        <Pressable
          onPress={() => router.push('/dieta')}
          accessibilityRole="button"
          accessibilityLabel="Dieta atualizada. Ver dieta"
          style={[estilos.chipDieta, { backgroundColor: c.destaque }]}
        >
          <Texto variante="rotulo" style={{ color: c.textoSobreDestaque }}>
            Dieta atualizada: ver
          </Texto>
        </Pressable>
      ) : null}
    </View>
  );
}

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
      await confirmar('Apagar conversa?', 'O histórico com o coach some deste aparelho.', 'Apagar')
    ) {
      limpar();
    }
  }

  const nome = perfil ? primeiroNome(perfil.nome) : '';
  const podeEnviar = texto.trim() !== '' && !respondendo;

  return (
    <SafeAreaView edges={['top']} style={[estilos.raiz, { backgroundColor: c.fundo }]}>
      <KeyboardAvoidingView
        style={estilos.raiz}
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
      >
        <View style={[estilos.topo, { borderBottomColor: c.borda }]}>
          <Texto variante="titulo" accessibilityRole="header">
            <Marcado>Coach</Marcado>
          </Texto>
          {mensagens.length > 0 ? (
            <Botao titulo="Limpar" variante="texto" onPress={apagarConversa} />
          ) : null}
        </View>

        <ScrollView
          ref={rolagem}
          contentContainerStyle={estilos.conversa}
          onContentSizeChange={() => rolagem.current?.scrollToEnd({ animated: true })}
          keyboardShouldPersistTaps="handled"
        >
          {mensagens.length === 0 ? (
            <View style={estilos.vazio}>
              <Texto variante="subtitulo">Fala, {nome}!</Texto>
              <Texto secundario>
                Sou seu coach. Sei suas metas, sua água e sua dieta. Pergunte o que quiser ou peça
                para eu montar ou mudar seu plano alimentar.
              </Texto>
              <View style={estilos.sugestoes}>
                {SUGESTOES.map((sugestao) => (
                  <Pressable
                    key={sugestao}
                    onPress={() => mandar(sugestao)}
                    accessibilityRole="button"
                    style={({ pressed }) => [
                      estilos.sugestao,
                      { borderColor: c.borda, backgroundColor: c.superficie },
                      pressed && { opacity: 0.75 },
                    ]}
                  >
                    <Texto>{sugestao}</Texto>
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

        <View
          style={[estilos.compositor, { borderTopColor: c.borda, backgroundColor: c.superficie }]}
        >
          <TextInput
            value={texto}
            onChangeText={setTexto}
            placeholder="Escreva para o coach"
            placeholderTextColor={c.textoSecundario}
            accessibilityLabel="Mensagem para o coach"
            multiline
            maxLength={LIMITES_COACH.texto}
            style={[
              estilos.entrada,
              { color: c.texto, borderColor: c.textoSecundario, backgroundColor: c.fundo },
            ]}
          />
          <View style={estilos.botaoEnviar}>
            <Botao
              titulo="Enviar"
              icone="arrow-up"
              variante="destaque"
              onPress={() => mandar(texto)}
              desabilitado={!podeEnviar}
              carregando={respondendo}
            />
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
    justifyContent: 'space-between',
    paddingHorizontal: espaco.md,
    paddingVertical: espaco.sm,
    borderBottomWidth: borda.grossa,
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
    gap: espaco.sm,
    marginTop: espaco.sm,
  },
  sugestao: {
    minHeight: 48,
    justifyContent: 'center',
    paddingHorizontal: espaco.md,
    borderWidth: borda.grossa,
    borderRadius: raio.sm,
  },
  bolha: {
    maxWidth: '88%',
    paddingHorizontal: espaco.md,
    paddingVertical: espaco.sm,
    borderRadius: raio.md,
    gap: espaco.xs,
  },
  bolhaUsuario: {
    alignSelf: 'flex-end',
  },
  bolhaCoach: {
    alignSelf: 'flex-start',
    borderWidth: borda.grossa,
  },
  chipDieta: {
    alignSelf: 'flex-start',
    minHeight: 44,
    justifyContent: 'center',
    paddingHorizontal: espaco.sm,
    marginTop: espaco.xs,
  },
  compositor: {
    flexDirection: 'row',
    alignItems: 'flex-end',
    gap: espaco.sm,
    padding: espaco.sm,
    borderTopWidth: borda.grossa,
  },
  entrada: {
    flex: 1,
    minHeight: 50,
    maxHeight: 140,
    borderWidth: borda.grossa,
    borderRadius: raio.sm,
    paddingHorizontal: espaco.md,
    paddingTop: 14,
    paddingBottom: 14,
    fontFamily: familia.corpo,
    fontSize: fonte.corpo,
    ...Platform.select({ web: { outlineWidth: 0 } }),
  },
  botaoEnviar: {
    width: 56,
  },
});
