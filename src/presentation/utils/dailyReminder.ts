import AsyncStorage from '@react-native-async-storage/async-storage';
import { isRunningInExpoGo } from 'expo';
import { Platform } from 'react-native';

type NotificationsModule = typeof import('expo-notifications');

const STORAGE_KEY = 'quranswift.dailyReminder';
const CHANNEL_ID = 'daily-reminder';
export const REMINDER_HOUR = 21;
export const REMINDER_MINUTE = 0;

export interface ReminderState {
  on: boolean;
  hour: number;
  minute: number;
}

let moduleRef: NotificationsModule | null | undefined;

function getNotifications(): NotificationsModule | null {
  if (moduleRef !== undefined) {
    return moduleRef;
  }
  // expo-notifications cannot run in Expo Go on Android (SDK 53+); load it lazily
  // so the app stays stable there. It works in a dev build / release APK.
  if (isRunningInExpoGo()) {
    moduleRef = null;
    return null;
  }
  try {
    // eslint-disable-next-line @typescript-eslint/no-var-requires
    const loaded = require('expo-notifications') as NotificationsModule;
    loaded.setNotificationHandler({
      handleNotification: async () => ({
        shouldShowBanner: true,
        shouldShowList: true,
        shouldPlaySound: false,
        shouldSetBadge: false,
      }),
    });
    moduleRef = loaded;
  } catch {
    moduleRef = null;
  }
  return moduleRef;
}

export function notificationsAvailable(): boolean {
  return getNotifications() !== null;
}

async function ensureChannel(notifications: NotificationsModule): Promise<void> {
  if (Platform.OS === 'android') {
    await notifications.setNotificationChannelAsync(CHANNEL_ID, {
      name: 'تذكير القراءة اليومي',
      importance: notifications.AndroidImportance.DEFAULT,
    });
  }
}

export async function ensureReminderPermission(): Promise<boolean> {
  const notifications = getNotifications();
  if (!notifications) {
    return false;
  }
  const current = await notifications.getPermissionsAsync();
  if (current.granted) {
    return true;
  }
  if (current.canAskAgain === false) {
    return false;
  }
  const asked = await notifications.requestPermissionsAsync();
  return asked.granted;
}

export async function cancelDailyReminder(): Promise<void> {
  const notifications = getNotifications();
  if (!notifications) {
    return;
  }
  await notifications.cancelAllScheduledNotificationsAsync();
}

export async function scheduleDailyReminder(
  hour: number = REMINDER_HOUR,
  minute: number = REMINDER_MINUTE,
): Promise<void> {
  const notifications = getNotifications();
  if (!notifications) {
    return;
  }
  await cancelDailyReminder();
  await ensureChannel(notifications);
  await notifications.scheduleNotificationAsync({
    content: {
      title: 'تذكير القراءة',
      body: 'ما زلت ما قرأتش اليوم. اقرأ ولو صفحة باش تحافظ على سلسلتك.',
    },
    trigger: {
      type: notifications.SchedulableTriggerInputTypes.DAILY,
      hour,
      minute,
      channelId: CHANNEL_ID,
    },
  });
}

export async function loadReminder(): Promise<ReminderState> {
  try {
    const raw = await AsyncStorage.getItem(STORAGE_KEY);
    if (raw) {
      const parsed = JSON.parse(raw) as Partial<ReminderState>;
      return {
        on: parsed.on === true,
        hour: typeof parsed.hour === 'number' ? parsed.hour : REMINDER_HOUR,
        minute: typeof parsed.minute === 'number' ? parsed.minute : REMINDER_MINUTE,
      };
    }
  } catch {
    // ignore
  }
  return { on: false, hour: REMINDER_HOUR, minute: REMINDER_MINUTE };
}

export async function saveReminder(state: ReminderState): Promise<void> {
  await AsyncStorage.setItem(STORAGE_KEY, JSON.stringify(state));
  if (state.on) {
    await scheduleDailyReminder(state.hour, state.minute);
  } else {
    await cancelDailyReminder();
  }
}
