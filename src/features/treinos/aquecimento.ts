import { buscarNoCatalogo, CATALOGO } from './catalogo';
import { LIMITES_MONTADOR, type ItemAquecimento, type MedidaAquecimento } from './contratoIa';
import type { DadosExercicio } from './types';

/**
 * Aquecimento com mais de um exercício, cada um medido em repetições ("15")
 * ou em tempo ("5 min"). Bike e esteira são sempre por tempo.
 * Lógica pura, usada no montador da semana e na folha de adicionar exercício.
 */

const PADRAO_MINUTOS = /^(\d+)\s*min(?:uto|utos)?$/i;
const APARELHO_DE_TEMPO = /bike|bicicleta|esteira|eliptico|escada|remo|corrida|caminhada/;

/** Passo do "+" e "-" de cada medida. */
export const PASSO_AQUECIMENTO: Record<MedidaAquecimento, number> = {
  repeticoes: 5,
  tempo: 1,
};

/** Valor que entra ao trocar de medida, quando o catálogo não diz. */
const VALOR_PADRAO: Record<MedidaAquecimento, number> = { repeticoes: 15, tempo: 3 };

function normalizar(texto: string): string {
  return texto.trim().toLocaleLowerCase('pt-BR').normalize('NFD').replace(/[̀-ͯ]/g, '');
}

/** Exercícios de aquecimento do catálogo, na ordem em que aparecem lá. */
export const OPCOES_AQUECIMENTO: readonly string[] = CATALOGO.filter(
  (item) => item.grupo === 'aquecimento',
).map((item) => item.nome);

/** "5 min" vira tempo 5; "15" ou "8 a 12" viram repetições (o primeiro número). */
export function medidaDoTexto(repeticoes: string): { medida: MedidaAquecimento; valor: number } {
  const limpo = repeticoes.trim();
  const minutos = PADRAO_MINUTOS.exec(limpo);

  if (minutos) {
    return { medida: 'tempo', valor: Number(minutos[1]) };
  }

  const numero = Number.parseInt(limpo, 10);

  return {
    medida: 'repeticoes',
    valor: Number.isFinite(numero) ? numero : VALOR_PADRAO.repeticoes,
  };
}

/** O contrário: como fica salvo no exercício ("15" ou "5 min"). */
export function textoDaMedida(medida: MedidaAquecimento, valor: number): string {
  return medida === 'tempo' ? `${valor} min` : String(valor);
}

/** Bike, esteira e afins só fazem sentido por tempo. */
export function soPorTempo(nome: string): boolean {
  const texto = normalizar(nome);

  // "Corrida no lugar" é sem aparelho: dá para contar repetições também
  return APARELHO_DE_TEMPO.test(texto) && !/no lugar/.test(texto);
}

function limitar(medida: MedidaAquecimento, valor: number): number {
  const { min, max } =
    medida === 'tempo'
      ? LIMITES_MONTADOR.minutosAquecimento
      : LIMITES_MONTADOR.repeticoesAquecimento;

  return Math.min(max, Math.max(min, Math.round(valor)));
}

/** Item novo com a medida e o valor do catálogo (ou o padrão). */
export function itemPadrao(nome: string): ItemAquecimento {
  const doCatalogo = buscarNoCatalogo(nome);
  const { medida, valor } = doCatalogo
    ? medidaDoTexto(doCatalogo.repeticoes)
    : { medida: 'repeticoes' as const, valor: VALOR_PADRAO.repeticoes };
  const final = soPorTempo(nome) ? 'tempo' : medida;

  return {
    nome,
    medida: final,
    valor: limitar(final, final === medida ? valor : VALOR_PADRAO[final]),
  };
}

/** Marca ou desmarca um exercício de aquecimento (até o limite de itens). */
export function alternarItemAquecimento(
  itens: readonly ItemAquecimento[],
  nome: string,
): ItemAquecimento[] {
  if (itens.some((item) => item.nome === nome)) {
    return itens.filter((item) => item.nome !== nome);
  }

  if (itens.length >= LIMITES_MONTADOR.itensAquecimento) {
    return [...itens];
  }

  return [...itens, itemPadrao(nome)];
}

/** Troca repetições por tempo (ou o contrário). Bike e esteira não mudam. */
export function mudarMedidaAquecimento(
  itens: readonly ItemAquecimento[],
  nome: string,
  medida: MedidaAquecimento,
): ItemAquecimento[] {
  return itens.map((item) => {
    if (item.nome !== nome || item.medida === medida || (soPorTempo(nome) && medida !== 'tempo')) {
      return item;
    }

    const padrao = itemPadrao(nome);

    return {
      ...item,
      medida,
      valor: padrao.medida === medida ? padrao.valor : VALOR_PADRAO[medida],
    };
  });
}

/** "+" ou "-" no valor do item, dentro dos limites da medida. */
export function passoAquecimento(
  itens: readonly ItemAquecimento[],
  nome: string,
  sentido: 1 | -1,
): ItemAquecimento[] {
  return itens.map((item) => {
    if (item.nome !== nome) {
      return item;
    }

    const passo = PASSO_AQUECIMENTO[item.medida];
    // De 12 com passo 5: sobe para 15 e desce para 10 (fica nos múltiplos)
    const base =
      sentido === 1
        ? Math.floor(item.valor / passo) * passo
        : Math.ceil(item.valor / passo) * passo;

    return { ...item, valor: limitar(item.medida, base + sentido * passo) };
  });
}

/** Item escolhido vira exercício do treino: uma série, repetições ou minutos. */
export function exercicioDeAquecimento(item: ItemAquecimento): DadosExercicio {
  const medida = soPorTempo(item.nome) ? 'tempo' : item.medida;

  return {
    nome: item.nome,
    grupo: 'aquecimento',
    series: 1,
    repeticoes: textoDaMedida(medida, limitar(medida, item.valor)),
  };
}

/** Texto curto ao lado do nome: "15 repetições", "5 minutos". */
export function textoValorAquecimento(item: ItemAquecimento): string {
  if (item.medida === 'tempo') {
    return item.valor === 1 ? '1 minuto' : `${item.valor} minutos`;
  }

  return item.valor === 1 ? '1 repetição' : `${item.valor} repetições`;
}
