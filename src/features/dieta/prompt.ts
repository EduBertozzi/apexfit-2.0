import {
  calcularNecessidades,
  NOME_NIVEL_ATIVIDADE,
  NOME_OBJETIVO,
  NOME_SEXO,
} from '@/features/nutricao/calculos';
import type { Perfil } from '@/features/perfil/types';
import { formatarNumero } from '@/shared/lib/numero';

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
  'Nunca use emoji. Nunca use travessão; use vírgula, ponto ou dois-pontos.',
  'Não recomende suplementos, remédios ou jejum prolongado.',
  'O resumo explica a estratégia do plano usando as metas (não repita o aviso no resumo).',
  'O aviso final deve lembrar que o plano é uma sugestão e que um nutricionista ou médico deve ser consultado.',
].join('\n');

/** Como dividir as calorias do dia entre as refeições. Mais calorias, mais refeições. */
export function distribuirRefeicoes(
  metaCalorias: number,
): { nome: string; horario: string; kcal: number }[] {
  const divisao =
    metaCalorias > 2600
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

/** Dados do usuário + metas calculadas. Vai como mensagem do usuário. */
export function montarPromptDieta(perfil: Perfil): string {
  const naoInformado = 'não informado';
  const necessidades = calcularNecessidades(perfil);

  const gordura =
    perfil.percentualGordura === undefined
      ? naoInformado
      : `${formatarNumero(perfil.percentualGordura, 1)}%`;

  const linhas = [
    'Monte meu plano alimentar com base nestes dados.',
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
      ...distribuirRefeicoes(metaCalorias).map(
        (refeicao) => `${refeicao.horario} ${refeicao.nome}: ${formatarNumero(refeicao.kcal)} kcal`,
      ),
    );
  }

  return linhas.filter((linha) => linha !== null).join('\n');
}
