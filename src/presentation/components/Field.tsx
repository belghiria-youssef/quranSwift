import { useEffect, useState } from 'react';
import {
  KeyboardTypeOptions,
  Pressable,
  StyleSheet,
  Text,
  TextInput,
  View,
} from 'react-native';
import Animated, { useAnimatedStyle, useSharedValue, withSequence, withTiming } from 'react-native-reanimated';

import { colors } from '@/core/theme/colors';
import { fonts } from '@/core/theme/fonts';
import { errorBuzz } from '@/presentation/utils/haptics';

interface FieldProps {
  label?: string;
  value: string;
  onChangeText: (value: string) => void;
  error?: string;
  secure?: boolean;
  placeholder?: string;
  dirLtr?: boolean;
  keyboardType?: KeyboardTypeOptions;
  autoCapitalize?: 'none' | 'sentences' | 'words' | 'characters';
  autoFocus?: boolean;
}

export function Field({
  label,
  value,
  onChangeText,
  error,
  secure = false,
  placeholder,
  dirLtr = false,
  keyboardType = 'default',
  autoCapitalize = 'none',
  autoFocus = false,
}: FieldProps) {
  const [hidden, setHidden] = useState(true);
  const shake = useSharedValue(0);

  useEffect(() => {
    if (error) {
      errorBuzz();
      shake.value = withSequence(
        withTiming(-8, { duration: 60 }),
        withTiming(8, { duration: 60 }),
        withTiming(-5, { duration: 60 }),
        withTiming(5, { duration: 60 }),
        withTiming(-3, { duration: 60 }),
        withTiming(0, { duration: 60 }),
      );
    }
  }, [error, shake]);

  const animated = useAnimatedStyle(() => ({ transform: [{ translateX: shake.value }] }));

  return (
    <Animated.View style={[styles.container, animated]}>
      {label ? <Text style={styles.label}>{label}</Text> : null}
      <View style={[styles.wrap, error && styles.wrapBad]}>
        <TextInput
          style={[styles.input, dirLtr && styles.ltr]}
          value={value}
          onChangeText={onChangeText}
          secureTextEntry={secure && hidden}
          placeholder={placeholder}
          placeholderTextColor={colors.mute}
          keyboardType={keyboardType}
          autoCapitalize={autoCapitalize}
          autoComplete="off"
          autoFocus={autoFocus}
          accessibilityLabel={label}
        />
        {secure ? (
          <Pressable
            style={styles.eye}
            onPress={() => setHidden((v) => !v)}
            accessibilityRole="button"
            accessibilityLabel={hidden ? 'إظهار كلمة المرور' : 'إخفاء كلمة المرور'}
          >
            <Text style={styles.eyeLabel}>{hidden ? 'إظهار' : 'إخفاء'}</Text>
          </Pressable>
        ) : null}
      </View>
      {error ? <Text style={styles.error}>{error}</Text> : null}
    </Animated.View>
  );
}

const styles = StyleSheet.create({
  container: {
    marginBottom: 12,
  },
  label: {
    fontFamily: fonts.body,
    fontSize: 14,
    color: colors.mute,
    marginBottom: 6,
  },
  wrap: {
    flexDirection: 'row',
    alignItems: 'center',
    borderWidth: 1.5,
    borderColor: colors.line,
    borderRadius: 12,
    backgroundColor: colors.white,
    paddingHorizontal: 14,
  },
  wrapBad: {
    borderColor: colors.danger,
  },
  input: {
    flex: 1,
    minHeight: 50,
    fontFamily: fonts.body,
    fontSize: 16,
    color: colors.ink,
    paddingVertical: 12,
    textAlign: 'right',
  },
  ltr: {
    textAlign: 'left',
    direction: 'ltr',
    fontFamily: fonts.latin,
  },
  eye: {
    minWidth: 44,
    minHeight: 44,
    alignItems: 'center',
    justifyContent: 'center',
    marginLeft: 6,
  },
  eyeLabel: {
    fontFamily: fonts.body,
    fontSize: 13,
    color: colors.mute,
  },
  error: {
    fontFamily: fonts.body,
    fontSize: 13,
    color: colors.danger,
    marginTop: 4,
  },
});