import { ActivityIndicator, Pressable, StyleSheet, Text } from 'react-native';
import Animated from 'react-native-reanimated';

import { colors } from '@/core/theme/colors';
import { fonts } from '@/core/theme/fonts';
import { useScaleTap } from '@/presentation/hooks/useScaleTap';

type Variant = 'primary' | 'outline' | 'gold' | 'danger';

interface ButtonProps {
  label: string;
  onPress: () => void;
  loading?: boolean;
  disabled?: boolean;
  variant?: Variant;
  danger?: boolean;
  style?: Record<string, unknown>;
}

export function Button({
  label,
  onPress,
  loading = false,
  disabled = false,
  variant = 'primary',
  danger = false,
  style,
}: ButtonProps) {
  const isGold = variant === 'gold';
  const isFilledDanger = variant === 'danger';
  const isPrimary = variant === 'primary' && !danger;
  const isOutline = variant === 'outline' || (danger && variant === 'primary');
  const isDisabled = disabled || loading;
  const { style: scaleStyle, onPressIn, onPressOut } = useScaleTap(isDisabled);

  const container = isGold
    ? styles.gold
    : isFilledDanger
      ? styles.filledDanger
      : isPrimary
        ? styles.primary
        : [styles.outline, danger && styles.outlineDanger];

  const labelColor = isGold
    ? colors.goldInk
    : isFilledDanger || isPrimary
      ? colors.white
      : danger
        ? colors.danger
        : colors.em;

  const spinnerColor = isGold ? colors.goldInk : isPrimary || isFilledDanger ? colors.white : colors.em;

  return (
    <Animated.View style={[scaleStyle, style]}>
      <Pressable
        style={[styles.base, container, isDisabled && styles.disabled]}
        onPress={onPress}
        onPressIn={onPressIn}
        onPressOut={onPressOut}
        disabled={isDisabled}
        accessibilityRole="button"
        accessibilityState={{ disabled: isDisabled, busy: loading }}
      >
        {loading ? (
          <ActivityIndicator color={spinnerColor} />
        ) : (
          <Text style={[styles.label, { color: labelColor }]}>{label}</Text>
        )}
      </Pressable>
    </Animated.View>
  );
}

const styles = StyleSheet.create({
  base: {
    borderRadius: 14,
    paddingVertical: 14,
    minHeight: 50,
    alignItems: 'center',
    justifyContent: 'center',
  },
  primary: {
    backgroundColor: colors.em,
  },
  outline: {
    backgroundColor: 'transparent',
    borderWidth: 1.5,
    borderColor: colors.em,
  },
  outlineDanger: {
    borderColor: colors.danger,
  },
  gold: {
    backgroundColor: colors.gold,
    borderRadius: 16,
    minHeight: 52,
  },
  filledDanger: {
    backgroundColor: colors.danger,
  },
  disabled: {
    opacity: 0.4,
  },
  label: {
    fontFamily: fonts.bodySemi,
    fontSize: 15,
  },
});
