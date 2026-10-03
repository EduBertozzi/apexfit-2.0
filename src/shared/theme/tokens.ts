/**
 * Design tokens: TODAS as cores e medidas do app vêm daqui.
 * Nenhum componente deve ter "#2E7D32" escrito direto. Quando a identidade
 * visual for definida (fase de UI/UX), só este arquivo muda.
 */

const paleta = {
  verde50: '#ECF7F1',
  verde200: '#A8DCC0',
  verde500: '#2E9D68',
  verde700: '#1C6E48',
  verde900: '#0F3D2E',
  cinza50: '#F6F7F8',
  cinza100: '#ECEEF0',
  cinza300: '#C9CED3',
  cinza500: '#7A828A',
  cinza700: '#3E454C',
  cinza800: '#24292E',
  cinza900: '#15191C',
  branco: '#FFFFFF',
  vermelho500: '#D64545',
  vermelho300: '#F08A8A',
  azul500: '#2F7FD8',
  azul300: '#7DB7F5',
};

export const cores = {
  claro: {
    fundo: paleta.cinza50,
    superficie: paleta.branco,
    superficieSecundaria: paleta.cinza100,
    borda: paleta.cinza300,
    texto: paleta.cinza900,
    textoSecundario: paleta.cinza500,
    primaria: paleta.verde700,
    textoSobrePrimaria: paleta.branco,
    primariaSuave: paleta.verde50,
    erro: paleta.vermelho500,
    agua: paleta.azul500,
  },
  escuro: {
    fundo: paleta.cinza900,
    superficie: paleta.cinza800,
    superficieSecundaria: paleta.cinza700,
    borda: paleta.cinza700,
    texto: paleta.cinza50,
    textoSecundario: paleta.cinza300,
    primaria: paleta.verde200,
    textoSobrePrimaria: paleta.verde900,
    primariaSuave: paleta.verde900,
    erro: paleta.vermelho300,
    agua: paleta.azul300,
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

export const raio = {
  sm: 8,
  md: 12,
  lg: 20,
  total: 999,
} as const;

export const fonte = {
  legenda: 13,
  corpo: 16,
  subtitulo: 18,
  titulo: 24,
  destaque: 32,
} as const;
