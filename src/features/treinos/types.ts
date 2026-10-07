/** Grupo do exercício: define o card e a cor na tela inicial. */
export type GrupoMuscular =
  | 'aquecimento'
  | 'peito'
  | 'costas'
  | 'ombro'
  | 'braco'
  | 'perna'
  | 'abdominal'
  | 'cardio'
  | 'outro';

export type Exercicio = {
  id: string;
  nome: string;
  /** Opcional: treinos antigos não têm; nesse caso vale `inferirGrupo(nome)`. */
  grupo?: GrupoMuscular;
  series: number;
  /** Texto livre já validado: "10" ou "8 a 12". */
  repeticoes: string;
  cargaKg?: number;
  observacao?: string;
};

export type Treino = {
  id: string;
  /** Ex: "Treino A". */
  nome: string;
  /** Ex: "Peito e tríceps". */
  foco?: string;
  exercicios: Exercicio[];
  /**
   * Plano semanal: dias em que este treino acontece (0 = domingo, 6 = sábado).
   * Sem o campo (ou vazio), o treino entra no rodízio A, B, C.
   */
  dias?: number[];
};

export type Sessao = {
  id: string;
  treinoId: string;
  /** Dia do treino, AAAA-MM-DD (ver `chaveDoDia`). */
  data: string;
  /** Ids dos exercícios já feitos. */
  concluidos: string[];
  finalizada: boolean;
};

/** Dados de um exercício sem o id (o que sai do formulário ou de um modelo). */
export type DadosExercicio = Omit<Exercicio, 'id'>;

/** Dados de um treino sem ids (o que sai do formulário ou de um modelo). */
export type DadosTreino = {
  nome: string;
  foco?: string;
  exercicios?: DadosExercicio[];
};

/** Função que gera ids. Nos testes, trocamos por um contador previsível. */
export type GeradorId = () => string;
