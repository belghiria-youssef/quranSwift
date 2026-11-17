import { HIZB_START_PAGES } from '@/core/constants/hizbs';

export const JUZ_START_PAGES: number[] = HIZB_START_PAGES.filter(
  (_page, index) => index % 2 === 0,
);

export const JUZ_COUNT = JUZ_START_PAGES.length;
