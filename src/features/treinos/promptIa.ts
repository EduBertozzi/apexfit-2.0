import { NOME_NIVEL_ATIVIDADE, NOME_OBJETIVO, NOME_SEXO } from '@/features/nutricao/calculos';
import type { Perfil } from '@/features/perfil/types';
import { formatarNumero } from '@/shared/lib/numero';

import { textoDaMedida } from './aquecimento';
import type { EscolhasSemana, MinutosTreino, PreferenciasTreino } from './contratoIa';
import { NOME_EQUIPAMENTO, NOME_NIVEL, nomeTreinoDoDia, textoArea } from './montadorIa';

/**
 * Instruções fixas para a IA que monta os treinos. Ficam separadas dos dados
 * do usuário (que mudam a cada pedido) para o servidor poder usar cache.
 */
export const SISTEMA_TREINOS = [
  'Você é o treinador do ApexFit, um app brasileiro de treino e saúde.',
  'Monte uma divisão de treinos semanal: uma sessão por dia de treino, chamadas "Treino A", "Treino B", "Treino C" e assim por diante.',
  'Comece toda sessão com um bloco curto de aquecimento (grupo "aquecimento", 5 a 10 minutos no total) e termine com cardio (grupo "cardio") quando couber no tempo.',
  'O aquecimento pode ter mais de um exercício (ex: polichinelo, agachamento sem peso, mobilidade). Cada um é por repetições ("15") ou por tempo ("3 min"); bike e esteira são sempre por tempo.',
  'Use nomes de exercícios como se fala em academia no Brasil (ex: Supino reto com barra, Puxada frontal, Leg press 45, Cadeira extensora).',
  'Em casa, use só peso do corpo, mochila com peso, garrafas de água, cadeira e sofá. Nada de máquinas nem barras.',
  'Séries e repetições realistas: 2 a 4 séries; força com 6 a 10 repetições, hipertrofia com 8 a 12, resistência e emagrecimento com 12 a 15.',
  'Em repeticoes, escreva só um número ou uma faixa, como "10" ou "8 a 12". Em exercícios por tempo (cardio, corrida, corda, bike ou esteira no aquecimento), use 1 série e escreva os minutos em repeticoes com a unidade, como "8 min".',
  'Respeite o tempo disponível: a quantidade de exercícios precisa caber na sessão.',
  'Respeite todas as restrições de saúde e lesões: troque exercícios que forçam a região e, se for o caso, diga no resumo para procurar um profissional.',
  'Se o usuário for menor de idade: nada de cargas altas, foco em técnica, repetições entre 12 e 15 e acompanhamento de um professor.',
  'Equilibre os grupos musculares na semana e não repita o mesmo grupo grande em dias seguidos.',
  'Não recomende suplementos, remédios nem hormônios.',
  'Escreva em português do Brasil, frases curtas, tratando o usuário por "você".',
  'Nunca use emoji. Nunca use travessão; use vírgula, ponto ou dois-pontos.',
].join('\n');

/**
 * Para ajustar treinos que já existem ("troca o leg press por agachamento"):
 * vai junto com `SISTEMA_TREINOS`. A IA devolve uma cópia editada.
 */
export const SISTEMA_AJUSTE_TREINOS = [
  'Agora você vai AJUSTAR treinos que já existem, não montar outros.',
  'Devolva todos os treinos atuais, na mesma ordem e com os mesmos nomes.',
  'Mude SOMENTE o exercício ou o treino que a pessoa pediu. Todo o resto fica exatamente igual: mesmos exercícios, com o mesmo nome escrito do mesmo jeito, mesma ordem, séries, repetições e observações.',
  'Ao trocar um exercício, coloque o novo na mesma posição do antigo e, se a pessoa não disser, use um do mesmo grupo muscular.',
  'No resumo, diga em uma frase o que mudou.',
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

/**
 * Para o montador da semana (central de IA): vai junto com `SISTEMA_TREINOS`.
 * A pessoa já escolheu os dias e o que treinar em cada um.
 */
export const SISTEMA_SEMANA = [
  'Agora a pessoa já escolheu a semana: monte exatamente um treino para cada dia pedido, na mesma ordem.',
  'Dê a cada treino o nome indicado, como "treino de segunda", em letras minúsculas.',
  'Use somente as áreas pedidas para aquele dia. Se vierem regiões (ex: bíceps), foque nelas. Não acrescente outras áreas nem cardio que não foi pedido.',
  'Se o aquecimento estiver ligado, comece cada treino com os exercícios de aquecimento pedidos, exatamente com as repetições ou os minutos indicados. Se estiver desligado, não coloque aquecimento.',
  'Respeite o nível e o equipamento: com halteres, nada de máquinas, barras nem cabos; só com o peso do corpo, nada de pesos.',
  'Nunca use exercícios que a pessoa pediu para evitar nem exercícios que forcem a lesão citada.',
  'Iniciante: 4 exercícios de força por treino, 3 séries de 12. Intermediário: 5 exercícios, 3 séries de 10 a 12. Avançado: 6 exercícios, 4 séries de 8 a 12.',
].join('\n');

/** Dados do usuário + a semana montada. Vai como mensagem do usuário. */
export function montarPromptSemana(perfil: Perfil, escolhas: EscolhasSemana): string {
  const { aquecimento } = escolhas;

  const linhas = [
    'Monte meus treinos da semana com base nestes dados.',
    perfil.idade < 18
      ? 'Atenção: o usuário é menor de idade. Nada de cargas altas; foco em técnica.'
      : null,
    '',
    `Idade: ${perfil.idade} anos`,
    perfil.sexo ? `Sexo: ${NOME_SEXO[perfil.sexo]}` : null,
    `Peso: ${formatarNumero(perfil.pesoKg, 1)} kg`,
    `Altura: ${formatarNumero(perfil.alturaCm, 0)} cm`,
    perfil.objetivo ? `Objetivo: ${NOME_OBJETIVO[perfil.objetivo]}` : null,
    `Restrições/Saúde: ${perfil.restricoes ?? 'não informado'}`,
    '',
    `Nível: ${NOME_NIVEL[escolhas.nivel]}`,
    `Equipamento: ${NOME_EQUIPAMENTO[escolhas.equipamento]}`,
    escolhas.evitar.trim() ? `Evitar (lesões ou exercícios): ${escolhas.evitar.trim()}` : null,
    '',
    `Dias de treino (${escolhas.dias.length}, um treino por dia):`,
    ...escolhas.dias.map(
      (dia) =>
        `- ${nomeTreinoDoDia(dia.dia)}: ${dia.areas.map((area) => textoArea(area.area, area.regioes)).join('; ')}`,
    ),
    '',
    aquecimento.ativo && aquecimento.itens.length > 0
      ? `Aquecimento (ligado), nesta ordem: ${aquecimento.itens
          .map(
            (item) =>
              `${item.nome} ${item.medida === 'tempo' ? textoDaMedida('tempo', item.valor) : `${item.valor} repetições`}`,
          )
          .join('; ')}`
      : 'Aquecimento: desligado, não coloque aquecimento.',
    escolhas.livre.trim() ? `Pedido do usuário: ${escolhas.livre.trim()}` : null,
  ];

  return linhas.filter((linha) => linha !== null).join('\n');
}
