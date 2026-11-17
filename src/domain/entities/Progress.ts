export type ProgressUnit = 'page' | 'hizb' | 'juz' | 'surah';

export interface ProgressReading {
  page: number;
  juz: number;
  hizb: number;
  surah: number;
  surahName: string;
  percentage: number;
}
