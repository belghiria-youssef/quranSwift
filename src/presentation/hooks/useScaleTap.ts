import { useCallback } from 'react';
import {
  Easing,
  useAnimatedStyle,
  useReducedMotion,
  useSharedValue,
  withSpring,
  withTiming,
} from 'react-native-reanimated';

export function useScaleTap(disabled = false) {
  const reduced = useReducedMotion();
  const scale = useSharedValue(1);

  const style = useAnimatedStyle(() => ({ transform: [{ scale: scale.value }] }));

  const onPressIn = useCallback(() => {
    if (!disabled && !reduced) {
      scale.value = withTiming(0.97, { duration: 80, easing: Easing.out(Easing.quad) });
    }
  }, [disabled, reduced, scale]);

  const onPressOut = useCallback(() => {
    if (!reduced) {
      scale.value = withSpring(1, { damping: 15, stiffness: 500 });
    }
  }, [reduced, scale]);

  return { style, onPressIn, onPressOut };
}