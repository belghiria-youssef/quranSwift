import { ReactNode } from 'react';
import { StyleSheet, View, ViewStyle } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { colors } from '@/core/theme/colors';

interface HeroProps {
  children: ReactNode;
  compact?: boolean;
  padTop?: number;
  style?: ViewStyle;
}

export function Hero({ children, compact = false, padTop, style }: HeroProps) {
  const insets = useSafeAreaInsets();
  const baseTop = padTop ?? (compact ? 16 : 22);
  return (
    <View style={[styles.hero, { paddingTop: insets.top + baseTop }, style]}>
      {children}
    </View>
  );
}

const styles = StyleSheet.create({
  hero: {
    backgroundColor: colors.em,
    paddingHorizontal: 22,
    paddingBottom: 26,
    borderBottomLeftRadius: 34,
    borderBottomRightRadius: 34,
  },
});
