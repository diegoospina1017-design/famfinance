import * as Notifications from 'expo-notifications';
import { Platform } from 'react-native';
import type { Reminder } from '../types';
import { reminderEmoji, reminderLabel } from '../utils/format';

Notifications.setNotificationHandler({
  handleNotification: async () => ({
    shouldPlaySound: true,
    shouldSetBadge: false,
    shouldShowBanner: true,
    shouldShowList: true,
  }),
});

/**
 * Pide permisos de notificación. Devuelve si fueron concedidos y, opcionalmente,
 * el Expo push token. En Expo Go SDK 53+ el push token no está disponible —
 * eso no impide que las notificaciones locales (recordatorios) funcionen.
 */
export async function registerForPushNotificationsAsync(): Promise<{
  granted: boolean;
  pushToken: string | null;
}> {
  if (Platform.OS === 'android') {
    await Notifications.setNotificationChannelAsync('default', {
      name: 'default',
      importance: Notifications.AndroidImportance.DEFAULT,
    });
  }
  const existing = await Notifications.getPermissionsAsync();
  let status = existing.status;
  if (status !== 'granted') {
    const req = await Notifications.requestPermissionsAsync();
    status = req.status;
  }
  if (status !== 'granted') return { granted: false, pushToken: null };

  let pushToken: string | null = null;
  try {
    const token = await Notifications.getExpoPushTokenAsync();
    pushToken = token.data;
  } catch {
    // Expo Go en SDK 53+ no soporta push tokens. Las notificaciones locales
    // siguen funcionando, así que ignoramos este error.
  }
  return { granted: true, pushToken };
}

/**
 * Programa una notificación local para un recordatorio. No requiere servidor.
 */
export async function scheduleLocalReminder(
  reminder: Reminder,
  plantNickname: string,
): Promise<string | null> {
  const fireAt = new Date(reminder.nextRunAt);
  if (fireAt.getTime() <= Date.now()) return null;
  const seconds = Math.max(60, Math.floor((fireAt.getTime() - Date.now()) / 1000));
  return Notifications.scheduleNotificationAsync({
    content: {
      title: `${reminderEmoji(reminder.type)} ${reminderLabel(reminder.type)} pendiente`,
      body: `Es hora de cuidar a ${plantNickname}.`,
      data: { plantId: reminder.plantId, reminderId: reminder.id },
    },
    trigger: { seconds, repeats: false } as any,
  });
}

export async function cancelAllNotifications(): Promise<void> {
  await Notifications.cancelAllScheduledNotificationsAsync();
}
