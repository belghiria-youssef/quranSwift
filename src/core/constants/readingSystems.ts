import { ReadingSystem } from '@/domain/entities/Team';

export const READING_SYSTEMS: { key: ReadingSystem; label: string; daily: string }[] = [
  { key: 'hizb', label: 'حزب', daily: 'حزب يوميًا' },
  { key: 'juz', label: 'جزء', daily: 'جزء يوميًا' },
  { key: 'surah', label: 'سورة', daily: 'سورة يوميًا' },
  { key: 'free', label: 'حر', daily: 'اختيار حر' },
];

export const readingSystemDaily = (system: ReadingSystem): string =>
  READING_SYSTEMS.find((option) => option.key === system)?.daily ?? 'اختيار حر';

export const readingSystemLabel = (system: ReadingSystem): string =>
  READING_SYSTEMS.find((option) => option.key === system)?.label ?? 'حر';