/**
 * Design tokens: TODAS as cores e medidas do app vêm daqui.
 * Nenhum componente deve ter "#39FF88" escrito direto.
 *
 * Identidade "Volt" (direção Alta performance): preto e osso, um verde menta
 * elétrico de destaque e tipografia condensada em itálico.
 *
 * Regra do destaque: o menta é claro demais para virar texto em fundo claro.
 * Ele só aparece como FUNDO atrás de texto preto (`textoSobreDestaque`)
 * ou como cor sobre fundo escuro (cartão herói, modo escuro).
 */

const paleta = {
  menta: '#39FF88',
  preto: '#0B0B0B',
  grafite900: '#161616',
  grafite800: '#1C1C1C',
  grafite750: '#1E1E1E',
  grafite700: '#2A2A2A',
  grafite600: '#3A3A3A',
  grafite500: '#4A4A4A',
  cinza400: '#A3A39C',
  cinza600: '#5E5E58',
  osso200: '#E4E4DE',
  osso100: '#F1F1EC',
  branco: '#FFFFFF',
  vermelho600: '#C62828',
  vermelho300: '#FF6B6B',
};

export const cores = {
  claro: {
    fundo: paleta.osso100,
    superficie: paleta.branco,
    superficieSecundaria: paleta.osso200,
    borda: paleta.preto,
    texto: paleta.preto,
    textoSecundario: paleta.cinza600,
    primaria: paleta.preto,
    textoSobrePrimaria: paleta.menta,
    primariaSuave: paleta.osso200,
    destaque: paleta.menta,
    textoSobreDestaque: paleta.preto,
    erro: paleta.vermelho600,
    agua: paleta.menta,
    heroi: paleta.preto,
    textoHeroi: paleta.branco,
    textoHeroiSecundario: paleta.cinza400,
    trilhoHeroi: paleta.grafite700,
    bordaHeroi: paleta.grafite500,
  },
  escuro: {
    fundo: paleta.preto,
    superficie: paleta.grafite900,
    superficieSecundaria: paleta.grafite750,
    borda: paleta.grafite600,
    texto: paleta.osso100,
    textoSecundario: paleta.cinza400,
    primaria: paleta.menta,
    textoSobrePrimaria: paleta.preto,
    primariaSuave: paleta.grafite750,
    destaque: paleta.menta,
    textoSobreDestaque: paleta.preto,
    erro: paleta.vermelho300,
    agua: paleta.menta,
    heroi: paleta.grafite800,
    textoHeroi: paleta.branco,
    textoHeroiSecundario: paleta.cinza400,
    trilhoHeroi: paleta.grafite600,
    bordaHeroi: paleta.grafite500,
  },
} as const;

export type Cores = { [K in keyof typeof cores.claro]: string };

export const espaco = {
  xs: 4,
  sm: 8,
  md: 16,
  lg: 24,
  xl: 32,
} as const;

/** Visual reto: cantos quase sem arredondar. */
export const raio = {
  sm: 2,
  md: 4,
  lg: 4,
  total: 999,
} as const;

export const borda = {
  fina: 1,
  grossa: 2,
} as const;

/**
 * Famílias carregadas no _layout (useFonts). Cada peso é uma família separada,
 * então NUNCA use fontWeight junto: no Android ele troca a fonte pela do sistema.
 */
export const familia = {
  display: 'BarlowCondensed_900Black_Italic',
  displayLeve: 'BarlowCondensed_800ExtraBold_Italic',
  rotulo: 'BarlowCondensed_700Bold',
  corpo: 'Barlow_400Regular',
  corpoMedio: 'Barlow_500Medium',
  corpoForte: 'Barlow_700Bold',
} as const;

export const fonte = {
  legenda: 13,
  corpo: 16,
  rotulo: 14,
  subtitulo: 22,
  titulo: 32,
  destaque: 48,
  gigante: 56,
} as const;
