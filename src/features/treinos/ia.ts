import { distribuirDias } from './diasIa';
import { inferirGrupo } from './grupos';
import { chaveDoDia } from '@/shared/lib/data';

import { criarTreino, ficaNoHistorico, guardarRegistros, novoId } from './logica';
import type { RespostaTreinosIa } from './contratoIa';
import { exercicioSchema, LIMITES } from './schema';
import type { DadosExercicio, DadosTreino, GeradorId, Sessao, Treino } from './types';

/**
 * Converte os treinos que a IA (ou o modo demonstração) montou nos dados que
 * o app salva. A IA às vezes escreve "8-12 reps" ou 7 séries: aqui tudo volta
 * para o formato que o formulário de exercício aceita.
 */

const REPETICOES_PADRAO = '10';

function limitar(valor: number, min: number, max: number): number {
  return Math.min(max, Math.max(min, valor));
}

function cortar(texto: string, max: number): string {
  return texto.trim().slice(0, max).trim();
}

/** "8-12 reps" vira "8 a 12"; "30 s" vira "30"; sem número, "10". */
export function normalizarRepeticoes(texto: string): string {
  const validado = exercicioSchema.shape.repeticoes.safeParse(texto);

  if (validado.success) {
    return validado.data;
  }

  const { min, max } = LIMITES.repeticoes;
  const numeros = (texto.match(/\d+/g) ?? []).map((numero) => limitar(Number(numero), min, max));

  if (numeros.length >= 2 && numeros[1] > numeros[0]) {
    return `${numeros[0]} a ${numeros[1]}`;
  }

  return numeros.length > 0 ? String(numeros[0]) : REPETICOES_PADRAO;
}

/**
 * A IA às vezes manda só "8" num exercício por tempo e explica "8 minutos" na
 * observação. No card isso viraria "1x8"; aqui vira "8 min".
 */
export function comUnidadeDeTempo(repeticoes: string, grupo: string, observacao: string): string {
  const porTempo = grupo === 'cardio' || grupo === 'aquecimento';
  const soNumero = /^\d+$/.test(repeticoes.trim());

  return porTempo && soNumero && /minuto/i.test(observacao)
    ? `${repeticoes.trim()} min`
    : repeticoes;
}

export function paraDadosTreino(resultado: RespostaTreinosIa): DadosTreino[] {
  return resultado.treinos
    .map((treino, indice): DadosTreino => {
      const exercicios = treino.exercicios
        .filter((exercicio) => exercicio.nome.trim().length >= LIMITES.nomeExercicio.min)
        .map((exercicio): DadosExercicio => {
          const nome = cortar(exercicio.nome, LIMITES.nomeExercicio.max);
          const observacao = exercicio.observacao
            ? cortar(exercicio.observacao, LIMITES.observacao.max)
            : '';

          return {
            nome,
            grupo: exercicio.grupo ?? inferirGrupo(nome),
            series: limitar(
              Math.round(exercicio.series) || 1,
              LIMITES.series.min,
              LIMITES.series.max,
            ),
            repeticoes: comUnidadeDeTempo(
              normalizarRepeticoes(exercicio.repeticoes),
              exercicio.grupo ?? inferirGrupo(nome),
              observacao,
            ),
            ...(observacao === '' ? {} : { observacao }),
          };
        });

      const nome = cortar(treino.nome, LIMITES.nomeTreino.max);
      const foco = cortar(treino.foco, LIMITES.foco.max);

      return {
        nome: nome === '' ? `Treino ${String.fromCharCode(65 + indice)}` : nome,
        ...(foco === '' ? {} : { foco }),
        exercicios,
      };
    })
    .filter((treino) => (treino.exercicios ?? []).length > 0);
}

/**
 * Troca todos os treinos pelos novos. O histórico (sessões finalizadas) fica;
 * a sessão aberta de hoje some, porque era de um treino que não existe mais.
 */
export function substituirTreinos(
  sessoes: readonly Sessao[],
  dados: readonly DadosTreino[],
  gerarId: GeradorId = novoId,
  antigos: readonly Treino[] = [],
  hoje: string = chaveDoDia(new Date()),
): { treinos: Treino[]; sessoes: Sessao[] } {
  const treinos = dados.map((treino) => criarTreino(treino, gerarId));
  const historico = sessoes.filter((sessao) => ficaNoHistorico(sessao, hoje));

  return { treinos, sessoes: guardarRegistros(historico, antigos, treinos) };
}

/**
 * Dá dias da semana a um conjunto NOVO de treinos: os dias pedidos no texto
 * ("segunda, quarta e sexta") ou, sem eles, espalhados pela semana (`diasPadrao`).
 */
export function comDias(
  dados: readonly DadosTreino[],
  diasPedidos: readonly number[] = [],
): DadosTreino[] {
  const dias = distribuirDias(dados.length, diasPedidos);

  return dados.map((treino, indice) =>
    dias[indice].length > 0 ? { ...treino, dias: dias[indice] } : treino,
  );
}
