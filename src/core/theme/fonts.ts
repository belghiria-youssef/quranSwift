import {
  IBMPlexSansArabic_400Regular,
  IBMPlexSansArabic_500Medium,
  IBMPlexSansArabic_600SemiBold,
} from '@expo-google-fonts/ibm-plex-sans-arabic';
import { ReemKufi_500Medium, ReemKufi_700Bold } from '@expo-google-fonts/reem-kufi';

export const fontAssets = {
  ReemKufi_500Medium,
  ReemKufi_700Bold,
  IBMPlexSansArabic_400Regular,
  IBMPlexSansArabic_500Medium,
  IBMPlexSansArabic_600SemiBold,
};

export const fonts = {
  display: 'ReemKufi_700Bold',
  displayMd: 'ReemKufi_500Medium',
  body: 'IBMPlexSansArabic_400Regular',
  bodyMd: 'IBMPlexSansArabic_500Medium',
  bodySemi: 'IBMPlexSansArabic_600SemiBold',
  // English/Latin text uses the same fonts as the HTML template
  // (IBM Plex Sans Arabic for body, Reem Kufi for headings).
  latin: 'IBMPlexSansArabic_400Regular',
  latinMd: 'IBMPlexSansArabic_500Medium',
  latinSemi: 'IBMPlexSansArabic_600SemiBold',
  latinBold: 'ReemKufi_700Bold',
};

const ARABIC_RE = /[\u0600-\u06FF\u0750-\u077F\uFB50-\uFDFF\uFE70-\uFEFF]/;

export const hasArabic = (text: string | null | undefined): boolean =>
  ARABIC_RE.test(text ?? '');

export const latinOr = (
  text: string | null | undefined,
  arabicFont: string,
  latinFont: string = fonts.latin,
): string => (hasArabic(text) ? arabicFont : latinFont);
