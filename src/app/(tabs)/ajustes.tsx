import Constants from 'expo-constants';
import { StyleSheet, View } from 'react-native';

import { AjustesAgua } from '@/features/ajustes/components/AjustesAgua';
import { apagarTodosOsDados } from '@/features/ajustes/apagarDados';
import { NOME_TEMA, type PreferenciaTema } from '@/features/ajustes/logica';
import { useAjustesStore } from '@/features/ajustes/store';
import { AjustesLembretes } from '@/features/lembretes/components/AjustesLembretes';
import { usePerfilStore } from '@/features/perfil/store';
import { confirmar } from '@/shared/lib/confirmar';
import { espaco } from '@/shared/theme/tokens';
import { Botao, Logo, Opcoes, Secao, Tela, Texto } from '@/shared/ui';

const TEMAS: PreferenciaTema[] = ['sistema', 'claro', 'escuro'];
const OPCOES_TEMA = TEMAS.map((valor) => ({ valor, rotulo: NOME_TEMA[valor] }));

export default function Ajustes() {
  const perfil = usePerfilStore((state) => state.perfil);
  const tema = useAjustesStore((state) => state.tema);
  const definirTema = useAjustesStore((state) => state.definirTema);

  if (!perfil) {
    return null;
  }

  async function apagarDados() {
    const confirmado = await confirmar(
      'apagar meus dados?',
      'seu perfil, água, peso, dieta, treinos, conversa com o coach, ajustes e lembretes serão apagados deste aparelho. não dá para desfazer.',
      'apagar',
    );

    if (confirmado) {
      apagarTodosOsDados();
    }
  }

  return (
    <Tela>
      <Texto variante="titulo" accessibilityRole="header" style={estilos.titulo}>
        ajustes
      </Texto>

      <Secao
        titulo="aparência"
        rodape="no automático, o app segue o modo claro ou escuro do celular."
      >
        <Opcoes
          rotulo="tema"
          opcoes={OPCOES_TEMA}
          valor={tema}
          onMudar={(valor) => definirTema(valor as PreferenciaTema)}
          testID="ajuste-tema"
        />
      </Secao>

      <AjustesAgua pesoKg={perfil.pesoKg} />

      <AjustesLembretes />

      <Secao
        titulo="privacidade"
        rodape="seus dados ficam salvos neste aparelho. quando você pede a dieta ou conversa com o coach, seu perfil e suas metas vão para o servidor do ApexFit e para a OpenAI (empresa do ChatGPT, a IA que responde) só para responder."
      >
        <Botao titulo="apagar meus dados" variante="perigo" onPress={apagarDados} />
      </Secao>

      <Secao
        titulo="sobre"
        rodape="o ApexFit ajuda a organizar sua rotina, mas não substitui médico, nutricionista ou educador físico."
      >
        <View style={estilos.sobre}>
          <Logo tamanho={48} />
          <View>
            <Texto variante="subtitulo">ApexFit</Texto>
            <Texto variante="legenda" secundario>
              versão {Constants.expoConfig?.version ?? ''}
            </Texto>
          </View>
        </View>
      </Secao>
    </Tela>
  );
}

const estilos = StyleSheet.create({
  titulo: {
    paddingHorizontal: espaco.xs,
    paddingTop: espaco.md,
    paddingBottom: espaco.sm,
  },
  sobre: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: espaco.md - 4,
  },
});
