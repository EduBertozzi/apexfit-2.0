import type { Perfil } from '@/features/perfil/types';
import { CODIGO_SEM_IA, SemIa, type ProvedorIa } from '@/shared/lib/semIa';

import { pedidoDietaSchema, respostaDietaSchema, type PlanoDieta } from './contrato';
import { limparPlano } from './texto';

/** Plano de um dia só (0 = domingo) e o treino desse dia. Sem `dia`, vale a semana toda. */
export type OpcoesPedidoDieta = { dia?: number; treinoDoDia?: string };

/**
 * Pede a dieta para o NOSSO servidor (rota /api/dieta), nunca direto para a IA.
 * Em desenvolvimento, o Expo resolve "/api/..." para o servidor do `expo start`.
 */
export async function pedirDieta(perfil: Perfil): Promise<PlanoDieta> {
  return (await pedirDietaComProvedor(perfil)).plano;
}

/** Igual a `pedirDieta`, mas diz também qual IA montou o plano. */
export async function pedirDietaComProvedor(
  perfil: Perfil,
  opcoes: OpcoesPedidoDieta = {},
): Promise<{ plano: PlanoDieta; provedor?: ProvedorIa }> {
  const pedido = pedidoDietaSchema.safeParse({
    perfil,
    ...(opcoes.dia === undefined ? {} : { dia: opcoes.dia }),
    ...(opcoes.treinoDoDia ? { treinoDoDia: opcoes.treinoDoDia.slice(0, 120) } : {}),
  });

  if (!pedido.success) {
    throw new Error('complete seu perfil (sexo, atividade e objetivo) para gerar a dieta.');
  }

  let resposta: Response;

  try {
    resposta = await fetch('/api/dieta', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(pedido.data),
    });
  } catch {
    // Sem conexão com o servidor: o app monta o plano offline
    throw new SemIa('sem conexão com o servidor.');
  }

  const corpo: unknown = await resposta.json().catch(() => null);

  if (!resposta.ok) {
    const { erro, codigo } = (corpo ?? {}) as { erro?: unknown; codigo?: unknown };

    if (codigo === CODIGO_SEM_IA) {
      throw new SemIa();
    }

    throw new Error(typeof erro === 'string' ? erro : 'não deu para gerar a dieta agora.');
  }

  const validado = respostaDietaSchema.safeParse(corpo);

  if (!validado.success) {
    throw new Error('O servidor devolveu um plano em formato inesperado.');
  }

  // A IA às vezes manda markdown ("**Arroz**"): o app guarda só texto puro
  return { ...validado.data, plano: limparPlano(validado.data.plano) };
}
