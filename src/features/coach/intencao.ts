import type { PlanoDieta } from '@/features/dieta/contrato';
import type { RespostaTreinosIa } from '@/features/treinos/contratoIa';
import { formatarNumero } from '@/shared/lib/numero';

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
  /\b(mont\w*|cri\w*|fa(z|ca|zer)|gera\w*|refa\w*|nova|novo|outr[ao]|troc\w*|mud\w*|substitu\w*|tir\w*|sem|tira|coloca\w*|adicion\w*|ajust\w*|aument\w*|diminu\w*)\b/;
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

/**
 * A mensagem pede para criar ou mudar os treinos? ("monta meu treino",
 * "refaz minha ficha para 4 dias"). Pergunta sobre treino não conta.
 */
export function pedeMudancaDeTreino(mensagem: string): boolean {
  const texto = normalizar(mensagem).trim();

  if (!ASSUNTO_TREINO.test(texto) || !ACAO.test(texto) || ASSUNTO_DIETA.test(texto)) {
    return false;
  }

  return (
    !SO_PERGUNTA.test(texto) ||
    /\b(pode|podes|consegue) (montar|criar|fazer|trocar|mudar|refazer)\b/.test(texto)
  );
}

/** Lê a meta de calorias do texto de contexto ("Meta de calorias: 2.830 kcal"). */
export function metaDoContexto(contexto: string): number | undefined {
  const achado = /Meta de calorias: ([\d.]+) kcal/.exec(contexto);

  return achado ? Number(achado[1].replace(/\./g, '')) : undefined;
}

/** Texto do coach depois de salvar um plano (modo IA local). */
export function confirmarPlano(plano: PlanoDieta): string {
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
    `Pronto! Salvei um plano de ${formatarNumero(plano.caloriasDia)} kcal em ${plano.refeicoes.length} refeições:\n` +
    `${refeicoes}\n\nToque em "Dieta atualizada" para ver as quantidades. Quer trocar alguma refeição?`
  );
}

/** Texto do coach depois de salvar treinos novos. */
export function confirmarTreinos(resultado: RespostaTreinosIa): string {
  const lista = resultado.treinos
    .map((treino) => {
      const quantidade = treino.exercicios.length;

      return `- ${treino.nome}: ${treino.foco} (${quantidade} ${quantidade === 1 ? 'exercício' : 'exercícios'})`;
    })
    .join('\n');

  return (
    `Pronto! Montei ${resultado.treinos.length} ${resultado.treinos.length === 1 ? 'treino' : 'treinos'}:\n` +
    `${lista}\n\nJá estão na tela inicial, separados por grupo muscular. Quer trocar algum exercício?`
  );
}
