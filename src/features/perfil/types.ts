export type Perfil = {
  nome: string;
  idade: number;
  alturaCm: number;
  pesoKg: number;
  /** Percentual de gordura corporal estimado. Opcional. */
  percentualGordura?: number;
  /** Problemas de saúde, lesões ou restrições alimentares. Opcional. */
  restricoes?: string;
};
