import type { PlanoDieta } from '@/features/dieta/contrato';
import { slotDaRefeicao } from '@/features/dieta/mesclar';
import { nomeDoDiaSemana, ORDEM_DIAS, type DietaPorDia } from '@/features/dieta/semana';
import {
  NOME_NIVEL_ATIVIDADE,
  NOME_OBJETIVO,
  NOME_SEXO,
  type Necessidades,
} from '@/features/nutricao/calculos';
import { calcularImc } from '@/features/perfil/calculos';
import type { Perfil } from '@/features/perfil/types';
import { formatarNumero } from '@/shared/lib/numero';

import { LIMITES_COACH } from './contrato';

export type DadosContexto = {
  perfil: Perfil;
  necessidades: Necessidades | null;
  agua: { hojeMl: number; metaMl: number; diasBatidosNaSemana: number; sequencia: number };
  /** Plano da semana: vale em todo dia sem plano próprio. */
  plano: PlanoDieta | null;
  /** Dias com plano próprio ("dieta de sexta"), 0 = domingo. */
  porDia?: DietaPorDia;
  /** Data por extenso, ex: "Sábado, 3 de outubro". */
  hoje: string;
  /** Blocos extras de outras features (treinos, peso...), já em texto. */
  extras?: string[];
};

type Refeicao = PlanoDieta['refeicoes'][number];

function linhaRefeicao(refeicao: Refeicao): string {
  const itens = refeicao.itens.map((item) => `${item.alimento} (${item.quantidade})`).join('; ');

  return `${refeicao.horario} ${refeicao.nome}, ${refeicao.calorias} kcal: ${itens}`;
}

function linhasPlano(plano: PlanoDieta): string[] {
  return [
    `Calorias do plano: ${formatarNumero(plano.caloriasDia)} kcal (P ${plano.macros.proteinaG} g, C ${plano.macros.carboidratoG} g, G ${plano.macros.gorduraG} g)`,
    ...plano.refeicoes.map(linhaRefeicao),
  ];
}

function chaveRefeicao(refeicao: Refeicao): string {
  return slotDaRefeicao(refeicao.nome) ?? refeicao.nome.toLowerCase();
}

/**
 * Dias com plano próprio, compactos: só as refeições que mudam em relação ao
 * plano da semana (o resto do dia é igual e não precisa ir de novo).
 */
export function linhasDietaPorDia(plano: PlanoDieta | null, porDia: DietaPorDia = {}): string[] {
  const linhas: string[] = [];

  for (const dia of ORDEM_DIAS) {
    const doDia = porDia[dia];

    if (!doDia) {
      continue;
    }

    const diferentes = doDia.refeicoes.filter((refeicao) => {
      const igual = plano?.refeicoes.find(
        (item) => chaveRefeicao(item) === chaveRefeicao(refeicao),
      );

      return !igual || JSON.stringify(igual) !== JSON.stringify(refeicao);
    });
    const removidas = (plano?.refeicoes ?? []).filter(
      (refeicao) =>
        !doDia.refeicoes.some((item) => chaveRefeicao(item) === chaveRefeicao(refeicao)),
    );

    linhas.push(
      `${nomeDoDiaSemana(dia)} (${formatarNumero(doDia.caloriasDia)} kcal), diferente do plano da semana em:`,
      ...diferentes.map((refeicao) => `- ${linhaRefeicao(refeicao)}`),
      ...removidas.map((refeicao) => `- sem ${refeicao.nome}`),
    );
  }

  return linhas;
}

/**
 * Resumo do que o app sabe sobre a pessoa, para o coach responder com base
 * em dados reais. Texto simples e curto: vai em todo pedido.
 */
export function montarContextoCoach(dados: DadosContexto): string {
  const { perfil, necessidades, agua, plano } = dados;

  const linhas = [
    `Hoje: ${dados.hoje}`,
    '',
    '## Perfil',
    `Nome: ${perfil.nome}`,
    `Idade: ${perfil.idade} anos${perfil.idade < 18 ? ' (MENOR DE IDADE)' : ''}`,
    perfil.sexo ? `Sexo: ${NOME_SEXO[perfil.sexo]}` : 'Sexo: não informado',
    `Altura: ${formatarNumero(perfil.alturaCm)} cm`,
    `Peso: ${formatarNumero(perfil.pesoKg, 1)} kg`,
    `IMC: ${formatarNumero(calcularImc(perfil.pesoKg, perfil.alturaCm), 1)}`,
    perfil.percentualGordura !== undefined
      ? `Gordura corporal: ${formatarNumero(perfil.percentualGordura, 1)}%`
      : null,
    perfil.nivelAtividade
      ? `Atividade: ${NOME_NIVEL_ATIVIDADE[perfil.nivelAtividade]}`
      : 'Atividade: não informada',
    perfil.objetivo ? `Objetivo: ${NOME_OBJETIVO[perfil.objetivo]}` : 'Objetivo: não informado',
    `Saúde e restrições: ${perfil.restricoes ?? 'nenhuma informada'}`,
    '',
    '## Metas calculadas pelo app',
    necessidades
      ? [
          `Metabolismo basal: ${formatarNumero(necessidades.tmb)} kcal`,
          `Gasto diário: ${formatarNumero(necessidades.gastoDiario)} kcal`,
          `Meta de calorias: ${formatarNumero(necessidades.metaCalorias)} kcal`,
          `Proteína ${necessidades.macros.proteinaG} g, carboidrato ${necessidades.macros.carboidratoG} g, gordura ${necessidades.macros.gorduraG} g`,
        ].join('\n')
      : 'Sem metas: o perfil ainda não tem sexo, atividade ou objetivo. Sugira completar em Perfil.',
    '',
    '## Água',
    `Hoje: ${formatarNumero(agua.hojeMl)} de ${formatarNumero(agua.metaMl)} ml`,
    `Meta batida em ${agua.diasBatidosNaSemana} dos últimos 7 dias; sequência atual de ${agua.sequencia} dias`,
    '',
    '## Dieta atual (plano da semana, vale em todos os dias sem plano próprio)',
    ...(plano ? linhasPlano(plano) : ['Nenhum plano salvo ainda.']),
    ...(dados.extras ?? []).flatMap((bloco) => ['', bloco]),
    // Por último: se o texto passar do limite, o corte pega só os dias (que vão também em JSON)
    ...(dados.porDia && Object.keys(dados.porDia).length > 0
      ? ['', '## Dieta por dia (dias com plano próprio)', ...linhasDietaPorDia(plano, dados.porDia)]
      : []),
  ];

  const texto = linhas.filter((linha) => linha !== null).join('\n');

  return texto.length > LIMITES_COACH.contexto
    ? `${texto.slice(0, LIMITES_COACH.contexto - 20)}\n[contexto cortado]`
    : texto;
}
