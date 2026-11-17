import { useEffect } from 'react';
import { Platform, Pressable, StyleSheet } from 'react-native';
import Animated, {
  interpolateColor,
  useAnimatedStyle,
  useReducedMotion,
  useSharedValue,
  withSpring,
} from 'react-native-reanimated';

import { colors } from '@/core/theme/colors';
import { selectTick } from '@/presentation/utils/haptics';

interface ToggleProps {
  value: boolean;
  onChange: (value: boolean) => void;
  accessibilityLabel: string;
  disabled?: boolean;
}

const TRACK_WIDTH = 50;
const TRACK_HEIGHT = 30;
const PADDING = 3;
const KNOB = 24;
const TRAVEL = TRACK_WIDTH - PADDING * 2 - KNOB;

const OFF_TRACK = '#c7d4cd';

export function Toggle({ value, onChange, accessibilityLabel, disabled = false }: ToggleProps) {
  const reduced = useReducedMotion();
  // RTL: the knob rests at the start (right) when off and slides left when on.
  const x = useSharedValue(value ? -TRAVEL : 0);

  useEffect(() => {
    const target = value ? -TRAVEL : 0;
    x.value = reduced ? target : withSpring(target, { damping: 18, stiffness: 210 });
  }, [value, reduced, x]);

  const knob = useAnimatedStyle(() => ({ transform: [{ translateX: x.value }] }));
  const track = useAnimatedStyle(() => ({
    backgroundColor: interpolateColor(x.value, [-TRAVEL, 0], [colors.em, OFF_TRACK]),
  }));

  return (
    <Pressable
      style={styles.hit}
      disabled={disabled}
      onPress={() => {
        if (!disabled) {
          selectTick();
          onChange(!value);
        }
      }}
      accessibilityRole="switch"
      accessibilityState={{ checked: value, disabled }}
      accessibilityLabel={accessibilityLabel}
    >
      <Animated.View style={[styles.track, track]}>
        <Animated.View style={[styles.knob, knob]} />
      </Animated.View>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  hit: {
    minWidth: 44,
    minHeight: 44,
    alignItems: 'center',
    justifyContent: 'center',
  },
  track: {
    width: TRACK_WIDTH,
    height: TRACK_HEIGHT,
    borderRadius: TRACK_HEIGHT / 2,
    padding: PADDING,
    justifyContent: 'center',
  },
  knob: {
    width: KNOB,
    height: KNOB,
    borderRadius: KNOB / 2,
    backgroundColor: colors.white,
    ...Platform.select({
      android: { elevation: 2 },
      default: {
        shadowColor: '#0a2119',
        shadowOpacity: 0.25,
        shadowRadius: 2,
        shadowOffset: { width: 0, height: 1 },
      },
    }),
  },
});
