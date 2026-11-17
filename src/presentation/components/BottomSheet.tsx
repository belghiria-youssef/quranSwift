import { ReactNode, useEffect, useState } from 'react';
import { Pressable, StyleSheet, View } from 'react-native';
import Animated, {
  Easing,
  runOnJS,
  useAnimatedStyle,
  useSharedValue,
  withSpring,
  withTiming,
} from 'react-native-reanimated';
import { Gesture, GestureDetector } from 'react-native-gesture-handler';

import { colors } from '@/core/theme/colors';

interface BottomSheetProps {
  visible: boolean;
  onClose: () => void;
  children: ReactNode;
}

export function BottomSheet({ visible, onClose, children }: BottomSheetProps) {
  const [mounted, setMounted] = useState(visible);
  const y = useSharedValue(0);
  const progress = useSharedValue(0);
  const backdrop = useSharedValue(0);

  useEffect(() => {
    if (visible) {
      setMounted(true);
      y.value = 0;
      backdrop.value = withTiming(1, { duration: 200 });
      progress.value = withTiming(1, { duration: 280, easing: Easing.out(Easing.cubic) });
    } else if (mounted) {
      backdrop.value = withTiming(0, { duration: 180 });
      progress.value = withTiming(
        0,
        { duration: 200, easing: Easing.in(Easing.cubic) },
        (finished) => {
          if (finished) {
            runOnJS(setMounted)(false);
          }
        },
      );
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [visible]);

  const pan = Gesture.Pan()
    .onUpdate((event) => {
      y.value = Math.max(0, event.translationY);
    })
    .onEnd((event) => {
      if (event.translationY > 120 || event.velocityY > 900) {
        runOnJS(onClose)();
      } else {
        y.value = withSpring(0, { damping: 22, stiffness: 240 });
      }
    });

  const sheetStyle = useAnimatedStyle(() => ({
    transform: [{ translateY: y.value + (1 - progress.value) * 44 }],
    opacity: progress.value,
  }));
  const backdropStyle = useAnimatedStyle(() => ({ opacity: backdrop.value }));

  if (!mounted) {
    return null;
  }

  return (
    <View style={styles.overlay}>
      <Animated.View style={[styles.backdrop, backdropStyle]}>
        <Pressable style={StyleSheet.absoluteFill} onPress={onClose} />
      </Animated.View>
      <GestureDetector gesture={pan}>
        <Animated.View style={[styles.sheet, sheetStyle]}>
          <View style={styles.grab} />
          {children}
        </Animated.View>
      </GestureDetector>
    </View>
  );
}

const styles = StyleSheet.create({
  overlay: {
    position: 'absolute',
    top: 0,
    bottom: 0,
    left: 0,
    right: 0,
    zIndex: 20,
    justifyContent: 'flex-end',
  },
  backdrop: {
    position: 'absolute',
    top: 0,
    bottom: 0,
    left: 0,
    right: 0,
    backgroundColor: colors.overlay,
  },
  sheet: {
    backgroundColor: colors.paper,
    width: '100%',
    borderTopLeftRadius: 26,
    borderTopRightRadius: 26,
    paddingHorizontal: 22,
    paddingTop: 10,
    paddingBottom: 28,
  },
  grab: {
    width: 40,
    height: 4,
    borderRadius: 2,
    backgroundColor: colors.line,
    alignSelf: 'center',
    marginBottom: 14,
  },
});
