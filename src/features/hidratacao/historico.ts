import { chaveDoDia } from '@/shared/lib/data';

import { progresso, totalDoDia, type RegistrosPorDia } from './logica';

const INICIAL_DIA_SEMANA = ['D', 'S', 'T', 'Q', 'Q', 'S', 'S'] as const;
const NOME_DIA_SEMANA = [
  'domingo',
  'segunda',
  'terça',
  'quarta',
  'quinta',
  'sexta',
  'sábado',
] as const;

export type DiaHistorico = {
  chave: string;
  /** Letra do dia da semana, ex: "S". */
  inicial: string;
  /** Nome para o leitor de tela, ex: "segunda". */
  nome: string;
  totalMl: number;
  /** De 0 a 1. */
  fracao: number;
  bateu: boolean;
  hoje: boolean;
};

/** Volta `n` dias no calendário local (sem passar por UTC, ver `chaveDoDia`). */
function diasAtras(hoje: Date, n: number): Date {
  return new Date(hoje.getFullYear(), hoje.getMonth(), hoje.getDate() - n);
}

/**
 * Os últimos `quantidade` dias, do mais antigo para hoje.
 * Usa a meta ATUAL para os dias passados: o app ainda não guarda a meta de cada dia.
 */
export function historicoDeDias(
  registros: RegistrosPorDia,
  hoje: Date,
  metaMl: number,
  quantidade = 7,
): DiaHistorico[] {
  return Array.from({ length: quantidade }, (_, i) => {
    const data = diasAtras(hoje, quantidade - 1 - i);
    const totalMl = totalDoDia(registros[chaveDoDia(data)]);

    return {
      chave: chaveDoDia(data),
      inicial: INICIAL_DIA_SEMANA[data.getDay()],
      nome: NOME_DIA_SEMANA[data.getDay()],
      totalMl,
      fracao: progresso(totalMl, metaMl),
      bateu: metaMl > 0 && totalMl >= metaMl,
      hoje: i === quantidade - 1,
    };
  });
}

/**
 * Dias seguidos batendo a meta, contando para trás.
 * Hoje só entra se já bateu: não faz sentido zerar a sequência às 8h da manhã.
 */
export function sequenciaAtual(registros: RegistrosPorDia, hoje: Date, metaMl: number): number {
  if (metaMl <= 0) {
    return 0;
  }

  const bateuEm = (data: Date) => totalDoDia(registros[chaveDoDia(data)]) >= metaMl;
  let dias = bateuEm(hoje) ? 1 : 0;

  for (let n = 1; n <= 366; n++) {
    if (!bateuEm(diasAtras(hoje, n))) {
      break;
    }

    dias++;
  }

  return dias;
}
