import * as Haptics from 'expo-haptics';

export const lightTap = (): void => {
  Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light).catch(() => undefined);
};

export const selectTick = (): void => {
  Haptics.selectionAsync().catch(() => undefined);
};

export const successBuzz = (): void => {
  Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success).catch(() => undefined);
};

export const errorBuzz = (): void => {
  Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error).catch(() => undefined);
};