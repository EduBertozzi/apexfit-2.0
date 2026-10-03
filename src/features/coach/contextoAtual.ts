import { metaAguaEfetiva } from '@/features/ajustes/logica';
import { useAjustesStore } from '@/features/ajustes/store';
import { useDietaStore } from '@/features/dieta/store';
import { historicoDeDias, sequenciaAtual } from '@/features/hidratacao/historico';
import { totalDoDia } from '@/features/hidratacao/logica';
import { useHidratacaoStore } from '@/features/hidratacao/store';
import { calcularNecessidades } from '@/features/nutricao/calculos';
import { calcularMetaAguaMl } from '@/features/perfil/calculos';
import { usePerfilStore } from '@/features/perfil/store';
import { chaveDoDia, dataPorExtenso } from '@/shared/lib/data';

import { montarContextoCoach } from './contexto';

/**
 * Junta o estado atual de todas as features num texto para o coach.
 * Lido na hora de enviar, então sempre vai o dado mais novo.
 * Feature nova com informação útil para o coach: adicione um bloco em `extras`.
 */
export function contextoAtual(agora: Date = new Date()): string | null {
  const perfil = usePerfilStore.getState().perfil;

  if (!perfil) {
    return null;
  }

  const registros = useHidratacaoStore.getState().registros;
  const metaMl = metaAguaEfetiva(
    calcularMetaAguaMl(perfil.pesoKg),
    useAjustesStore.getState().metaAguaManualMl,
  );

  return montarContextoCoach({
    perfil,
    necessidades: calcularNecessidades(perfil),
    agua: {
      hojeMl: totalDoDia(registros[chaveDoDia(agora)]),
      metaMl,
      diasBatidosNaSemana: historicoDeDias(registros, agora, metaMl).filter((dia) => dia.bateu)
        .length,
      sequencia: sequenciaAtual(registros, agora, metaMl),
    },
    plano: useDietaStore.getState().plano,
    hoje: dataPorExtenso(agora),
    extras: [],
  });
}
