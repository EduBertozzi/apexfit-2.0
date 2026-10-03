export type Sexo = 'masculino' | 'feminino';

export type NivelAtividade = 'sedentario' | 'leve' | 'moderado' | 'alto' | 'atleta';

export type Objetivo = 'perder' | 'manter' | 'ganhar';

export type Perfil = {
  nome: string;
  idade: number;
  alturaCm: number;
  pesoKg: number;
  /** Percentual de gordura corporal estimado. Opcional. */
  percentualGordura?: number;
  /** Problemas de saúde, lesões ou restrições alimentares. Opcional. */
  restricoes?: string;
  /**
   * Os três campos abaixo entraram depois da 2.0. São opcionais no tipo porque
   * perfis antigos salvos no aparelho não têm; o formulário passa a exigir.
   */
  sexo?: Sexo;
  nivelAtividade?: NivelAtividade;
  objetivo?: Objetivo;
};
