import MaterialCommunityIcons from '@expo/vector-icons/MaterialCommunityIcons';
import { router } from 'expo-router';
import { useState, type ComponentProps } from 'react';
import { StyleSheet, View } from 'react-native';

import { useDietaStore } from '@/features/dieta/store';
import {
  resumoDieta,
  resumoTreinosGerados,
  textoOrigem,
  textoOrigemDieta,
} from '@/features/ia/textos';
import { usePerfilStore } from '@/features/perfil/store';
import {
  DIAS_POR_SEMANA,
  MINUTOS_TREINO,
  type LocalTreino,
  type MinutosTreino,
} from '@/features/treinos/contratoIa';
import { useTreinosIaStore } from '@/features/treinos/storeIa';
import { espaco, raio } from '@/shared/theme/tokens';
import { useCategorias, useCores } from '@/shared/theme/useCores';
import { Botao, Cartao, Opcoes, Tela, Texto, type Opcao } from '@/shared/ui';

const OPCOES_DIAS: Opcao[] = DIAS_POR_SEMANA.map((dias) => ({
  valor: String(dias),
  rotulo: String(dias),
}));

const OPCOES_LOCAL: Opcao[] = [
  { valor: 'academia', rotulo: 'academia' },
  { valor: 'casa', rotulo: 'casa' },
];

const OPCOES_MINUTOS: Opcao[] = MINUTOS_TREINO.map((minutos) => ({
  valor: String(minutos),
  rotulo: `${minutos} min`,
}));

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

  const preferencias = useTreinosIaStore((state) => state.preferencias);
  const mudarPreferencias = useTreinosIaStore((state) => state.mudarPreferencias);
  const gerarTreinos = useTreinosIaStore((state) => state.gerar);
  const gerandoTreinos = useTreinosIaStore((state) => state.gerando);
  const erroTreinos = useTreinosIaStore((state) => state.erro);
  const ultima = useTreinosIaStore((state) => state.ultima);
  // "pronto" só aparece depois de gerar nesta visita à tela
  const [pronto, setPronto] = useState(false);

  const plano = useDietaStore((state) => state.plano);
  const origemDieta = useDietaStore((state) => state.origem);
  const provedorDieta = useDietaStore((state) => state.provedor);
  const gerandoDieta = useDietaStore((state) => state.gerando);
  const erroDieta = useDietaStore((state) => state.erro);
  const gerarDieta = useDietaStore((state) => state.gerar);

  if (!perfil) {
    return null;
  }

  const mudar = (mudanca: Parameters<typeof mudarPreferencias>[0]) => {
    setPronto(false);
    mudarPreferencias(mudanca);
  };

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
        <Texto variante="subtitulo" accessibilityRole="header">
          monte seu treino com IA
        </Texto>
        <Texto secundario>
          escolha como você treina. a IA monta os treinos com aquecimento, exercícios por grupo e
          cardio, e eles aparecem na tela inicial.
        </Texto>

        <Opcoes
          rotulo="dias por semana"
          compacto
          opcoes={OPCOES_DIAS}
          valor={String(preferencias.diasPorSemana)}
          onMudar={(valor) => mudar({ diasPorSemana: Number(valor) })}
        />
        <Opcoes
          rotulo="onde"
          compacto
          opcoes={OPCOES_LOCAL}
          valor={preferencias.local}
          onMudar={(valor) => mudar({ local: valor as LocalTreino })}
        />
        <Opcoes
          rotulo="tempo por treino"
          compacto
          opcoes={OPCOES_MINUTOS}
          valor={String(preferencias.minutos)}
          onMudar={(valor) => mudar({ minutos: Number(valor) as MinutosTreino })}
        />

        <Botao
          titulo="gerar treino"
          onPress={aoGerarTreinos}
          carregando={gerandoTreinos}
          descricaoAcessivel={gerandoTreinos ? 'montando seus treinos' : 'gerar treino'}
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
          peça para trocar um exercício ou uma refeição: o coach muda e salva para você.
        </Texto>
        <Botao titulo="conversar" variante="secundario" onPress={() => router.push('/coach')} />
      </Cartao>
    </Tela>
  );
}

const estilos = StyleSheet.create({
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
