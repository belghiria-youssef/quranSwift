import { Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';

import { colors } from '@/core/theme/colors';
import { fonts } from '@/core/theme/fonts';
import { selectTick } from '@/presentation/utils/haptics';

export interface ChipOption {
  key: string;
  label: string;
}

interface ChipGroupProps {
  options: ChipOption[];
  value: string;
  onChange: (key: string) => void;
}

export function Segmented({ options, value, onChange }: ChipGroupProps) {
  return (
    <View style={styles.track}>
      {options.map((option) => {
        const active = option.key === value;
        return (
          <Pressable
            key={option.key}
            style={[styles.seg, active && styles.segActive]}
            onPress={() => {
              selectTick();
              onChange(option.key);
            }}
            accessibilityRole="button"
            accessibilityState={{ selected: active }}
          >
            <Text style={[styles.segLabel, active && styles.segLabelActive]}>
              {option.label}
            </Text>
          </Pressable>
        );
      })}
    </View>
  );
}

export function TeamChips({ options, value, onChange }: ChipGroupProps) {
  return (
    <ScrollView
      horizontal
      showsHorizontalScrollIndicator={false}
      contentContainerStyle={styles.chips}
      style={styles.chipsWrap}
    >
      {options.map((option) => {
        const active = option.key === value;
        return (
          <Pressable
            key={option.key}
            style={[styles.chip, active && styles.chipActive]}
            onPress={() => {
              selectTick();
              onChange(option.key);
            }}
            accessibilityRole="button"
            accessibilityState={{ selected: active }}
          >
            <Text style={[styles.chipLabel, active && styles.chipLabelActive]}>{option.label}</Text>
          </Pressable>
        );
      })}
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  track: {
    flexDirection: 'row',
    backgroundColor: colors.chipBg,
    borderRadius: 14,
    padding: 4,
  },
  seg: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    minHeight: 42,
    borderRadius: 11,
  },
  segActive: {
    backgroundColor: colors.em,
  },
  segLabel: {
    fontFamily: fonts.bodySemi,
    fontSize: 15,
    color: colors.mute,
  },
  segLabelActive: {
    color: colors.white,
  },
  chipsWrap: {
    flexGrow: 0,
    marginVertical: 12,
    marginBottom: 4,
  },
  chips: {
    gap: 8,
    paddingVertical: 2,
  },
  chip: {
    paddingHorizontal: 14,
    minHeight: 38,
    justifyContent: 'center',
    borderRadius: 99,
    borderWidth: 1,
    borderColor: colors.tick,
    backgroundColor: 'transparent',
  },
  chipActive: {
    backgroundColor: colors.heroText,
    borderColor: colors.heroText,
  },
  chipLabel: {
    color: colors.heroSoft,
    fontFamily: fonts.body,
    fontSize: 14,
  },
  chipLabelActive: {
    color: colors.em,
    fontFamily: fonts.bodySemi,
  },
});
