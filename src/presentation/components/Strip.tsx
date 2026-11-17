import { StyleSheet, View, ViewStyle } from 'react-native';

import { colors } from '@/core/theme/colors';

interface StripProps {
  filled: number;
  segments?: number;
  gold?: boolean;
  style?: ViewStyle;
}

export function Strip({ filled, segments = 60, gold = false, style }: StripProps) {
  return (
    <View
      style={[styles.strip, style]}
      accessibilityRole="progressbar"
      accessibilityValue={{ now: filled, min: 0, max: segments }}
    >
      {Array.from({ length: segments }, (_, segment) => {
        const active = segment < filled;
        return (
          <View
            key={segment}
            style={[styles.cell, active && (gold ? styles.gold : styles.em2)]}
          />
        );
      })}
    </View>
  );
}

const styles = StyleSheet.create({
  strip: {
    flexDirection: 'row',
    gap: 2,
    marginTop: 8,
  },
  cell: {
    flex: 1,
    height: 10,
    borderRadius: 2,
    backgroundColor: colors.stripOff,
    overflow: 'hidden',
  },
  gold: {
    backgroundColor: colors.gold,
  },
  em2: {
    backgroundColor: colors.em2,
  },
});
