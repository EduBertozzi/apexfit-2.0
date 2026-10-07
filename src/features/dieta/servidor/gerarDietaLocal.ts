import { ErroServidor } from '@/shared/servidor/claude';
import { lerJson } from '@/shared/servidor/esquemaEstrito';
import { responderJson, type MensagemJson, type ProvedorJson } from '@/shared/servidor/json';

import { planoDietaSchema, type PlanoDieta } from '../contrato';
import { SISTEMA_DIETA } from '../prompt';

/**
 * Roda SÓ no servidor. Gera o plano com a IA de HTTP simples (OpenAI ou
 * Ollama), com o formato JSON travado pelo schema, e confere a meta de calorias.
 */

const TENTATIVAS = 2;

/** Diferença aceita entre o total do plano e a meta, antes de pedir correção. */
const TOLERANCIA = 0.1;

/**
 * Modelos pequenos às vezes erram a soma das refeições. Em vez de confiar no
 * total que a IA escreveu, o total do dia é sempre a soma das refeições.
 */
export function corrigirTotais(plano: PlanoDieta): PlanoDieta {
  const caloriasDia = plano.refeicoes.reduce((soma, refeicao) => soma + refeicao.calorias, 0);

  return { ...plano, caloriasDia: caloriasDia > 0 ? caloriasDia : plano.caloriasDia };
}

/**
 * `instrucoes`: os dados do usuário e o que ele pediu, em texto.
 * `metaCalorias`: se informada, o servidor confere o total e pede correção quando foge muito.
 */
export async function gerarPlanoComIa(
  provedor: ProvedorJson,
  instrucoes: string,
  metaCalorias?: number,
): Promise<PlanoDieta> {
  const conversa: MensagemJson[] = [
    {
      role: 'system',
      content: `${SISTEMA_DIETA}\nResponda apenas com o JSON do plano, sem nenhum texto fora dele.`,
    },
    { role: 'user', content: instrucoes },
  ];
  let melhor: PlanoDieta | null = null;

  for (let tentativa = 1; tentativa <= TENTATIVAS; tentativa++) {
    const texto = await responderJson(provedor, {
      mensagens: conversa,
      nome: 'plano_dieta',
      schema: planoDietaSchema,
    });
    const lido = lerJson(texto, planoDietaSchema);
    const plano = lido && lido.refeicoes.length > 0 ? corrigirTotais(lido) : null;

    if (!plano) {
      continue;
    }

    melhor = plano;

    if (!metaCalorias || Math.abs(plano.caloriasDia - metaCalorias) / metaCalorias <= TOLERANCIA) {
      return plano;
    }

    // Fora da meta: mostra a conta para o modelo e pede para ajustar as porções
    conversa.push(
      { role: 'assistant', content: texto },
      {
        role: 'user',
        content:
          `A soma das refeições deu ${plano.caloriasDia} kcal, mas a meta é ${metaCalorias} kcal. ` +
          'Ajuste as quantidades para a soma ficar perto da meta e devolva o plano completo em JSON.',
      },
    );
  }

  if (melhor) {
    return melhor;
  }

  throw new ErroServidor('A IA devolveu um plano incompleto. Tente de novo.', 502);
}

/** Atalho para a IA local (Ollama). */
export function gerarPlanoLocal(instrucoes: string, metaCalorias?: number): Promise<PlanoDieta> {
  return gerarPlanoComIa('local', instrucoes, metaCalorias);
}
