import { ReactNode } from 'react';
import { Pressable, StyleSheet, ViewStyle } from 'react-native';
import Animated from 'react-native-reanimated';

import { useScaleTap } from '@/presentation/hooks/useScaleTap';

interface PressableScaleProps {
  children: ReactNode;
  onPress?: () => void;
  disabled?: boolean;
  style?: ViewStyle | ViewStyle[];
  accessibilityRole?: 'button' | 'tab';
  accessibilityLabel?: string;
  accessibilityState?: Record<string, unknown>;
}

export function PressableScale({
  children,
  onPress,
  disabled = false,
  style,
  accessibilityRole = 'button',
  accessibilityLabel,
  accessibilityState,
}: PressableScaleProps) {
  const { style: scaleStyle, onPressIn, onPressOut } = useScaleTap(disabled);
  return (
    <Animated.View style={[scaleStyle, style]}>
      <Pressable
        style={styles.inner}
        onPress={onPress}
        onPressIn={onPressIn}
        onPressOut={onPressOut}
        disabled={disabled}
        accessibilityRole={accessibilityRole}
        accessibilityLabel={accessibilityLabel}
        accessibilityState={accessibilityState}
      >
        {children}
      </Pressable>
    </Animated.View>
  );
}

const styles = StyleSheet.create({
  inner: {
    minHeight: 44,
    justifyContent: 'center',
  },
});