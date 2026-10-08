import Ionicons from '@expo/vector-icons/Ionicons';
import MaterialCommunityIcons from '@expo/vector-icons/MaterialCommunityIcons';
import { router } from 'expo-router';
import { useState, type ComponentProps } from 'react';
import { Pressable, StyleSheet, View } from 'react-native';

import { OpcoesDieta } from '@/features/dieta/components/OpcoesDieta';
import { resumoPreferencias } from '@/features/dieta/preferencias';
import { useDietaStore } from '@/features/dieta/store';
import {
  resumoDieta,
  resumoTreinosGerados,
  textoOrigem,
  textoOrigemDieta,
} from '@/features/ia/textos';
import { usePerfilStore } from '@/features/perfil/store';
import { MontadorSemana } from '@/features/treinos/components/MontadorSemana';
import { resumoEscolhas, textoBotaoGerar } from '@/features/treinos/montadorIa';
import { useTreinosIaStore } from '@/features/treinos/storeIa';
import { espaco, raio } from '@/shared/theme/tokens';
import { useCategorias, useCores } from '@/shared/theme/useCores';
import { Botao, Cartao, Tela, Texto } from '@/shared/ui';

type Icone = ComponentProps<typeof MaterialCommunityIcons>['name'];

/** Pílula pastel com ícone: o "rótulo de categoria" dos cards bento. */
function Selo({ icone, texto, cor }: { icone: Icone; texto: string; cor: string }) {
  // Pastel é claro nos dois temas: texto escuro por cima
  const escuro = useCores().textoSobreDestaque;

  return (
    <View style={[estilos.selo, { backgroundColor: cor }]}>
      <MaterialCommunityIcons name={icone} size={16} color={escuro} />
      <Texto variante="legenda" style={{ color: escuro }}>
        {texto}
      </Texto>
    </View>
  );
}

/** Central de IA (botão do cérebro): treinos montados pela IA, dieta e coach. */
export default function Ia() {
  const c = useCores();
  const categorias = useCategorias();
  const perfil = usePerfilStore((state) => state.perfil);

  const escolhas = useTreinosIaStore((state) => state.escolhas);
  const gerarTreinos = useTreinosIaStore((state) => state.gerar);
  const gerandoTreinos = useTreinosIaStore((state) => state.gerando);
  const erroTreinos = useTreinosIaStore((state) => state.erro);
  const ultima = useTreinosIaStore((state) => state.ultima);
  // "pronto" só aparece depois de gerar nesta visita à tela
  const [pronto, setPronto] = useState(false);
  // O montador é grande: abre no primeiro uso e começa fechado depois de já ter gerado
  const [montadorAberto, setMontadorAberto] = useState(() => !ultima);
  const [opcoesDietaAbertas, setOpcoesDietaAbertas] = useState(false);
  const preferenciasDieta = useDietaStore((state) => state.preferencias);

  const plano = useDietaStore((state) => state.plano);
  const origemDieta = useDietaStore((state) => state.origem);
  const provedorDieta = useDietaStore((state) => state.provedor);
  const gerandoDieta = useDietaStore((state) => state.gerando);
  const erroDieta = useDietaStore((state) => state.erro);
  const gerarDieta = useDietaStore((state) => state.gerar);

  if (!perfil) {
    return null;
  }

  const aoGerarTreinos = async () => {
    setPronto(false);
    setPronto(await gerarTreinos(perfil));
  };

  const origemTreinos = textoOrigem(ultima?.origem);
  const origemPlano = textoOrigemDieta(origemDieta, provedorDieta);

  return (
    <Tela>
      <Texto variante="titulo" accessibilityRole="header">
        sua IA
      </Texto>

      <Cartao>
        <Selo icone="brain" texto="treino com IA" cor={categorias.fundo.aquecimento} />
        <Pressable
          onPress={() => setMontadorAberto((aberto) => !aberto)}
          accessibilityRole="button"
          accessibilityLabel="monte sua semana"
          accessibilityHint={montadorAberto ? 'fecha as escolhas' : 'abre as escolhas'}
          accessibilityState={{ expanded: montadorAberto }}
          hitSlop={4}
          style={({ pressed }) => [estilos.cabecalhoMontador, pressed && { opacity: 0.75 }]}
        >
          <View style={estilos.textosMontador}>
            <Texto variante="subtitulo">monte sua semana</Texto>
            <Texto secundario>
              {montadorAberto
                ? 'escolha os dias e o que treinar em cada um.'
                : resumoEscolhas(escolhas)}
            </Texto>
          </View>
          <View style={[estilos.seta, { backgroundColor: c.superficieSecundaria }]}>
            <Ionicons
              name={montadorAberto ? 'chevron-up' : 'chevron-down'}
              size={20}
              color={c.texto}
            />
          </View>
        </Pressable>

        {montadorAberto ? <MontadorSemana /> : null}

        <Botao
          titulo={textoBotaoGerar(escolhas)}
          onPress={aoGerarTreinos}
          carregando={gerandoTreinos}
          descricaoAcessivel={gerandoTreinos ? 'montando seus treinos' : textoBotaoGerar(escolhas)}
        />

        {gerandoTreinos ? (
          <Texto variante="legenda" secundario accessibilityLiveRegion="polite">
            montando seus treinos. pode levar até 1 minuto.
          </Texto>
        ) : null}

        {erroTreinos ? (
          <Texto variante="legenda" style={{ color: c.erro }} accessibilityLiveRegion="polite">
            {erroTreinos}
          </Texto>
        ) : null}

        {pronto && ultima ? (
          <View
            style={[estilos.pronto, { backgroundColor: c.superficieSecundaria }]}
            accessibilityLiveRegion="polite"
          >
            <View style={estilos.linha}>
              <Texto variante="subtitulo">pronto</Texto>
              {origemTreinos ? (
                <Selo
                  icone={ultima.origem === 'demo' ? 'wifi-off' : 'check'}
                  texto={origemTreinos}
                  cor={ultima.origem === 'demo' ? categorias.fundo.outro : categorias.fundo.ombro}
                />
              ) : null}
            </View>
            <Texto>{resumoTreinosGerados(ultima.quantidade)}</Texto>
            <Texto variante="legenda" secundario>
              {ultima.resumo}
            </Texto>
            <Botao
              titulo="ver na tela inicial"
              variante="destaque"
              onPress={() => router.push('/')}
            />
          </View>
        ) : null}
      </Cartao>

      <Cartao>
        <Selo icone="food-apple" texto="dieta" cor={categorias.fundo.peito} />
        <Texto variante="subtitulo">{resumoDieta(plano)}</Texto>
        {origemPlano ? (
          <Texto variante="legenda" secundario>
            {origemPlano}
          </Texto>
        ) : null}
        <Pressable
          onPress={() => setOpcoesDietaAbertas((aberto) => !aberto)}
          accessibilityRole="button"
          accessibilityLabel="opções da dieta"
          accessibilityHint={opcoesDietaAbertas ? 'fecha as opções' : 'abre as opções'}
          accessibilityState={{ expanded: opcoesDietaAbertas }}
          hitSlop={4}
          style={({ pressed }) => [
            estilos.cabecalhoMontador,
            estilos.opcoesDieta,
            { backgroundColor: c.superficieSecundaria },
            pressed && { opacity: 0.75 },
          ]}
        >
          <View style={estilos.textosMontador}>
            <Texto variante="rotulo">opções da dieta</Texto>
            <Texto variante="legenda" secundario>
              {resumoPreferencias(preferenciasDieta)}
            </Texto>
          </View>
          <Ionicons
            name={opcoesDietaAbertas ? 'chevron-up' : 'chevron-down'}
            size={20}
            color={c.texto}
          />
        </Pressable>

        {opcoesDietaAbertas ? <OpcoesDieta /> : null}

        {erroDieta ? (
          <Texto variante="legenda" style={{ color: c.erro }} accessibilityLiveRegion="polite">
            {erroDieta}
          </Texto>
        ) : null}
        <View style={estilos.botoes}>
          {plano ? (
            <Botao titulo="ver dieta" variante="secundario" onPress={() => router.push('/dieta')} />
          ) : null}
          <Botao
            titulo={plano ? 'gerar outra dieta' : 'gerar dieta'}
            variante={plano ? 'texto' : 'primario'}
            carregando={gerandoDieta}
            onPress={() => void gerarDieta(perfil)}
          />
        </View>
      </Cartao>

      <Cartao>
        <Selo icone="chat-processing" texto="coach" cor={categorias.fundo.costas} />
        <Texto variante="subtitulo">converse sobre treino, dieta e rotina</Texto>
        <Texto secundario>
          peça para trocar um exercício ou uma refeição: o coach mostra a mudança e você decide se
          aplica.
        </Texto>
        <Botao titulo="conversar" variante="secundario" onPress={() => router.push('/coach')} />
      </Cartao>
    </Tela>
  );
}

const estilos = StyleSheet.create({
  cabecalhoMontador: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: espaco.md,
  },
  textosMontador: {
    flex: 1,
    gap: espaco.xs,
  },
  opcoesDieta: {
    paddingHorizontal: espaco.md,
    paddingVertical: espaco.sm + 4,
    borderRadius: raio.lg,
  },
  seta: {
    width: 40,
    height: 40,
    borderRadius: raio.total,
    alignItems: 'center',
    justifyContent: 'center',
  },
  selo: {
    alignSelf: 'flex-start',
    flexDirection: 'row',
    alignItems: 'center',
    gap: espaco.xs,
    paddingHorizontal: espaco.sm + 2,
    paddingVertical: espaco.xs,
    borderRadius: raio.total,
  },
  pronto: {
    borderRadius: raio.md,
    borderCurve: 'continuous',
    padding: espaco.md,
    gap: espaco.sm,
  },
  linha: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    flexWrap: 'wrap',
    gap: espaco.sm,
  },
  botoes: {
    gap: espaco.sm,
  },
});
