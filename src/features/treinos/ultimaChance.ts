/**
 * Notificação de "última chance" da sequência: o planejador é puro (sem React e
 * sem expo-notifications). Quem agenda de verdade é `useAvisoUltimaChance`.
 *
 * Regra: se hoje decide a sequência (quebraria ou gastaria o último congelador),
 * agenda um aviso às 20:00 de hoje. Treinou, deixou de estar em risco ou já passou
 * das 20:00: cancela. O id é fixo, então agendar de novo só troca o anterior.
 */
import { textoUltimaChance, type RiscoDeHoje } from './regraSequencia';

export const ID_AVISO_ULTIMA_CHANCE = 'apexfit-sequencia-ultima-chance';
export const HORA_AVISO_ULTIMA_CHANCE = 20;

export type PlanoDoAviso =
  | { acao: 'agendar'; id: string; titulo: string; corpo: string; quando: Date }
  | { acao: 'cancelar'; id: string };

export function planejarAvisoUltimaChance(entrada: {
  emRisco: boolean;
  atual: number;
  risco: RiscoDeHoje;
  agora: Date;
  hora?: number;
}): PlanoDoAviso {
  const { emRisco, atual, risco, agora, hora = HORA_AVISO_ULTIMA_CHANCE } = entrada;
  const quando = new Date(agora.getFullYear(), agora.getMonth(), agora.getDate(), hora, 0, 0, 0);

  if (!emRisco || quando.getTime() <= agora.getTime()) {
    return { acao: 'cancelar', id: ID_AVISO_ULTIMA_CHANCE };
  }

  return {
    acao: 'agendar',
    id: ID_AVISO_ULTIMA_CHANCE,
    titulo: 'Última chance de hoje',
    corpo: `${capitalizar(textoUltimaChance(atual, risco))}.`,
    quando,
  };
}

/** A notificação do sistema começa com maiúscula, como os lembretes de água. */
function capitalizar(texto: string): string {
  return texto.charAt(0).toUpperCase() + texto.slice(1);
}
