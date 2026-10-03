import type { NivelAtividade, Objetivo, Perfil, Sexo } from '@/features/perfil/types';

/** Multiplicador do gasto basal pelo nível de atividade (fatores clássicos de Harris-Benedict). */
export const FATOR_ATIVIDADE: Record<NivelAtividade, number> = {
  sedentario: 1.2,
  leve: 1.375,
  moderado: 1.55,
  alto: 1.725,
  atleta: 1.9,
};

export const NOME_NIVEL_ATIVIDADE: Record<NivelAtividade, string> = {
  sedentario: 'Sedentário',
  leve: 'Leve (1 a 2 treinos/semana)',
  moderado: 'Moderado (3 a 4 treinos/semana)',
  alto: 'Alto (5 a 6 treinos/semana)',
  atleta: 'Atleta (treino 2x por dia)',
};

export const NOME_OBJETIVO: Record<Objetivo, string> = {
  perder: 'Perder gordura',
  manter: 'Manter o peso',
  ganhar: 'Ganhar massa',
};

export const NOME_SEXO: Record<Sexo, string> = {
  masculino: 'Masculino',
  feminino: 'Feminino',
};

/** Ajuste de calorias sobre o gasto diário, por objetivo. */
const AJUSTE_ADULTO: Record<Objetivo, number> = { perder: -0.2, manter: 0, ganhar: 0.1 };

/** Menores de 18 ainda estão crescendo: déficit e superávit bem mais leves. */
const AJUSTE_MENOR: Record<Objetivo, number> = { perder: -0.1, manter: 0, ganhar: 0.05 };

/** Gramas de proteína por kg de peso, por objetivo. */
const PROTEINA_G_POR_KG: Record<Objetivo, number> = { perder: 2.0, manter: 1.6, ganhar: 1.8 };

/** Gordura: 0,8 g por kg de peso, mas nunca abaixo de 20% das calorias. */
const GORDURA_G_POR_KG = 0.8;
const GORDURA_MIN_FRACAO = 0.2;

const KCAL_POR_G = { proteina: 4, carboidrato: 4, gordura: 9 } as const;

/** Nunca recomendar menos que isso, mesmo em déficit. */
const CALORIAS_MINIMAS: Record<Sexo, number> = { masculino: 1500, feminino: 1200 };

/**
 * Taxa metabólica basal (kcal/dia): o que o corpo gasta parado.
 * Com % de gordura usa Katch-McArdle (considera a massa magra, mais preciso);
 * sem, usa Mifflin-St Jeor.
 */
export function calcularTmb(perfil: Perfil & { sexo: Sexo }): number {
  if (perfil.percentualGordura !== undefined) {
    const massaMagraKg = perfil.pesoKg * (1 - perfil.percentualGordura / 100);

    return Math.round(370 + 21.6 * massaMagraKg);
  }

  const base = 10 * perfil.pesoKg + 6.25 * perfil.alturaCm - 5 * perfil.idade;

  return Math.round(perfil.sexo === 'masculino' ? base + 5 : base - 161);
}

export type Macros = {
  proteinaG: number;
  carboidratoG: number;
  gorduraG: number;
};

export type Necessidades = {
  tmb: number;
  gastoDiario: number;
  metaCalorias: number;
  macros: Macros;
};

function arredondarPara(valor: number, passo: number): number {
  return Math.round(valor / passo) * passo;
}

/**
 * Calorias e macros do dia a partir do perfil.
 * Retorna `null` se faltar sexo, nível de atividade ou objetivo (perfis antigos).
 */
export function calcularNecessidades(perfil: Perfil): Necessidades | null {
  const { sexo, nivelAtividade, objetivo } = perfil;

  if (!sexo || !nivelAtividade || !objetivo) {
    return null;
  }

  const tmb = calcularTmb({ ...perfil, sexo });
  const gastoDiario = arredondarPara(tmb * FATOR_ATIVIDADE[nivelAtividade], 10);

  const menor = perfil.idade < 18;
  const ajuste = (menor ? AJUSTE_MENOR : AJUSTE_ADULTO)[objetivo];
  const metaCalorias = Math.max(
    arredondarPara(gastoDiario * (1 + ajuste), 10),
    // O mínimo só vale para quem está em déficit; nunca passar do próprio gasto
    Math.min(CALORIAS_MINIMAS[sexo], gastoDiario),
  );

  const proteinaG = Math.round(perfil.pesoKg * PROTEINA_G_POR_KG[objetivo]);
  const gorduraG = Math.round(
    Math.max(
      perfil.pesoKg * GORDURA_G_POR_KG,
      (metaCalorias * GORDURA_MIN_FRACAO) / KCAL_POR_G.gordura,
    ),
  );
  const kcalRestante =
    metaCalorias - proteinaG * KCAL_POR_G.proteina - gorduraG * KCAL_POR_G.gordura;
  const carboidratoG = Math.max(Math.round(kcalRestante / KCAL_POR_G.carboidrato), 0);

  return { tmb, gastoDiario, metaCalorias, macros: { proteinaG, carboidratoG, gorduraG } };
}
