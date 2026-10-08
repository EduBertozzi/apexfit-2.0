import {
  exerciciosDe,
  GRUPOS_MUSCULACAO,
  MISTO,
  REGIOES,
  type ExercicioCatalogo,
  type Local,
} from './catalogo';
import { grupoDe, inferirGrupo } from './grupos';
import type { Direcao } from './logica';
import { LIMITES } from './schema';
import { SIGLAS_DIA, NOME_DIA } from './semana';
import type { DadosExercicio, Exercicio, GrupoMuscular, Treino } from './types';

/**
 * Regras da tela de montar treino: a folha de adicionar (musculação, cardio e
 * plano semanal) e a reordenação dos exercícios dentro do grupo.
 */

export type Aba = 'musculacao' | 'cardio' | 'plano';

export const ABAS: { valor: Aba; rotulo: string }[] = [
  { valor: 'musculacao', rotulo: 'musculação' },
  { valor: 'cardio', rotulo: 'cardio' },
  { valor: 'plano', rotulo: 'semana' },
];

/** Aceita o que vier da rota; qualquer outra coisa vira musculação. */
export function abaInicial(valor: unknown): Aba {
  return ABAS.some((aba) => aba.valor === valor) ? (valor as Aba) : 'musculacao';
}

export const PASSOS = {
  series: { min: LIMITES.series.min, max: LIMITES.series.max, passo: 1 },
  repeticoes: { min: LIMITES.repeticoes.min, max: LIMITES.repeticoes.max, passo: 1 },
  minutos: { min: 5, max: LIMITES.minutos.max, passo: 5 },
} as const;

/** Quantos já vêm marcados ao abrir a folha ou trocar de grupo. */
export const QUANTIDADE_INICIAL = 3;

export const MINUTOS_INICIAIS = 10;

/** Soma o passo e segura dentro do mínimo e do máximo. */
export function passo(
  valor: number,
  sentido: 1 | -1,
  limite: { min: number; max: number; passo: number },
): number {
  return Math.min(limite.max, Math.max(limite.min, valor + sentido * limite.passo));
}

/** Grupo que já vem escolhido: o do último exercício do treino (se for de musculação). */
export function grupoInicial(treino: Pick<Treino, 'exercicios'>): GrupoMuscular {
  const ultimo = treino.exercicios[treino.exercicios.length - 1];
  const grupo = ultimo ? grupoDe(ultimo) : undefined;

  return grupo && GRUPOS_MUSCULACAO.includes(grupo) ? grupo : GRUPOS_MUSCULACAO[0];
}

/** Região que já vem escolhida ao trocar de grupo: "misto" quando o grupo tem várias. */
export function regiaoInicial(grupo: GrupoMuscular): string | undefined {
  const regioes = REGIOES[grupo];

  return regioes.length > 1 ? MISTO : regioes[0]?.id;
}

export const NOME_LOCAL: Record<Local, string> = {
  academia: 'academia',
  casa: 'em casa',
  ambos: 'academia ou casa',
};

// ---------------------------------------------------------------------------
// Seleção
// ---------------------------------------------------------------------------

/** Marca ou desmarca um exercício (pelo nome), mantendo a ordem em que foram marcados. */
export function alternarSelecao(selecionados: readonly string[], nome: string): string[] {
  return selecionados.includes(nome)
    ? selecionados.filter((item) => item !== nome)
    : [...selecionados, nome];
}

/** "+" da quantidade: marca o primeiro da lista que ainda não está marcado. */
export function marcarMaisUm(
  disponiveis: readonly ExercicioCatalogo[],
  selecionados: readonly string[],
): string[] {
  const proximo = disponiveis.find((exercicio) => !selecionados.includes(exercicio.nome));

  return proximo ? [...selecionados, proximo.nome] : [...selecionados];
}

/** "-" da quantidade: desmarca o último marcado. */
export function desmarcarUltimo(selecionados: readonly string[]): string[] {
  return selecionados.slice(0, -1);
}

/** Séries e repetições que já vêm no contador: as do primeiro exercício da região. */
export function padraoDaRegiao(
  grupo: GrupoMuscular,
  regiao: string | undefined,
): { series: number; repeticoes: number } {
  const primeiro = exerciciosDe(grupo, regiao)[0];
  const repeticoes = primeiro ? Number.parseInt(primeiro.repeticoes, 10) : NaN;

  return {
    series: primeiro?.series ?? 3,
    repeticoes: Number.isFinite(repeticoes) ? repeticoes : 12,
  };
}

// ---------------------------------------------------------------------------
// O que vai para o treino
// ---------------------------------------------------------------------------

function normalizar(nome: string): string {
  return nome.trim().toLocaleLowerCase('pt-BR').normalize('NFD').replace(/[̀-ͯ]/g, '');
}

/** Nome digitado em "ou digite o nome": vazio não conta; curto ou longo demais é inválido. */
export function validarNomeLivre(nome: string): { valido: boolean; erro?: string } {
  const limpo = nome.trim();
  const { min, max } = LIMITES.nomeExercicio;

  if (limpo === '') {
    return { valido: false };
  }

  if (limpo.length < min) {
    return { valido: false, erro: `use pelo menos ${min} letras` };
  }

  if (limpo.length > max) {
    return { valido: false, erro: `use no máximo ${max} caracteres` };
  }

  return { valido: true };
}

/**
 * Exercícios de musculação prontos para salvar: os marcados e, no fim, o nome
 * digitado (se for válido e não repetir um marcado). Todos com as mesmas séries
 * e repetições dos contadores. O grupo é o escolhido; sem grupo, o app adivinha.
 */
export function montarMusculacao(dados: {
  selecionados: readonly string[];
  nomeLivre?: string;
  grupo?: GrupoMuscular;
  series: number;
  repeticoes: number;
}): DadosExercicio[] {
  const nomes = [...dados.selecionados];
  const livre = dados.nomeLivre?.trim() ?? '';

  if (
    validarNomeLivre(livre).valido &&
    !nomes.some((nome) => normalizar(nome) === normalizar(livre))
  ) {
    nomes.push(livre);
  }

  return nomes.map((nome) => ({
    nome,
    grupo: dados.grupo ?? inferirGrupo(nome),
    series: dados.series,
    repeticoes: String(dados.repeticoes),
  }));
}

/** Cardio: uma série, repetições em minutos ("20 min"). */
export function montarCardio(dados: {
  selecionados: readonly string[];
  minutos: number;
}): DadosExercicio[] {
  return dados.selecionados.map((nome) => ({
    nome,
    grupo: 'cardio',
    series: 1,
    repeticoes: `${dados.minutos} min`,
  }));
}

/** Texto do botão de salvar da folha. */
export function textoBotaoSalvar(aba: Aba, quantidade: number): string {
  if (aba === 'plano' && quantidade === 0) {
    return 'salvar dias';
  }

  if (quantidade === 0) {
    return 'adicionar';
  }

  return `adicionar ${quantidade}`;
}

/** O mesmo botão, por extenso, para o leitor de tela ("adicionar 3 exercícios"). */
export function descricaoBotaoSalvar(aba: Aba, quantidade: number): string {
  if (quantidade === 0) {
    return textoBotaoSalvar(aba, quantidade);
  }

  return quantidade === 1 ? 'adicionar 1 exercício' : `adicionar ${quantidade} exercícios`;
}

// ---------------------------------------------------------------------------
// Plano semanal
// ---------------------------------------------------------------------------

export function alternarDia(dias: readonly number[], dia: number): number[] {
  return dias.includes(dia)
    ? dias.filter((item) => item !== dia)
    : [...dias, dia].sort((a, b) => a - b);
}

export function mesmosDias(a: readonly number[] = [], b: readonly number[] = []): boolean {
  const ordenar = (lista: readonly number[]) => [...new Set(lista)].sort((x, y) => x - y).join();

  return ordenar(a) === ordenar(b);
}

/** Nomes dos outros treinos que também caem neste dia da semana. */
export function outrosTreinosNoDia(
  treinos: readonly Treino[],
  treinoId: string,
  dia: number,
): string[] {
  return treinos
    .filter((treino) => treino.id !== treinoId && treino.dias?.includes(dia))
    .map((treino) => treino.nome);
}

function juntar(itens: readonly string[]): string {
  return itens.length > 1
    ? `${itens.slice(0, -1).join(', ')} e ${itens[itens.length - 1]}`
    : (itens[0] ?? '');
}

/** "seg, qua e sex" ou, sem dias, "sem dia fixo, segue o rodízio". */
export function textoDias(dias: readonly number[] | undefined): string {
  if (!dias || dias.length === 0) {
    return 'sem dia fixo, segue o rodízio';
  }

  return juntar([...dias].sort((a, b) => a - b).map((dia) => SIGLAS_DIA[dia]));
}

/** Versão falada: "segunda, quarta e sexta". */
export function textoDiasAcessivel(dias: readonly number[] | undefined): string {
  if (!dias || dias.length === 0) {
    return 'sem dia fixo, segue o rodízio';
  }

  return juntar([...dias].sort((a, b) => a - b).map((dia) => NOME_DIA[dia]));
}

// ---------------------------------------------------------------------------
// Reordenar dentro do grupo
// ---------------------------------------------------------------------------

/**
 * Leva o exercício para a posição `destino` entre os do MESMO grupo. Os outros
 * grupos ficam onde estavam (a tela mostra a lista separada por grupo).
 */
export function reordenarNoGrupo(
  exercicios: readonly Exercicio[],
  id: string,
  destino: number,
): Exercicio[] {
  const alvo = exercicios.find((exercicio) => exercicio.id === id);

  if (!alvo) {
    return [...exercicios];
  }

  const grupo = grupoDe(alvo);
  const posicoes: number[] = [];

  exercicios.forEach((exercicio, indice) => {
    if (grupoDe(exercicio) === grupo) {
      posicoes.push(indice);
    }
  });

  const doGrupo = posicoes.map((indice) => exercicios[indice]);
  const origem = doGrupo.indexOf(alvo);
  const final = Math.min(doGrupo.length - 1, Math.max(0, Math.round(destino)));

  if (origem === final) {
    return [...exercicios];
  }

  const reordenados = [...doGrupo];
  reordenados.splice(origem, 1);
  reordenados.splice(final, 0, alvo);

  const resultado = [...exercicios];
  posicoes.forEach((posicao, i) => {
    resultado[posicao] = reordenados[i];
  });

  return resultado;
}

/** Sobe ou desce uma posição dentro do grupo. Nas pontas, não faz nada. */
export function moverNoGrupo(
  exercicios: readonly Exercicio[],
  id: string,
  direcao: Direcao,
): Exercicio[] {
  const alvo = exercicios.find((exercicio) => exercicio.id === id);

  if (!alvo) {
    return [...exercicios];
  }

  const doGrupo = exercicios.filter((exercicio) => grupoDe(exercicio) === grupoDe(alvo));
  const origem = doGrupo.indexOf(alvo);

  return reordenarNoGrupo(exercicios, id, direcao === 'cima' ? origem - 1 : origem + 1);
}

function noTreino(
  treinos: readonly Treino[],
  treinoId: string,
  mudar: (exercicios: Exercicio[]) => Exercicio[],
): Treino[] {
  return treinos.map((treino) =>
    treino.id === treinoId ? { ...treino, exercicios: mudar(treino.exercicios) } : treino,
  );
}

export function reordenarExercicioNoGrupo(
  treinos: readonly Treino[],
  treinoId: string,
  exercicioId: string,
  destino: number,
): Treino[] {
  return noTreino(treinos, treinoId, (exercicios) =>
    reordenarNoGrupo(exercicios, exercicioId, destino),
  );
}

export function moverExercicioNoGrupo(
  treinos: readonly Treino[],
  treinoId: string,
  exercicioId: string,
  direcao: Direcao,
): Treino[] {
  return noTreino(treinos, treinoId, (exercicios) =>
    moverNoGrupo(exercicios, exercicioId, direcao),
  );
}

/** Para o leitor de tela: "2 de 4 em braço". */
export function posicaoNoGrupo(indice: number, total: number, nomeGrupo: string): string {
  return `${indice + 1} de ${total} em ${nomeGrupo}`;
}
