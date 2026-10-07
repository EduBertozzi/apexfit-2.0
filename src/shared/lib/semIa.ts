/**
 * Sinal de que não há IA disponível agora: o servidor respondeu SEM_IA,
 * ou nem deu para falar com ele (sem internet, servidor desligado).
 * Quem recebe usa o modo demonstração offline em vez de mostrar erro.
 */
export class SemIa extends Error {
  constructor(motivo = 'Nenhuma IA disponível.') {
    super(motivo);
    this.name = 'SemIa';
  }
}

/** Código que as rotas /api/* mandam quando não há IA no servidor. */
export const CODIGO_SEM_IA = 'SEM_IA';

/** Qual IA respondeu, como as rotas /api/* devolvem. "demo" é o modo demonstração offline. */
export const PROVEDORES_IA = ['claude', 'openai', 'local'] as const;

export type ProvedorIa = (typeof PROVEDORES_IA)[number];
