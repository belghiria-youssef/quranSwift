import { previousDateKey, toDateKey } from '@/core/utils/date';

export function lastNDays(n: number): string[] {
  const today = new Date();
  const out: string[] = [];
  for (let i = n - 1; i >= 0; i -= 1) {
    const day = new Date(today.getFullYear(), today.getMonth(), today.getDate() - i);
    out.push(toDateKey(day));
  }
  return out;
}

export function readOnDays(dates: string[], n: number): boolean[] {
  const set = new Set(dates);
  return lastNDays(n).map((key) => set.has(key));
}

export function hasReadToday(dates: string[]): boolean {
  return dates.includes(toDateKey(new Date()));
}

export function currentWeek(dates: string[]): boolean[] {
  const set = new Set(dates);
  const today = new Date();
  const weekday = today.getDay();
  const out: boolean[] = [];
  for (let i = 0; i < 7; i += 1) {
    const day = new Date(
      today.getFullYear(),
      today.getMonth(),
      today.getDate() - (weekday - i),
    );
    out.push(set.has(toDateKey(day)));
  }
  return out;
}

export function bestStreak(dates: string[]): number {
  const unique = Array.from(new Set(dates)).sort();
  let best = 0;
  let run = 0;
  let prev: string | null = null;
  for (const key of unique) {
    if (prev !== null && key === previousDateKey(prev)) {
      run += 1;
    } else {
      run = 1;
    }
    if (run > best) {
      best = run;
    }
    prev = key;
  }
  return best;
}

export function currentStreak(dates: string[]): number {
  const set = new Set(dates);
  if (!set.has(toDateKey(new Date()))) {
    return 0;
  }
  let streak = 1;
  let key = previousDateKey(toDateKey(new Date()));
  while (set.has(key)) {
    streak += 1;
    key = previousDateKey(key);
  }
  return streak;
}

export function recentHeatmap(dates: string[], n = 35): boolean[] {
  return readOnDays(dates, n);
}

export function readCountInDays(dates: string[], n: number): number {
  return recentHeatmap(dates, n).filter(Boolean).length;
}

export function teamStreak(members: { lastReadDate: string | null }[]): number {
  if (members.length === 0) {
    return 0;
  }
  if (members.some((member) => member.lastReadDate === null)) {
    return 0;
  }
  const todayKey = toDateKey(new Date());
  const allToday = members.every((member) => member.lastReadDate === todayKey);
  let end = allToday ? todayKey : previousDateKey(todayKey);
  if (!allToday && members.some((member) => member.lastReadDate === todayKey)) {
    end = todayKey;
  }
  let min = members[0].lastReadDate as string;
  for (const member of members) {
    if ((member.lastReadDate as string) < min) {
      min = member.lastReadDate as string;
    }
  }
  let streak = 0;
  let day = end;
  while (day >= min) {
    streak += 1;
    day = previousDateKey(day);
  }
  return streak;
}