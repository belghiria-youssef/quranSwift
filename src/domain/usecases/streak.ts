import { previousDateKey } from '@/core/utils/date';

export function nextStreak(
  lastReadDate: string | null,
  todayKey: string,
  currentStreak: number,
): number {
  if (lastReadDate === todayKey) {
    return Math.max(currentStreak, 1);
  }
  if (lastReadDate !== null && lastReadDate === previousDateKey(todayKey)) {
    return currentStreak + 1;
  }
  return 1;
}
