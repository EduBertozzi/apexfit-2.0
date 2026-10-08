import { buscarAlimento, nutrientesDaPorcao, type Tag } from '@/features/dieta/alimentos';
import type { SlotTrocavel } from '@/features/dieta/cardapios';
import type { PlanoDieta } from '@/features/dieta/contrato';
import { quantidadeDeRefeicoes } from '@/features/dieta/regras';
import {
  alimentoPermitido,
  lerRestricoes,
  normalizarTexto,
  type Restricoes,
} from '@/features/dieta/restricoes';
import { primeiroNome } from '@/features/perfil/calculos';
import { planoDoDia } from '@/features/dieta/semana';
import type { LocalTreino } from '@/features/treinos/contratoIa';
import { diasDoTexto, textoDosDias } from '@/features/treinos/diasIa';
import type { DadosTreino, Treino } from '@/features/treinos/types';
import { formatarNumero } from '@/shared/lib/numero';

import type { DadosContexto } from './contexto';
import { citaExercicio, diasCitados } from './intencao';
import { aplicarPedidoExercicio, lerPedidoExercicio, type PedidoExercicio } from './trocaExercicio';

/**
 * Coach em "modo demonstração": responde sem IA e sem internet, com regras
 * simples e os números reais do app. Usado quando o servidor não tem IA.
 */

export type DadosDemo = DadosContexto & {
  treinos?: { proximo?: string; naSemana: number; sequenciaSemanas: number };
  peso?: { variacao30Dias: number | null; ultimoKg?: number };
  /** Treinos salvos (com dias), para trocar um exercício sem IA. */
  listaTreinos?: readonly Treino[];
};

/**
 * O que a resposta pede para o app montar (vira uma proposta no chat, que a
 * pessoa aplica ou não). `diasPedidos`: dias citados ("segunda, quarta e sexta").
 */
export type AcaoDemo =
  | { tipo: 'dieta'; trocarRefeicao?: SlotTrocavel; novo?: boolean; dias?: number[] }
  | { tipo: 'treinos'; diasPorSemana: number; local: LocalTreino; diasPedidos: number[] }
  /** Troca ou tira um exercício: `treinos` já editados (sem ids), só os dos `diasAlvo` mudam. */
  | { tipo: 'ajusteTreino'; treinos: DadosTreino[]; diasAlvo: number[] };

export type RespostaDemo = { texto: string; acao?: AcaoDemo };

export type Intencao =
  | 'dor'
  | 'seguranca'
  | 'trocarRefeicao'
  | 'ajustarExercicio'
  | 'evitarAlimento'
  | 'montarDieta'
  | 'preTreino'
  | 'posTreino'
  | 'agua'
  | 'proteina'
  | 'calorias'
  | 'peso'
  | 'motivacao'
  | 'montarTreino'
  | 'treino'
  | 'saudacao'
  | 'desconhecida';

const NOME_REFEICAO: Record<SlotTrocavel, string> = {
  cafe: 'café da manhã',
  almoco: 'almoço',
  lanche: 'lanche',
  jantar: 'jantar',
};

/** Normaliza letra por letra, para os índices baterem com o texto original. */
function normalizarAlinhado(texto: string): string {
  return Array.from(texto.toLowerCase(), (letra) => normalizarTexto(letra) || letra).join('');
}

const PADROES = {
  dor: /\b(dor|dores|doi|doendo|doeu|lesao|lesionei|machu\w*|contusao|torci|tendinite|inflamad\w*)\b/,
  seguranca:
    /\b(jejum|remedio\w*|suplement\w*|whey|creatina|termogenic\w*|anabolizante\w*|bomba|hormonio\w*|laxante\w*|diuretico\w*|sibutramina|ozempic)\b/,
  troca: /\b(troc\w*|troqu\w*|mud\w*|substitu\w*|outr[oa]|diferente|nova opcao)\b/,
  dieta: /\b(dieta|plano|cardapio|refeic\w*|comer|comida|alimentacao)\b/,
  montar: /\b(mont\w*|cri\w*|ger\w*|faz|fazer|faca|nov[oa]|quero|preciso)\b/,
  pre: /\b(pre[\s-]?treino|antes do treino|antes de treinar|antes da academia)\b/,
  pos: /\b(pos[\s-]?treino|depois do treino|apos o treino|depois de treinar|depois da academia)\b/,
  agua: /\b(agua|hidrat\w*|beber|bebi|sede|copos?)\b/,
  proteina: /\b(proteina\w*|protein)\b/,
  calorias: /\b(caloria\w*|kcal|metas?|macros?|carbo\w*|gordura\w*|quanto (devo )?comer)\b/,
  peso: /\b(peso|emagrec\w*|perder (gordura|barriga|peso)|ganhar massa|hipertrofia|engord\w*|secar|balanca|massa muscular|definir)\b/,
  motivacao:
    /\b(motiva\w*|cansad[oa]|cansaco|preguica|desanim\w*|sem vontade|desist\w*|nao consigo|triste|foco)\b/,
  treino: /\b(treino\w*|treinar|academia|exercicio\w*|malhar|musculacao|cardio|serie\w*)\b/,
  montarTreino:
    /\b(mont\w*|cri(a|e|ar)|refa\w*|ger(a|e|ar)|nov[oa]s?|outr[ao]s?)\b.*\b(treinos?|ficha|divisao)\b|\b(treinos?|ficha|divisao)\b.*\bnov[oa]s?\b/,
  saudacao: /^\s*(oi+|ola|e ai|eai|bom dia|boa tarde|boa noite|fala|salve|hey|opa|tudo bem)\b/,
};

const SLOTS: [SlotTrocavel, RegExp][] = [
  ['cafe', /\bcafe\b/],
  ['almoco', /\balmoco\b/],
  ['lanche', /\blanche\b/],
  ['jantar', /\b(jantar|janta)\b/],
];

const NAO_COMIDA =
  /\b(treino\w*|treinar|academia|correr|corrida|agua|acordar|cedo|dormir|cardio)\b/;

/** "Não gosto de peixe" → "peixe"; "dieta sem lactose" → "lactose". */
export function alimentoEvitado(pergunta: string): string | null {
  const original = pergunta.toLowerCase();
  const normal = normalizarAlinhado(pergunta);
  const padrao =
    /(nao gosto de|nao gosto do|nao gosto da|nao gosto dos|nao gosto das|odeio|nao como|nao posso comer|sem)(\s+)([a-z][a-z-]*(?:\s+(?!e\b|no\b|na\b|nos\b|nas\b|por\b|pra\b|para\b|mais\b|porque\b|pq\b)[a-z][a-z-]*){0,2})/;
  const achado = padrao.exec(normal);

  if (!achado) {
    return null;
  }

  const [, chave, espaco, alvo] = achado;

  if (chave === 'sem' && !PADROES.dieta.test(normal)) {
    return null;
  }

  if (NAO_COMIDA.test(alvo)) {
    return null;
  }

  const inicio = achado.index + chave.length + espaco.length;

  return original.slice(inicio, inicio + alvo.length).trim();
}

function slotPedido(normal: string): SlotTrocavel | null {
  return SLOTS.find(([, padrao]) => padrao.test(normal))?.[0] ?? null;
}

/**
 * "troca o supino da sexta por supino inclinado", "tira cardio de segunda":
 * pedido de exercício (cita um exercício ou o treino, e não fala de comida).
 */
function pedidoDeExercicio(pergunta: string): PedidoExercicio | null {
  const normal = normalizarAlinhado(pergunta);

  if (slotPedido(normal) || PADROES.dieta.test(normal)) {
    return null;
  }

  const pedido = lerPedidoExercicio(pergunta);

  return pedido && (citaExercicio(pergunta) || /\btreino/.test(normal)) ? pedido : null;
}

/** Qual assunto a pergunta trata. A ordem importa: segurança vem primeiro. */
export function detectarIntencao(pergunta: string): Intencao {
  const normal = normalizarAlinhado(pergunta);

  if (PADROES.dor.test(normal)) return 'dor';
  if (PADROES.seguranca.test(normal)) return 'seguranca';
  if (PADROES.troca.test(normal) && slotPedido(normal)) return 'trocarRefeicao';
  if (pedidoDeExercicio(pergunta)) return 'ajustarExercicio';
  if (alimentoEvitado(pergunta)) return 'evitarAlimento';
  if (
    PADROES.dieta.test(normal) &&
    PADROES.montar.test(normal) &&
    /dieta|plano|cardapio/.test(normal)
  )
    return 'montarDieta';
  if (PADROES.montarTreino.test(normal)) return 'montarTreino';
  if (PADROES.pre.test(normal)) return 'preTreino';
  if (PADROES.pos.test(normal)) return 'posTreino';
  if (PADROES.agua.test(normal)) return 'agua';
  if (PADROES.proteina.test(normal)) return 'proteina';
  if (PADROES.calorias.test(normal)) return 'calorias';
  if (PADROES.peso.test(normal)) return 'peso';
  if (PADROES.motivacao.test(normal)) return 'motivacao';
  if (PADROES.treino.test(normal)) return 'treino';
  if (/\b(dieta|cardapio|plano alimentar)\b/.test(normal)) return 'montarDieta';
  if (PADROES.saudacao.test(normal)) return 'saudacao';

  return 'desconhecida';
}

// Utilidades de texto

function escolher<T>(opcoes: readonly T[], semente: number): T {
  const base = Number.isFinite(semente) ? Math.abs(Math.floor(semente)) : 0;

  return opcoes[base % opcoes.length];
}

function frases(...partes: (string | null | undefined | false)[]): string {
  return partes.filter((parte): parte is string => Boolean(parte)).join(' ');
}

/** ["a", "b", "c"] → "a, b e c" */
function porExtenso(itens: readonly string[]): string {
  if (itens.length <= 1) {
    return itens[0] ?? '';
  }

  return `${itens.slice(0, -1).join(', ')} e ${itens[itens.length - 1]}`;
}

function minuscula(texto: string): string {
  return texto.charAt(0).toLowerCase() + texto.slice(1);
}

function vezes(n: number): string {
  return n === 1 ? '1 vez' : `${n} vezes`;
}

function semanas(n: number): string {
  return n === 1 ? '1 semana' : `${n} semanas`;
}

function kg(valor: number): string {
  return `${formatarNumero(valor, 1)} kg`;
}

function ml(valor: number): string {
  return `${formatarNumero(valor)} ml`;
}

function kcal(valor: number): string {
  return `${formatarNumero(valor)} kcal`;
}

// Exemplos de comida que respeitam as restrições do perfil

type Exemplo = { texto: string; tags: Tag[] };

function filtrar(exemplos: readonly Exemplo[], restricoes: Restricoes, quantos: number): string[] {
  return exemplos
    .filter((exemplo) => !exemplo.tags.some((tag) => restricoes.bloqueadas.has(tag)))
    .slice(0, quantos)
    .map((exemplo) => exemplo.texto);
}

const PRE_TREINO: Exemplo[] = [
  { texto: 'banana com aveia', tags: ['gluten'] },
  { texto: 'tapioca com queijo branco', tags: ['lactose', 'laticinio'] },
  { texto: 'pão com ovo', tags: ['gluten', 'ovo'] },
  { texto: 'banana com pasta de amendoim', tags: ['amendoim'] },
  { texto: 'batata-doce com um pouco de frango', tags: ['carne'] },
  { texto: 'uma fruta com castanhas', tags: ['castanha'] },
  { texto: 'cuscuz com uma fruta', tags: [] },
];

const POS_TREINO: Exemplo[] = [
  { texto: 'arroz, feijão e frango', tags: ['carne'] },
  { texto: 'omelete com batata-doce', tags: ['ovo'] },
  { texto: 'iogurte com banana', tags: ['lactose', 'laticinio'] },
  { texto: 'atum com pão integral', tags: ['peixe', 'gluten'] },
  { texto: 'tofu com arroz e legumes', tags: [] },
  { texto: 'lentilha com arroz', tags: [] },
];

type FonteProteina = { id: string; quantidade: number; rotulo: string };

const FONTES_PROTEINA: FonteProteina[] = [
  { id: 'frango', quantidade: 100, rotulo: '100 g de frango grelhado' },
  { id: 'ovo', quantidade: 2, rotulo: '2 ovos' },
  { id: 'tilapia', quantidade: 120, rotulo: '1 filé de tilápia' },
  { id: 'iogurte', quantidade: 170, rotulo: '1 pote de iogurte natural' },
  { id: 'tofu', quantidade: 100, rotulo: '100 g de tofu' },
  { id: 'lentilha', quantidade: 180, rotulo: '2 conchas de lentilha' },
  { id: 'proteina-soja', quantidade: 100, rotulo: '100 g de proteína de soja' },
];

function fontesDeProteina(restricoes: Restricoes, quantos: number): string[] {
  return FONTES_PROTEINA.filter(({ id }) => alimentoPermitido(buscarAlimento(id), restricoes))
    .slice(0, quantos)
    .map(({ id, quantidade, rotulo }) => {
      const gramas = Math.round(nutrientesDaPorcao(buscarAlimento(id), quantidade).proteina);

      return `uns ${gramas} g em ${rotulo}`;
    });
}

function refeicaoDoPlano(plano: PlanoDieta | null, slot: SlotTrocavel) {
  if (!plano) {
    return null;
  }

  const chave = { cafe: 'cafe', almoco: 'almoco', lanche: 'lanche', jantar: 'jantar' }[slot];

  return plano.refeicoes.find((r) => normalizarTexto(r.nome).includes(chave)) ?? null;
}

function alimentosDaRefeicao(refeicao: PlanoDieta['refeicoes'][number], quantos = 3): string {
  return porExtenso(refeicao.itens.slice(0, quantos).map((item) => minuscula(item.alimento)));
}

// Respostas por assunto

type Contexto = {
  dados: DadosDemo;
  nome: string;
  semente: number;
  menor: boolean;
  restricoes: Restricoes;
  pergunta: string;
};

const APLICAR = 'Confira a proposta aqui embaixo e toque em aplicar para salvar.';

const COMPLETAR_PERFIL =
  'Para eu calcular suas metas, complete o perfil com sexo, nível de atividade e objetivo. É rapidinho, na aba Perfil.';

/** ", Eduardo" no fim da frase, ou nada se não tiver nome. */
function vocativo(nome: string): string {
  return nome ? `, ${nome}` : '';
}

/** "Eduardo, seu placar..." ou "Seu placar..." quando não tem nome. */
function comNome(nome: string, frase: string): string {
  return nome ? `${nome}, ${frase}` : frase.charAt(0).toUpperCase() + frase.slice(1);
}

function responderDor({ nome, semente }: Contexto): RespostaDemo {
  return {
    texto: escolher(
      [
        `Dor não é para ignorar${vocativo(nome)}. Pare o exercício que incomoda e procure um médico ou fisioterapeuta antes de voltar. Até lá, nada de forçar.`,
        `Opa, com dor a regra é parar${vocativo(nome)}. Procure um médico ou fisioterapeuta para avaliar. Depois que ele liberar, a gente volta com carga leve.`,
      ],
      semente,
    ),
  };
}

function responderSeguranca({ nome, semente, menor }: Contexto): RespostaDemo {
  return {
    texto: frases(
      escolher(
        [
          `Suplemento, remédio e jejum eu não indico por aqui${vocativo(nome)}.`,
          `Esse assunto precisa de um profissional${vocativo(nome)}: não indico suplemento, remédio nem jejum.`,
        ],
        semente,
      ),
      'Com comida de verdade, água e treino já dá para chegar muito longe.',
      menor
        ? 'Na sua idade isso é ainda mais importante: converse com seus responsáveis e com um médico ou nutricionista.'
        : 'Se quiser saber mais, converse com um nutricionista ou médico.',
    ),
  };
}

function responderMontarDieta({ dados, nome, semente }: Contexto): RespostaDemo {
  const { necessidades } = dados;

  if (!necessidades) {
    return { texto: COMPLETAR_PERFIL };
  }

  const refeicoes = quantidadeDeRefeicoes(necessidades.metaCalorias);

  return {
    texto: frases(
      escolher([`Bora${vocativo(nome)}!`, `Fechado${vocativo(nome)}!`, 'Partiu!'], semente),
      `Vou montar um plano de ${kcal(necessidades.metaCalorias)} com ${necessidades.macros.proteinaG} g de proteína, dividido em ${refeicoes} refeições.`,
      dados.plano ? 'Se você aplicar, ele substitui o atual.' : null,
      APLICAR,
    ),
    acao: { tipo: 'dieta', novo: true },
  };
}

function responderTrocar(ctx: Contexto, slot: SlotTrocavel): RespostaDemo {
  const { dados, nome, semente, pergunta } = ctx;
  const evitado = alimentoEvitado(pergunta);
  // "muda o almoço de quarta": só a dieta de quarta
  const dias = diasCitados(pergunta);
  const deQuando = dias.length > 0 ? ` de ${textoDosDias(dias)}` : '';

  if (!dados.necessidades) {
    return { texto: COMPLETAR_PERFIL };
  }

  const plano =
    dias.length > 0
      ? planoDoDia({ plano: dados.plano, porDia: dados.porDia ?? {} }, dias[0])
      : dados.plano;
  const refeicao = refeicaoDoPlano(plano, slot);

  if (!refeicao) {
    return {
      texto: frases(
        `Você ainda não tem um plano salvo${vocativo(nome)}.`,
        `Bora montar um completo, de ${kcal(dados.necessidades.metaCalorias)}, e depois você troca o ${NOME_REFEICAO[slot]} quando quiser.`,
      ),
      acao: { tipo: 'dieta', novo: true },
    };
  }

  return {
    texto: frases(
      escolher(
        [
          `Bora trocar o ${NOME_REFEICAO[slot]}${deQuando}${vocativo(nome)}.`,
          `Fechado, novo ${NOME_REFEICAO[slot]}${deQuando} saindo.`,
        ],
        semente,
      ),
      `Hoje ele tem ${alimentosDaRefeicao(refeicao)}, com ${kcal(refeicao.calorias)}.`,
      `Vou montar outra opção com calorias parecidas${evitado ? `, sem ${evitado}` : ''}.`,
      dias.length > 0
        ? 'Os outros dias e as outras refeições continuam iguais.'
        : 'O resto do plano continua igual.',
      APLICAR,
    ),
    acao: { tipo: 'dieta', trocarRefeicao: slot, ...(dias.length > 0 ? { dias } : {}) },
  };
}

function responderEvitar(ctx: Contexto): RespostaDemo {
  const { dados, nome, semente, pergunta } = ctx;
  const evitado = alimentoEvitado(pergunta) ?? '';

  if (!dados.necessidades) {
    return { texto: frases(`Anotado: sem ${evitado}.`, COMPLETAR_PERFIL) };
  }

  return {
    texto: frases(
      escolher(
        [`Anotado${vocativo(nome)}: sem ${evitado}.`, `Tranquilo, nada de ${evitado}.`],
        semente,
      ),
      `Vou montar um plano novo de ${kcal(dados.necessidades.metaCalorias)} trocando por opções equivalentes.`,
      APLICAR,
      'Se for alergia ou intolerância, escreva em Perfil, no campo de restrições, para eu levar em conta sempre.',
    ),
    acao: { tipo: 'dieta', novo: true },
  };
}

function responderPreTreino({ dados, nome, semente, restricoes }: Contexto): RespostaDemo {
  const exemplos = filtrar(PRE_TREINO, restricoes, 2);
  const lanche = refeicaoDoPlano(dados.plano, 'lanche');
  const proximo = dados.treinos?.proximo;

  return {
    texto: frases(
      escolher(
        [
          `Antes do treino${vocativo(nome)}, coma de 1 a 2 horas antes: carboidrato com um pouco de proteína.`,
          'O pré-treino ideal é leve: carboidrato para energia e um pouco de proteína, de 1 a 2 horas antes.',
        ],
        semente,
      ),
      `Boas opções: ${porExtenso(exemplos)}.`,
      lanche
        ? `Seu ${minuscula(lanche.nome)} do plano, com ${kcal(lanche.calorias)}, já serve bem.`
        : null,
      proximo ? `E o próximo treino é o ${proximo}. Bora!` : null,
    ),
  };
}

function responderPosTreino({ dados, nome, semente, restricoes }: Contexto): RespostaDemo {
  const exemplos = filtrar(POS_TREINO, restricoes, 2);
  const proteinaRefeicao = dados.necessidades
    ? Math.round(
        dados.necessidades.macros.proteinaG /
          quantidadeDeRefeicoes(dados.necessidades.metaCalorias),
      )
    : null;

  return {
    texto: frases(
      escolher(
        [
          `Depois do treino${vocativo(nome)}, faça uma refeição com proteína e carboidrato em até 2 horas.`,
          'No pós-treino o corpo quer recuperar: junte proteína e carboidrato numa refeição de verdade.',
        ],
        semente,
      ),
      proteinaRefeicao ? `Mire em uns ${proteinaRefeicao} g de proteína nessa refeição.` : null,
      `Exemplos: ${porExtenso(exemplos)}.`,
      'E não esquece a água!',
    ),
  };
}

function responderAgua({ dados, nome, semente }: Contexto): RespostaDemo {
  const { hojeMl, metaMl, sequencia, diasBatidosNaSemana } = dados.agua;
  const falta = Math.max(metaMl - hojeMl, 0);
  const copos = Math.ceil(falta / 250);

  if (falta === 0) {
    return {
      texto: frases(
        escolher(
          [
            `Meta de água batida hoje${vocativo(nome)}!`,
            `Mandou bem${vocativo(nome)}, meta de água batida!`,
          ],
          semente,
        ),
        `Foram ${ml(hojeMl)} de ${ml(metaMl)}.`,
        sequencia > 1 ? `Sua sequência está em ${sequencia} dias.` : null,
      ),
    };
  }

  return {
    texto: frases(
      escolher(
        [
          `Hoje você bebeu ${ml(hojeMl)} de ${ml(metaMl)}${vocativo(nome)}.`,
          `Até agora foram ${ml(hojeMl)} de água, a meta é ${ml(metaMl)}.`,
          comNome(nome, `seu placar de água hoje: ${ml(hojeMl)} de ${ml(metaMl)}.`),
        ],
        semente,
      ),
      `Faltam ${ml(falta)}, uns ${copos} ${copos === 1 ? 'copo' : 'copos'} de 250 ml.`,
      sequencia > 0
        ? `Você está numa sequência de ${sequencia} ${sequencia === 1 ? 'dia' : 'dias'}, não deixa quebrar.`
        : `Na semana você bateu a meta em ${diasBatidosNaSemana} de 7 dias.`,
    ),
  };
}

function responderProteina({ dados, nome, semente, restricoes }: Contexto): RespostaDemo {
  const { necessidades, plano } = dados;

  if (!necessidades) {
    return { texto: COMPLETAR_PERFIL };
  }

  const refeicoes = quantidadeDeRefeicoes(necessidades.metaCalorias);
  const porRefeicao = Math.round(necessidades.macros.proteinaG / refeicoes);
  const exemplos = fontesDeProteina(restricoes, 2);

  return {
    texto: frases(
      escolher(
        [
          `Sua meta é de ${necessidades.macros.proteinaG} g de proteína por dia${vocativo(nome)}.`,
          comNome(
            nome,
            `você precisa de uns ${necessidades.macros.proteinaG} g de proteína por dia.`,
          ),
        ],
        semente,
      ),
      `Dividindo em ${refeicoes} refeições, são uns ${porRefeicao} g em cada.`,
      exemplos.length > 0 ? `Para ter ideia: ${porExtenso(exemplos)}.` : null,
      plano ? `Seu plano atual entrega ${plano.macros.proteinaG} g.` : null,
    ),
  };
}

function frasesObjetivo({ dados, menor }: Contexto): string | null {
  const { perfil, necessidades } = dados;

  if (!necessidades || !perfil.objetivo) {
    return null;
  }

  const diferenca = Math.abs(necessidades.gastoDiario - necessidades.metaCalorias);

  if (menor) {
    return 'Como você ainda está crescendo, o ajuste é bem leve: o foco é comer bem e não pular refeições.';
  }

  switch (perfil.objetivo) {
    case 'perder':
      return `São ${kcal(diferenca)} a menos que seu gasto de ${kcal(necessidades.gastoDiario)}, para perder gordura aos poucos.`;
    case 'ganhar':
      return `São ${kcal(diferenca)} a mais que seu gasto de ${kcal(necessidades.gastoDiario)}, para ganhar massa com treino.`;
    default:
      return `Fica igual ao seu gasto diário, para manter o peso.`;
  }
}

function responderCalorias(ctx: Contexto): RespostaDemo {
  const { dados, nome, semente } = ctx;
  const { necessidades, plano } = dados;

  if (!necessidades) {
    return { texto: COMPLETAR_PERFIL };
  }

  const { proteinaG, carboidratoG, gorduraG } = necessidades.macros;

  return {
    texto: frases(
      escolher(
        [
          `Sua meta é de ${kcal(necessidades.metaCalorias)} por dia${vocativo(nome)}.`,
          comNome(nome, `seu alvo diário é ${kcal(necessidades.metaCalorias)}.`),
          `A conta do dia dá ${kcal(necessidades.metaCalorias)}${vocativo(nome)}.`,
        ],
        semente,
      ),
      `Em macros: ${proteinaG} g de proteína, ${carboidratoG} g de carboidrato e ${gorduraG} g de gordura.`,
      frasesObjetivo(ctx),
      plano
        ? `Seu plano salvo tem ${kcal(plano.caloriasDia)} em ${plano.refeicoes.length} refeições.`
        : 'Quer que eu monte um plano com esses números?',
    ),
  };
}

function responderPeso(ctx: Contexto): RespostaDemo {
  const { dados, nome, semente, menor } = ctx;
  const { perfil, peso } = dados;
  const atual = peso?.ultimoKg ?? perfil.pesoKg;
  const variacao = peso?.variacao30Dias ?? null;

  const linhaVariacao =
    variacao === null
      ? 'Registre seu peso na tela de peso para eu acompanhar a tendência.'
      : variacao === 0
        ? 'Nos últimos 30 dias seu peso ficou estável.'
        : `Nos últimos 30 dias você ${variacao < 0 ? 'perdeu' : 'ganhou'} ${kg(Math.abs(variacao))}.`;

  let linhaObjetivo: string;

  if (menor) {
    linhaObjetivo =
      'Na sua idade o foco é hábito, não balança: comer bem, dormir e treinar. Antes de mudar a alimentação, converse com seus responsáveis e um profissional.';
  } else if (perfil.objetivo === 'perder') {
    linhaObjetivo = 'Perder de meio a 1 kg por semana já é um ótimo ritmo, sem passar fome.';
  } else if (perfil.objetivo === 'ganhar') {
    linhaObjetivo =
      'Ganho de massa é lento: subir uns 200 a 300 g por semana, com treino, já é ótimo.';
  } else {
    linhaObjetivo = 'Variar 1 kg para cima ou para baixo no dia a dia é normal.';
  }

  return {
    texto: frases(
      escolher(
        [
          `Seu peso atual é ${kg(atual)}${vocativo(nome)}.`,
          comNome(nome, `hoje a balança marca ${kg(atual)}.`),
        ],
        semente,
      ),
      linhaVariacao,
      linhaObjetivo,
      !menor && dados.necessidades
        ? `Sua meta de ${kcal(dados.necessidades.metaCalorias)} já está ajustada para isso.`
        : null,
    ),
  };
}

function responderMotivacao({ dados, nome, semente }: Contexto): RespostaDemo {
  const treinos = dados.treinos;
  const conquista =
    treinos && treinos.sequenciaSemanas > 0
      ? `Você já tem ${semanas(treinos.sequenciaSemanas)} seguidas treinando, não deixa isso cair.`
      : dados.agua.sequencia > 0
        ? `Você está há ${dados.agua.sequencia} ${dados.agua.sequencia === 1 ? 'dia' : 'dias'} batendo a meta de água, isso é constância.`
        : 'Todo começo é assim, e o importante é aparecer.';

  return {
    texto: frases(
      escolher(
        [
          `Normal ter dia assim${vocativo(nome)}.`,
          `Cansaço acontece${vocativo(nome)}.`,
          `Bora${vocativo(nome)}, um passo de cada vez.`,
        ],
        semente,
      ),
      conquista,
      'Hoje vale um treino mais leve ou 20 minutos de caminhada: feito é melhor que perfeito.',
      'E durma bem, o descanso também conta.',
    ),
  };
}

function responderMontarTreino({ nome, semente, pergunta }: Contexto): RespostaDemo {
  const normal = normalizarAlinhado(pergunta);
  const diasPedidos = diasDoTexto(pergunta);
  const numero = /\b([2-6]) ?(dias|x|vezes)\b/.exec(normal);
  const diasPorSemana = numero
    ? Number(numero[1])
    : Math.min(6, Math.max(2, diasPedidos.length || 3));
  const local: LocalTreino = /\b(casa|sem aparelho\w*|sem academia)\b/.test(normal)
    ? 'casa'
    : 'academia';

  return {
    texto: frases(
      escolher([`Bora${vocativo(nome)}!`, `Fechado${vocativo(nome)}!`], semente),
      `Montei uma divisão de ${diasPorSemana} treinos ${local === 'casa' ? 'em casa, sem aparelhos' : 'na academia'}, de 60 minutos, cada um no seu dia da semana.`,
      'Se você aplicar, eles substituem os treinos atuais. O histórico fica.',
      APLICAR,
    ),
    acao: { tipo: 'treinos', diasPorSemana, local, diasPedidos },
  };
}

function responderExercicio(ctx: Contexto, pedido: PedidoExercicio): RespostaDemo {
  const { dados, nome, semente } = ctx;
  const treinos = dados.listaTreinos ?? [];
  const quando = pedido.dias.length > 0 ? ` de ${textoDosDias(pedido.dias)}` : '';
  const citado = pedido.tipo === 'trocar' ? pedido.de : pedido.alvo;

  if (treinos.length === 0) {
    return {
      texto: frases(
        `Você ainda não tem treinos salvos${vocativo(nome)}.`,
        'Peça "monta meu treino" ou escolha um modelo na aba Treinos, e depois eu troco o que quiser.',
      ),
    };
  }

  const resultado = aplicarPedidoExercicio(treinos, pedido);

  if (!resultado.ok) {
    if (resultado.motivo === 'sem-substituto') {
      return {
        texto: frases(
          `Achei ${minuscula(resultado.encontrado)} no seu treino${quando}${vocativo(nome)}.`,
          `Por qual exercício você quer trocar? Ex: "troca o ${citado}${quando} por ${citado.startsWith('supino') ? 'supino inclinado' : 'agachamento'}".`,
        ),
      };
    }

    return {
      texto:
        resultado.motivo === 'sem-treino-no-dia'
          ? frases(
              `Você não tem treino marcado ${pedido.dias.length === 1 ? (pedido.dias[0] === 0 || pedido.dias[0] === 6 ? 'no' : 'na') : 'em'} ${textoDosDias(pedido.dias)}${vocativo(nome)}.`,
              'Me diz de qual treino é o exercício, ou marque os dias na aba Treinos.',
            )
          : frases(
              `Não achei "${citado}" nos seus treinos${quando}${vocativo(nome)}.`,
              'Me diz o nome do exercício como está no treino.',
            ),
    };
  }

  return {
    texto: frases(
      escolher([`Fechado${vocativo(nome)}!`, `Bora${vocativo(nome)}!`], semente),
      pedido.tipo === 'trocar'
        ? `Troquei ${citado} por ${minuscula(pedido.para)}${quando}, com as mesmas séries e repetições.`
        : `Tirei ${citado}${quando}.`,
      'O resto dos treinos fica igual.',
      APLICAR,
    ),
    acao: { tipo: 'ajusteTreino', treinos: resultado.treinos, diasAlvo: pedido.dias },
  };
}

function responderTreino({ dados, nome, semente }: Contexto): RespostaDemo {
  const treinos = dados.treinos;

  if (!treinos || (!treinos.proximo && treinos.naSemana === 0 && treinos.sequenciaSemanas === 0)) {
    return {
      texto: frases(
        `Você ainda não montou seus treinos${vocativo(nome)}.`,
        'Na aba Treinos tem modelos prontos, é só escolher um e começar.',
        'Bora?',
      ),
    };
  }

  return {
    texto: frases(
      escolher(
        [
          `Nesta semana você treinou ${vezes(treinos.naSemana)}${vocativo(nome)}.`,
          comNome(nome, `seu placar da semana: ${vezes(treinos.naSemana)} na academia.`),
        ],
        semente,
      ),
      treinos.proximo ? `O próximo é o ${treinos.proximo}.` : null,
      treinos.sequenciaSemanas > 0
        ? `São ${semanas(treinos.sequenciaSemanas)} seguidas treinando. Bora manter!`
        : 'Bora começar uma sequência nova!',
    ),
  };
}

function responderSaudacao({ dados, nome, semente }: Contexto): RespostaDemo {
  const { hojeMl, metaMl } = dados.agua;
  const proximo = dados.treinos?.proximo;

  return {
    texto: frases(
      escolher(
        [
          `Fala${vocativo(nome)}! Bora?`,
          `Oi${vocativo(nome)}! Tudo certo?`,
          `E aí${vocativo(nome)}! Bora pra cima.`,
        ],
        semente,
      ),
      `Hoje você está com ${ml(hojeMl)} de ${ml(metaMl)} de água${proximo ? ` e o próximo treino é o ${proximo}` : ''}.`,
      'Posso montar sua dieta, trocar uma refeição, montar seus treinos ou falar de treino.',
    ),
  };
}

function responderDesconhecida({ nome, semente }: Contexto): RespostaDemo {
  return {
    texto: frases(
      escolher(
        [
          `Essa eu ainda não sei responder no modo demonstração${vocativo(nome)}.`,
          `Hum, essa fugiu do que eu sei sem internet${vocativo(nome)}.`,
        ],
        semente,
      ),
      'Posso ajudar com água, calorias e metas, proteína, pré e pós-treino, treino e motivação.',
      'Também monto sua dieta, troco uma refeição ou um exercício, é só pedir: "troca o almoço de quarta" ou "troca o supino da sexta por supino inclinado".',
    ),
  };
}

/**
 * Responde uma mensagem do chat sem IA. Mesma pergunta, mesmos dados e mesma
 * semente sempre dão a mesma resposta. `acao` pede para a tela gerar ou
 * trocar a dieta (com `montarDietaPorRegras`).
 */
export function responderModoDemo(
  pergunta: string,
  dados: DadosDemo,
  semente: number = 0,
): RespostaDemo {
  const ctx: Contexto = {
    dados,
    nome: primeiroNome(dados.perfil.nome),
    semente,
    menor: dados.perfil.idade < 18,
    restricoes: lerRestricoes(dados.perfil.restricoes),
    pergunta,
  };

  switch (detectarIntencao(pergunta)) {
    case 'dor':
      return responderDor(ctx);
    case 'seguranca':
      return responderSeguranca(ctx);
    case 'trocarRefeicao':
      return responderTrocar(ctx, slotPedido(normalizarAlinhado(pergunta)) ?? 'almoco');
    case 'ajustarExercicio':
      return responderExercicio(ctx, pedidoDeExercicio(pergunta)!);
    case 'evitarAlimento':
      return responderEvitar(ctx);
    case 'montarDieta':
      return responderMontarDieta(ctx);
    case 'preTreino':
      return responderPreTreino(ctx);
    case 'posTreino':
      return responderPosTreino(ctx);
    case 'agua':
      return responderAgua(ctx);
    case 'proteina':
      return responderProteina(ctx);
    case 'calorias':
      return responderCalorias(ctx);
    case 'peso':
      return responderPeso(ctx);
    case 'motivacao':
      return responderMotivacao(ctx);
    case 'montarTreino':
      return responderMontarTreino(ctx);
    case 'treino':
      return responderTreino(ctx);
    case 'saudacao':
      return responderSaudacao(ctx);
    default:
      return responderDesconhecida(ctx);
  }
}
