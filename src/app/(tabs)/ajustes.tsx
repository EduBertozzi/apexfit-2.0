import Constants from 'expo-constants';

import { AjustesAgua } from '@/features/ajustes/components/AjustesAgua';
import { apagarTodosOsDados } from '@/features/ajustes/apagarDados';
import { NOME_TEMA, type PreferenciaTema } from '@/features/ajustes/logica';
import { useAjustesStore } from '@/features/ajustes/store';
import { AjustesLembretes } from '@/features/lembretes/components/AjustesLembretes';
import { usePerfilStore } from '@/features/perfil/store';
import { confirmar } from '@/shared/lib/confirmar';
import { View } from 'react-native';

import { Botao, Cartao, Logo, Opcoes, Tela, Texto } from '@/shared/ui';

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
      'Apagar meus dados?',
      'Seu perfil, água, peso, dieta, treinos, conversa com o coach, ajustes e lembretes serão apagados deste aparelho. Não dá para desfazer.',
      'Apagar',
    );

    if (confirmado) {
      apagarTodosOsDados();
    }
  }

  return (
    <Tela>
      <Texto variante="titulo" accessibilityRole="header">
        Ajustes
      </Texto>

      <Cartao titulo="Aparência">
        <Opcoes
          rotulo="Tema"
          opcoes={OPCOES_TEMA}
          valor={tema}
          onMudar={(valor) => definirTema(valor as PreferenciaTema)}
          testID="ajuste-tema"
        />
        <Texto variante="legenda" secundario>
          No automático, o app segue o modo claro ou escuro do celular.
        </Texto>
      </Cartao>

      <AjustesAgua pesoKg={perfil.pesoKg} />

      <AjustesLembretes />

      <Cartao titulo="Privacidade">
        <Texto variante="legenda" secundario>
          Seus dados ficam salvos neste aparelho. Quando você pede a dieta ou conversa com o coach,
          seu perfil e suas metas vão para o servidor do ApexFit e para a Anthropic (empresa da IA)
          só para responder.
        </Texto>
        <Botao titulo="Apagar meus dados" variante="perigo" onPress={apagarDados} />
      </Cartao>

      <Cartao titulo="Sobre">
        <View style={{ flexDirection: 'row', alignItems: 'center', gap: 12 }}>
          <Logo tamanho={48} />
          <Texto variante="subtitulo">ApexFit {Constants.expoConfig?.version ?? ''}</Texto>
        </View>
        <Texto variante="legenda" secundario>
          O ApexFit ajuda a organizar sua rotina, mas não substitui médico, nutricionista ou
          educador físico.
        </Texto>
      </Cartao>
    </Tela>
  );
}
