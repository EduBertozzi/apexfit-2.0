import {
  calcularNecessidades,
  NOME_NIVEL_ATIVIDADE,
  NOME_OBJETIVO,
  NOME_SEXO,
} from '@/features/nutricao/calculos';
import type { Perfil } from '@/features/perfil/types';
import { formatarNumero } from '@/shared/lib/numero';

import {
  linhasPreferencias,
  quantidadeDeRefeicoesEscolhida,
  type PreferenciasDieta,
} from './preferencias';

/**
 * Instruções fixas para a IA. Ficam separadas dos dados do usuário
 * (que mudam a cada pedido) para o servidor poder usar cache de prompt.
 */
export const SISTEMA_DIETA = [
  'Você é o assistente nutricional do ApexFit, um app brasileiro de treino e saúde.',
  'Monte um plano alimentar de um dia, prático, com comida comum no Brasil e fácil de achar em mercado.',
  'Use exatamente as metas de calorias e macros informadas: elas já foram calculadas pelo app.',
  'A soma das calorias das refeições deve ficar a no máximo 5% da meta.',
  'Dê as quantidades em gramas e em medida caseira (colher, xícara, unidade, fatia).',
  'Respeite todas as restrições de saúde e alimentares. Se alguma restrição pedir acompanhamento médico, diga isso no resumo.',
  'Escreva em português do Brasil, frases curtas e diretas, tratando o usuário por "você".',
  'Texto puro: nada de markdown, negrito, asteriscos, títulos com # ou listas com hífen dentro dos campos.',
  'Nome do alimento curto (ex: "Arroz branco"); a quantidade vai só no campo quantidade, começando pelos gramas: "150 g, 3 colheres de sopa".',
  'Nunca use emoji. Nunca use travessão; use vírgula, ponto ou dois-pontos.',
  'Não recomende suplementos, remédios ou jejum prolongado.',
  'O resumo explica a estratégia do plano usando as metas (não repita o aviso no resumo).',
  'O aviso final deve lembrar que o plano é uma sugestão e que um nutricionista ou médico deve ser consultado.',
].join('\n');

/** Como dividir as calorias do dia entre as refeições. Mais calorias, mais refeições. */
export function distribuirRefeicoes(
  metaCalorias: number,
  escolhida?: 3 | 4 | 5,
): { nome: string; horario: string; kcal: number }[] {
  const quantidade = escolhida ?? (metaCalorias > 2600 ? 5 : 4);
  const divisao =
    quantidade === 3
      ? [
          ['Café da manhã', '07:00', 0.3],
          ['Almoço', '12:00', 0.4],
          ['Jantar', '20:00', 0.3],
        ]
      : quantidade === 5
        ? [
            ['Café da manhã', '07:00', 0.2],
            ['Almoço', '12:00', 0.3],
            ['Lanche da tarde', '16:00', 0.15],
            ['Jantar', '20:00', 0.25],
            ['Ceia', '22:00', 0.1],
          ]
        : [
            ['Café da manhã', '07:00', 0.25],
            ['Almoço', '12:00', 0.35],
            ['Lanche da tarde', '16:00', 0.15],
            ['Jantar', '20:00', 0.25],
          ];

  return divisao.map(([nome, horario, fracao]) => ({
    nome: nome as string,
    horario: horario as string,
    kcal: Math.round((metaCalorias * (fracao as number)) / 10) * 10,
  }));
}

const NOMES_DIAS = ['domingo', 'segunda', 'terça', 'quarta', 'quinta', 'sexta', 'sábado'];

export type OpcoesPromptDieta = {
  /** Plano só deste dia (0 = domingo). Sem o campo, vale para a semana toda. */
  dia?: number;
  /** Treino marcado para o dia. */
  treinoDoDia?: string;
  /** Opções escolhidas na central de IA (refeições, estilo, observações...). */
  preferencias?: PreferenciasDieta;
  /** Plano dos dias de treino ou dos dias de descanso. */
  tipoDia?: 'treino' | 'descanso';
};

const LINHA_TIPO_DIA = {
  treino:
    'Este é o plano dos meus dias de treino: concentre mais carboidrato nas refeições antes e depois do treino.',
  descanso:
    'Este é o plano dos meus dias de descanso: mantenha a proteína, tire carboidrato de perto do treino e use mais verduras e legumes. Use refeições diferentes das de um dia de treino.',
} as const;

/** Dados do usuário + metas calculadas. Vai como mensagem do usuário. */
export function montarPromptDieta(perfil: Perfil, opcoes: OpcoesPromptDieta = {}): string {
  const naoInformado = 'não informado';
  const necessidades = calcularNecessidades(perfil);

  const gordura =
    perfil.percentualGordura === undefined
      ? naoInformado
      : `${formatarNumero(perfil.percentualGordura, 1)}%`;

  const nomeDia = opcoes.dia === undefined ? undefined : NOMES_DIAS[opcoes.dia];

  const linhas = [
    nomeDia
      ? `Monte meu plano alimentar de ${nomeDia} com base nestes dados. Ele vale só para esse dia da semana.`
      : opcoes.tipoDia
        ? LINHA_TIPO_DIA[opcoes.tipoDia]
        : 'Monte meu plano alimentar com base nestes dados. Ele vale para todos os dias da semana.',
    nomeDia && opcoes.treinoDoDia
      ? `Neste dia eu treino: ${opcoes.treinoDoDia}. Pense nas refeições antes e depois do treino.`
      : nomeDia
        ? 'Neste dia não tenho treino marcado.'
        : null,
    perfil.idade < 18
      ? 'Atenção: o usuário é menor de idade. Nada de déficit agressivo nem suplementos.'
      : null,
    '',
    `Idade: ${perfil.idade} anos`,
    perfil.sexo ? `Sexo: ${NOME_SEXO[perfil.sexo]}` : null,
    `Peso: ${formatarNumero(perfil.pesoKg, 1)} kg`,
    `Altura: ${formatarNumero(perfil.alturaCm, 0)} cm`,
    `Gordura corporal: ${gordura}`,
    perfil.nivelAtividade
      ? `Nível de atividade: ${NOME_NIVEL_ATIVIDADE[perfil.nivelAtividade]}`
      : null,
    perfil.objetivo ? `Objetivo: ${NOME_OBJETIVO[perfil.objetivo]}` : null,
    `Restrições/Saúde: ${perfil.restricoes ?? naoInformado}`,
  ];

  const preferencias = opcoes.preferencias ? linhasPreferencias(opcoes.preferencias) : [];

  if (preferencias.length > 0) {
    linhas.push('', 'Preferências do usuário (siga todas):', ...preferencias);
  }

  if (necessidades) {
    const { metaCalorias, macros } = necessidades;

    linhas.push(
      '',
      'Metas do dia (calculadas pelo app):',
      `Calorias: ${formatarNumero(metaCalorias)} kcal`,
      `Proteína: ${macros.proteinaG} g`,
      `Carboidrato: ${macros.carboidratoG} g`,
      `Gordura: ${macros.gorduraG} g`,
      '',
      'Divisão das refeições (siga estes horários e calorias):',
      ...distribuirRefeicoes(
        metaCalorias,
        opcoes.preferencias ? quantidadeDeRefeicoesEscolhida(opcoes.preferencias) : undefined,
      ).map(
        (refeicao) => `${refeicao.horario} ${refeicao.nome}: ${formatarNumero(refeicao.kcal)} kcal`,
      ),
    );
  }

  return linhas.filter((linha) => linha !== null).join('\n');
}
