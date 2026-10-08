import { calcularNecessidades, type Necessidades } from '@/features/nutricao/calculos';
import { calcularMetaAguaMl } from '@/features/perfil/calculos';
import type { Objetivo, Perfil } from '@/features/perfil/types';
import { formatarNumero } from '@/shared/lib/numero';

import {
  ajustarPorcao,
  ALIMENTOS,
  buscarAlimento,
  nutrientesDaPorcao,
  textoQuantidade,
  type Alimento,
  type Nutrientes,
} from './alimentos';
import {
  HORARIO_SLOT,
  MODELOS,
  NOME_SLOT,
  type ModeloRefeicao,
  type Papel,
  type Slot,
  type SlotTrocavel,
} from './cardapios';
import type { PlanoDieta } from './contrato';
import { alimentoPermitido, lerRestricoes, normalizarTexto, type Restricoes } from './restricoes';

/**
 * Dieta montada sem IA, só com regras e uma tabela de alimentos. É o "modo
 * demonstração": funciona offline e devolve o mesmo formato do plano da IA.
 */

export type OpcoesDietaRegras = {
  /** Escolhe os modelos de refeição. Mesma semente, mesmo plano. */
  semente?: number;
  /** Troca só essa refeição, mantendo o resto de `planoAtual`. */
  trocarRefeicao?: SlotTrocavel;
  planoAtual?: PlanoDieta;
};

/** Acima disso a dieta ganha uma ceia (5 refeições). */
export const CALORIAS_PARA_CEIA = 2600;

/** Tolerância final das calorias do plano em relação à meta. */
export const TOLERANCIA_CALORIAS = 0.05;

export function quantidadeDeRefeicoes(metaCalorias: number): number {
  return metaCalorias > CALORIAS_PARA_CEIA ? 5 : 4;
}

type Divisao = Partial<Record<Slot, { kcal: number; proteina: number }>>;

const DIVISAO_4: Divisao = {
  cafe: { kcal: 0.25, proteina: 0.2 },
  almoco: { kcal: 0.35, proteina: 0.35 },
  lanche: { kcal: 0.15, proteina: 0.15 },
  jantar: { kcal: 0.25, proteina: 0.3 },
};

const DIVISAO_5: Divisao = {
  cafe: { kcal: 0.22, proteina: 0.18 },
  almoco: { kcal: 0.3, proteina: 0.3 },
  lanche: { kcal: 0.13, proteina: 0.12 },
  jantar: { kcal: 0.25, proteina: 0.28 },
  ceia: { kcal: 0.1, proteina: 0.12 },
};

type Porcao = { alimento: Alimento; papel: Papel; quantidade: number };

type Refeicao = { slot: Slot; porcoes: Porcao[]; kcalAlvo: number };

const ZERO: Nutrientes = { kcal: 0, proteina: 0, carboidrato: 0, gordura: 0 };

function somar(a: Nutrientes, b: Nutrientes): Nutrientes {
  return {
    kcal: a.kcal + b.kcal,
    proteina: a.proteina + b.proteina,
    carboidrato: a.carboidrato + b.carboidrato,
    gordura: a.gordura + b.gordura,
  };
}

function nutrientes(porcoes: readonly Porcao[]): Nutrientes {
  return porcoes.reduce(
    (total, porcao) => somar(total, nutrientesDaPorcao(porcao.alimento, porcao.quantidade)),
    ZERO,
  );
}

function indice(semente: number, deslocamento: number, tamanho: number): number {
  const base = Number.isFinite(semente) ? Math.abs(Math.floor(semente)) : 0;

  return (base + deslocamento) % tamanho;
}

/** Escolhe, para cada item do modelo, a primeira opção permitida e ainda não usada. */
function montarPorcoes(modelo: ModeloRefeicao, restricoes: Restricoes): Porcao[] {
  const usados = new Set<string>();
  const porcoes: Porcao[] = [];

  for (const item of modelo.itens) {
    const opcao = item.opcoes.find(
      ({ id }) => !usados.has(id) && alimentoPermitido(buscarAlimento(id), restricoes),
    );

    if (!opcao) {
      continue;
    }

    usados.add(opcao.id);
    porcoes.push({ alimento: buscarAlimento(opcao.id), papel: item.papel, quantidade: opcao.base });
  }

  return porcoes;
}

function limitar(valor: number, minimo: number, maximo: number): number {
  return Math.min(maximo, Math.max(minimo, valor));
}

/**
 * Escala uma refeição: primeiro as fontes de proteína (para a proteína da
 * refeição), depois carboidratos e gorduras (para as calorias). Arredonda tudo.
 */
function escalarRefeicao(porcoes: Porcao[], kcalAlvo: number, proteinaAlvo: number): void {
  const proteicas = porcoes.filter((p) => p.papel === 'proteina');
  const proteinaFontes = nutrientes(proteicas).proteina;
  const proteinaOutras = nutrientes(porcoes.filter((p) => p.papel !== 'proteina')).proteina;

  if (proteinaFontes > 0) {
    const fator = limitar((proteinaAlvo - proteinaOutras) / proteinaFontes, 0.5, 3);

    proteicas.forEach((p) => (p.quantidade = ajustarPorcao(p.alimento, p.quantidade * fator)));
  }

  const variaveis = porcoes.filter((p) => p.papel === 'carbo' || p.papel === 'gordura');
  const kcalVariaveis = nutrientes(variaveis).kcal;
  const kcalFixas = nutrientes(porcoes.filter((p) => !variaveis.includes(p))).kcal;

  if (kcalVariaveis > 0) {
    const fator = limitar((kcalAlvo - kcalFixas) / kcalVariaveis, 0.3, 5);

    variaveis.forEach((p) => (p.quantidade = ajustarPorcao(p.alimento, p.quantidade * fator)));
  }

  porcoes.forEach((p) => (p.quantidade = ajustarPorcao(p.alimento, p.quantidade)));
}

function passoKcal(porcao: Porcao): number {
  return nutrientesDaPorcao(porcao.alimento, porcao.alimento.passo).kcal;
}

/** `folga` aumenta o máximo da porção: último recurso para metas muito altas. */
function podeMudar(porcao: Porcao, direcao: 1 | -1, folga = 1): boolean {
  if (porcao.alimento.tipo === 'livre') {
    return false;
  }

  const nova = porcao.quantidade + direcao * porcao.alimento.passo;

  return nova >= porcao.alimento.min && nova <= porcao.alimento.max * folga;
}

/** Sobe as fontes de proteína, uma porção por vez, até chegar perto da meta. */
function completarProteina(porcoes: Porcao[], proteinaAlvo: number): void {
  for (let i = 0; i < 200; i++) {
    if (nutrientes(porcoes).proteina >= proteinaAlvo * 0.95) {
      return;
    }

    let melhor: Porcao | null = null;
    let melhorRazao = 0;

    for (const porcao of porcoes) {
      if (porcao.papel !== 'proteina' || !podeMudar(porcao, 1)) {
        continue;
      }

      const ganho = nutrientesDaPorcao(porcao.alimento, porcao.alimento.passo);
      const razao = ganho.proteina / Math.max(ganho.kcal, 1);

      if (razao > melhorRazao) {
        melhor = porcao;
        melhorRazao = razao;
      }
    }

    if (!melhor) {
      return;
    }

    melhor.quantidade += melhor.alimento.passo;
  }
}

/** Quanto da faixa (mínimo a máximo) a porção já usa, de 0 a 1. */
function ocupacao(porcao: Porcao): number {
  const { min, max } = porcao.alimento;

  return max > min ? (porcao.quantidade - min) / (max - min) : 1;
}

/**
 * Acerta as calorias somando ou tirando um passo de cada vez. Entre os
 * alimentos que aproximam o total da meta, mexe no que está menos usado
 * (ou mais usado, para tirar): assim a mudança se espalha pelo prato.
 */
function acertarCalorias(
  porcoes: Porcao[],
  kcalAlvo: number,
  papeis: readonly Papel[],
  folga = 1,
): void {
  for (let i = 0; i < 400; i++) {
    const diferenca = kcalAlvo - nutrientes(porcoes).kcal;

    if (Math.abs(diferenca) <= kcalAlvo * 0.015) {
      return;
    }

    const direcao = diferenca > 0 ? 1 : -1;
    let melhor: Porcao | null = null;

    for (const porcao of porcoes) {
      if (!papeis.includes(porcao.papel) || !podeMudar(porcao, direcao, folga)) {
        continue;
      }

      const resto = Math.abs(diferenca - direcao * passoKcal(porcao));

      if (resto >= Math.abs(diferenca)) {
        continue;
      }

      if (!melhor || direcao * (ocupacao(melhor) - ocupacao(porcao)) > 0) {
        melhor = porcao;
      }
    }

    if (!melhor) {
      return;
    }

    melhor.quantidade += direcao * melhor.alimento.passo;
  }
}

/** Sobe as gorduras boas (azeite, castanhas) até perto da meta de gordura. */
function completarGordura(porcoes: Porcao[], gorduraAlvo: number): void {
  for (let i = 0; i < 100; i++) {
    if (nutrientes(porcoes).gordura >= gorduraAlvo * 0.85) {
      return;
    }

    const candidata = porcoes
      .filter((p) => p.papel === 'gordura' && podeMudar(p, 1))
      .sort((a, b) => ocupacao(a) - ocupacao(b))[0];

    if (!candidata) {
      return;
    }

    candidata.quantidade += candidata.alimento.passo;
  }
}

/** Tira proteína quando passou muito da meta (feijão, pão e leite também têm). */
function reduzirProteina(porcoes: Porcao[], proteinaAlvo: number): void {
  for (let i = 0; i < 200; i++) {
    if (nutrientes(porcoes).proteina <= proteinaAlvo * 1.08) {
      return;
    }

    // Corta da porção mais "cheia", para não deixar uma refeição sem proteína
    const candidata = porcoes
      .filter((p) => p.papel === 'proteina' && podeMudar(p, -1))
      .sort((a, b) => ocupacao(b) - ocupacao(a))[0];

    if (!candidata) {
      return;
    }

    candidata.quantidade -= candidata.alimento.passo;
  }
}

type Alvos = { kcal: number; proteina: number; gordura: number };

/**
 * Ajuste fino do dia: proteína e gordura olhando o dia todo, depois as
 * calorias de cada refeição (para manter a divisão entre elas) e, se ainda
 * precisar, o dia inteiro de uma vez.
 */
function ajustarDia(refeicoes: Refeicao[], alvos: Alvos): void {
  const todas = refeicoes.flatMap((r) => r.porcoes);

  completarProteina(todas, alvos.proteina);
  reduzirProteina(todas, alvos.proteina);
  completarGordura(todas, alvos.gordura);

  for (const refeicao of refeicoes) {
    acertarCalorias(refeicao.porcoes, refeicao.kcalAlvo, ['carbo']);
    acertarCalorias(refeicao.porcoes, refeicao.kcalAlvo, ['carbo', 'gordura', 'fixo']);
  }

  const fora = () => Math.abs(nutrientes(todas).kcal - alvos.kcal) > alvos.kcal * 0.03;

  if (fora()) {
    acertarCalorias(todas, alvos.kcal, ['carbo', 'gordura', 'fixo']);
  }

  if (fora()) {
    acertarCalorias(todas, alvos.kcal, ['carbo', 'gordura', 'fixo', 'proteina']);
  }

  if (fora()) {
    acertarCalorias(todas, alvos.kcal, ['carbo', 'gordura', 'fixo', 'proteina'], 1.6);
  }
}

function nomeMinusculo(alimento: Alimento): string {
  return alimento.nome.charAt(0).toLowerCase() + alimento.nome.slice(1);
}

/** Troca equivalente: mesma proteína para fontes de proteína, mesmas calorias para o resto. */
function substituicoes(porcoes: readonly Porcao[], restricoes: Restricoes): string[] {
  const usados = new Set(porcoes.map((p) => p.alimento.id));
  const textos: string[] = [];

  for (const porcao of porcoes) {
    if (textos.length === 2) {
      break;
    }

    const alternativa = (porcao.alimento.trocas ?? [])
      .map((id) => buscarAlimento(id))
      .find((alimento) => !usados.has(alimento.id) && alimentoPermitido(alimento, restricoes));

    if (!alternativa) {
      continue;
    }

    const atual = nutrientesDaPorcao(porcao.alimento, porcao.quantidade);
    const porProteina = porcao.papel === 'proteina' && alternativa.proteina > 0;
    const unitario = nutrientesDaPorcao(alternativa, alternativa.tipo === 'unidade' ? 1 : 100);
    const bruto = porProteina
      ? (atual.proteina / unitario.proteina) * (alternativa.tipo === 'unidade' ? 1 : 100)
      : (atual.kcal / unitario.kcal) * (alternativa.tipo === 'unidade' ? 1 : 100);
    const quantidade = ajustarPorcao(alternativa, bruto);

    usados.add(alternativa.id);
    textos.push(
      `Troque ${nomeMinusculo(porcao.alimento)} por ${nomeMinusculo(alternativa)}: ${textoQuantidade(alternativa, quantidade)}.`,
    );
  }

  return textos;
}

type RefeicaoPlano = PlanoDieta['refeicoes'][number];

function paraPlano(refeicao: Refeicao, restricoes: Restricoes): RefeicaoPlano {
  return {
    nome: NOME_SLOT[refeicao.slot],
    horario: HORARIO_SLOT[refeicao.slot],
    calorias: Math.round(nutrientes(refeicao.porcoes).kcal),
    itens: refeicao.porcoes.map((p) => ({
      alimento: p.alimento.nome,
      quantidade: textoQuantidade(p.alimento, p.quantidade),
    })),
    substituicoes: substituicoes(refeicao.porcoes, restricoes),
  };
}

function slotsDoDia(metaCalorias: number): Slot[] {
  const slots: Slot[] = ['cafe', 'almoco', 'lanche', 'jantar'];

  return quantidadeDeRefeicoes(metaCalorias) === 5 ? [...slots, 'ceia'] : slots;
}

function divisaoDoDia(metaCalorias: number): Divisao {
  return quantidadeDeRefeicoes(metaCalorias) === 5 ? DIVISAO_5 : DIVISAO_4;
}

/** Monta e escala uma refeição a partir do modelo escolhido. */
function prepararRefeicao(
  slot: Slot,
  modelo: ModeloRefeicao,
  restricoes: Restricoes,
  kcalAlvo: number,
  proteinaAlvo: number,
): Refeicao {
  const porcoes = montarPorcoes(modelo, restricoes);

  escalarRefeicao(porcoes, kcalAlvo, proteinaAlvo);

  return { slot, porcoes, kcalAlvo };
}

function frasesObjetivo(objetivo: Objetivo, menor: boolean, necessidades: Necessidades): string {
  const gasto = formatarNumero(necessidades.gastoDiario);

  if (menor) {
    return objetivo === 'manter'
      ? `A meta acompanha seu gasto de ${gasto} kcal, com energia para crescer, estudar e treinar.`
      : `Como você ainda está crescendo, o ajuste em relação ao gasto de ${gasto} kcal é bem leve e o foco é comer bem, sem pular refeições.`;
  }

  switch (objetivo) {
    case 'perder':
      return `A meta fica um pouco abaixo do seu gasto de ${gasto} kcal, para perder gordura aos poucos sem passar fome.`;
    case 'ganhar':
      return `A meta fica um pouco acima do seu gasto de ${gasto} kcal, para ganhar massa junto com o treino.`;
    default:
      return `A meta acompanha seu gasto de ${gasto} kcal, para manter o peso com energia para treinar.`;
  }
}

function montarResumo(
  perfil: Perfil,
  necessidades: Necessidades,
  totais: { calorias: number; proteina: number; carboidrato: number; gordura: number },
  quantidade: number,
  restricoes: Restricoes,
): string {
  const frases = [
    `Plano de ${formatarNumero(totais.calorias)} kcal por dia em ${quantidade} refeições, com ${totais.proteina} g de proteína, ${totais.carboidrato} g de carboidrato e ${totais.gordura} g de gordura.`,
    frasesObjetivo(perfil.objetivo ?? 'manter', perfil.idade < 18, necessidades),
  ];

  if (restricoes.rotulos.length > 0) {
    frases.push(`Cardápio adaptado para: ${restricoes.rotulos.join(', ')}.`);
  }

  return frases.join(' ');
}

function montarDicas(perfil: Perfil, proteinaG: number, refeicoes: number): string[] {
  const agua = formatarNumero(calcularMetaAguaMl(perfil.pesoKg));
  const porRefeicao = Math.round(proteinaG / refeicoes);
  const dicas = [
    `Beba água ao longo do dia: sua meta é de ${agua} ml.`,
    `Coloque proteína em todas as refeições, uns ${porRefeicao} g em cada.`,
  ];

  if (perfil.idade < 18) {
    dicas.push('Não pule refeições e durma bem: o corpo cresce e se recupera no sono.');
  }

  switch (perfil.objetivo) {
    case 'perder':
      dicas.push('Comece o prato pela salada e pelos legumes: enchem e têm poucas calorias.');
      dicas.push('Prefira grelhado, assado ou cozido em vez de fritura.');
      break;
    case 'ganhar':
      dicas.push('Não pule o lanche: ele ajuda muito a bater as calorias do dia.');
      dicas.push('Depois do treino, faça uma refeição com carboidrato e proteína.');
      break;
    default:
      dicas.push('Mantenha horários parecidos todo dia, isso ajuda a controlar a fome.');
      dicas.push('Separe as marmitas da semana no domingo e fica fácil seguir o plano.');
  }

  return dicas.slice(0, 5);
}

function montarAviso(perfil: Perfil): string {
  const base =
    'Plano montado pelo app com regras simples, sem IA. É uma sugestão educativa e não substitui nutricionista ou médico: consulte um profissional antes de mudar sua alimentação.';

  return perfil.idade < 18
    ? `${base} Como você é menor de idade, converse também com seus responsáveis.`
    : base;
}

/** Descobre os ids de alimentos de uma refeição do plano pelo nome. */
function idsDaRefeicao(refeicao: RefeicaoPlano): Set<string> {
  const porNome = new Map(Object.values(ALIMENTOS).map((a) => [a.nome, a.id]));

  return new Set(refeicao.itens.map((item) => porNome.get(item.alimento) ?? item.alimento));
}

/** Nutrientes de uma refeição já salva; `null` se tiver alimento fora da tabela. */
function nutrientesDaRefeicaoSalva(refeicao: RefeicaoPlano): Nutrientes | null {
  const porNome = new Map(Object.values(ALIMENTOS).map((a) => [a.nome, a]));
  let total = ZERO;

  for (const item of refeicao.itens) {
    const alimento = porNome.get(item.alimento);
    const numero = /^(\d+)/.exec(item.quantidade);

    if (!alimento || (alimento.tipo !== 'livre' && !numero)) {
      return null;
    }

    total = somar(total, nutrientesDaPorcao(alimento, Number(numero?.[1] ?? 0)));
  }

  return total;
}

function slotDaRefeicao(nome: string): Slot | null {
  const normal = normalizarTexto(nome);

  if (normal.includes('cafe')) return 'cafe';
  if (normal.includes('almoco')) return 'almoco';
  if (normal.includes('lanche')) return 'lanche';
  if (normal.includes('jantar')) return 'jantar';
  if (normal.includes('ceia')) return 'ceia';

  return null;
}

/** Primeiro modelo, a partir do sugerido, que gera alimentos diferentes dos atuais. */
function modeloDiferente(
  slot: Slot,
  inicio: number,
  atuais: Set<string>,
  restricoes: Restricoes,
): ModeloRefeicao {
  const modelos = MODELOS[slot];

  for (let k = 0; k < modelos.length; k++) {
    const modelo = modelos[(inicio + k) % modelos.length];
    const ids = montarPorcoes(modelo, restricoes).map((p) => p.alimento.id);
    const igual = ids.length === atuais.size && ids.every((id) => atuais.has(id));

    if (!igual) {
      return modelo;
    }
  }

  return modelos[inicio % modelos.length];
}

function trocarNoPlano(
  perfil: Perfil,
  necessidades: Necessidades,
  planoAtual: PlanoDieta,
  slot: SlotTrocavel,
  semente: number,
  restricoes: Restricoes,
): PlanoDieta | null {
  const posicao = planoAtual.refeicoes.findIndex((r) => slotDaRefeicao(r.nome) === slot);

  if (posicao < 0) {
    return null;
  }

  const antiga = planoAtual.refeicoes[posicao];
  const divisao = divisaoDoDia(necessidades.metaCalorias)[slot] ?? DIVISAO_4[slot];
  const proteinaAlvo = necessidades.macros.proteinaG * (divisao?.proteina ?? 0.25);
  const kcalAlvo = antiga.calorias > 0 ? antiga.calorias : necessidades.metaCalorias * 0.25;
  const ordem = slotsDoDia(necessidades.metaCalorias).indexOf(slot);
  const modelo = modeloDiferente(
    slot,
    indice(semente, Math.max(ordem, 0) + 1, MODELOS[slot].length),
    idsDaRefeicao(antiga),
    restricoes,
  );
  const nova = prepararRefeicao(slot, modelo, restricoes, kcalAlvo, proteinaAlvo);

  ajustarDia([nova], {
    kcal: kcalAlvo,
    proteina: proteinaAlvo,
    gordura: necessidades.macros.gorduraG * (kcalAlvo / necessidades.metaCalorias),
  });

  const refeicaoNova = paraPlano(nova, restricoes);
  const refeicoes = planoAtual.refeicoes.map((r, i) => (i === posicao ? refeicaoNova : r));

  // Macros: tira o que a refeição antiga tinha e soma a nova
  const novaNutr = nutrientes(nova.porcoes);
  const antigaNutr = nutrientesDaRefeicaoSalva(antiga) ?? {
    kcal: antiga.calorias,
    proteina: planoAtual.macros.proteinaG * (antiga.calorias / planoAtual.caloriasDia),
    carboidrato: planoAtual.macros.carboidratoG * (antiga.calorias / planoAtual.caloriasDia),
    gordura: planoAtual.macros.gorduraG * (antiga.calorias / planoAtual.caloriasDia),
  };
  const macros = {
    proteinaG: Math.max(
      0,
      Math.round(planoAtual.macros.proteinaG - antigaNutr.proteina + novaNutr.proteina),
    ),
    carboidratoG: Math.max(
      0,
      Math.round(planoAtual.macros.carboidratoG - antigaNutr.carboidrato + novaNutr.carboidrato),
    ),
    gorduraG: Math.max(
      0,
      Math.round(planoAtual.macros.gorduraG - antigaNutr.gordura + novaNutr.gordura),
    ),
  };
  const caloriasDia = refeicoes.reduce((total, r) => total + r.calorias, 0);
  const resumo = montarResumo(
    perfil,
    necessidades,
    {
      calorias: caloriasDia,
      proteina: macros.proteinaG,
      carboidrato: macros.carboidratoG,
      gordura: macros.gorduraG,
    },
    refeicoes.length,
    restricoes,
  );

  return { ...planoAtual, resumo, caloriasDia, macros, refeicoes };
}

/**
 * Monta um plano alimentar completo, no formato do plano da IA, a partir do
 * perfil. Retorna `null` se o perfil não tem sexo, atividade ou objetivo.
 */
export function montarDietaPorRegras(
  perfil: Perfil,
  opcoes: OpcoesDietaRegras = {},
): PlanoDieta | null {
  const necessidades = calcularNecessidades(perfil);

  if (!necessidades) {
    return null;
  }

  const semente = opcoes.semente ?? 0;
  const restricoes = lerRestricoes(perfil.restricoes);

  if (opcoes.trocarRefeicao && opcoes.planoAtual) {
    const trocado = trocarNoPlano(
      perfil,
      necessidades,
      opcoes.planoAtual,
      opcoes.trocarRefeicao,
      semente,
      restricoes,
    );

    if (trocado) {
      return trocado;
    }
  }

  const { metaCalorias } = necessidades;
  const proteinaMeta = necessidades.macros.proteinaG;
  const divisao = divisaoDoDia(metaCalorias);
  const slots = slotsDoDia(metaCalorias);

  const refeicoes = slots.map((slot, ordem) => {
    const modelos = MODELOS[slot];
    const sugerido = indice(semente, ordem, modelos.length);
    // Sem plano atual para comparar, "trocar" usa o modelo seguinte ao da semente
    const escolhido = opcoes.trocarRefeicao === slot ? (sugerido + 1) % modelos.length : sugerido;
    const parte = divisao[slot] ?? { kcal: 0.25, proteina: 0.25 };

    return prepararRefeicao(
      slot,
      modelos[escolhido],
      restricoes,
      metaCalorias * parte.kcal,
      proteinaMeta * parte.proteina,
    );
  });

  ajustarDia(refeicoes, {
    kcal: metaCalorias,
    proteina: proteinaMeta,
    gordura: necessidades.macros.gorduraG,
  });

  const refeicoesPlano = refeicoes.map((r) => paraPlano(r, restricoes));
  const total = nutrientes(refeicoes.flatMap((r) => r.porcoes));
  const caloriasDia = refeicoesPlano.reduce((soma, r) => soma + r.calorias, 0);
  const macros = {
    proteinaG: Math.round(total.proteina),
    carboidratoG: Math.round(total.carboidrato),
    gorduraG: Math.round(total.gordura),
  };

  return {
    resumo: montarResumo(
      perfil,
      necessidades,
      {
        calorias: caloriasDia,
        proteina: macros.proteinaG,
        carboidrato: macros.carboidratoG,
        gordura: macros.gorduraG,
      },
      refeicoesPlano.length,
      restricoes,
    ),
    caloriasDia,
    macros,
    refeicoes: refeicoesPlano,
    dicas: montarDicas(perfil, proteinaMeta, refeicoesPlano.length),
    aviso: montarAviso(perfil),
  };
}
