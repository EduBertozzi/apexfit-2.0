import { metaAguaEfetiva } from '@/features/ajustes/logica';
import { useAjustesStore } from '@/features/ajustes/store';
import { useDietaStore } from '@/features/dieta/store';
import { historicoDeDias, sequenciaAtual } from '@/features/hidratacao/historico';
import { totalDoDia } from '@/features/hidratacao/logica';
import { useHidratacaoStore } from '@/features/hidratacao/store';
import { calcularNecessidades } from '@/features/nutricao/calculos';
import {
  registrosRecentes,
  variacaoPorExtenso,
  variacao,
  formatarKg,
} from '@/features/peso/logica';
import { usePesoStore } from '@/features/peso/store';
import { calcularMetaAguaMl } from '@/features/perfil/calculos';
import { usePerfilStore } from '@/features/perfil/store';
import {
  proximoTreino,
  resumoExercicio,
  resumoTreino,
  sequenciaDeTreinos,
  textoTreinosNaSemana,
  treinosNaSemana,
} from '@/features/treinos/logica';
import { useTreinosStore } from '@/features/treinos/store';
import { chaveDoDia, dataPorExtenso } from '@/shared/lib/data';

import { montarContextoCoach } from './contexto';
import type { DadosDemo } from './demo';

/**
 * Junta o estado atual de todas as features. Lido na hora de enviar, então
 * sempre vai o dado mais novo. Feature nova útil para o coach: entra aqui e em `extras`.
 */
export function dadosAtuais(agora: Date = new Date()): DadosDemo | null {
  const perfil = usePerfilStore.getState().perfil;

  if (!perfil) {
    return null;
  }

  const hoje = chaveDoDia(agora);
  const registros = useHidratacaoStore.getState().registros;
  const metaMl = metaAguaEfetiva(
    calcularMetaAguaMl(perfil.pesoKg),
    useAjustesStore.getState().metaAguaManualMl,
  );
  const { treinos, sessoes } = useTreinosStore.getState();
  const pesos = usePesoStore.getState().registros;

  return {
    perfil,
    necessidades: calcularNecessidades(perfil),
    agua: {
      hojeMl: totalDoDia(registros[hoje]),
      metaMl,
      diasBatidosNaSemana: historicoDeDias(registros, agora, metaMl).filter((dia) => dia.bateu)
        .length,
      sequencia: sequenciaAtual(registros, agora, metaMl),
    },
    plano: useDietaStore.getState().plano,
    hoje: dataPorExtenso(agora),
    extras: [blocoPeso(hoje), blocoTreinos(hoje)],
    treinos: {
      proximo: proximoTreino(treinos, sessoes, hoje)?.nome,
      naSemana: treinosNaSemana(sessoes, hoje),
      sequenciaSemanas: sequenciaDeTreinos(sessoes, hoje),
    },
    peso: {
      variacao30Dias: variacao(pesos, hoje, 30),
      ultimoKg: registrosRecentes(pesos, 1)[0]?.kg,
    },
  };
}

/** O mesmo, em texto, para a IA. */
export function contextoAtual(agora: Date = new Date()): string | null {
  const dados = dadosAtuais(agora);

  return dados ? montarContextoCoach(dados) : null;
}

function blocoPeso(hoje: string): string {
  const registros = usePesoStore.getState().registros;

  if (registros.length === 0) {
    return '## Peso\nNenhum registro de peso ainda (só o peso do perfil).';
  }

  const ultimos = registrosRecentes(registros, 5)
    .map((registro) => `${registro.data}: ${formatarKg(registro.kg)}`)
    .join('; ');

  return [
    '## Peso',
    variacaoPorExtenso(variacao(registros, hoje, 30), 30),
    `Últimos registros: ${ultimos}`,
  ].join('\n');
}

function blocoTreinos(hoje: string): string {
  const { treinos, sessoes } = useTreinosStore.getState();

  if (treinos.length === 0) {
    return '## Treinos\nNenhum treino montado ainda. Pode sugerir montar na aba Treinos.';
  }

  const proximo = proximoTreino(treinos, sessoes, hoje);
  const linhas = treinos.map(
    (treino) =>
      `${treino.nome} (${resumoTreino(treino)}): ` +
      treino.exercicios.map((ex) => `${ex.nome} ${resumoExercicio(ex)}`).join('; '),
  );

  return [
    '## Treinos',
    `${textoTreinosNaSemana(treinosNaSemana(sessoes, hoje))}; sequência de ${sequenciaDeTreinos(sessoes, hoje)} semanas seguidas treinando`,
    proximo ? `Próximo treino sugerido: ${proximo.nome}` : null,
    ...linhas,
  ]
    .filter((linha) => linha !== null)
    .join('\n');
}
