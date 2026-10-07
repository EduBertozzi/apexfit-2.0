import { distribuirRefeicoes } from '@/features/dieta/prompt';
import { gerarPlanoComIa } from '@/features/dieta/servidor/gerarDietaLocal';
import { gerarTreinos } from '@/features/treinos/servidor/gerarTreinos';
import type { ProvedorJson } from '@/shared/servidor/json';

import type { EventoCoach, PedidoCoach } from '../contrato';
import { confirmarPlano, confirmarTreinos, metaDoContexto } from '../intencao';

/**
 * Ações do coach com as IAs de HTTP simples (OpenAI e local). Roda SÓ no servidor.
 * A ferramenta recebe só o pedido em uma frase; aqui uma segunda chamada,
 * com o formato JSON travado, monta o resultado. A confirmação é montada
 * a partir do que foi salvo: rápida e nunca inventa alimento ou exercício.
 */

/** Ferramentas que o coach pode chamar (o argumento é sempre o pedido em uma frase). */
export const FERRAMENTAS_COACH = {
  atualizar_dieta: {
    descricao:
      'Cria ou muda o plano alimentar salvo no app. Use só quando a pessoa pedir para criar ou mudar a dieta.',
    exemplo: 'Ex: "trocar o café da manhã por algo sem ovo".',
  },
  atualizar_treinos: {
    descricao:
      'Cria ou refaz os treinos salvos no app (divisão, dias por semana, exercícios). Use só quando a pessoa pedir para criar ou mudar os treinos.',
    exemplo: 'Ex: "treino em casa, 3 dias, 45 minutos" ou "trocar supino por flexão".',
  },
} as const;

export type NomeFerramentaCoach = keyof typeof FERRAMENTAS_COACH;

export function ehFerramentaCoach(nome: string): nome is NomeFerramentaCoach {
  return nome in FERRAMENTAS_COACH;
}

/** Lê o pedido dos argumentos da ferramenta, com um padrão se vier vazio. */
export function pedidoDosArgumentos(argumentos: Record<string, unknown>, padrao: string): string {
  const pedido = argumentos.pedido;

  return typeof pedido === 'string' && pedido.trim() !== '' ? pedido.trim() : padrao;
}

function separador(textoAntes: string): string {
  return textoAntes === '' ? '' : '\n\n';
}

export async function* montarDietaEConfirmar(
  provedor: ProvedorJson,
  pedido: PedidoCoach,
  pedidoDieta: string,
  textoAntes: string,
): AsyncGenerator<EventoCoach> {
  yield {
    tipo: 'texto',
    texto: `${separador(textoAntes)}Bora! Montando seu plano com as suas metas. Leva uns 40 segundos.\n\n`,
  };

  const meta = metaDoContexto(pedido.contexto);
  const divisao = meta
    ? '\nDivisão das refeições (siga estes horários e calorias):\n' +
      distribuirRefeicoes(meta)
        .map((refeicao) => `${refeicao.horario} ${refeicao.nome}: ${refeicao.kcal} kcal`)
        .join('\n')
    : '';

  const plano = await gerarPlanoComIa(
    provedor,
    `${pedido.contexto}\n${divisao}\n\nPedido do usuário para a dieta: ${pedidoDieta}\n` +
      'Se já existe uma dieta atual, mantenha o que não foi pedido para mudar.',
    meta,
  );

  yield { tipo: 'dieta', plano };
  yield { tipo: 'texto', texto: confirmarPlano(plano) };
}

export async function* montarTreinosEConfirmar(
  provedor: ProvedorJson,
  pedido: PedidoCoach,
  pedidoTreinos: string,
  textoAntes: string,
): AsyncGenerator<EventoCoach> {
  yield {
    tipo: 'texto',
    texto: `${separador(textoAntes)}Bora! Montando seus treinos. Leva uns 30 segundos.\n\n`,
  };

  const resultado = await gerarTreinos(
    provedor,
    `${pedido.contexto}\n\nPedido do usuário para os treinos: ${pedidoTreinos}\n` +
      'Se o pedido não disser, use 3 dias por semana, 60 minutos e o local dos treinos atuais (academia se não houver). ' +
      'Se já existem treinos e a pessoa pediu só uma troca, mantenha o resto igual e devolva todos os treinos.',
  );

  yield { tipo: 'treinos', resultado };
  yield { tipo: 'texto', texto: confirmarTreinos(resultado) };
}
