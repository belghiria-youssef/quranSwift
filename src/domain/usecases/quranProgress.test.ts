import { HIZB_START_PAGES } from '@/core/constants/hizbs';
import { JUZ_START_PAGES } from '@/core/constants/juzs';
import { SURAHS } from '@/core/constants/surahs';
import {
  describeProgress,
  hizbToPage,
  isValidHizb,
  isValidJuz,
  isValidPage,
  isValidSurah,
  juzToPage,
  pageToHizb,
  pageToJuz,
  pageToSurah,
  surahToPage,
  unitEndPage,
  unitToPage,
} from '@/domain/usecases/quranProgress';

describe('reference tables', () => {
  test('has 114 surahs, 60 hizbs and 30 juzs', () => {
    expect(SURAHS).toHaveLength(114);
    expect(HIZB_START_PAGES).toHaveLength(60);
    expect(JUZ_START_PAGES).toHaveLength(30);
  });

  test('first and last pages are 1 and 604', () => {
    expect(SURAHS[0].startPage).toBe(1);
    expect(SURAHS[SURAHS.length - 1].startPage).toBe(604);
    expect(HIZB_START_PAGES[0]).toBe(1);
    expect(HIZB_START_PAGES[HIZB_START_PAGES.length - 1]).toBeLessThanOrEqual(604);
  });

  test('surah start pages and hizb start pages increase strictly', () => {
    for (let index = 1; index < SURAHS.length; index += 1) {
      expect(SURAHS[index].startPage).toBeGreaterThanOrEqual(SURAHS[index - 1].startPage);
    }
    for (let index = 1; index < HIZB_START_PAGES.length; index += 1) {
      expect(HIZB_START_PAGES[index]).toBeGreaterThan(HIZB_START_PAGES[index - 1]);
    }
  });
});

describe('known Madinah mushaf anchors', () => {
  const surahAnchors: [number, number][] = [
    [2, 2],
    [3, 50],
    [18, 293],
    [36, 440],
    [55, 531],
    [114, 604],
  ];

  const hizbAnchors: [number, number][] = [
    [1, 1],
    [3, 22],
    [13, 121],
    [30, 292],
    [59, 582],
    [60, 591],
  ];

  const juzAnchors: [number, number][] = [
    [1, 1],
    [2, 22],
    [3, 42],
    [6, 102],
    [30, 582],
  ];

  test.each(surahAnchors)('surah %i starts on page %i', (surah, page) => {
    expect(surahToPage(surah)).toBe(page);
  });

  test.each(hizbAnchors)('hizb %i starts on page %i', (hizb, page) => {
    expect(hizbToPage(hizb)).toBe(page);
  });

  test.each(juzAnchors)('juz %i starts on page %i', (juz, page) => {
    expect(juzToPage(juz)).toBe(page);
  });
});

describe('conversion between units', () => {
  test('every hizb maps to itself in a round trip', () => {
    for (let hizb = 1; hizb <= 60; hizb += 1) {
      expect(pageToHizb(hizbToPage(hizb))).toBe(hizb);
    }
  });

  test('each surah start page resolves to a surah starting on that page', () => {
    for (let surah = 1; surah <= 114; surah += 1) {
      const page = surahToPage(surah);
      expect(pageToSurah(page).startPage).toBe(page);
    }
  });

  test('every juz maps to itself in a round trip', () => {
    for (let juz = 1; juz <= 30; juz += 1) {
      expect(pageToJuz(juzToPage(juz))).toBe(juz);
    }
  });

  test('unitToPage converts page, hizb, juz and surah', () => {
    expect(unitToPage('page', 120)).toBe(120);
    expect(unitToPage('hizb', 1)).toBe(1);
    expect(unitToPage('hizb', 60)).toBe(591);
    expect(unitToPage('juz', 2)).toBe(22);
    expect(unitToPage('juz', 30)).toBe(582);
    expect(unitToPage('surah', 3)).toBe(50);
    expect(unitToPage('surah', 114)).toBe(604);
  });

  test('unitEndPage ends each unit at the page before the next unit', () => {
    expect(unitEndPage('hizb', 1)).toBe(10);
    expect(unitEndPage('hizb', 2)).toBe(21);
    expect(unitEndPage('hizb', 12)).toBe(120);
    expect(unitEndPage('hizb', 60)).toBe(604);
    expect(unitEndPage('juz', 6)).toBe(120);
    expect(unitEndPage('juz', 30)).toBe(604);
    expect(unitEndPage('surah', 1)).toBe(1);
    expect(unitEndPage('surah', 114)).toBe(604);
  });

  test('edge pages resolve to first and last units', () => {
    expect(pageToHizb(1)).toBe(1);
    expect(pageToHizb(604)).toBe(60);
    expect(pageToJuz(1)).toBe(1);
    expect(pageToJuz(604)).toBe(30);
    expect(pageToSurah(1).number).toBe(1);
    expect(pageToSurah(604).number).toBe(114);
  });
});

describe('describeProgress', () => {
  test('returns all units and a percentage', () => {
    expect(describeProgress(1)).toEqual({
      page: 1,
      juz: 1,
      hizb: 1,
      surah: 1,
      surahName: SURAHS[0].name,
      percentage: 1,
    });
    expect(describeProgress(302).percentage).toBe(50);
    expect(describeProgress(604)).toEqual({
      page: 604,
      juz: 30,
      hizb: 60,
      surah: 114,
      surahName: SURAHS[113].name,
      percentage: 100,
    });
  });

  test('page 120 is hizb 12, juz 6 of Al-Maidah', () => {
    expect(describeProgress(120)).toEqual({
      page: 120,
      juz: 6,
      hizb: 12,
      surah: 5,
      surahName: 'المائدة',
      percentage: 20,
    });
  });
});

describe('validation', () => {
  test('accepts valid values', () => {
    expect(isValidPage(1)).toBe(true);
    expect(isValidPage(604)).toBe(true);
    expect(isValidHizb(60)).toBe(true);
    expect(isValidJuz(30)).toBe(true);
    expect(isValidSurah(114)).toBe(true);
  });

  test('rejects out of range values', () => {
    expect(isValidPage(0)).toBe(false);
    expect(isValidPage(605)).toBe(false);
    expect(isValidHizb(61)).toBe(false);
    expect(isValidJuz(0)).toBe(false);
    expect(isValidJuz(31)).toBe(false);
    expect(isValidSurah(0)).toBe(false);
    expect(() => hizbToPage(0)).toThrow();
    expect(() => juzToPage(31)).toThrow();
    expect(() => surahToPage(115)).toThrow();
    expect(() => unitToPage('page', 700)).toThrow();
  });
});
