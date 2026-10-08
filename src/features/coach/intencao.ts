import type { PlanoDieta } from '@/features/dieta/contrato';
import type { SlotRefeicao } from '@/features/dieta/mesclar';
import type { RespostaTreinosIa } from '@/features/treinos/contratoIa';
import { diasDoTexto, textoDosDias } from '@/features/treinos/diasIa';
import { formatarNumero } from '@/shared/lib/numero';
import { minusculaInicial } from '@/shared/lib/texto';

/**
 * A mensagem pede para criar ou mudar a dieta?
 * Usado com a IA local: modelos pequenos nem sempre chamam a ferramenta sozinhos,
 * então o servidor reconhece o pedido e monta o plano direto.
 */

function normalizar(texto: string): string {
  return texto.toLowerCase().normalize('NFD').replace(/[̀-ͯ]/g, '');
}

const ASSUNTO_DIETA =
  /\b(dieta|cardapio|plano alimentar|refeic(ao|oes)|cafe da manha|cafe|almoco|lanche|jantar|ceia)\b/;
const ACAO =
  /\b(mont\w*|cri\w*|fa(z|ca|zer)|gera\w*|refa\w*|nova|novo|outr[ao]|troc\w*|troqu\w*|mud\w*|substitu\w*|tir\w*|sem|tira|coloca\w*|adicion\w*|ajust\w*|aument\w*|diminu\w*)\b/;
/** Perguntas sobre a dieta, sem pedir mudança ("o que como antes do treino?"). */
const SO_PERGUNTA =
  /^(o que|qual|quais|quanto|quantas?|como|por ?que|posso|pode|e se|tem problema)\b/;

export function pedeMudancaDeDieta(mensagem: string): boolean {
  const texto = normalizar(mensagem).trim();

  if (!ASSUNTO_DIETA.test(texto) || !ACAO.test(texto)) {
    return false;
  }

  // "posso trocar arroz por batata?" é dúvida; "troca o arroz por batata" é pedido
  return (
    !SO_PERGUNTA.test(texto) ||
    /\b(pode|podes|consegue) (montar|criar|fazer|trocar|mudar|refazer)\b/.test(texto)
  );
}

const ASSUNTO_TREINO = /\b(treinos?|ficha|divisao|exercicios?|musculacao|academia|treino [a-f])\b/;

/** Nomes de exercício comuns: "troca o leg press por agachamento" é pedido de treino. */
const EXERCICIO =
  /\b(supino|agachamentos?|leg ?press|remadas?|puxadas?|pulldown|roscas?|triceps|biceps|flexao|flexoes|abdominais?|prancha|esteira|bike|bicicleta|corrida|eliptico|elevacao (lateral|frontal|pelvica)|desenvolvimento|stiff|afundos?|cadeira (extensora|flexora|abdutora|adutora)|mesa flexora|panturrilhas?|crucifixo|crossover|burpees?|polichinelos?|levantamento terra|hack|smith|graviton|mergulho|extensora|flexora|abdutora|adutora|gluteos?|cardio|hiit|escada|pular corda)\b/;

/** O texto cita um exercício conhecido ("supino", "leg press", "cardio")? */
export function citaExercicio(mensagem: string): boolean {
  return EXERCICIO.test(normalizar(mensagem));
}

/**
 * A mensagem pede para criar ou mudar os treinos? ("monta meu treino",
 * "refaz minha ficha para 4 dias", "troca o leg press por agachamento").
 * Pergunta sobre treino não conta.
 */
export function pedeMudancaDeTreino(mensagem: string): boolean {
  const texto = normalizar(mensagem).trim();

  if (
    !(ASSUNTO_TREINO.test(texto) || EXERCICIO.test(texto)) ||
    !ACAO.test(texto) ||
    ASSUNTO_DIETA.test(texto)
  ) {
    return false;
  }

  return (
    !SO_PERGUNTA.test(texto) ||
    /\b(pode|podes|consegue) (montar|criar|fazer|trocar|mudar|refazer)\b/.test(texto)
  );
}

/**
 * Dias da semana citados no pedido ("troca o supino da sexta" vira [5];
 * "muda o almoço de segunda e quarta" vira [1, 3]). "Segunda série" ou
 * "segunda opção" não é dia. Sem dia, lista vazia.
 */
export function diasCitados(mensagem: string): number[] {
  const texto = normalizar(mensagem).replace(
    /\bsegunda (serie|vez|opcao|refeicao|parte|semana|metade|feira do mes)\b/g,
    ' ',
  );

  return diasDoTexto(texto);
}

/**
 * Dias que delimitam um ajuste de treino ("troca o supino da sexta" vira [5]).
 * Se o pedido nomeia o treino ("treino A") ou muda o dia dele ("passa o
 * treino para sexta"), o dia não é filtro: vazio.
 */
export function diasDoAjusteDeTreino(mensagem: string): number[] {
  const texto = normalizar(mensagem);

  if (
    /\btreino [a-f]\b/.test(texto) ||
    /\b(pass\w*|move\w*|mud\w*|joga\w*) .*\bpara (o |a )?(dia )?(dom|seg|ter|qua|qui|sex|sab)/.test(
      texto,
    )
  ) {
    return [];
  }

  return diasCitados(mensagem);
}

/** Plano novo do zero ou só um ajuste no que já existe. */
export type ModoMudanca = 'novo' | 'ajuste';

const VERBO_NOVO = /\b(mont\w*|cri(a|e|ar)|refa\w*|ger(a|e|ar)|fa(z|ca|zer)|do zero)\b/;
const TREINO_NOVO =
  /\b(nov[oa]s?|outr[ao]s?) (treinos?|ficha|divisao)\b|\b(treinos?|ficha|divisao) nov[oa]s?\b|\b\d+ ?dias\b|\bdias por semana\b|\bem casa\b|\bdo zero\b/;
const ASSUNTO_PLANO = /\b(dieta|plano|cardapio)\b/;
const DIETA_NOVA =
  /\b(nov[oa]|outr[ao]) (dieta|plano|cardapio)\b|\b(dieta|plano|cardapio)( alimentar)? nov[oa]\b|\bdo zero\b/;
/**
 * Pedido que mexe no plano inteiro: "muda tudo", "a dieta toda", "adapta pra
 * delivery", "só peço no ifood". Sem uma refeição citada, vira plano novo.
 */
const DIETA_AMPLA =
  /\b(tudo|tod[ao]s?|inteir[ao]|complet[ao]|geral|adapt\w*|delivery|ifood|restaurantes?|marmitas?|pedir comida|peco comida)\b/;

/**
 * Treino novo ("monta meu treino", "refaz minha ficha", "novo treino", "4 dias")
 * ou ajuste ("troca o leg press por agachamento", "tira a prancha do treino A")?
 * Sem treinos salvos, é sempre novo.
 */
export function modoDoTreino(mensagem: string, temTreinos: boolean): ModoMudanca {
  const texto = normalizar(mensagem);

  if (!temTreinos || TREINO_NOVO.test(texto)) {
    return 'novo';
  }

  const especifico = EXERCICIO.test(texto) || /\btreino [a-f]\b/.test(texto);

  return VERBO_NOVO.test(texto) && !especifico ? 'novo' : 'ajuste';
}

/**
 * Refeições citadas no pedido: "troca o café da manhã e o jantar" vira
 * ["cafe", "jantar"]. "Café" sozinho só conta se nenhuma outra refeição foi
 * citada ("tira o café do lanche" é sobre o lanche).
 */
export function refeicoesPedidas(mensagem: string): SlotRefeicao[] {
  const texto = normalizar(mensagem);
  const slots: SlotRefeicao[] = [];

  if (/\bcafe da manha\b/.test(texto)) slots.push('cafe');
  if (/\balmoco\b/.test(texto)) slots.push('almoco');
  if (/\blanches?\b/.test(texto)) slots.push('lanche');
  if (/\bjant(ar|a)\b/.test(texto)) slots.push('jantar');
  if (/\bceia\b/.test(texto)) slots.push('ceia');

  if (slots.length === 0 && /\bcafe\b/.test(texto)) {
    slots.push('cafe');
  }

  return slots;
}

/**
 * Dieta nova ("monta minha dieta", "quero um cardápio novo") ou ajuste
 * ("troca o café da manhã", "dieta sem lactose")? Sem plano salvo, é sempre nova.
 */
export function modoDaDieta(mensagem: string, temPlano: boolean): ModoMudanca {
  const texto = normalizar(mensagem);

  if (!temPlano) {
    return 'novo';
  }

  if (refeicoesPedidas(texto).length > 0) {
    return 'ajuste';
  }

  return DIETA_NOVA.test(texto) ||
    DIETA_AMPLA.test(texto) ||
    (VERBO_NOVO.test(texto) && ASSUNTO_PLANO.test(texto))
    ? 'novo'
    : 'ajuste';
}

/** Lê a meta de calorias do texto de contexto ("Meta de calorias: 2.830 kcal"). */
export function metaDoContexto(contexto: string): number | undefined {
  const achado = /Meta de calorias: ([\d.]+) kcal/.exec(contexto);

  return achado ? Number(achado[1].replace(/\./g, '')) : undefined;
}

const APLICAR = 'Confira a proposta aqui embaixo e toque em aplicar para salvar.';

/** Texto do coach com a proposta de dieta. `mudancas`: o que mudou num ajuste. */
export function confirmarPlano(plano: PlanoDieta, mudancas: readonly string[] = []): string {
  if (mudancas.length > 0) {
    return (
      `Proposta pronta, mudei só o que você pediu:\n${mudancas.map((linha) => `- ${linha}`).join('\n')}\n\n` +
      `O resto do plano fica igual, ${formatarNumero(plano.caloriasDia)} kcal no dia. ${APLICAR}`
    );
  }

  const refeicoes = plano.refeicoes
    .map((refeicao) => {
      const destaques = refeicao.itens
        .slice(0, 2)
        .map((item) => item.alimento.toLowerCase())
        .join(' e ');

      return `- ${refeicao.horario} ${refeicao.nome}: ${destaques}`;
    })
    .join('\n');

  return (
    `Montei uma proposta de ${formatarNumero(plano.caloriasDia)} kcal em ${plano.refeicoes.length} refeições:\n` +
    `${refeicoes}\n\n${APLICAR}`
  );
}

/**
 * Texto do coach com a proposta de treinos. `dias`: os dias de cada treino
 * (mesma ordem). `mudancas`: o que mudou num ajuste.
 */
export function confirmarTreinos(
  resultado: RespostaTreinosIa,
  opcoes: { dias?: readonly (readonly number[])[]; mudancas?: readonly string[] } = {},
): string {
  const { dias = [], mudancas } = opcoes;

  if (mudancas) {
    return mudancas.length > 0
      ? `Proposta pronta, mudei só o que você pediu:\n${mudancas.map((linha) => `- ${linha}`).join('\n')}\n\n` +
          `O resto dos treinos fica igual. ${APLICAR}`
      : 'Não achei o que mudar nos seus treinos com esse pedido. Me diz qual exercício ou treino você quer trocar?';
  }

  const lista = resultado.treinos
    .map((treino, indice) => {
      const quantidade = treino.exercicios.length;
      const quando =
        dias[indice] && dias[indice].length > 0 ? `, ${textoDosDias(dias[indice])}` : '';

      return `- ${minusculaInicial(treino.nome)}: ${minusculaInicial(treino.foco)} (${quantidade} ${quantidade === 1 ? 'exercício' : 'exercícios'})${quando}`;
    })
    .join('\n');

  return (
    `Montei ${resultado.treinos.length} ${resultado.treinos.length === 1 ? 'treino' : 'treinos'}:\n` +
    `${lista}\n\n${APLICAR}`
  );
}
