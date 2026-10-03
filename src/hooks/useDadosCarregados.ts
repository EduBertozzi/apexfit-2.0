import { useEffect, useState } from 'react';

import { useDietaStore } from '@/features/dieta/store';
import { useHidratacaoStore } from '@/features/hidratacao/store';
import { usePerfilStore } from '@/features/perfil/store';

// Todas as stores que salvam no aparelho entram nesta lista
const STORES_PERSISTIDAS = [usePerfilStore, useHidratacaoStore, useDietaStore];

function todasCarregadas() {
  return STORES_PERSISTIDAS.every((store) => store.persist.hasHydrated());
}

/**
 * Ler do AsyncStorage é assíncrono. Até terminar, o app não sabe se já existe perfil.
 * Sem esperar, o onboarding "piscaria" na tela de quem já tem conta.
 */
export function useDadosCarregados(): boolean {
  const [carregado, setCarregado] = useState(todasCarregadas);

  useEffect(() => {
    const atualizar = () => setCarregado(todasCarregadas());

    const cancelarInscricoes = STORES_PERSISTIDAS.map((store) =>
      store.persist.onFinishHydration(atualizar),
    );

    atualizar();

    return () => cancelarInscricoes.forEach((cancelar) => cancelar());
  }, []);

  return carregado;
}
