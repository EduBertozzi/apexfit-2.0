import Ionicons from '@expo/vector-icons/Ionicons';
import type { Ref } from 'react';
import { StyleSheet, Text, View } from 'react-native';

import { categorias, cores, espaco, familia, fonte, raio } from '@/shared/theme/tokens';
import { Logo } from '@/shared/ui';

import type { BolinhaDaSemana } from '../sequencia';
import { BolinhasSemana } from './BolinhasSemana';

/** Largura de referência do desenho; tudo escala a partir dela (proporção 9:16). */
const BASE = 360;

/** Tamanho da imagem final para os stories. */
export const TAMANHO_STORY = { largura: 1080, altura: 1920 } as const;

/** O cartão é sempre escuro, como um story: usa a paleta do tema escuro nos dois temas. */
const escuro = cores.escuro;
const chama = categorias.escuro.fundo.cardio;

type Props = {
  ref?: Ref<View>;
  /** Largura na tela (a altura sai da proporção 9:16). */
  largura: number;
  dias: number;
  /** "dias de sequência" ou "dia de sequência" */
  rotulo: string;
  frase: string;
  bolinhas: readonly BolinhaDaSemana[];
  nome: string;
  /** "treino A: 5 de 6 exercícios"; aparece só na variante com o treino de hoje. */
  treinoDeHoje?: string | null;
};

/**
 * Cartão 9:16 para os stories: logo, chama com o número enorme, a semana em
 * bolinhas e o nome da pessoa. Vira PNG ao compartilhar (ver `shared/lib/compartilhar`).
 * Textos com tamanho fixo: é uma imagem, não pode mudar com a fonte do sistema.
 */
export function CartaoCompartilhar({
  ref,
  largura,
  dias,
  rotulo,
  frase,
  bolinhas,
  nome,
  treinoDeHoje,
}: Props) {
  const e = largura / BASE;
  const tam = (valor: number) => Math.round(valor * e);

  return (
    <View
      ref={ref}
      // Sem isso o Android pode achatar a View e a captura sai vazia
      collapsable={false}
      accessible
      accessibilityRole="image"
      accessibilityLabel={`prévia da imagem para compartilhar: ${dias} ${rotulo}, ${nome}`}
      style={[
        estilos.cartao,
        {
          width: largura,
          height: (largura * 16) / 9,
          padding: tam(espaco.lg + 4),
          borderRadius: tam(raio.lg),
          backgroundColor: escuro.fundo,
        },
      ]}
    >
      <View style={[estilos.marca, { gap: tam(espaco.sm + 2) }]}>
        <Logo tamanho={tam(44)} />
        <Text
          allowFontScaling={false}
          style={[estilos.nomeApp, { color: escuro.texto, fontSize: tam(fonte.subtitulo) }]}
        >
          ApexFit
        </Text>
      </View>

      <View style={estilos.meio}>
        <Ionicons name="flame" size={tam(110)} color={chama} style={estilos.centro} />
        <Text
          allowFontScaling={false}
          style={[
            estilos.numero,
            {
              color: escuro.texto,
              fontSize: tam(fonte.gigante * 3.4),
              lineHeight: tam(fonte.gigante * 3.5),
            },
          ]}
        >
          {dias}
        </Text>
        <Text
          allowFontScaling={false}
          style={[estilos.rotulo, { color: escuro.texto, fontSize: tam(fonte.subtitulo + 1) }]}
        >
          {rotulo}
        </Text>
        <Text
          allowFontScaling={false}
          style={[
            estilos.frase,
            { color: escuro.textoSecundario, fontSize: tam(fonte.corpo), marginTop: tam(4) },
          ]}
        >
          {frase}
        </Text>

        <View
          style={[
            {
              marginTop: tam(espaco.xl),
              padding: tam(espaco.md),
              borderRadius: tam(raio.md),
              backgroundColor: escuro.superficie,
            },
          ]}
        >
          <BolinhasSemana
            bolinhas={bolinhas}
            tamanho={tam(32)}
            tamanhoFixo
            paleta={{
              vazio: escuro.superficieSecundaria,
              contorno: escuro.texto,
              rotulo: escuro.textoSecundario,
              congelado: escuro.congelado,
            }}
          />
        </View>

        {treinoDeHoje ? (
          <View
            style={[
              estilos.treino,
              {
                marginTop: tam(espaco.sm + 4),
                paddingVertical: tam(espaco.sm + 2),
                paddingHorizontal: tam(espaco.md),
                backgroundColor: escuro.destaque,
              },
            ]}
          >
            <Text
              allowFontScaling={false}
              numberOfLines={1}
              style={[
                estilos.textoTreino,
                { color: escuro.textoSobreDestaque, fontSize: tam(fonte.rotulo) },
              ]}
            >
              hoje: {treinoDeHoje}
            </Text>
          </View>
        ) : null}
      </View>

      <Text
        allowFontScaling={false}
        numberOfLines={1}
        style={[estilos.assinatura, { color: escuro.texto, fontSize: tam(fonte.rotulo + 1) }]}
      >
        {nome ? `${nome} no ApexFit` : 'treinando com o ApexFit'}
      </Text>
    </View>
  );
}

const estilos = StyleSheet.create({
  cartao: {
    overflow: 'hidden',
    justifyContent: 'space-between',
  },
  marca: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  nomeApp: {
    fontFamily: familia.display,
  },
  meio: {
    alignItems: 'stretch',
  },
  numero: {
    fontFamily: familia.display,
    textAlign: 'center',
    letterSpacing: -2,
  },
  rotulo: {
    fontFamily: familia.displayLeve,
    textAlign: 'center',
  },
  frase: {
    fontFamily: familia.corpo,
    textAlign: 'center',
  },
  centro: {
    textAlign: 'center',
  },
  treino: {
    alignSelf: 'center',
    borderRadius: raio.total,
    maxWidth: '100%',
  },
  textoTreino: {
    fontFamily: familia.corpoForte,
  },
  assinatura: {
    fontFamily: familia.displayLeve,
    textAlign: 'center',
  },
});
