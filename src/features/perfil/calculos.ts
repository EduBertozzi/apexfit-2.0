/** Mililitros de água recomendados por kg de peso corporal. */
export const ML_POR_KG = 35;

/**
 * Meta diária de água, arredondada para múltiplos de 50 ml.
 * Ex: 70 kg × 35 ml = 2450 ml.
 */
export function calcularMetaAguaMl(pesoKg: number): number {
  const bruto = pesoKg * ML_POR_KG;

  return Math.round(bruto / 50) * 50;
}

/** IMC = peso / altura², com 1 casa decimal. Altura em centímetros. */
export function calcularImc(pesoKg: number, alturaCm: number): number {
  const alturaM = alturaCm / 100;
  const imc = pesoKg / (alturaM * alturaM);

  return Math.round(imc * 10) / 10;
}

export type FaixaImc = 'abaixo' | 'normal' | 'sobrepeso' | 'obesidade';

export const NOME_FAIXA_IMC: Record<FaixaImc, string> = {
  abaixo: 'abaixo do peso',
  normal: 'peso adequado',
  sobrepeso: 'sobrepeso',
  obesidade: 'obesidade',
};

/**
 * Classificação da OMS para ADULTOS.
 * Para menores de 18 anos retorna `null`: o correto é usar curvas de
 * percentil por idade e sexo, que o app ainda não tem.
 */
export function classificarImc(imc: number, idade: number): FaixaImc | null {
  if (idade < 18) {
    return null;
  }

  if (imc < 18.5) {
    return 'abaixo';
  }

  if (imc < 25) {
    return 'normal';
  }

  if (imc < 30) {
    return 'sobrepeso';
  }

  return 'obesidade';
}

/** "Eduardo Bertozzi" → "Eduardo" */
export function primeiroNome(nome: string): string {
  return nome.trim().split(/\s+/)[0] ?? '';
}
