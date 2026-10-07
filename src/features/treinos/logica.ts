import { chaveDoDia, diasEntre } from '@/shared/lib/data';
import { formatarNumero } from '@/shared/lib/numero';

import type { DadosExercicio, DadosTreino, Exercicio, GeradorId, Sessao, Treino } from './types';

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
  return {
    id: gerarId(),
    nome: dados.nome,
    foco: dados.foco,
    exercicios: (dados.exercicios ?? []).map((exercicio) => criarExercicio(exercicio, gerarId)),
  };
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
export function proximoTreino(treinos: readonly Treino[], sessoes: readonly Sessao[]) {
  if (treinos.length === 0) {
    return null;
  }

  const ultima = ultimaFinalizada(sessoes);
  const indice = ultima ? treinos.findIndex((treino) => treino.id === ultima.treinoId) : -1;

  return indice === -1 ? treinos[0] : treinos[(indice + 1) % treinos.length];
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

/** Ao apagar um treino, a sessão aberta dele perde o sentido. As finalizadas ficam no histórico. */
export function descartarSessoesAbertas(sessoes: readonly Sessao[], treinoId: string): Sessao[] {
  return sessoes.filter((sessao) => sessao.finalizada || sessao.treinoId !== treinoId);
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
  | { tipo: 'sugerido'; treino: Treino }
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
          proximo: proximoTreino(treinos, sessoes),
        }
      : { tipo: 'em-andamento', treino: treinoDaSessao, sessao };
  }

  // Aqui `treinos` tem pelo menos um item, então sempre há um próximo
  return { tipo: 'sugerido', treino: proximoTreino(treinos, sessoes) as Treino };
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
    return 'Nenhum treino nesta semana ainda';
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
  // Cardio guarda minutos nas repetições: "10 min"
  const minutos = /^(\d+) min$/.exec(exercicio.repeticoes);
  const base = minutos
    ? exercicio.series === 1
      ? `${minutos[1]} minutos`
      : `${series} de ${minutos[1]} minutos`
    : `${series} de ${exercicio.repeticoes} repetições`;

  return exercicio.cargaKg === undefined
    ? base
    : `${base}, ${textoCarga(exercicio.cargaKg)} quilos`;
}

/** "Peito e tríceps, 6 exercícios" */
export function resumoTreino(treino: Treino): string {
  const quantidade = treino.exercicios.length;
  const exercicios = quantidade === 1 ? '1 exercício' : `${quantidade} exercícios`;

  return treino.foco ? `${treino.foco}, ${exercicios}` : exercicios;
}

/** Linha embaixo de "treino de hoje": qual treino e como ele está. */
export function legendaTreinoDoDia(situacao: SituacaoDoDia): string {
  switch (situacao.tipo) {
    case 'sem-treinos':
      return 'nenhum treino montado ainda';
    case 'sugerido':
      return situacao.treino.foco
        ? `${situacao.treino.nome}, ${situacao.treino.foco}`
        : situacao.treino.nome;
    case 'em-andamento': {
      const { feitos, total } = progressoDaSessao(situacao.sessao, situacao.treino);

      return `${situacao.treino.nome}, ${feitos} de ${total} feitos`;
    }
    case 'concluido':
      return situacao.proximo
        ? `${situacao.treino.nome} feito. Próximo: ${situacao.proximo.nome}`
        : `${situacao.treino.nome} feito`;
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
  return situacao.tipo === 'sugerido' || situacao.tipo === 'em-andamento';
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
