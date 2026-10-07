/**
 * Design tokens: TODAS as cores e medidas do app vêm daqui.
 * Nenhum componente deve ter "#A2E0B4" escrito direto.
 *
 * Identidade "Bento": fundo preto, cards cinza bem arredondados em grade,
 * uma cor pastel por grupo muscular, fonte geométrica (Lexend) e títulos
 * em minúsculas. O modo escuro é o principal; o claro segue a mesma lógica.
 *
 * Regra do pastel: verde-menta e as cores de categoria são claras demais
 * para virar texto em fundo claro. No modo claro, texto de categoria usa a
 * versão forte (`categoriaTexto`); o pastel fica para fundos com texto escuro.
 */

const paleta = {
  preto: '#000000',
  grafite900: '#121212',
  grafite800: '#1E1E1E',
  grafite700: '#262626',
  grafite600: '#333333',
  grafite500: '#444444',
  cinza400: '#9A9A9A',
  cinza500: '#6E6E6E',
  cinza200: '#E6E6E3',
  cinza100: '#F4F4F2',
  branco: '#FFFFFF',
  menta: '#A2E0B4',
  mentaForte: '#1F7A45',
  vermelho600: '#C62828',
  vermelho300: '#FF8A8A',
};

export const cores = {
  claro: {
    fundo: paleta.cinza100,
    superficie: paleta.branco,
    superficieSecundaria: paleta.cinza200,
    borda: paleta.cinza200,
    texto: paleta.grafite800,
    textoSecundario: paleta.cinza500,
    primaria: paleta.grafite800,
    textoSobrePrimaria: paleta.branco,
    primariaSuave: paleta.cinza200,
    destaque: paleta.menta,
    textoSobreDestaque: paleta.preto,
    erro: paleta.vermelho600,
    agua: '#8FB5F2',
    // "Herói": card escuro de destaque, escuro nos dois temas
    heroi: paleta.grafite800,
    textoHeroi: paleta.branco,
    textoHeroiSecundario: paleta.cinza400,
    trilhoHeroi: paleta.grafite600,
    bordaHeroi: paleta.grafite500,
  },
  escuro: {
    fundo: paleta.preto,
    superficie: paleta.grafite700,
    superficieSecundaria: paleta.grafite600,
    borda: paleta.grafite600,
    texto: paleta.branco,
    textoSecundario: paleta.cinza400,
    primaria: paleta.menta,
    textoSobrePrimaria: paleta.preto,
    primariaSuave: paleta.grafite600,
    destaque: paleta.menta,
    textoSobreDestaque: paleta.preto,
    erro: paleta.vermelho300,
    agua: '#8FB5F2',
    heroi: paleta.grafite700,
    textoHeroi: paleta.branco,
    textoHeroiSecundario: paleta.cinza400,
    trilhoHeroi: paleta.grafite600,
    bordaHeroi: paleta.grafite500,
  },
} as const;

export type Cores = { [K in keyof typeof cores.claro]: string };

/** Uma cor por grupo muscular (e água). Usada em rótulos, ícones e na faixa da semana. */
export type CorCategoria =
  | 'aquecimento'
  | 'braco'
  | 'perna'
  | 'abdominal'
  | 'costas'
  | 'peito'
  | 'ombro'
  | 'cardio'
  | 'outro'
  | 'agua';

const pastel: Record<CorCategoria, string> = {
  aquecimento: '#8ED9B5',
  braco: '#EFA27C',
  perna: '#D9A8EC',
  abdominal: '#95AAF5',
  costas: '#F5BCCB',
  peito: '#F2D27A',
  ombro: '#9FD8E8',
  cardio: '#F08C8C',
  outro: '#C8C8C8',
  agua: '#8FB5F2',
};

/** Versões fortes, legíveis como texto em fundo branco (contraste ≥ 4,5:1). */
const forte: Record<CorCategoria, string> = {
  aquecimento: '#1B7A52',
  braco: '#A84A17',
  perna: '#7E3FA0',
  abdominal: '#3550B5',
  costas: '#A83A5C',
  peito: '#8A6400',
  ombro: '#156C82',
  cardio: '#B42F2F',
  outro: '#5A5A5A',
  agua: '#2F62C2',
};

export const categorias = {
  claro: { texto: forte, fundo: pastel },
  escuro: { texto: pastel, fundo: pastel },
} as const;

export const espaco = {
  xs: 4,
  sm: 8,
  md: 16,
  lg: 24,
  xl: 32,
} as const;

/** Cantos bem arredondados, como no desenho de referência. */
export const raio = {
  sm: 14,
  md: 20,
  lg: 28,
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
  display: 'Lexend_700Bold',
  displayLeve: 'Lexend_600SemiBold',
  rotulo: 'Lexend_500Medium',
  corpo: 'Lexend_400Regular',
  corpoMedio: 'Lexend_500Medium',
  corpoForte: 'Lexend_600SemiBold',
} as const;

export const fonte = {
  legenda: 13,
  corpo: 17,
  rotulo: 15,
  subtitulo: 21,
  titulo: 32,
  destaque: 36,
  gigante: 40,
} as const;
