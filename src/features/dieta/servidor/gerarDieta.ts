import { betaZodOutputFormat } from '@anthropic-ai/sdk/helpers/beta/zod';

import { ErroServidor, FALLBACK, MODELO_CLAUDE, obterCliente } from '@/shared/servidor/claude';

import { planoDietaSchema, type PedidoDieta, type PlanoDieta } from '../contrato';
import { montarPromptDieta, SISTEMA_DIETA } from '../prompt';

/** Roda SÓ no servidor (rota /api/dieta). Nunca importe isto de uma tela. */
export async function gerarDieta({
  perfil,
  dia,
  treinoDoDia,
  preferencias,
  tipoDia,
}: PedidoDieta): Promise<PlanoDieta> {
  const resposta = await obterCliente().beta.messages.parse({
    model: MODELO_CLAUDE,
    max_tokens: 16000,
    ...FALLBACK,
    betas: [...FALLBACK.betas],
    system: SISTEMA_DIETA,
    messages: [
      {
        role: 'user',
        content: montarPromptDieta(perfil, { dia, treinoDoDia, preferencias, tipoDia }),
      },
    ],
    output_config: {
      effort: 'medium',
      format: betaZodOutputFormat(planoDietaSchema),
    },
  });

  if (resposta.stop_reason === 'refusal') {
    throw new ErroServidor('A IA não conseguiu montar este plano. Revise as restrições.', 422);
  }

  if (!resposta.parsed_output) {
    throw new ErroServidor('A IA devolveu um plano incompleto. Tente de novo.', 502);
  }

  return resposta.parsed_output;
}
