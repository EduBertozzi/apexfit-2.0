import { chaveDoDia } from '@/shared/lib/data';
import { minusculaInicial } from '@/shared/lib/texto';

import { textoDosDias } from './diasIa';
import { criarExercicio, ficaNoHistorico, novoId, normalizarDias, resumoExercicio } from './logica';
import type { DadosTreino, Exercicio, GeradorId, Sessao, Treino } from './types';

/**
 * Junta os treinos novos (da IA) com os atuais sem perder o que já existe:
 * treino e exercício com o mesmo nome mantêm o id, então as sessões e as
 * marcas de hoje continuam valendo. Lógica pura.
 */

function normalizar(texto: string): string {
  return texto.toLowerCase().normalize('NFD').replace(/[̀-ͯ]/g, '').replace(/\s+/g, ' ').trim();
}

function mesclarExercicios(
  atuais: readonly Exercicio[],
  propostos: DadosTreino['exercicios'] = [],
  gerarId: GeradorId,
): Exercicio[] {
  const usados = new Set<string>();

  return propostos.map((dados) => {
    const igual = atuais.find(
      (atual) => !usados.has(atual.id) && normalizar(atual.nome) === normalizar(dados.nome),
    );

    if (!igual) {
      return criarExercicio(dados, gerarId);
    }

    usados.add(igual.id);
    // A carga é da pessoa: a IA não sabe, então fica a que já estava
    const cargaKg = dados.cargaKg ?? igual.cargaKg;

    return { ...dados, id: igual.id, ...(cargaKg === undefined ? {} : { cargaKg }) };
  });
}

/**
 * `propostos`: os treinos que a IA devolveu (já normalizados). Treino com o
 * mesmo nome de um atual fica com o id e os dias dele (a não ser que o
 * proposto traga dias); exercício com o mesmo nome no mesmo treino fica com o id.
 */
export function mesclarTreinos(
  atuais: readonly Treino[],
  propostos: readonly DadosTreino[],
  gerarId: GeradorId = novoId,
): Treino[] {
  const usados = new Set<string>();

  return propostos.map((dados) => {
    const igual = atuais.find(
      (atual) => !usados.has(atual.id) && normalizar(atual.nome) === normalizar(dados.nome),
    );

    if (igual) {
      usados.add(igual.id);
    }

    const dias = normalizarDias(dados.dias ?? igual?.dias ?? []);
    const treino: Treino = {
      id: igual?.id ?? gerarId(),
      nome: dados.nome,
      foco: dados.foco,
      exercicios: mesclarExercicios(igual?.exercicios ?? [], dados.exercicios, gerarId),
    };

    return dias ? { ...treino, dias } : treino;
  });
}

function nomeExercicio(exercicio: Exercicio): string {
  return minusculaInicial(exercicio.nome);
}

function mesmosDias(a: readonly number[] = [], b: readonly number[] = []): boolean {
  return a.length === b.length && a.every((dia, i) => dia === b[i]);
}

/** O que mudou num treino que existia antes. */
function mudancasDoTreino(antes: Treino, depois: Treino): string[] {
  const idsDepois = new Set(depois.exercicios.map((exercicio) => exercicio.id));
  const idsAntes = new Set(antes.exercicios.map((exercicio) => exercicio.id));
  const saiu = antes.exercicios.filter((exercicio) => !idsDepois.has(exercicio.id));
  const entrou = depois.exercicios.filter((exercicio) => !idsAntes.has(exercicio.id));
  const partes: string[] = [];

  // Sai um, entra outro: é uma troca
  const trocas = Math.min(saiu.length, entrou.length);

  for (let i = 0; i < trocas; i++) {
    partes.push(`${nomeExercicio(saiu[i])} trocado por ${nomeExercicio(entrou[i])}`);
  }

  saiu.slice(trocas).forEach((exercicio) => partes.push(`sai ${nomeExercicio(exercicio)}`));
  entrou.slice(trocas).forEach((exercicio) => partes.push(`entra ${nomeExercicio(exercicio)}`));

  for (const exercicio of depois.exercicios) {
    const anterior = antes.exercicios.find((item) => item.id === exercicio.id);

    if (
      anterior &&
      (anterior.series !== exercicio.series || anterior.repeticoes !== exercicio.repeticoes)
    ) {
      partes.push(`${nomeExercicio(exercicio)} agora ${resumoExercicio(exercicio)}`);
    }
  }

  if (!mesmosDias(antes.dias, depois.dias) && depois.dias && depois.dias.length > 0) {
    partes.push(`agora ${textoDosDias(depois.dias)}`);
  }

  return partes;
}

function noDia(treino: Pick<Treino, 'dias'> | undefined, dias: readonly number[]): number[] {
  return (treino?.dias ?? []).filter((dia) => dias.includes(dia));
}

/**
 * Pedido com dia da semana ("troca o supino da sexta"): só o treino daquele
 * dia pode mudar. Os outros voltam exatamente como estavam (mesmo objeto),
 * treino novo que a IA inventou não entra e treino que sumiu volta.
 * `novos` já passou por `mesclarTreinos` (ids preservados).
 */
export function restringirAosDias(
  atuais: readonly Treino[],
  novos: readonly Treino[],
  dias: readonly number[],
): Treino[] {
  if (dias.length === 0) {
    return [...novos];
  }

  return atuais.map((atual) => {
    const novo = novos.find((treino) => treino.id === atual.id);

    if (!novo) {
      return atual;
    }

    const alvo = noDia(atual, dias).length > 0 || noDia(novo, dias).length > 0;

    return alvo ? novo : atual;
  });
}

/** Treinos marcados em algum dos dias. */
export function treinosNosDias<T extends Pick<Treino, 'dias'>>(
  treinos: readonly T[],
  dias: readonly number[],
): T[] {
  return treinos.filter((treino) => noDia(treino, dias).length > 0);
}

/**
 * Resumo do que mudou, uma linha por treino:
 * "treino A: leg press trocado por agachamento livre". Sem mudança, lista vazia.
 * Com `diasAlvo` (pedido citou o dia), a linha começa pelo dia:
 * "sexta: supino reto trocado por supino inclinado".
 */
export function resumoMudancas(
  atuais: readonly Treino[],
  novos: readonly Treino[],
  opcoes: { diasAlvo?: readonly number[] } = {},
): string[] {
  const linhas: string[] = [];
  const diasAlvo = opcoes.diasAlvo ?? [];

  for (const treino of novos) {
    const antes = atuais.find((atual) => atual.id === treino.id);
    const dosDias = noDia(antes ?? treino, diasAlvo);
    const nome = dosDias.length > 0 ? textoDosDias(dosDias) : minusculaInicial(treino.nome);
    // Treino que também cai em outro dia muda lá também: avisa
    const outros = (antes?.dias ?? []).filter((dia) => !diasAlvo.includes(dia));
    const aviso =
      dosDias.length > 0 && outros.length > 0
        ? ` (${minusculaInicial(treino.nome)}, vale também para ${textoDosDias(outros)})`
        : '';

    if (!antes) {
      const quantidade = treino.exercicios.length;
      linhas.push(`${nome}: novo, ${quantidade} ${quantidade === 1 ? 'exercício' : 'exercícios'}`);
      continue;
    }

    const partes = mudancasDoTreino(antes, treino);

    if (partes.length > 0) {
      linhas.push(`${nome}: ${partes.join('; ')}${aviso}`);
    }
  }

  for (const antes of atuais) {
    if (!novos.some((treino) => treino.id === antes.id)) {
      linhas.push(`${minusculaInicial(antes.nome)}: removido`);
    }
  }

  return linhas;
}

/**
 * Sessões depois de trocar os treinos: o histórico (finalizadas) fica; a
 * sessão aberta continua se o treino ainda existe, só com as marcas de
 * exercícios que ainda existem.
 */
export function sessoesValidas(
  sessoes: readonly Sessao[],
  treinos: readonly Treino[],
  hoje: string = chaveDoDia(new Date()),
): Sessao[] {
  return sessoes.flatMap((sessao) => {
    if (ficaNoHistorico(sessao, hoje)) {
      return [sessao];
    }

    const treino = treinos.find((item) => item.id === sessao.treinoId);

    if (!treino) {
      return [];
    }

    const ids = new Set(treino.exercicios.map((exercicio) => exercicio.id));
    const concluidos = sessao.concluidos.filter((id) => ids.has(id));

    return [concluidos.length === sessao.concluidos.length ? sessao : { ...sessao, concluidos }];
  });
}
