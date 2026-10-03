import { useDietaStore } from '@/features/dieta/store';
import { useHidratacaoStore } from '@/features/hidratacao/store';
import { usePerfilStore } from '@/features/perfil/store';
import { useTreinosStore } from '@/features/treinos/store';

import { useAjustesStore } from './store';

/**
 * "Apagar meus dados" (LGPD): limpa TUDO que o app guardou no aparelho.
 * Toda store nova com dado do usuário precisa entrar aqui.
 * O perfil vai por último: sem ele, o _layout volta sozinho para o onboarding.
 */
export function apagarTodosOsDados() {
  useHidratacaoStore.getState().apagarTudo();
  useDietaStore.getState().apagarTudo();
  useTreinosStore.getState().apagarTudo();
  useAjustesStore.getState().restaurarPadrao();
  usePerfilStore.getState().apagarPerfil();
}
