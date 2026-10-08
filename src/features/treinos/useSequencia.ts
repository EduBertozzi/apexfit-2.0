import { useMemo } from 'react';

import { chaveDoDia } from '@/shared/lib/data';

import { emUltimaChance, textoCongeladores, textoProximoCongelador } from './regraSequencia';
import type { MarcasDosDias } from './semana';
import {
  diasDeTreinoNoTotal,
  diasDoMes,
  fraseDaSequencia,
  marcos,
  mesesDoCalendario,
  resumoDoTreinoDeHoje,
  rotuloDiasSeguidos,
  semanaDaSequencia,
} from './sequencia';
import { useResultadoSequencia, useTreinosStore } from './store';

/** Tudo o que a página de sequência mostra, calculado pela lógica pura. */
export function useSequencia(data: Date) {
  const treinos = useTreinosStore((state) => state.treinos);
  const sessoes = useTreinosStore((state) => state.sessoes);
  const resultado = useResultadoSequencia(data);
  const hoje = chaveDoDia(data);

  return useMemo(() => {
    const { atual, congeladores } = resultado;
    const recorde = Math.max(resultado.recorde, atual);

    return {
      hoje,
      atual,
      recorde,
      frase: fraseDaSequencia(atual),
      rotulo: rotuloDiasSeguidos(atual),
      semana: semanaDaSequencia(treinos, sessoes, hoje, resultado.marcas),
      total: diasDeTreinoNoTotal(treinos, sessoes, hoje),
      noMes: diasDoMes(
        Number(hoje.slice(0, 4)),
        Number(hoje.slice(5, 7)) - 1,
        treinos,
        sessoes,
        hoje,
        resultado.marcas,
      ).treinos,
      marcos: marcos(atual, recorde),
      treinoDeHoje: resumoDoTreinoDeHoje(treinos, sessoes, hoje),
      congeladores,
      textoCongeladores: textoCongeladores(congeladores),
      textoProximoCongelador: textoProximoCongelador(atual, congeladores),
      ultimaChance: emUltimaChance(resultado),
      risco: resultado.risco,
    };
  }, [treinos, sessoes, hoje, resultado]);
}

/** Meses do calendário (do primeiro treino até hoje) e as marcas da regra da sequência. */
export function useMesesDaSequencia(data: Date) {
  const sessoes = useTreinosStore((state) => state.sessoes);
  const hoje = chaveDoDia(data);
  const { marcas } = useResultadoSequencia(data);
  const meses = useMemo(() => mesesDoCalendario(sessoes, hoje), [sessoes, hoje]);

  return { meses, marcas };
}

/** Um mês do calendário (`mes` de 0 a 11), pintado com as marcas da sequência. */
export function useMesDaSequencia(ano: number, mes: number, data: Date, marcas: MarcasDosDias) {
  const treinos = useTreinosStore((state) => state.treinos);
  const sessoes = useTreinosStore((state) => state.sessoes);
  const hoje = chaveDoDia(data);

  return useMemo(
    () => diasDoMes(ano, mes, treinos, sessoes, hoje, marcas),
    [ano, mes, treinos, sessoes, hoje, marcas],
  );
}
