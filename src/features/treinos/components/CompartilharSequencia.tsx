import { useEffect, useRef, useState } from 'react';
import { StyleSheet, useWindowDimensions, View } from 'react-native';

import { compartilharView, prepararCaptura } from '@/shared/lib/compartilhar';
import { mensagemDoCompartilhar } from '@/shared/lib/resultadoCompartilhar';
import { espaco } from '@/shared/theme/tokens';
import { Botao, Cartao, Opcoes, Texto } from '@/shared/ui';

import type { BolinhaDaSemana } from '../sequencia';
import { CartaoCompartilhar, TAMANHO_STORY } from './CartaoCompartilhar';

type Props = {
  dias: number;
  rotulo: string;
  frase: string;
  bolinhas: readonly BolinhaDaSemana[];
  nome: string;
  treinoDeHoje: string | null;
};

/** Maior largura da prévia; a imagem final sai em 1080 x 1920 de qualquer jeito. */
const LARGURA_MAXIMA = 300;
/** Respiro da tela (16 de cada lado) mais o do cartão (20 de cada lado). */
const MARGENS = 2 * espaco.md + 2 * (espaco.lg - 4);

const VARIANTES = [
  { valor: 'sequencia', rotulo: 'só a sequência' },
  { valor: 'treino', rotulo: 'com o treino de hoje' },
];

/** Prévia do story, a escolha do que mostrar e o botão "compartilhar". */
export function CompartilharSequencia({
  dias,
  rotulo,
  frase,
  bolinhas,
  nome,
  treinoDeHoje,
}: Props) {
  const { width } = useWindowDimensions();
  const ref = useRef<View>(null);
  const [variante, setVariante] = useState('sequencia');
  const [enviando, setEnviando] = useState(false);
  const [aviso, setAviso] = useState<string | null>(null);
  const largura = Math.min(LARGURA_MAXIMA, width - MARGENS);
  const comTreino = variante === 'treino' && treinoDeHoje !== null;

  // No navegador, deixa o gerador de imagem pronto antes do toque
  useEffect(() => {
    prepararCaptura();
  }, []);

  const compartilhar = async () => {
    setEnviando(true);
    setAviso(null);
    const resultado = await compartilharView(ref, {
      arquivo: `apexfit-sequencia-${dias}.png`,
      titulo: 'compartilhar sequência',
      largura: TAMANHO_STORY.largura,
      altura: TAMANHO_STORY.altura,
    });
    setEnviando(false);
    setAviso(mensagemDoCompartilhar(resultado));
  };

  return (
    <Cartao titulo="compartilhar nos stories">
      {treinoDeHoje ? (
        <Opcoes
          rotulo="o que mostrar"
          opcoes={VARIANTES}
          valor={variante}
          onMudar={setVariante}
          direcao="coluna"
        />
      ) : null}

      <View style={estilos.previa}>
        <CartaoCompartilhar
          ref={ref}
          largura={largura}
          dias={dias}
          rotulo={rotulo}
          frase={frase}
          bolinhas={bolinhas}
          nome={nome}
          treinoDeHoje={comTreino ? treinoDeHoje : null}
        />
      </View>

      <Botao
        titulo="compartilhar"
        onPress={compartilhar}
        carregando={enviando}
        descricaoAcessivel="compartilhar a imagem da sequência"
      />
      {aviso ? (
        <Texto variante="legenda" secundario accessibilityLiveRegion="polite" style={estilos.aviso}>
          {aviso}
        </Texto>
      ) : null}
    </Cartao>
  );
}

const estilos = StyleSheet.create({
  previa: {
    alignItems: 'center',
    paddingVertical: espaco.sm,
  },
  aviso: {
    textAlign: 'center',
  },
});
