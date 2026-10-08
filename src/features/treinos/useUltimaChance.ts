import { useEffect } from 'react';

import { chaveDoDia } from '@/shared/lib/data';
import { agendarAvisoUnico, cancelarAviso, podeNotificar } from '@/features/lembretes/notificacoes';

import { emUltimaChance, textoUltimaChance } from './regraSequencia';
import { useResultadoSequencia, useTreinosStore } from './store';
import { planejarAvisoUltimaChance } from './ultimaChance';

/**
 * Efeitos finos da sequência (a regra está em `regraSequencia.ts` e `ultimaChance.ts`):
 * - guarda na store os dias que a regra acabou de congelar;
 * - agenda ou cancela a notificação de última chance de hoje.
 * Devolve se o aviso de última chance aparece e o texto dele.
 */
export function useUltimaChance(hoje: Date) {
  const resultado = useResultadoSequencia(hoje);
  const registrarCongelados = useTreinosStore((state) => state.registrarCongelados);
  const { atual, risco, congeladosNovos } = resultado;
  const mostrar = emUltimaChance(resultado);
  const dia = chaveDoDia(hoje);

  useEffect(() => {
    if (congeladosNovos.length > 0) {
      registrarCongelados(congeladosNovos);
    }
  }, [congeladosNovos, registrarCongelados]);

  useEffect(() => {
    let cancelado = false;
    const plano = planejarAvisoUltimaChance({ emRisco: mostrar, atual, risco, agora: new Date() });

    const aplicar = async () => {
      if (plano.acao === 'cancelar') {
        await cancelarAviso(plano.id);

        return;
      }

      // Sem permissão, não pede aqui: quem liga notificações são os lembretes de água
      if (!cancelado && (await podeNotificar())) {
        await agendarAvisoUnico(plano);
      }
    };

    aplicar().catch((erro) => {
      console.warn('Não deu para atualizar o aviso de última chance', erro);
    });

    return () => {
      cancelado = true;
    };
  }, [mostrar, atual, risco, dia]);

  return { mostrar, texto: textoUltimaChance(atual, risco) };
}
