import { LIMITES } from '@/features/perfil/schema';
import { chaveDoDia, diasEntre } from '@/shared/lib/data';
import { formatarNumero } from '@/shared/lib/numero';

/** Um peso por dia. `data` é a chave AAAA-MM-DD de `chaveDoDia`. */
export type RegistroPeso = { data: string; kg: number };

/** Quantos dias de histórico guardamos no aparelho (pouco mais de um ano). */
export const DIAS_DE_HISTORICO = 400;

/** Passo do contador na tela: 100 g. */
export const PASSO_KG = 0.1;

/** Períodos que o gráfico mostra. */
export const PERIODOS = [30, 90] as const;
export type Periodo = (typeof PERIODOS)[number];

/** Janela da linha de tendência (média dos últimos 7 dias). */
export const JANELA_TENDENCIA = 7;

const MESES = [
  'jan',
  'fev',
  'mar',
  'abr',
  'mai',
  'jun',
  'jul',
  'ago',
  'set',
  'out',
  'nov',
  'dez',
] as const;

/** Arredonda para 1 casa (100 g), evitando 74.30000000000001. */
export function arredondarKg(kg: number): number {
  return Math.round(kg * 10) / 10;
}

/** Mesmos limites do cadastro de perfil. */
export function pesoValido(kg: number): boolean {
  return Number.isFinite(kg) && kg >= LIMITES.pesoKg.min && kg <= LIMITES.pesoKg.max;
}

/** Soma ou subtrai `n` dias de uma chave AAAA-MM-DD, no calendário local. */
export function somarDias(chave: string, n: number): string {
  const ano = Number(chave.slice(0, 4));
  const mes = Number(chave.slice(5, 7)) - 1;
  const dia = Number(chave.slice(8, 10));

  return chaveDoDia(new Date(ano, mes, dia + n));
}

/** Do mais antigo para o mais recente. Não altera a lista original. */
export function ordenar(registros: readonly RegistroPeso[]): RegistroPeso[] {
  return [...registros].sort((a, b) => (a.data < b.data ? -1 : a.data > b.data ? 1 : 0));
}

/** Adiciona o peso do dia. Se o dia já tem registro, o novo substitui. Peso inválido é ignorado. */
export function registrarPeso(
  registros: readonly RegistroPeso[],
  data: string,
  kg: number,
): RegistroPeso[] {
  if (!pesoValido(kg)) {
    return [...registros];
  }

  const semODia = registros.filter((registro) => registro.data !== data);

  return ordenar([...semODia, { data, kg: arredondarKg(kg) }]);
}

export function removerRegistro(registros: readonly RegistroPeso[], data: string): RegistroPeso[] {
  return registros.filter((registro) => registro.data !== data);
}

/** Tira registros mais antigos que o limite, para o armazenamento não crescer para sempre. */
export function limparHistoricoAntigo(
  registros: readonly RegistroPeso[],
  hoje: string,
): RegistroPeso[] {
  return registros.filter((registro) => diasEntre(registro.data, hoje) < DIAS_DE_HISTORICO);
}

export function ultimoRegistro(registros: readonly RegistroPeso[]): RegistroPeso | null {
  const ordenados = ordenar(registros);

  return ordenados[ordenados.length - 1] ?? null;
}

/** Os `quantidade` registros mais recentes, do mais novo para o mais antigo (para a lista). */
export function registrosRecentes(
  registros: readonly RegistroPeso[],
  quantidade = 10,
): RegistroPeso[] {
  return ordenar(registros).reverse().slice(0, quantidade);
}

/** Valor inicial do contador: último peso registrado, ou o do perfil se ainda não há registro. */
export function pesoInicial(registros: readonly RegistroPeso[], pesoPerfilKg: number): number {
  return ultimoRegistro(registros)?.kg ?? arredondarKg(pesoPerfilKg);
}

/** Um passo do contador, dentro dos limites. */
export function ajustarPeso(kg: number, direcao: 1 | -1): number {
  const proximo = arredondarKg(kg + direcao * PASSO_KG);

  return Math.min(Math.max(proximo, LIMITES.pesoKg.min), LIMITES.pesoKg.max);
}

export function podeAjustarPeso(kg: number, direcao: 1 | -1): boolean {
  return ajustarPeso(kg, direcao) !== arredondarKg(kg);
}

/** Registros entre `inicio` e `fim` (inclusive), em ordem. */
function noIntervalo(registros: readonly RegistroPeso[], inicio: string, fim: string) {
  return ordenar(registros).filter((registro) => registro.data >= inicio && registro.data <= fim);
}

/**
 * Quanto o peso mudou nos últimos `dias` (positivo = subiu).
 * Compara o registro mais recente com o último registro de antes do período
 * (ou o primeiro dentro dele). `null` quando não há dois registros para comparar.
 */
export function variacao(
  registros: readonly RegistroPeso[],
  hoje: string,
  dias: number,
): number | null {
  const ate = ordenar(registros).filter((registro) => registro.data <= hoje);
  const atual = ate[ate.length - 1];

  if (!atual) {
    return null;
  }

  const inicio = somarDias(hoje, -dias);
  const antes = ate.filter((registro) => registro.data <= inicio);
  const dentro = ate.filter((registro) => registro.data > inicio);
  const base = antes[antes.length - 1] ?? dentro[0];

  if (!base || base.data === atual.data) {
    return null;
  }

  return arredondarKg(atual.kg - base.kg);
}

/**
 * Tendência: para cada registro, a média dos registros dos últimos 7 dias (incluindo ele).
 * Suaviza a variação do dia a dia (água, sal, intestino).
 */
export function mediaMovel(
  registros: readonly RegistroPeso[],
  janelaDias = JANELA_TENDENCIA,
): RegistroPeso[] {
  const ordenados = ordenar(registros);

  return ordenados.map((registro) => {
    const inicio = somarDias(registro.data, -(janelaDias - 1));
    const janela = ordenados.filter((r) => r.data >= inicio && r.data <= registro.data);
    const soma = janela.reduce((total, r) => total + r.kg, 0);

    return { data: registro.data, kg: arredondarKg(soma / janela.length) };
  });
}

/** Ponto do gráfico: `x` e `y` de 0 a 1 (y = 0 é o menor peso da escala, embaixo). */
export type PontoGrafico = { data: string; kg: number; x: number; y: number };

export type DadosGrafico = {
  pontos: PontoGrafico[];
  tendencia: PontoGrafico[];
  /** Escala do eixo vertical, já com folga e em kg inteiros. */
  minKg: number;
  maxKg: number;
  inicio: string;
  fim: string;
};

/** Folga mínima acima e abaixo da linha, para ela não colar na borda. */
const FOLGA_MINIMA_KG = 0.5;

/**
 * Prepara os pontos do gráfico dos últimos `dias` (hoje incluso).
 * A tendência usa também os registros de antes do período, para começar certa.
 */
export function pontosGrafico(
  registros: readonly RegistroPeso[],
  hoje: string,
  dias: number,
): DadosGrafico {
  const inicio = somarDias(hoje, -(dias - 1));
  const noPeriodo = noIntervalo(registros, inicio, hoje);
  const tendencia = mediaMovel(registros.filter((r) => r.data <= hoje)).filter(
    (r) => r.data >= inicio,
  );

  const todos = [...noPeriodo, ...tendencia].map((r) => r.kg);
  const menor = todos.length > 0 ? Math.min(...todos) : 0;
  const maior = todos.length > 0 ? Math.max(...todos) : 0;
  const folga = Math.max((maior - menor) * 0.1, FOLGA_MINIMA_KG);
  const minKg = Math.floor(menor - folga);
  const maxKg = Math.ceil(maior + folga);
  const ultimoDia = Math.max(dias - 1, 1);

  const paraPonto = (registro: RegistroPeso): PontoGrafico => ({
    data: registro.data,
    kg: registro.kg,
    x: diasEntre(inicio, registro.data) / ultimoDia,
    y: maxKg === minKg ? 0.5 : (registro.kg - minKg) / (maxKg - minKg),
  });

  return {
    pontos: noPeriodo.map(paraPonto),
    tendencia: tendencia.map(paraPonto),
    minKg,
    maxKg,
    inicio,
    fim: hoje,
  };
}

/** "2026-10-03" → "3 out" */
export function rotuloData(chave: string): string {
  return `${Number(chave.slice(8, 10))} ${MESES[Number(chave.slice(5, 7)) - 1]}`;
}

/** "Hoje", "Ontem" ou "3 out". */
export function rotuloDia(chave: string, hoje: string): string {
  const diferenca = diasEntre(chave, hoje);

  if (diferenca === 0) {
    return 'Hoje';
  }

  if (diferenca === 1) {
    return 'Ontem';
  }

  return rotuloData(chave);
}

export function formatarKg(kg: number): string {
  return `${formatarNumero(kg, 1)} kg`;
}

/** "+0,5 kg", "-0,8 kg", "0,0 kg". Usa hífen comum, que o leitor de tela lê como "menos". */
export function textoVariacao(kg: number): string {
  const sinal = kg > 0 ? '+' : kg < 0 ? '-' : '';

  return `${sinal}${formatarKg(Math.abs(kg))}`;
}

/** Variação em palavras, para o leitor de tela e legendas. */
export function variacaoPorExtenso(kg: number | null, dias: number): string {
  if (kg === null) {
    return `Sem registros suficientes para comparar os últimos ${dias} dias.`;
  }

  if (kg === 0) {
    return `Peso estável nos últimos ${dias} dias.`;
  }

  const sentido = kg < 0 ? 'Queda' : 'Alta';

  return `${sentido} de ${formatarKg(Math.abs(kg))} nos últimos ${dias} dias.`;
}

/** Resumo em texto do gráfico, lido pelo leitor de tela no lugar das linhas. */
export function descreverGrafico(
  registros: readonly RegistroPeso[],
  hoje: string,
  dias: number,
): string {
  const { pontos } = pontosGrafico(registros, hoje, dias);

  if (pontos.length === 0) {
    return `Gráfico de peso: nenhum registro nos últimos ${dias} dias.`;
  }

  const primeiro = pontos[0];
  const ultimo = pontos[pontos.length - 1];
  const quantos = pontos.length === 1 ? '1 registro' : `${pontos.length} registros`;

  if (pontos.length === 1) {
    return `Gráfico de peso dos últimos ${dias} dias: ${quantos}, ${formatarKg(ultimo.kg)}.`;
  }

  return (
    `Gráfico de peso dos últimos ${dias} dias: ${quantos}, ` +
    `de ${formatarKg(primeiro.kg)} em ${rotuloData(primeiro.data)} ` +
    `para ${formatarKg(ultimo.kg)} em ${rotuloData(ultimo.data)}. ` +
    variacaoPorExtenso(variacao(registros, hoje, dias), dias)
  );
}

export type ResumoPeso = {
  /** Último peso registrado, ou o do perfil quando ainda não há registro. */
  atualKg: number;
  temRegistros: boolean;
  /** Variação em 30 dias, ou `null` se não dá para comparar. */
  variacao30: number | null;
  /** O dia de hoje já tem peso registrado? */
  registrouHoje: boolean;
};

export function resumoPeso(
  registros: readonly RegistroPeso[],
  hoje: string,
  pesoPerfilKg: number,
): ResumoPeso {
  const ultimo = ultimoRegistro(registros);

  return {
    atualKg: ultimo?.kg ?? pesoPerfilKg,
    temRegistros: ultimo !== null,
    variacao30: variacao(registros, hoje, 30),
    registrouHoje: registros.some((registro) => registro.data === hoje),
  };
}
