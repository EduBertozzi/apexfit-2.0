import { NOME_NIVEL_ATIVIDADE, NOME_OBJETIVO, NOME_SEXO } from '@/features/nutricao/calculos';
import type { Perfil } from '@/features/perfil/types';
import { formatarNumero } from '@/shared/lib/numero';

import type { MinutosTreino, PreferenciasTreino } from './contratoIa';

/**
 * Instruções fixas para a IA que monta os treinos. Ficam separadas dos dados
 * do usuário (que mudam a cada pedido) para o servidor poder usar cache.
 */
export const SISTEMA_TREINOS = [
  'Você é o treinador do ApexFit, um app brasileiro de treino e saúde.',
  'Monte uma divisão de treinos semanal: uma sessão por dia de treino, chamadas "Treino A", "Treino B", "Treino C" e assim por diante.',
  'Comece toda sessão com um bloco curto de aquecimento (grupo "aquecimento", 5 a 10 minutos) e termine com cardio (grupo "cardio") quando couber no tempo.',
  'Use nomes de exercícios como se fala em academia no Brasil (ex: Supino reto com barra, Puxada frontal, Leg press 45, Cadeira extensora).',
  'Em casa, use só peso do corpo, mochila com peso, garrafas de água, cadeira e sofá. Nada de máquinas nem barras.',
  'Séries e repetições realistas: 2 a 4 séries; força com 6 a 10 repetições, hipertrofia com 8 a 12, resistência e emagrecimento com 12 a 15.',
  'Em repeticoes, escreva só um número ou uma faixa, como "10" ou "8 a 12". Em exercícios por tempo (aquecimento ou cardio em aparelho, corrida, corda), use 1 série e escreva os minutos em repeticoes com a unidade, como "8 min".',
  'Respeite o tempo disponível: a quantidade de exercícios precisa caber na sessão.',
  'Respeite todas as restrições de saúde e lesões: troque exercícios que forçam a região e, se for o caso, diga no resumo para procurar um profissional.',
  'Se o usuário for menor de idade: nada de cargas altas, foco em técnica, repetições entre 12 e 15 e acompanhamento de um professor.',
  'Equilibre os grupos musculares na semana e não repita o mesmo grupo grande em dias seguidos.',
  'Não recomende suplementos, remédios nem hormônios.',
  'Escreva em português do Brasil, frases curtas, tratando o usuário por "você".',
  'Nunca use emoji. Nunca use travessão; use vírgula, ponto ou dois-pontos.',
].join('\n');

/** Quantos exercícios de força cabem numa sessão, além do aquecimento e do cardio. */
export function exerciciosPorTempo(minutos: MinutosTreino): number {
  return { 30: 3, 45: 4, 60: 5, 90: 7 }[minutos];
}

/** Dados do usuário + preferências. Vai como mensagem do usuário. */
export function montarPromptTreinos(perfil: Perfil, preferencias: PreferenciasTreino): string {
  const naoInformado = 'não informado';
  const forca = exerciciosPorTempo(preferencias.minutos);

  const linhas = [
    'Monte meus treinos com base nestes dados.',
    perfil.idade < 18
      ? 'Atenção: o usuário é menor de idade. Nada de cargas altas; foco em técnica.'
      : null,
    '',
    `Idade: ${perfil.idade} anos`,
    perfil.sexo ? `Sexo: ${NOME_SEXO[perfil.sexo]}` : null,
    `Peso: ${formatarNumero(perfil.pesoKg, 1)} kg`,
    `Altura: ${formatarNumero(perfil.alturaCm, 0)} cm`,
    perfil.nivelAtividade
      ? `Nível de atividade: ${NOME_NIVEL_ATIVIDADE[perfil.nivelAtividade]}`
      : null,
    perfil.objetivo ? `Objetivo: ${NOME_OBJETIVO[perfil.objetivo]}` : null,
    `Restrições/Saúde: ${perfil.restricoes ?? naoInformado}`,
    '',
    'Preferências:',
    `Dias de treino por semana: ${preferencias.diasPorSemana} (monte ${preferencias.diasPorSemana} treinos)`,
    `Local: ${preferencias.local === 'casa' ? 'em casa, sem aparelhos' : 'academia'}`,
    `Tempo por treino: ${preferencias.minutos} minutos (cerca de ${forca} exercícios de força, mais aquecimento e cardio)`,
    preferencias.foco ? `Pedido do usuário: ${preferencias.foco}` : null,
  ];

  return linhas.filter((linha) => linha !== null).join('\n');
}
