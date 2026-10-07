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
  cinza300: '#CFCFCB',
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
    /** Contorno do campo de texto em repouso (o fundo é `superficieSecundaria`). */
    bordaCampo: paleta.cinza300,
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
    // Barra de abas flutuante: vidro fosco (superfície a 85%), fio claro e sombra suave
    barra: 'rgba(255, 255, 255, 0.85)',
    bordaBarra: paleta.cinza200,
    sombraBarra: '0px 6px 24px rgba(0, 0, 0, 0.12)',
  },
  escuro: {
    fundo: paleta.preto,
    superficie: paleta.grafite700,
    superficieSecundaria: paleta.grafite600,
    borda: paleta.grafite600,
    bordaCampo: paleta.grafite500,
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
    barra: 'rgba(38, 38, 38, 0.85)',
    bordaBarra: paleta.grafite500,
    sombraBarra: '0px 8px 28px rgba(0, 0, 0, 0.6)',
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

/**
 * Faixa da semana na tela inicial: cor de cada dia pelo quanto do treino foi feito.
 * Pastéis com texto escuro por cima (`texto`) e círculo branco do número (`circulo`),
 * iguais nos dois temas.
 */
export const semana = {
  /** Fez 100% dos exercícios (verde). */
  completo: '#A2E0B4',
  /** Fez de 50% a menos de 100% (amarelo creme). */
  parcial: '#F5DFA8',
  /** Não treinou ou fez menos de 50% (vermelho salmão). */
  fraco: '#E88A8A',
  texto: paleta.preto,
  circulo: paleta.branco,
} as const;

export const espaco = {
  xs: 4,
  sm: 8,
  md: 16,
  lg: 24,
  xl: 32,
  /** Espaço único entre os cards da grade "bento" (linhas e colunas). */
  grade: 12,
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
  /** Rótulo embaixo dos ícones da barra de abas. */
  micro: 12,
  legenda: 13,
  corpo: 17,
  rotulo: 15,
  /** Título no cabeçalho das telas empilhadas. */
  cabecalho: 19,
  subtitulo: 21,
  titulo: 32,
  destaque: 36,
  gigante: 40,
} as const;

/**
 * Movimento: durações (ms) e molas usadas nas animações (ver shared/ui/animacao.ts).
 * Tudo curto e sem repetição; com "reduzir movimento" ligado nada anima.
 */
export const movimento = {
  /** Toque: o "pop" do check. */
  rapido: 120,
  /** Troca de estado: linha marcada, cor de fundo. */
  medio: 250,
  /** Comemoração inteira (anel e pontinhos). Nunca passar de 1,2 s. */
  comemoracao: 1100,
  /** Mola firme, quase sem balanço: preencher barras. */
  mola: { damping: 18, stiffness: 180, mass: 1 },
  /** Mola com um pouco de balanço: selos e faixas entrando. */
  molaPop: { damping: 12, stiffness: 220, mass: 0.8 },
} as const;
