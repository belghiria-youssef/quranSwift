import { createContext, ReactNode, useCallback, useContext, useEffect, useRef, useState } from 'react';
import { StyleSheet, Text } from 'react-native';
import Animated, {
  useAnimatedStyle,
  useReducedMotion,
  useSharedValue,
  withTiming,
} from 'react-native-reanimated';

import { colors } from '@/core/theme/colors';
import { fonts } from '@/core/theme/fonts';

interface ToastValue {
  show: (message: string) => void;
}

const ToastContext = createContext<ToastValue | null>(null);

export function useToast(): ToastValue {
  const context = useContext(ToastContext);
  if (!context) {
    throw new Error('useToast must be used within ToastProvider');
  }
  return context;
}

export function ToastProvider({ children }: { children: ReactNode }) {
  const [message, setMessage] = useState('');
  const visible = useSharedValue(0);
  const timer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const reduced = useReducedMotion();

  useEffect(() => {
    if (message === '') {
      return;
    }
    visible.value = reduced ? 1 : withTiming(1, { duration: 180 });
    if (timer.current) {
      clearTimeout(timer.current);
    }
    timer.current = setTimeout(() => {
      visible.value = withTiming(0, { duration: 180 });
    }, 2200);
  }, [message, reduced, visible]);

  const show = useCallback((text: string) => {
    setMessage(text);
  }, []);

  const style = useAnimatedStyle(() => ({
    opacity: visible.value,
    transform: [{ translateY: (visible.value - 1) * -10 }],
  }));

  return (
    <ToastContext.Provider value={{ show }}>
      {children}
      {message !== '' ? (
        <Animated.View style={[styles.toast, style]} pointerEvents="none">
          <Text style={styles.text}>{message}</Text>
        </Animated.View>
      ) : null}
    </ToastContext.Provider>
  );
}

const styles = StyleSheet.create({
  toast: {
    position: 'absolute',
    bottom: 90,
    left: 16,
    right: 16,
    borderRadius: 14,
    backgroundColor: colors.em,
    borderWidth: 1,
    borderColor: colors.tick,
    paddingVertical: 12,
    paddingHorizontal: 16,
    zIndex: 30,
    alignItems: 'center',
  },
  text: {
    fontFamily: fonts.body,
    fontSize: 14,
    color: colors.heroText,
    textAlign: 'center',
  },
});