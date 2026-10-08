import { chaveDoDia, diasEntre } from '@/shared/lib/data';
import { formatarNumero } from '@/shared/lib/numero';

import type { DadosExercicio, DadosTreino, Exercicio, GeradorId, Sessao, Treino } from './types';
import { minusculaInicial } from '@/shared/lib/texto';

/** Quantos dias de sessões guardamos no aparelho. */
export const DIAS_DE_HISTORICO = 365;

export type Direcao = 'cima' | 'baixo';

/** Id curto e único o bastante para dados que só vivem no aparelho. */
export const novoId: GeradorId = () =>
  `${Date.now().toString(36)}${Math.random().toString(36).slice(2, 8)}`;

// ---------------------------------------------------------------------------
// Lista genérica
// ---------------------------------------------------------------------------

/** Troca o item de lugar com o vizinho. Nas pontas, não faz nada. */
export function mover<T extends { id: string }>(lista: readonly T[], id: string, direcao: Direcao) {
  const indice = lista.findIndex((item) => item.id === id);
  const destino = direcao === 'cima' ? indice - 1 : indice + 1;

  if (indice === -1 || destino < 0 || destino >= lista.length) {
    return lista as T[];
  }

  const copia = [...lista];
  [copia[indice], copia[destino]] = [copia[destino], copia[indice]];

  return copia;
}

// ---------------------------------------------------------------------------
// Treinos
// ---------------------------------------------------------------------------

const LETRAS = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ';

function normalizar(texto: string) {
  return texto.trim().toLocaleLowerCase('pt-BR');
}

/** Próximo nome livre na sequência "Treino A", "Treino B"... */
export function proximoNomeDeTreino(treinos: readonly Treino[]): string {
  const usados = new Set(treinos.map((treino) => normalizar(treino.nome)));

  for (const letra of LETRAS) {
    const nome = `Treino ${letra}`;

    if (!usados.has(normalizar(nome))) {
      return nome;
    }
  }

  return `Treino ${treinos.length + 1}`;
}

export function criarExercicio(dados: DadosExercicio, gerarId: GeradorId = novoId): Exercicio {
  return { ...dados, id: gerarId() };
}

export function criarTreino(dados: DadosTreino, gerarId: GeradorId = novoId): Treino {
  const treino: Treino = {
    id: gerarId(),
    nome: dados.nome,
    foco: dados.foco,
    exercicios: (dados.exercicios ?? []).map((exercicio) => criarExercicio(exercicio, gerarId)),
  };
  const dias = normalizarDias(dados.dias ?? []);

  return dias ? { ...treino, dias } : treino;
}

export function adicionarTreino(treinos: readonly Treino[], treino: Treino): Treino[] {
  return [...treinos, treino];
}

export function editarTreino(
  treinos: readonly Treino[],
  id: string,
  dados: { nome: string; foco?: string },
): Treino[] {
  return treinos.map((treino) =>
    treino.id === id ? { ...treino, nome: dados.nome, foco: dados.foco } : treino,
  );
}

/** Dias do plano semanal sem repetição, em ordem e só de 0 a 6. Vazio vira `undefined`. */
export function normalizarDias(dias: readonly number[]): number[] | undefined {
  const validos = [...new Set(dias)]
    .filter((dia) => Number.isInteger(dia) && dia >= 0 && dia <= 6)
    .sort((a, b) => a - b);

  return validos.length > 0 ? validos : undefined;
}

/** Troca os dias da semana em que o treino acontece. */
export function definirDias(
  treinos: readonly Treino[],
  id: string,
  dias: readonly number[],
): Treino[] {
  return treinos.map((treino) => {
    if (treino.id !== id) {
      return treino;
    }

    const novos = normalizarDias(dias);
    const atualizado: Treino = { ...treino, dias: novos };

    if (!novos) {
      delete atualizado.dias;
    }

    return atualizado;
  });
}

export function removerTreino(treinos: readonly Treino[], id: string): Treino[] {
  return treinos.filter((treino) => treino.id !== id);
}

export function moverTreino(treinos: readonly Treino[], id: string, direcao: Direcao): Treino[] {
  return mover(treinos, id, direcao);
}

/** Aplica uma mudança só nos exercícios de um treino. */
function alterarExercicios(
  treinos: readonly Treino[],
  treinoId: string,
  mudar: (exercicios: Exercicio[]) => Exercicio[],
): Treino[] {
  return treinos.map((treino) =>
    treino.id === treinoId ? { ...treino, exercicios: mudar(treino.exercicios) } : treino,
  );
}

export function adicionarExercicio(
  treinos: readonly Treino[],
  treinoId: string,
  dados: DadosExercicio,
  gerarId: GeradorId = novoId,
): Treino[] {
  return alterarExercicios(treinos, treinoId, (exercicios) => [
    ...exercicios,
    criarExercicio(dados, gerarId),
  ]);
}

/** Substitui os dados do exercício (campo opcional vazio é apagado), mantendo o id. */
export function editarExercicio(
  treinos: readonly Treino[],
  treinoId: string,
  exercicioId: string,
  dados: DadosExercicio,
): Treino[] {
  return alterarExercicios(treinos, treinoId, (exercicios) =>
    exercicios.map((exercicio) =>
      exercicio.id === exercicioId ? { ...dados, id: exercicioId } : exercicio,
    ),
  );
}

/** Vários de uma vez, na ordem (ex: os escolhidos na folha de adicionar). */
export function adicionarExercicios(
  treinos: readonly Treino[],
  treinoId: string,
  dados: readonly DadosExercicio[],
  gerarId: GeradorId = novoId,
): Treino[] {
  return alterarExercicios(treinos, treinoId, (exercicios) => [
    ...exercicios,
    ...dados.map((item) => criarExercicio(item, gerarId)),
  ]);
}

export function removerExercicio(
  treinos: readonly Treino[],
  treinoId: string,
  exercicioId: string,
): Treino[] {
  return alterarExercicios(treinos, treinoId, (exercicios) =>
    exercicios.filter((exercicio) => exercicio.id !== exercicioId),
  );
}

export function moverExercicio(
  treinos: readonly Treino[],
  treinoId: string,
  exercicioId: string,
  direcao: Direcao,
): Treino[] {
  return alterarExercicios(treinos, treinoId, (exercicios) =>
    mover(exercicios, exercicioId, direcao),
  );
}

/**
 * Adiciona os treinos de um modelo pronto.
 * Os nomes seguem a sequência livre ("Treino A", "B"...) para não repetir os que já existem.
 */
export function aplicarModelo(
  treinos: readonly Treino[],
  modelo: { treinos: readonly DadosTreino[] },
  gerarId: GeradorId = novoId,
): Treino[] {
  return modelo.treinos.reduce<Treino[]>(
    (lista, dados) =>
      adicionarTreino(lista, criarTreino({ ...dados, nome: proximoNomeDeTreino(lista) }, gerarId)),
    [...treinos],
  );
}

// ---------------------------------------------------------------------------
// Sessões
// ---------------------------------------------------------------------------

/** A última sessão finalizada (a mais recente por data; no mesmo dia, a última registrada). */
function ultimaFinalizada(sessoes: readonly Sessao[]): Sessao | undefined {
  let ultima: Sessao | undefined;

  for (const sessao of sessoes) {
    if (sessao.finalizada && (!ultima || sessao.data >= ultima.data)) {
      ultima = sessao;
    }
  }

  return ultima;
}

/**
 * Rodízio A → B → C → A: o próximo é o que vem depois do último treino finalizado.
 * Sem histórico (ou se o último treino foi apagado), começa do primeiro.
 */
function proximoNoRodizio(treinos: readonly Treino[], sessoes: readonly Sessao[]): Treino | null {
  if (treinos.length === 0) {
    return null;
  }

  const ultima = ultimaFinalizada(sessoes);
  const indice = ultima ? treinos.findIndex((treino) => treino.id === ultima.treinoId) : -1;

  return indice === -1 ? treinos[0] : treinos[(indice + 1) % treinos.length];
}

/** O treino tem dias marcados no plano semanal? */
export function temDias(treino: Pick<Treino, 'dias'>): boolean {
  return (treino.dias?.length ?? 0) > 0;
}

/** Índice do dia da semana de uma chave AAAA-MM-DD (0 = domingo). */
export function diaDaSemanaDe(chave: string): number {
  return paraData(chave).getDay();
}

function somarDias(chave: string, dias: number): string {
  const data = paraData(chave);

  return chaveDoDia(new Date(data.getFullYear(), data.getMonth(), data.getDate() + dias));
}

export type TreinoDoDia = {
  treino: Treino | null;
  /** Dia sem treino no plano semanal; `treino` é o próximo que vem. */
  descanso: boolean;
};

/**
 * Qual treino cai no dia, juntando o plano semanal com o rodízio:
 * - algum treino tem este dia da semana marcado: é ele (o primeiro da lista, se forem vários);
 * - senão, os treinos sem dias marcados seguem o rodízio A, B, C;
 * - se todos têm dias e nenhum é deste dia: descanso (e `treino` é o próximo do plano).
 */
export function treinoDoDia(
  treinos: readonly Treino[],
  sessoes: readonly Sessao[],
  hoje: string,
): TreinoDoDia {
  if (treinos.length === 0) {
    return { treino: null, descanso: false };
  }

  if (!treinos.some(temDias)) {
    return { treino: proximoNoRodizio(treinos, sessoes), descanso: false };
  }

  const dia = diaDaSemanaDe(hoje);
  const marcado = treinos.find((treino) => treino.dias?.includes(dia));

  if (marcado) {
    return { treino: marcado, descanso: false };
  }

  const semDias = treinos.filter((treino) => !temDias(treino));

  if (semDias.length > 0) {
    // O rodízio só olha para os treinos dele: um treino de dia marcado não empurra a fila
    const doRodizio = sessoes.filter((sessao) => semDias.some((t) => t.id === sessao.treinoId));

    return { treino: proximoNoRodizio(semDias, doRodizio), descanso: false };
  }

  // Descanso: o próximo é o do próximo dia marcado (no máximo uma semana para frente)
  for (let n = 1; n <= 7; n++) {
    const proximoDia = (dia + n) % 7;
    const proximo = treinos.find((treino) => treino.dias?.includes(proximoDia));

    if (proximo) {
      return { treino: proximo, descanso: true };
    }
  }

  return { treino: null, descanso: true };
}

/**
 * O próximo treino. Sem `hoje`, é só o rodízio A → B → C → A (depois do último
 * finalizado). Com `hoje`, respeita o plano semanal (ver `treinoDoDia`).
 */
export function proximoTreino(
  treinos: readonly Treino[],
  sessoes: readonly Sessao[],
  hoje?: string,
): Treino | null {
  return hoje === undefined
    ? proximoNoRodizio(treinos, sessoes)
    : treinoDoDia(treinos, sessoes, hoje).treino;
}

/** A sessão mais recente do dia (pode estar em andamento ou finalizada). */
export function sessaoDeHoje(sessoes: readonly Sessao[], hoje: string): Sessao | null {
  for (let i = sessoes.length - 1; i >= 0; i--) {
    if (sessoes[i].data === hoje) {
      return sessoes[i];
    }
  }

  return null;
}

/**
 * Começa (ou retoma) o treino do dia.
 * - Já tem sessão aberta deste treino hoje: retoma, sem perder o que foi marcado.
 * - Tem sessão aberta de OUTRO treino: troca o treino e zera as marcações.
 * - Senão: cria uma nova (dá para treinar duas vezes no mesmo dia).
 */
export function iniciarSessao(
  sessoes: readonly Sessao[],
  treinoId: string,
  hoje: string,
  gerarId: GeradorId = novoId,
): { sessoes: Sessao[]; sessao: Sessao } {
  const atual = sessaoDeHoje(sessoes, hoje);

  if (atual && !atual.finalizada) {
    if (atual.treinoId === treinoId) {
      return { sessoes: [...sessoes], sessao: atual };
    }

    const trocada: Sessao = { ...atual, treinoId, concluidos: [] };

    return {
      sessoes: sessoes.map((sessao) => (sessao.id === atual.id ? trocada : sessao)),
      sessao: trocada,
    };
  }

  const nova: Sessao = { id: gerarId(), treinoId, data: hoje, concluidos: [], finalizada: false };

  return { sessoes: [...sessoes, nova], sessao: nova };
}

/** Marca ou desmarca um exercício. Sessão finalizada não muda mais. */
export function alternarExercicio(
  sessoes: readonly Sessao[],
  sessaoId: string,
  exercicioId: string,
): Sessao[] {
  return sessoes.map((sessao) => {
    if (sessao.id !== sessaoId || sessao.finalizada) {
      return sessao;
    }

    const feito = sessao.concluidos.includes(exercicioId);

    return {
      ...sessao,
      concluidos: feito
        ? sessao.concluidos.filter((id) => id !== exercicioId)
        : [...sessao.concluidos, exercicioId],
    };
  });
}

/** Só dá para finalizar depois de marcar pelo menos um exercício. */
export function podeFinalizar(sessao: Sessao | null | undefined): boolean {
  return !!sessao && !sessao.finalizada && sessao.concluidos.length > 0;
}

export function finalizarSessao(sessoes: readonly Sessao[], sessaoId: string): Sessao[] {
  return sessoes.map((sessao) =>
    sessao.id === sessaoId && podeFinalizar(sessao) ? { ...sessao, finalizada: true } : sessao,
  );
}

/**
 * Ao apagar um treino, a sessão aberta de hoje perde o sentido. As finalizadas
 * e as de dias que já passaram ficam no histórico.
 */
export function descartarSessoesAbertas(
  sessoes: readonly Sessao[],
  treinoId: string,
  hoje: string = chaveDoDia(new Date()),
): Sessao[] {
  return sessoes.filter((sessao) => ficaNoHistorico(sessao, hoje) || sessao.treinoId !== treinoId);
}

/** Sessão finalizada ou de um dia que já passou: é histórico, nunca some. */
export function ficaNoHistorico(sessao: Sessao, hoje: string): boolean {
  return sessao.finalizada || sessao.data < hoje;
}

/** O treino que a sessão fez: o atual ou, se ele foi apagado ou trocado, a cópia guardada. */
export function treinoDaSessao(treinos: readonly Treino[], sessao: Sessao): Treino | null {
  const atual = treinos.find((treino) => treino.id === sessao.treinoId);

  if (atual) {
    return atual;
  }

  return sessao.registro
    ? { id: sessao.treinoId, nome: sessao.registro.nome, exercicios: sessao.registro.exercicios }
    : null;
}

/**
 * Antes de trocar ou apagar treinos: cada sessão cujo treino vai sumir guarda
 * uma cópia dele (`registro`), para o histórico não perder o que foi feito.
 */
export function guardarRegistros(
  sessoes: readonly Sessao[],
  antigos: readonly Treino[],
  novos: readonly Treino[],
): Sessao[] {
  const ficam = new Set(novos.map((treino) => treino.id));

  return sessoes.map((sessao) => {
    if (sessao.registro || ficam.has(sessao.treinoId)) {
      return sessao;
    }

    const treino = antigos.find((item) => item.id === sessao.treinoId);

    return treino
      ? { ...sessao, registro: { nome: treino.nome, exercicios: treino.exercicios } }
      : sessao;
  });
}

export function limparSessoesAntigas(sessoes: readonly Sessao[], hoje: string): Sessao[] {
  return sessoes.filter((sessao) => diasEntre(sessao.data, hoje) < DIAS_DE_HISTORICO);
}

export type Progresso = {
  feitos: number;
  total: number;
  /** De 0 a 1. */
  fracao: number;
  completo: boolean;
};

/** Conta só exercícios que ainda existem no treino (um pode ter sido apagado no meio). */
export function progressoDaSessao(sessao: Sessao, treino: Treino): Progresso {
  const total = treino.exercicios.length;
  const feitos = treino.exercicios.filter((exercicio) =>
    sessao.concluidos.includes(exercicio.id),
  ).length;

  return {
    feitos,
    total,
    fracao: total === 0 ? 0 : feitos / total,
    completo: total > 0 && feitos === total,
  };
}

/** Marcar este exercício agora fecha o treino? (era o último que faltava; desmarcar nunca fecha) */
export function marcarCompletaOTreino(
  sessao: Sessao,
  treino: Treino,
  exercicioId: string,
): boolean {
  if (sessao.concluidos.includes(exercicioId)) {
    return false;
  }

  if (!treino.exercicios.some((exercicio) => exercicio.id === exercicioId)) {
    return false;
  }

  const depois = { ...sessao, concluidos: [...sessao.concluidos, exercicioId] };

  return progressoDaSessao(depois, treino).completo;
}

export type SituacaoDoDia =
  | { tipo: 'sem-treinos' }
  /** `descanso`: hoje não tem treino no plano semanal; `treino` é o próximo. */
  | { tipo: 'sugerido'; treino: Treino; descanso?: true }
  | { tipo: 'em-andamento'; treino: Treino; sessao: Sessao }
  | { tipo: 'concluido'; treino: Treino; sessao: Sessao; proximo: Treino | null };

/** Tudo que a tela precisa saber sobre o treino de hoje, numa resposta só. */
export function situacaoDoDia(
  treinos: readonly Treino[],
  sessoes: readonly Sessao[],
  hoje: string,
): SituacaoDoDia {
  if (treinos.length === 0) {
    return { tipo: 'sem-treinos' };
  }

  const sessao = sessaoDeHoje(sessoes, hoje);
  const treinoDaSessao = sessao && treinos.find((treino) => treino.id === sessao.treinoId);

  if (sessao && treinoDaSessao) {
    return sessao.finalizada
      ? {
          tipo: 'concluido',
          treino: treinoDaSessao,
          sessao,
          proximo: treinoDoDia(treinos, sessoes, somarDias(hoje, 1)).treino,
        }
      : { tipo: 'em-andamento', treino: treinoDaSessao, sessao };
  }

  // Aqui `treinos` tem pelo menos um item, então sempre há um próximo
  const doDia = treinoDoDia(treinos, sessoes, hoje);
  const treino = (doDia.treino ?? treinos[0]) as Treino;

  return doDia.descanso
    ? { tipo: 'sugerido', treino, descanso: true }
    : { tipo: 'sugerido', treino };
}

// ---------------------------------------------------------------------------
// Semana
// ---------------------------------------------------------------------------

function paraData(chave: string): Date {
  return new Date(Number(chave.slice(0, 4)), Number(chave.slice(5, 7)) - 1, Number(chave.slice(8)));
}

/** Segunda-feira da semana do dia informado (a semana de treino começa na segunda). */
export function inicioDaSemana(dia: string): string {
  const data = paraData(dia);
  const desdeSegunda = (data.getDay() + 6) % 7;

  return chaveDoDia(new Date(data.getFullYear(), data.getMonth(), data.getDate() - desdeSegunda));
}

function semanaAnterior(segunda: string): string {
  const data = paraData(segunda);

  return chaveDoDia(new Date(data.getFullYear(), data.getMonth(), data.getDate() - 7));
}

/** Treinos finalizados de segunda até hoje. */
export function treinosNaSemana(sessoes: readonly Sessao[], hoje: string): number {
  const segunda = inicioDaSemana(hoje);

  return sessoes.filter(
    (sessao) => sessao.finalizada && sessao.data >= segunda && sessao.data <= hoje,
  ).length;
}

/**
 * Semanas seguidas com pelo menos um treino, contando para trás.
 * A semana atual só entra se já tem treino: na segunda de manhã a sequência não zera.
 */
export function sequenciaDeTreinos(sessoes: readonly Sessao[], hoje: string): number {
  const semanasComTreino = new Set(
    sessoes
      .filter((sessao) => sessao.finalizada && sessao.data <= hoje)
      .map((sessao) => inicioDaSemana(sessao.data)),
  );

  let semana = inicioDaSemana(hoje);
  let total = semanasComTreino.has(semana) ? 1 : 0;

  for (let n = 0; n < 520; n++) {
    semana = semanaAnterior(semana);

    if (!semanasComTreino.has(semana)) {
      break;
    }

    total++;
  }

  return total;
}

// ---------------------------------------------------------------------------
// Textos
// ---------------------------------------------------------------------------

export function textoTreinosNaSemana(quantidade: number): string {
  if (quantidade === 0) {
    return 'nenhum treino nesta semana ainda';
  }

  return quantidade === 1 ? '1 treino nesta semana' : `${quantidade} treinos nesta semana`;
}

function textoCarga(cargaKg: number) {
  return formatarNumero(cargaKg, Number.isInteger(cargaKg) ? 0 : 1);
}

/** "3 x 10, 40 kg" */
export function resumoExercicio(exercicio: Pick<Exercicio, 'series' | 'repeticoes' | 'cargaKg'>) {
  const base = `${exercicio.series} x ${exercicio.repeticoes}`;

  return exercicio.cargaKg === undefined ? base : `${base}, ${textoCarga(exercicio.cargaKg)} kg`;
}

/** Versão para o leitor de tela: "3 séries de 10 repetições, 40 quilos". */
export function resumoExercicioAcessivel(
  exercicio: Pick<Exercicio, 'series' | 'repeticoes' | 'cargaKg'>,
) {
  const series = exercicio.series === 1 ? '1 série' : `${exercicio.series} séries`;
  // Cardio guarda o tempo nas repetições: "10 min" ou, no circuito, "40 s"
  const minutos = /^(\d+) min$/.exec(exercicio.repeticoes);
  const segundos = /^(\d+) s$/.exec(exercicio.repeticoes);
  const tempo = minutos ? `${minutos[1]} minutos` : segundos ? `${segundos[1]} segundos` : null;
  const base = tempo
    ? exercicio.series === 1
      ? tempo
      : `${series} de ${tempo}`
    : `${series} de ${exercicio.repeticoes} repetições`;

  return exercicio.cargaKg === undefined
    ? base
    : `${base}, ${textoCarga(exercicio.cargaKg)} quilos`;
}

/** "peito e tríceps, 6 exercícios" (o foco pode vir com maiúscula da IA ou do modelo) */
export function resumoTreino(treino: Treino): string {
  const quantidade = treino.exercicios.length;
  const exercicios = quantidade === 1 ? '1 exercício' : `${quantidade} exercícios`;

  return treino.foco ? `${minusculaInicial(treino.foco)}, ${exercicios}` : exercicios;
}

/** Linha embaixo de "treino de hoje": qual treino e como ele está. */
export function legendaTreinoDoDia(situacao: SituacaoDoDia): string {
  switch (situacao.tipo) {
    case 'sem-treinos':
      return 'nenhum treino montado ainda';
    case 'sugerido':
      if (situacao.descanso) {
        return `dia de descanso. próximo: ${minusculaInicial(situacao.treino.nome)}`;
      }

      return situacao.treino.foco
        ? `${minusculaInicial(situacao.treino.nome)}, ${minusculaInicial(situacao.treino.foco)}`
        : minusculaInicial(situacao.treino.nome);
    case 'em-andamento': {
      const { feitos, total } = progressoDaSessao(situacao.sessao, situacao.treino);

      return `${minusculaInicial(situacao.treino.nome)}, ${feitos} de ${total} feitos`;
    }
    case 'concluido':
      return situacao.proximo
        ? `${minusculaInicial(situacao.treino.nome)} feito. próximo: ${minusculaInicial(situacao.proximo.nome)}`
        : `${minusculaInicial(situacao.treino.nome)} feito`;
  }
}

/** Exercícios já marcados hoje (para o visual de feito nos cards). */
export function concluidosDeHoje(situacao: SituacaoDoDia): string[] {
  return situacao.tipo === 'em-andamento' || situacao.tipo === 'concluido'
    ? situacao.sessao.concluidos
    : [];
}

// ---------------------------------------------------------------------------
// Tela inicial: marcar exercício direto no card e o botão principal
// ---------------------------------------------------------------------------

/**
 * Marca ou desmarca um exercício do treino de hoje direto da tela inicial.
 * Se o treino ainda não começou, começa sozinho (igual ao "começar" da sessão).
 * Treino de hoje já finalizado não muda mais.
 */
export function marcarExercicioNoDia(
  sessoes: readonly Sessao[],
  treinoId: string,
  exercicioId: string,
  hoje: string,
  gerarId: GeradorId = novoId,
): Sessao[] {
  if (sessaoDeHoje(sessoes, hoje)?.finalizada) {
    return [...sessoes];
  }

  const { sessoes: comSessao, sessao } = iniciarSessao(sessoes, treinoId, hoje, gerarId);

  return alternarExercicio(comSessao, sessao.id, exercicioId);
}

/** Dá para marcar exercícios na tela inicial? Só antes de finalizar o treino de hoje. */
export function podeMarcarNoInicio(situacao: SituacaoDoDia): boolean {
  // No dia de descanso a grade não aparece; quem quiser treina pelo botão
  return (situacao.tipo === 'sugerido' && !situacao.descanso) || situacao.tipo === 'em-andamento';
}

export type AcaoTreinoHoje = {
  tipo: 'comecar' | 'continuar' | 'concluido';
  /** "continuar treino · 3 de 11" */
  texto: string;
  /** "continuar treino, 3 de 11 exercícios feitos" */
  acessivel: string;
};

/**
 * Botão principal embaixo de "treino de hoje". `null` quando não há o que
 * fazer (sem treino ou treino vazio): a grade já mostra o convite certo.
 */
export function acaoTreinoHoje(situacao: SituacaoDoDia): AcaoTreinoHoje | null {
  if (situacao.tipo === 'sem-treinos' || situacao.treino.exercicios.length === 0) {
    return null;
  }

  const concluido: AcaoTreinoHoje = {
    tipo: 'concluido',
    texto: 'treino concluído',
    acessivel: 'treino concluído, ver o treino de hoje',
  };
  const comecar: AcaoTreinoHoje = {
    tipo: 'comecar',
    texto: 'começar treino',
    acessivel: `começar treino, ${resumoTreino(situacao.treino)}`,
  };

  if (situacao.tipo === 'concluido') {
    return concluido;
  }

  if (situacao.tipo === 'sugerido' && situacao.descanso) {
    return {
      tipo: 'comecar',
      texto: 'treinar mesmo assim',
      acessivel: `hoje é dia de descanso. treinar mesmo assim: ${minusculaInicial(situacao.treino.nome)}`,
    };
  }

  if (situacao.tipo === 'sugerido') {
    return comecar;
  }

  const { feitos, total, completo } = progressoDaSessao(situacao.sessao, situacao.treino);

  if (completo) {
    return concluido;
  }

  if (feitos === 0) {
    return comecar;
  }

  return {
    tipo: 'continuar',
    texto: `continuar treino · ${feitos} de ${total}`,
    acessivel: `continuar treino, ${feitos} de ${total} exercícios feitos`,
  };
}

function mesmosDiasDoPlano(a: readonly number[] | undefined, b: readonly number[] | undefined) {
  const x = [...(a ?? [])].sort().join(',');
  const y = [...(b ?? [])].sort().join(',');

  return x === y;
}

/**
 * Marca desde quando o plano de cada treino vale: treino novo com dias, ou com
 * os dias trocados, ganha `planoDesde = hoje`; o resto mantém a data que tinha.
 * Sem mudança nenhuma, devolve a mesma lista (dá para comparar por referência).
 */
export function carimbarPlano(
  antigos: readonly Treino[],
  novos: readonly Treino[],
  hoje: string,
): Treino[] {
  let mudou = false;

  const resultado = novos.map((treino) => {
    if (!temDias(treino)) {
      if (treino.planoDesde === undefined) {
        return treino;
      }

      mudou = true;
      const { planoDesde: _sem, ...semData } = treino;

      return semData;
    }

    const antes = antigos.find((item) => item.id === treino.id);
    const desde =
      antes && temDias(antes) && mesmosDiasDoPlano(antes.dias, treino.dias)
        ? (antes.planoDesde ?? treino.planoDesde ?? hoje)
        : hoje;

    if (treino.planoDesde === desde) {
      return treino;
    }

    mudou = true;

    return { ...treino, planoDesde: desde };
  });

  return mudou ? resultado : (novos as Treino[]);
}

/**
 * Os treinos como o plano era numa data que já passou: quem só ganhou dias
 * depois dela volta a ser do rodízio. Assim montar a semana hoje não pinta de
 * vermelho, nem quebra a sequência, nos dias de antes.
 */
export function treinosNaData(treinos: readonly Treino[], chave: string): readonly Treino[] {
  if (!treinos.some((treino) => treino.planoDesde !== undefined && treino.planoDesde > chave)) {
    return treinos;
  }

  return treinos.map((treino) => {
    if (treino.planoDesde === undefined || treino.planoDesde <= chave) {
      return treino;
    }

    const { dias: _dias, planoDesde: _desde, ...doRodizio } = treino;

    return doRodizio;
  });
}
