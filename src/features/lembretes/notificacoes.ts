import * as Notifications from 'expo-notifications';
import { Platform } from 'react-native';

import { PREFIXO_ID, type Lembrete } from './logica';

/**
 * Único arquivo que conversa com expo-notifications. Nos testes ele é trocado por um mock.
 * Só notificações LOCAIS (agendadas no próprio celular): funcionam no Expo Go,
 * no Android e no iPhone. Push remoto não é usado aqui.
 */

const CANAL_ANDROID = 'lembretes-agua';

/** Na web o expo-notifications não funciona: a tela explica e nada é agendado. */
export function notificacoesSuportadas(): boolean {
  return Platform.OS !== 'web';
}

/** Sem isso, notificação que chega com o app aberto não aparece. Chamar uma vez ao abrir. */
export function configurarExibicaoComAppAberto() {
  if (!notificacoesSuportadas()) {
    return;
  }

  Notifications.setNotificationHandler({
    handleNotification: async () => ({
      shouldShowBanner: true,
      shouldShowList: true,
      shouldPlaySound: false,
      shouldSetBadge: false,
    }),
  });
}

// No Android 13+, o pedido de permissão só aparece depois que existe um canal
async function criarCanalAndroid() {
  if (Platform.OS !== 'android') {
    return;
  }

  await Notifications.setNotificationChannelAsync(CANAL_ANDROID, {
    name: 'Lembretes de água',
    importance: Notifications.AndroidImportance.DEFAULT,
  });
}

function permitido(status: Notifications.NotificationPermissionsStatus): boolean {
  return status.granted || status.ios?.status === Notifications.IosAuthorizationStatus.PROVISIONAL;
}

/** Pede permissão (se ainda não tiver). Retorna se pode notificar. */
export async function pedirPermissao(): Promise<boolean> {
  if (!notificacoesSuportadas()) {
    return false;
  }

  await criarCanalAndroid();

  const atual = await Notifications.getPermissionsAsync();

  if (permitido(atual)) {
    return true;
  }

  if (!atual.canAskAgain) {
    return false;
  }

  return permitido(await Notifications.requestPermissionsAsync());
}

/** Cancela só os lembretes de água do ApexFit, sem mexer em outras notificações. */
export async function cancelarLembretes(): Promise<void> {
  if (!notificacoesSuportadas()) {
    return;
  }

  const agendadas = await Notifications.getAllScheduledNotificationsAsync();

  await Promise.all(
    agendadas
      .filter((notificacao) => notificacao.identifier.startsWith(PREFIXO_ID))
      .map((notificacao) => Notifications.cancelScheduledNotificationAsync(notificacao.identifier)),
  );
}

/** Troca os lembretes agendados por estes, cada um repetindo todo dia no mesmo horário. */
export async function agendarLembretes(lembretes: Lembrete[]): Promise<void> {
  if (!notificacoesSuportadas()) {
    return;
  }

  await cancelarLembretes();
  await criarCanalAndroid();

  for (const lembrete of lembretes) {
    await Notifications.scheduleNotificationAsync({
      identifier: lembrete.id,
      content: { title: lembrete.titulo, body: lembrete.corpo },
      trigger: {
        type: Notifications.SchedulableTriggerInputTypes.DAILY,
        hour: lembrete.hora,
        minute: lembrete.minuto,
        channelId: CANAL_ANDROID,
      },
    });
  }
}

// ---------------------------------------------------------------------------
// Avisos de um dia só (ex: "última chance" da sequência de treinos)
// ---------------------------------------------------------------------------

const CANAL_SEQUENCIA = 'sequencia-treinos';

/** Aviso único, numa data e hora. O plano (quando e o texto) vem da lógica pura da feature. */
export type AvisoUnico = {
  /** O mesmo id substitui o agendamento anterior. */
  id: string;
  titulo: string;
  corpo: string;
  quando: Date;
};

/** Já tem permissão? Não pede nada: só confere (o pedido fica nos lembretes de água). */
export async function podeNotificar(): Promise<boolean> {
  if (!notificacoesSuportadas()) {
    return false;
  }

  return permitido(await Notifications.getPermissionsAsync());
}

/** Agenda (ou reagenda) um aviso que toca uma vez só. */
export async function agendarAvisoUnico(aviso: AvisoUnico): Promise<void> {
  if (!notificacoesSuportadas()) {
    return;
  }

  if (Platform.OS === 'android') {
    await Notifications.setNotificationChannelAsync(CANAL_SEQUENCIA, {
      name: 'Sequência de treinos',
      importance: Notifications.AndroidImportance.DEFAULT,
    });
  }

  await Notifications.cancelScheduledNotificationAsync(aviso.id);
  await Notifications.scheduleNotificationAsync({
    identifier: aviso.id,
    content: { title: aviso.titulo, body: aviso.corpo },
    trigger: {
      type: Notifications.SchedulableTriggerInputTypes.DATE,
      date: aviso.quando,
      channelId: CANAL_SEQUENCIA,
    },
  });
}

/** Cancela um aviso agendado pelo id (sem erro se não existir). */
export async function cancelarAviso(id: string): Promise<void> {
  if (!notificacoesSuportadas()) {
    return;
  }

  await Notifications.cancelScheduledNotificationAsync(id);
}
