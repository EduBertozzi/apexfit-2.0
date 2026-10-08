import { useMemo } from 'react';

import { chaveDoDia } from '@/shared/lib/data';

import { sequenciaDeDias } from './semana';
import {
  diasDeTreinoNoTotal,
  diasDoMes,
  fraseDaSequencia,
  maiorSequencia,
  marcos,
  resumoDoTreinoDeHoje,
  rotuloDiasSeguidos,
  semanaDaSequencia,
} from './sequencia';
import { useTreinosStore } from './store';

/** Tudo o que a página de sequência mostra, calculado pela lógica pura. */
export function useSequencia(data: Date) {
  const treinos = useTreinosStore((state) => state.treinos);
  const sessoes = useTreinosStore((state) => state.sessoes);
  const hoje = chaveDoDia(data);

  return useMemo(() => {
    const atual = sequenciaDeDias(treinos, sessoes, hoje);
    const recorde = Math.max(maiorSequencia(treinos, sessoes, hoje), atual);

    return {
      hoje,
      atual,
      recorde,
      frase: fraseDaSequencia(atual),
      rotulo: rotuloDiasSeguidos(atual),
      semana: semanaDaSequencia(treinos, sessoes, hoje),
      total: diasDeTreinoNoTotal(treinos, sessoes, hoje),
      noMes: diasDoMes(
        Number(hoje.slice(0, 4)),
        Number(hoje.slice(5, 7)) - 1,
        treinos,
        sessoes,
        hoje,
      ).treinos,
      marcos: marcos(atual, recorde),
      treinoDeHoje: resumoDoTreinoDeHoje(treinos, sessoes, hoje),
    };
  }, [treinos, sessoes, hoje]);
}

/** Um mês do calendário (`mes` de 0 a 11). */
export function useMesDaSequencia(ano: number, mes: number, data: Date) {
  const treinos = useTreinosStore((state) => state.treinos);
  const sessoes = useTreinosStore((state) => state.sessoes);
  const hoje = chaveDoDia(data);

  return useMemo(
    () => diasDoMes(ano, mes, treinos, sessoes, hoje),
    [ano, mes, treinos, sessoes, hoje],
  );
}
