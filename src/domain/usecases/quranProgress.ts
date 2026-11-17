import { TOTAL_PAGES } from '@/core/constants/app';
import { HIZB_START_PAGES } from '@/core/constants/hizbs';
import { JUZ_START_PAGES } from '@/core/constants/juzs';
import { SURAHS, Surah } from '@/core/constants/surahs';
import { ProgressReading, ProgressUnit } from '@/domain/entities/Progress';

export const isValidPage = (page: number): boolean =>
  Number.isInteger(page) && page >= 1 && page <= TOTAL_PAGES;

export const isValidHizb = (hizb: number): boolean =>
  Number.isInteger(hizb) && hizb >= 1 && hizb <= HIZB_START_PAGES.length;

export const isValidJuz = (juz: number): boolean =>
  Number.isInteger(juz) && juz >= 1 && juz <= JUZ_START_PAGES.length;

export const isValidSurah = (surah: number): boolean =>
  Number.isInteger(surah) && surah >= 1 && surah <= SURAHS.length;

const clampPage = (page: number): number =>
  Math.min(Math.max(Math.trunc(page), 1), TOTAL_PAGES);

export function pageToHizb(page: number): number {
  const target = clampPage(page);
  let hizb = 1;
  for (let index = 0; index < HIZB_START_PAGES.length; index += 1) {
    if (HIZB_START_PAGES[index] > target) {
      break;
    }
    hizb = index + 1;
  }
  return hizb;
}

export function pageToSurah(page: number): Surah {
  const target = clampPage(page);
  let surah = SURAHS[0];
  for (const candidate of SURAHS) {
    if (candidate.startPage > target) {
      break;
    }
    surah = candidate;
  }
  return surah;
}

export function pageToJuz(page: number): number {
  const target = clampPage(page);
  let juz = 1;
  for (let index = 0; index < JUZ_START_PAGES.length; index += 1) {
    if (JUZ_START_PAGES[index] > target) {
      break;
    }
    juz = index + 1;
  }
  return juz;
}

export function hizbToPage(hizb: number): number {
  if (!isValidHizb(hizb)) {
    throw new Error('رقم الحزب يجب أن يكون بين 1 و 60');
  }
  return HIZB_START_PAGES[hizb - 1];
}

export function juzToPage(juz: number): number {
  if (!isValidJuz(juz)) {
    throw new Error('رقم الجزء يجب أن يكون بين 1 و 30');
  }
  return JUZ_START_PAGES[juz - 1];
}

export function surahToPage(surah: number): number {
  if (!isValidSurah(surah)) {
    throw new Error('رقم السورة يجب أن يكون بين 1 و 114');
  }
  return SURAHS[surah - 1].startPage;
}

export function unitToPage(unit: ProgressUnit, value: number): number {
  if (unit === 'hizb') {
    return hizbToPage(value);
  }
  if (unit === 'juz') {
    return juzToPage(value);
  }
  if (unit === 'surah') {
    return surahToPage(value);
  }
  if (!isValidPage(value)) {
    throw new Error('رقم الصفحة يجب أن يكون بين 1 و 604');
  }
  return value;
}

export function unitEndPage(unit: ProgressUnit, value: number): number {
  if (unit === 'hizb') {
    if (!isValidHizb(value)) {
      throw new Error('رقم الحزب يجب أن يكون بين 1 و 60');
    }
    return value >= HIZB_START_PAGES.length ? TOTAL_PAGES : HIZB_START_PAGES[value] - 1;
  }
  if (unit === 'juz') {
    if (!isValidJuz(value)) {
      throw new Error('رقم الجزء يجب أن يكون بين 1 و 30');
    }
    return value >= JUZ_START_PAGES.length ? TOTAL_PAGES : JUZ_START_PAGES[value] - 1;
  }
  if (unit === 'surah') {
    if (!isValidSurah(value)) {
      throw new Error('رقم السورة يجب أن يكون بين 1 و 114');
    }
    return value >= SURAHS.length ? TOTAL_PAGES : SURAHS[value].startPage - 1;
  }
  if (!isValidPage(value)) {
    throw new Error('رقم الصفحة يجب أن يكون بين 1 و 604');
  }
  return value;
}

export function describeProgress(page: number): ProgressReading {
  if (!isValidPage(page)) {
    throw new Error('رقم الصفحة يجب أن يكون بين 1 و 604');
  }
  const surah = pageToSurah(page);
  return {
    page,
    juz: pageToJuz(page),
    hizb: pageToHizb(page),
    surah: surah.number,
    surahName: surah.name,
    percentage: Math.max(1, Math.round((page / TOTAL_PAGES) * 100)),
  };
}
