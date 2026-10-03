import type { PlanoDieta } from '@/features/dieta/contrato';
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
  plano: PlanoDieta | null;
  /** Data por extenso, ex: "Sábado, 3 de outubro". */
  hoje: string;
  /** Blocos extras de outras features (treinos, peso...), já em texto. */
  extras?: string[];
};

function linhasPlano(plano: PlanoDieta): string[] {
  const linhas = [
    `Calorias do plano: ${formatarNumero(plano.caloriasDia)} kcal (P ${plano.macros.proteinaG} g, C ${plano.macros.carboidratoG} g, G ${plano.macros.gorduraG} g)`,
  ];

  for (const refeicao of plano.refeicoes) {
    const itens = refeicao.itens.map((item) => `${item.alimento} (${item.quantidade})`).join('; ');
    linhas.push(`${refeicao.horario} ${refeicao.nome}, ${refeicao.calorias} kcal: ${itens}`);
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
    '## Dieta atual',
    ...(plano ? linhasPlano(plano) : ['Nenhum plano salvo ainda.']),
    ...(dados.extras ?? []).flatMap((bloco) => ['', bloco]),
  ];

  const texto = linhas.filter((linha) => linha !== null).join('\n');

  return texto.length > LIMITES_COACH.contexto
    ? `${texto.slice(0, LIMITES_COACH.contexto - 20)}\n[contexto cortado]`
    : texto;
}
