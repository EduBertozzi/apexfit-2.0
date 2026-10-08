import { NOME_SLOT } from '@/features/dieta/cardapios';
import { mesclarPlano, resumoMudancasDieta } from '@/features/dieta/mesclar';
import { distribuirRefeicoes } from '@/features/dieta/prompt';
import { gerarPlanoComIa } from '@/features/dieta/servidor/gerarDietaLocal';
import { diasDoTexto, distribuirDias, textoDosDias } from '@/features/treinos/diasIa';
import { inferirGrupo } from '@/features/treinos/grupos';
import { paraDadosTreino } from '@/features/treinos/ia';
import {
  mesclarTreinos,
  restringirAosDias,
  resumoMudancas,
  treinosNosDias,
} from '@/features/treinos/mesclar';
import { nomeDoDiaSemana, treinoNoDia } from '@/features/dieta/semana';
import { gerarTreinos } from '@/features/treinos/servidor/gerarTreinos';
import type { ProvedorJson } from '@/shared/servidor/json';

import { alvoDaDieta, comPrefixoDias } from '../alvos';
import type { EventoCoach, PedidoCoach, TreinoAtual } from '../contrato';
import {
  confirmarPlano,
  confirmarTreinos,
  diasDoAjusteDeTreino,
  metaDoContexto,
  modoDoTreino,
  pedeMudancaDeDieta,
  pedeMudancaDeTreino,
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
    exemplo:
      'Ex: "trocar o café da manhã por algo sem ovo" ou "trocar o almoço de quarta". Cite o dia da semana se a pessoa citou.',
  },
  atualizar_treinos: {
    descricao:
      'Monta uma divisão de treinos NOVA (outra divisão, outro número de dias, treino em casa). Use só quando a pessoa pedir treinos novos.',
    exemplo: 'Ex: "treino em casa, 3 dias, 45 minutos".',
  },
  ajustar_treino: {
    descricao:
      'Muda só uma parte dos treinos salvos (trocar, tirar ou incluir um exercício, mudar séries de um treino). O resto fica igual. Use para pedidos pequenos.',
    exemplo:
      'Ex: "trocar o leg press do treino A por agachamento livre" ou "trocar o supino da sexta por supino inclinado". Cite o dia da semana se a pessoa citou.',
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
  // "muda o almoço de quarta": o alvo é o plano de quarta (os outros dias ficam)
  const { modo, alvos, dias, atual } = alvoDaDieta(pedido, pedidoDieta, ultimaMensagem(pedido));
  const nomeDias = textoDosDias(dias);

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
      `${pedido.contexto}\n\nDieta atual${dias.length > 0 ? ` de ${nomeDias}` : ''} (JSON):\n${JSON.stringify(atual)}\n\n` +
      `Pedido do usuário para a dieta: ${pedidoDieta}\n` +
      (alvos.length > 0
        ? `Mude SOMENTE estas refeições: ${nomes}. Copie todas as outras exatamente iguais, com os mesmos alimentos, quantidades, horários e calorias. A refeição nova deve ter calorias parecidas com a antiga.`
        : 'Mude só o que foi pedido e copie todo o resto exatamente igual.') +
      ' Reaproveite os alimentos que já estão no plano sempre que der. Devolva o plano completo.';
  } else {
    const divisao = meta
      ? '\nDivisão das refeições (siga estes horários e calorias):\n' +
        distribuirRefeicoes(meta)
          .map((refeicao) => `${refeicao.horario} ${refeicao.nome}: ${refeicao.kcal} kcal`)
          .join('\n')
      : '';
    const treinoDoDia =
      dias.length === 1 ? treinoNoDia(pedido.treinosAtuais ?? [], dias[0]) : undefined;
    const doDia =
      dias.length > 0
        ? `\nEste plano vale só para ${nomeDias}.` +
          (treinoDoDia ? ` Neste dia a pessoa treina: ${treinoDoDia}.` : '')
        : '';

    instrucoes = `${pedido.contexto}\n${divisao}${doDia}\n\nPedido do usuário para a dieta: ${pedidoDieta}`;
  }

  const gerado = await gerarPlanoComIa(provedor, instrucoes, meta);
  const plano = modo === 'ajuste' ? mesclarPlano(atual, gerado, alvos) : gerado;
  const mudancas =
    modo === 'ajuste'
      ? comPrefixoDias(resumoMudancasDieta(atual, plano), dias)
      : dias.length > 0
        ? [`${nomeDias}: plano novo só para ${dias.length === 1 ? 'esse dia' : 'esses dias'}`]
        : [];

  if (modo === 'ajuste' && mudancas.length === 0) {
    yield {
      tipo: 'texto',
      texto:
        'Não achei o que mudar no plano com esse pedido. Me diz qual refeição ou alimento você quer trocar?',
    };
    return;
  }

  yield {
    tipo: 'dieta',
    plano,
    modo,
    ...(alvos.length > 0 ? { refeicoes: alvos } : {}),
    ...(dias.length > 0 ? { dias } : {}),
  };
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
    // Só para a IA saber o dia de cada treino; ela não devolve este campo
    ...(treino.dias && treino.dias.length > 0 ? { dias: textoDosDias(treino.dias) } : {}),
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

  // "troca o supino da sexta": só o treino de sexta pode mudar
  // Aqui já é um ajuste: o dia citado é sempre o alvo
  const diasAlvo = [
    ...new Set([
      ...diasDoAjusteDeTreino(pedidoTreinos),
      ...diasDoAjusteDeTreino(ultimaMensagem(pedido)),
    ]),
  ].sort((a, b) => a - b);
  const doDia = treinosNosDias(atuais, diasAlvo);

  if (diasAlvo.length > 0 && doDia.length === 0) {
    yield {
      tipo: 'texto',
      texto:
        `${separador(textoAntes)}Você não tem treino marcado ${diasAlvo.length === 1 ? (diasAlvo[0] === 0 || diasAlvo[0] === 6 ? 'no' : 'na') : 'em'} ${textoDosDias(diasAlvo)}. ` +
        'Me diz de qual treino é o exercício, ou marque os dias na aba Treinos.',
    };
    return;
  }

  yield {
    tipo: 'texto',
    texto: `${separador(textoAntes)}Bora! Mudando só o que você pediu. Leva uns 20 segundos.\n\n`,
  };

  const soDoDia =
    doDia.length > 0
      ? `Mude SOMENTE ${doDia.map((treino) => `o ${treino.nome}`).join(' e ')} (o treino de ${diasAlvo.map(nomeDoDiaSemana).join(' e ')}). Copie todos os outros treinos exatamente iguais.\n`
      : '';

  const resultado = await gerarTreinos(
    provedor,
    `${pedido.contexto}\n\nTreinos atuais (JSON):\n${JSON.stringify({ treinos: paraIa(atuais) })}\n\n` +
      `Pedido do usuário: ${pedidoTreinos}\n${soDoDia}` +
      'Devolva todos os treinos, mudando só o que foi pedido. Mantenha os nomes dos exercícios que não mudam exatamente iguais.',
    'ajuste',
  );

  // Ids só para comparar: o app junta de novo com os ids reais
  let contador = 0;
  const mesclados = restringirAosDias(
    atuais,
    mesclarTreinos(atuais, paraDadosTreino(resultado), () => {
      contador += 1;
      return `novo-${contador}`;
    }),
    diasAlvo,
  );
  const mudancas = resumoMudancas(atuais, mesclados, { diasAlvo });

  if (mudancas.length > 0) {
    yield {
      tipo: 'treinos',
      resultado,
      modo: 'ajuste',
      ...(diasAlvo.length > 0 ? { diasAlvo } : {}),
    };
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
