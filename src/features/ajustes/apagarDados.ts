import { useDietaStore } from '@/features/dieta/store';
import { useHidratacaoStore } from '@/features/hidratacao/store';
import { useLembretesStore } from '@/features/lembretes/store';
import { usePerfilStore } from '@/features/perfil/store';

import { useAjustesStore } from './store';

/**
 * "Apagar meus dados" (LGPD): limpa TUDO que o app guardou no aparelho.
 * Toda store nova com dado do usuário precisa entrar aqui.
 * O perfil vai por último: sem ele, o _layout volta sozinho para o onboarding.
 */
export function apagarTodosOsDados() {
  useHidratacaoStore.getState().apagarTudo();
  useDietaStore.getState().apagarTudo();
  useAjustesStore.getState().restaurarPadrao();
  // Volta ao padrão na hora; o cancelamento das notificações agendadas termina em segundo plano
  void useLembretesStore.getState().apagarTudo();
  usePerfilStore.getState().apagarPerfil();
}
