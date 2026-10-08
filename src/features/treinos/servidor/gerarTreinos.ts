import { betaZodOutputFormat } from '@anthropic-ai/sdk/helpers/beta/zod';

import type { ProvedorIa } from '@/shared/lib/semIa';
import { ErroServidor, FALLBACK, MODELO_CLAUDE, obterCliente } from '@/shared/servidor/claude';
import { lerJson } from '@/shared/servidor/esquemaEstrito';
import { responderJson } from '@/shared/servidor/json';

import { respostaTreinosIaSchema, type RespostaTreinosIa } from '../contratoIa';
import { SISTEMA_AJUSTE_TREINOS, SISTEMA_SEMANA, SISTEMA_TREINOS } from '../promptIa';

/** Roda SÓ no servidor (rotas /api/treino e /api/coach). Nunca importe isto de uma tela. */

const TENTATIVAS = 2;

/** Resposta aproveitável: pelo menos um treino, e todo treino com exercícios. */
export function treinosValidos(resposta: RespostaTreinosIa | null): resposta is RespostaTreinosIa {
  return (
    resposta !== null &&
    resposta.treinos.length > 0 &&
    resposta.treinos.every((treino) => treino.exercicios.length > 0)
  );
}

async function tentarClaude(
  sistema: string,
  instrucoes: string,
): Promise<RespostaTreinosIa | null> {
  const resposta = await obterCliente().beta.messages.parse({
    model: MODELO_CLAUDE,
    max_tokens: 16000,
    ...FALLBACK,
    betas: [...FALLBACK.betas],
    system: sistema,
    messages: [{ role: 'user', content: instrucoes }],
    output_config: {
      effort: 'low',
      format: betaZodOutputFormat(respostaTreinosIaSchema),
    },
  });

  if (resposta.stop_reason === 'refusal') {
    throw new ErroServidor('A IA não conseguiu montar estes treinos. Revise as restrições.', 422);
  }

  return resposta.parsed_output ?? null;
}

/**
 * Gera os treinos com a IA escolhida, valida com o zod e tenta mais uma vez
 * se vier incompleto. `instrucoes`: dados do usuário e o pedido, em texto.
 * `modo`: "ajuste" edita os treinos atuais (vão nas instruções) em vez de montar outros;
 * "semana" segue os dias e as áreas escolhidos no montador da central de IA.
 */
export async function gerarTreinos(
  provedor: ProvedorIa,
  instrucoes: string,
  modo: 'novo' | 'ajuste' | 'semana' = 'novo',
): Promise<RespostaTreinosIa> {
  const extra = { novo: null, ajuste: SISTEMA_AJUSTE_TREINOS, semana: SISTEMA_SEMANA }[modo];
  const sistema = extra ? `${SISTEMA_TREINOS}\n\n${extra}` : SISTEMA_TREINOS;

  for (let tentativa = 1; tentativa <= TENTATIVAS; tentativa++) {
    const resposta =
      provedor === 'claude'
        ? await tentarClaude(sistema, instrucoes)
        : lerJson(
            await responderJson(provedor, {
              mensagens: [
                {
                  role: 'system',
                  content: `${sistema}\nResponda apenas com o JSON dos treinos, sem nenhum texto fora dele.`,
                },
                { role: 'user', content: instrucoes },
              ],
              nome: 'treinos',
              schema: respostaTreinosIaSchema,
            }),
            respostaTreinosIaSchema,
          );

    if (treinosValidos(resposta)) {
      return resposta;
    }
  }

  throw new ErroServidor('A IA devolveu treinos incompletos. Tente de novo.', 502);
}
