/**
 * Dias da semana dos treinos montados pela IA (coach, central de IA ou modo
 * demonstração). Lógica pura: 0 = domingo, 6 = sábado, como `Treino.dias`.
 */

const NOMES_DIAS = ['domingo', 'segunda', 'terça', 'quarta', 'quinta', 'sexta', 'sábado'];

/** Dias espalhados pela semana para cada quantidade de treinos. */
const PADRAO: Record<number, number[]> = {
  1: [1],
  2: [1, 4],
  3: [1, 3, 5],
  4: [1, 2, 4, 5],
  5: [1, 2, 3, 4, 5],
  6: [1, 2, 3, 4, 5, 6],
  7: [1, 2, 3, 4, 5, 6, 0],
};

/**
 * Um dia por treino, espalhados na semana: 2 treinos em segunda e quinta,
 * 3 em segunda, quarta e sexta... Mais de 7 treinos: os extras ficam sem dia.
 */
export function diasPadrao(quantidade: number): number[] {
  const inteiro = Math.max(0, Math.floor(quantidade));

  return inteiro === 0 ? [] : PADRAO[Math.min(inteiro, 7)];
}

function normalizar(texto: string): string {
  return texto.toLowerCase().normalize('NFD').replace(/[̀-ͯ]/g, '');
}

/** Nome completo ou abreviação comum. "ter" e "sex" só valem num intervalo ("seg a sex"). */
const DIA = [
  ['dom(ingo)?s?', 0],
  ['seg(unda)?s?(-feiras?)?', 1],
  ['tercas?(-feiras?)?', 2],
  ['qua(rta)?s?(-feiras?)?', 3],
  ['qui(nta)?s?(-feiras?)?', 4],
  ['sexta(s)?(-feiras?)?', 5],
  ['sab(ado)?s?', 6],
] as const;

const DIA_NO_INTERVALO = [
  ['dom(ingo)?', 0],
  ['seg(unda)?(-feira)?', 1],
  ['ter(ca)?(-feira)?', 2],
  ['qua(rta)?(-feira)?', 3],
  ['qui(nta)?(-feira)?', 4],
  ['sex(ta)?(-feira)?', 5],
  ['sab(ado)?', 6],
] as const;

function diaDaPalavra(palavra: string, tabela: typeof DIA | typeof DIA_NO_INTERVALO) {
  return tabela.find(([padrao]) => new RegExp(`^${padrao}$`).test(palavra))?.[1];
}

/** Grupos internos sem captura, para os índices do `replace` baterem. */
function semCaptura(padrao: string): string {
  return `(?:${padrao.replace(/\((?!\?)/g, '(?:')})`;
}

const PALAVRA_INTERVALO = DIA_NO_INTERVALO.map(([padrao]) => semCaptura(padrao)).join('|');
const INTERVALO = new RegExp(
  `\\b(${PALAVRA_INTERVALO})\\s+(?:a|ate)\\s+(${PALAVRA_INTERVALO})\\b`,
  'g',
);
const PALAVRA_DIA = new RegExp(
  `\\b(${DIA.map(([padrao]) => semCaptura(padrao)).join('|')})\\b`,
  'g',
);

/**
 * Dias citados no pedido: "segunda, quarta e sexta" vira [1, 3, 5];
 * "de seg a sex" vira [1, 2, 3, 4, 5]. Sem dia citado, lista vazia.
 */
export function diasDoTexto(texto: string): number[] {
  let normal = normalizar(texto);
  const dias = new Set<number>();

  normal = normal.replace(INTERVALO, (_trecho, inicio: string, fim: string) => {
    const de = diaDaPalavra(inicio, DIA_NO_INTERVALO);
    const ate = diaDaPalavra(fim, DIA_NO_INTERVALO);

    if (de !== undefined && ate !== undefined) {
      for (let dia = de; ; dia = (dia + 1) % 7) {
        dias.add(dia);

        if (dia === ate || dias.size === 7) {
          break;
        }
      }
    }

    return ' ';
  });

  for (const [palavra] of normal.matchAll(PALAVRA_DIA)) {
    const dia = diaDaPalavra(palavra, DIA);

    if (dia !== undefined) {
      dias.add(dia);
    }
  }

  return [...dias].sort((a, b) => a - b);
}

/**
 * Dias de cada treino. Com dias pedidos (pelo menos um por treino), reparte em
 * rodízio: 2 treinos em seg, ter, qui e sex dá A em seg e qui, B em ter e sex.
 * Sem dias suficientes, usa `diasPadrao`.
 */
export function distribuirDias(quantidade: number, pedidos: readonly number[] = []): number[][] {
  const total = Math.max(0, Math.floor(quantidade));
  // Semana começando na segunda, como a pessoa fala
  const ordenados = [...new Set(pedidos)]
    .filter((dia) => Number.isInteger(dia) && dia >= 0 && dia <= 6)
    .sort((a, b) => ((a + 6) % 7) - ((b + 6) % 7));

  if (total > 0 && ordenados.length >= total) {
    return Array.from({ length: total }, (_, treino) =>
      ordenados.filter((_dia, posicao) => posicao % total === treino).sort((a, b) => a - b),
    );
  }

  const padrao = diasPadrao(total);

  return Array.from({ length: total }, (_, treino) =>
    padrao[treino] === undefined ? [] : [padrao[treino]],
  );
}

/** [1, 4] vira "segunda e quinta" (semana começando na segunda). */
export function textoDosDias(dias: readonly number[]): string {
  const nomes = [...new Set(dias)]
    .filter((dia) => dia >= 0 && dia <= 6)
    .sort((a, b) => ((a + 6) % 7) - ((b + 6) % 7))
    .map((dia) => NOMES_DIAS[dia]);

  if (nomes.length <= 1) {
    return nomes[0] ?? '';
  }

  return `${nomes.slice(0, -1).join(', ')} e ${nomes[nomes.length - 1]}`;
}
