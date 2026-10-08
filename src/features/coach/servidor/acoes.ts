import { NOME_SLOT } from '@/features/dieta/cardapios';
import { mesclarPlano, resumoMudancasDieta } from '@/features/dieta/mesclar';
import { distribuirRefeicoes } from '@/features/dieta/prompt';
import { gerarPlanoComIa } from '@/features/dieta/servidor/gerarDietaLocal';
import { diasDoTexto, distribuirDias, textoDosDias } from '@/features/treinos/diasIa';
import { inferirGrupo } from '@/features/treinos/grupos';
import { paraDadosTreino } from '@/features/treinos/ia';
import { mesclarTreinos, resumoMudancas } from '@/features/treinos/mesclar';
import { gerarTreinos } from '@/features/treinos/servidor/gerarTreinos';
import type { ProvedorJson } from '@/shared/servidor/json';

import type { EventoCoach, PedidoCoach, TreinoAtual } from '../contrato';
import {
  confirmarPlano,
  confirmarTreinos,
  metaDoContexto,
  modoDaDieta,
  modoDoTreino,
  pedeMudancaDeDieta,
  pedeMudancaDeTreino,
  refeicoesPedidas,
} from '../intencao';

/**
 * Ações do coach com as IAs de HTTP simples (OpenAI e local). Roda SÓ no servidor.
 * A ferramenta recebe só o pedido em uma frase; aqui uma segunda chamada,
 * com o formato JSON travado, monta o resultado. Nada é salvo aqui: o app
 * mostra uma proposta e a pessoa decide se aplica. Pedido pequeno muda só o
 * que foi pedido (o resto volta igual, ver `mesclarPlano` e `mesclarTreinos`).
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
      'Monta uma divisão de treinos NOVA (outra divisão, outro número de dias, treino em casa). Use só quando a pessoa pedir treinos novos.',
    exemplo: 'Ex: "treino em casa, 3 dias, 45 minutos".',
  },
  ajustar_treino: {
    descricao:
      'Muda só uma parte dos treinos salvos (trocar, tirar ou incluir um exercício, mudar séries de um treino). O resto fica igual. Use para pedidos pequenos.',
    exemplo: 'Ex: "trocar o leg press do treino A por agachamento livre".',
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

function ultimaMensagem(pedido: PedidoCoach): string {
  return pedido.mensagens[pedido.mensagens.length - 1].texto;
}

export async function* montarDietaEConfirmar(
  provedor: ProvedorJson,
  pedido: PedidoCoach,
  pedidoDieta: string,
  textoAntes: string,
): AsyncGenerator<EventoCoach> {
  const atual = pedido.planoAtual ?? null;
  const modo = modoDaDieta(pedidoDieta, atual !== null);
  const alvos = modo === 'ajuste' ? refeicoesPedidas(pedidoDieta) : [];

  yield {
    tipo: 'texto',
    texto:
      `${separador(textoAntes)}` +
      (modo === 'ajuste'
        ? 'Bora! Mudando só o que você pediu. Leva uns 30 segundos.\n\n'
        : 'Bora! Montando seu plano com as suas metas. Leva uns 40 segundos.\n\n'),
  };

  const meta = metaDoContexto(pedido.contexto);
  let instrucoes: string;

  if (modo === 'ajuste' && atual) {
    const nomes = alvos.map((slot) => NOME_SLOT[slot].toLowerCase()).join(', ');

    instrucoes =
      `${pedido.contexto}\n\nDieta atual (JSON):\n${JSON.stringify(atual)}\n\n` +
      `Pedido do usuário para a dieta: ${pedidoDieta}\n` +
      (alvos.length > 0
        ? `Mude SOMENTE estas refeições: ${nomes}. Copie todas as outras exatamente iguais, com os mesmos alimentos, quantidades, horários e calorias. A refeição nova deve ter calorias parecidas com a antiga.`
        : 'Mude só o que foi pedido e copie todo o resto exatamente igual.') +
      ' Devolva o plano completo.';
  } else {
    const divisao = meta
      ? '\nDivisão das refeições (siga estes horários e calorias):\n' +
        distribuirRefeicoes(meta)
          .map((refeicao) => `${refeicao.horario} ${refeicao.nome}: ${refeicao.kcal} kcal`)
          .join('\n')
      : '';

    instrucoes = `${pedido.contexto}\n${divisao}\n\nPedido do usuário para a dieta: ${pedidoDieta}`;
  }

  const gerado = await gerarPlanoComIa(provedor, instrucoes, meta);
  const plano = mesclarPlano(atual, gerado, alvos);
  const mudancas = modo === 'ajuste' ? resumoMudancasDieta(atual, plano) : [];

  if (modo === 'ajuste' && mudancas.length === 0) {
    yield {
      tipo: 'texto',
      texto:
        'Não achei o que mudar no plano com esse pedido. Me diz qual refeição ou alimento você quer trocar?',
    };
    return;
  }

  yield { tipo: 'dieta', plano, modo, ...(alvos.length > 0 ? { refeicoes: alvos } : {}) };
  yield { tipo: 'texto', texto: confirmarPlano(plano, mudancas) };
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

  const diasPedidos = diasDoTexto(`${ultimaMensagem(pedido)} ${pedidoTreinos}`);
  const resultado = await gerarTreinos(
    provedor,
    `${pedido.contexto}\n\nPedido do usuário para os treinos: ${pedidoTreinos}\n` +
      (diasPedidos.length > 0
        ? `Dias pedidos: ${textoDosDias(diasPedidos)}. Monte ${diasPedidos.length} treinos, a não ser que o pedido diga outro número.\n`
        : '') +
      'Se o pedido não disser, use 3 dias por semana, 60 minutos e o local dos treinos atuais (academia se não houver).',
  );

  yield {
    tipo: 'treinos',
    resultado,
    modo: 'novo',
    ...(diasPedidos.length > 0 ? { diasPedidos } : {}),
  };
  yield {
    tipo: 'texto',
    texto: confirmarTreinos(resultado, {
      dias: distribuirDias(resultado.treinos.length, diasPedidos),
    }),
  };
}

/** Treinos atuais sem ids, no formato que a IA devolve (menos texto para ela copiar). */
function paraIa(treinos: readonly TreinoAtual[]) {
  return treinos.map((treino) => ({
    nome: treino.nome,
    foco: treino.foco ?? '',
    exercicios: treino.exercicios.map((exercicio) => ({
      nome: exercicio.nome,
      grupo: exercicio.grupo ?? inferirGrupo(exercicio.nome),
      series: exercicio.series,
      repeticoes: exercicio.repeticoes,
      ...(exercicio.observacao ? { observacao: exercicio.observacao } : {}),
    })),
  }));
}

/** Pedido pequeno ("troca o leg press por agachamento"): edita os treinos atuais. */
export async function* ajustarTreinoEConfirmar(
  provedor: ProvedorJson,
  pedido: PedidoCoach,
  pedidoTreinos: string,
  textoAntes: string,
): AsyncGenerator<EventoCoach> {
  const atuais = pedido.treinosAtuais ?? [];

  if (atuais.length === 0) {
    yield* montarTreinosEConfirmar(provedor, pedido, pedidoTreinos, textoAntes);
    return;
  }

  yield {
    tipo: 'texto',
    texto: `${separador(textoAntes)}Bora! Mudando só o que você pediu. Leva uns 20 segundos.\n\n`,
  };

  const resultado = await gerarTreinos(
    provedor,
    `${pedido.contexto}\n\nTreinos atuais (JSON):\n${JSON.stringify({ treinos: paraIa(atuais) })}\n\n` +
      `Pedido do usuário: ${pedidoTreinos}\n` +
      'Devolva todos os treinos, mudando só o que foi pedido.',
    'ajuste',
  );

  // Ids só para comparar: o app junta de novo com os ids reais
  let contador = 0;
  const mesclados = mesclarTreinos(atuais, paraDadosTreino(resultado), () => {
    contador += 1;
    return `novo-${contador}`;
  });
  const mudancas = resumoMudancas(atuais, mesclados);

  if (mudancas.length > 0) {
    yield { tipo: 'treinos', resultado, modo: 'ajuste' };
  }

  yield { tipo: 'texto', texto: confirmarTreinos(resultado, { mudancas }) };
}

function temTreinos(pedido: PedidoCoach): boolean {
  return (pedido.treinosAtuais ?? []).length > 0;
}

/** Ferramenta pedida pelo coach: monta ou ajusta, conforme o pedido. */
export function executarFerramenta(
  provedor: ProvedorJson,
  pedido: PedidoCoach,
  nome: NomeFerramentaCoach,
  pedidoTexto: string,
  textoAntes: string,
): AsyncGenerator<EventoCoach> {
  if (nome === 'atualizar_dieta') {
    return montarDietaEConfirmar(provedor, pedido, pedidoTexto, textoAntes);
  }

  const ajuste =
    nome === 'ajustar_treino'
      ? temTreinos(pedido)
      : modoDoTreino(pedidoTexto, temTreinos(pedido)) === 'ajuste';

  return ajuste
    ? ajustarTreinoEConfirmar(provedor, pedido, pedidoTexto, textoAntes)
    : montarTreinosEConfirmar(provedor, pedido, pedidoTexto, textoAntes);
}

/**
 * Pedido claro na última mensagem: vai direto, sem depender do modelo chamar
 * a ferramenta. Sem pedido claro, `null`.
 */
export function acaoPorIntencao(
  provedor: ProvedorJson,
  pedido: PedidoCoach,
): AsyncGenerator<EventoCoach> | null {
  const ultima = ultimaMensagem(pedido);

  if (pedeMudancaDeDieta(ultima)) {
    return executarFerramenta(provedor, pedido, 'atualizar_dieta', ultima, '');
  }

  if (pedeMudancaDeTreino(ultima)) {
    return executarFerramenta(provedor, pedido, 'atualizar_treinos', ultima, '');
  }

  return null;
}
