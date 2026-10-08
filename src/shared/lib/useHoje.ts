import { useEffect, useState } from 'react';
import { AppState } from 'react-native';

import { chaveDoDia } from './data';

/** Quanto falta para a próxima meia-noite (com meio segundo de folga). */
export function msAteMeiaNoite(agora: Date): number {
  const amanha = new Date(agora.getFullYear(), agora.getMonth(), agora.getDate() + 1);

  return amanha.getTime() - agora.getTime() + 500;
}

/**
 * A data de hoje que se atualiza sozinha: na virada da meia-noite com o app
 * aberto, e quando o app volta do segundo plano num dia diferente.
 * Sem isso, quem deixa o app aberto continua vendo o treino de ontem.
 */
export function useHoje(): Date {
  const [hoje, setHoje] = useState(() => new Date());
  const chave = chaveDoDia(hoje);

  useEffect(() => {
    const atualizarSeMudou = () => {
      const agora = new Date();

      if (chaveDoDia(agora) !== chave) {
        setHoje(agora);
      }
    };

    const timer = setTimeout(atualizarSeMudou, msAteMeiaNoite(new Date()));
    const assinatura = AppState.addEventListener('change', (estado) => {
      if (estado === 'active') {
        atualizarSeMudou();
      }
    });

    return () => {
      clearTimeout(timer);
      assinatura.remove();
    };
  }, [chave]);

  return hoje;
}
