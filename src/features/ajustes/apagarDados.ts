import { useCoachStore } from '@/features/coach/store';
import { useDietaStore } from '@/features/dieta/store';
import { useHidratacaoStore } from '@/features/hidratacao/store';
import { cancelarAviso } from '@/features/lembretes/notificacoes';
import { useLembretesStore } from '@/features/lembretes/store';
import { apagarTodasAsFotos } from '@/features/perfil/arquivoFoto';
import { usePerfilStore } from '@/features/perfil/store';
import { usePesoStore } from '@/features/peso/store';
import { useTreinosStore } from '@/features/treinos/store';
import { useTreinosIaStore } from '@/features/treinos/storeIa';
import { ID_AVISO_ULTIMA_CHANCE } from '@/features/treinos/ultimaChance';

import { useAjustesStore } from './store';

/**
 * "Apagar meus dados" (LGPD): limpa TUDO que o app guardou no aparelho.
 * Toda store nova com dado do usuário precisa entrar aqui.
 * O perfil vai por último: sem ele, o _layout volta sozinho para o onboarding.
 */
export function apagarTodosOsDados() {
  useHidratacaoStore.getState().apagarTudo();
  useDietaStore.getState().apagarTudo();
  useCoachStore.getState().limpar();
  usePesoStore.getState().apagarTudo();
  useTreinosStore.getState().apagarTudo();
  useTreinosIaStore.getState().apagarTudo();
  useAjustesStore.getState().restaurarPadrao();
  // Volta ao padrão na hora; o cancelamento das notificações agendadas termina em segundo plano
  void useLembretesStore.getState().apagarTudo();
  void cancelarAviso(ID_AVISO_ULTIMA_CHANCE).catch(() => {});
  // A foto do perfil é um arquivo à parte, fora das stores
  apagarTodasAsFotos();
  usePerfilStore.getState().apagarPerfil();
}
