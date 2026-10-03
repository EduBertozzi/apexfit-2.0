import type { KeyboardTypeOptions } from 'react-native';

import { NOME_NIVEL_ATIVIDADE, NOME_OBJETIVO, NOME_SEXO } from '@/features/nutricao/calculos';

import { NIVEIS_ATIVIDADE, OBJETIVOS, SEXOS, type FormularioPerfilValores } from './schema';

export type NomeCampo = keyof FormularioPerfilValores;

type OpcaoCampo = { valor: string; rotulo: string; descricao?: string };

export type ConfigCampo =
  | {
      tipo: 'texto';
      rotulo: string;
      placeholder?: string;
      teclado?: KeyboardTypeOptions;
      sufixo?: string;
      dica?: string;
      opcional?: boolean;
      multilinha?: boolean;
    }
  | {
      tipo: 'escolha';
      rotulo: string;
      opcoes: OpcaoCampo[];
      direcao: 'linha' | 'coluna';
    };

/** Como cada campo do perfil aparece na tela. Usado pelo onboarding e pela edição. */
export const CONFIG_CAMPOS: Record<NomeCampo, ConfigCampo> = {
  nome: { tipo: 'texto', rotulo: 'Nome', placeholder: 'Como quer ser chamado?' },
  idade: {
    tipo: 'texto',
    rotulo: 'Idade',
    placeholder: '17',
    teclado: 'number-pad',
    sufixo: 'anos',
  },
  sexo: {
    tipo: 'escolha',
    rotulo: 'Sexo biológico',
    direcao: 'linha',
    opcoes: SEXOS.map((valor) => ({ valor, rotulo: NOME_SEXO[valor] })),
  },
  alturaCm: {
    tipo: 'texto',
    rotulo: 'Altura',
    placeholder: '175',
    teclado: 'decimal-pad',
    sufixo: 'cm',
  },
  pesoKg: {
    tipo: 'texto',
    rotulo: 'Peso',
    placeholder: '70,5',
    teclado: 'decimal-pad',
    sufixo: 'kg',
  },
  percentualGordura: {
    tipo: 'texto',
    rotulo: 'Gordura corporal',
    placeholder: '18',
    teclado: 'decimal-pad',
    sufixo: '%',
    opcional: true,
    dica: 'Se não souber, deixe em branco.',
  },
  restricoes: {
    tipo: 'texto',
    rotulo: 'Saúde e restrições',
    placeholder: 'Ex: intolerância à lactose, lesão no joelho, hipertensão',
    opcional: true,
    multilinha: true,
  },
  nivelAtividade: {
    tipo: 'escolha',
    rotulo: 'Nível de atividade',
    direcao: 'coluna',
    opcoes: NIVEIS_ATIVIDADE.map((valor) => {
      // "Moderado (3 a 4 treinos/semana)" vira rótulo + descrição
      const [rotulo, descricao] = NOME_NIVEL_ATIVIDADE[valor].replace(')', '').split(' (');

      return { valor, rotulo, descricao };
    }),
  },
  objetivo: {
    tipo: 'escolha',
    rotulo: 'Objetivo',
    direcao: 'coluna',
    opcoes: OBJETIVOS.map((valor) => ({ valor, rotulo: NOME_OBJETIVO[valor] })),
  },
};

export type Etapa = {
  id: string;
  titulo: string;
  descricao: string;
  campos: NomeCampo[];
};

/** Onboarding: uma pergunta (ou um grupinho de perguntas parecidas) por tela. */
export const ETAPAS_ONBOARDING: Etapa[] = [
  {
    id: 'nome',
    titulo: 'Como quer ser chamado?',
    descricao: 'É assim que o app vai falar com você.',
    campos: ['nome'],
  },
  {
    id: 'basico',
    titulo: 'Idade e sexo',
    descricao: 'Os dois entram no cálculo do seu metabolismo.',
    campos: ['idade', 'sexo'],
  },
  {
    id: 'corpo',
    titulo: 'Seu corpo',
    descricao: 'Para calcular sua água, suas calorias e seu IMC. Fica só no seu celular.',
    campos: ['alturaCm', 'pesoKg', 'percentualGordura'],
  },
  {
    id: 'atividade',
    titulo: 'Quanto você treina?',
    descricao: 'Conte academia, esporte e corrida. Seja sincero: isso muda suas calorias.',
    campos: ['nivelAtividade'],
  },
  {
    id: 'objetivo',
    titulo: 'Qual seu objetivo?',
    descricao: 'Dá para mudar depois, quando quiser.',
    campos: ['objetivo'],
  },
  {
    id: 'saude',
    titulo: 'Algo que a gente deva saber?',
    descricao: 'Lesões, alergias, intolerâncias ou doenças. A dieta com IA respeita isso.',
    campos: ['restricoes'],
  },
];

/** Formulário de edição: tudo numa tela, em seções. */
export const SECOES_EDICAO: Etapa[] = [
  {
    id: 'voce',
    titulo: 'Sobre você',
    descricao: '',
    campos: ['nome', 'idade', 'sexo'],
  },
  {
    id: 'corpo',
    titulo: 'Seu corpo',
    descricao: 'Usamos esses dados para calcular sua água, suas calorias e seu IMC.',
    campos: ['alturaCm', 'pesoKg', 'percentualGordura', 'restricoes'],
  },
  {
    id: 'rotina',
    titulo: 'Sua rotina',
    descricao: '',
    campos: ['nivelAtividade', 'objetivo'],
  },
];
