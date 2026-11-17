import { useEffect, useState } from 'react';
import { Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';

import { colors } from '@/core/theme/colors';
import { fonts } from '@/core/theme/fonts';
import { Button } from '@/presentation/components/Button';

interface TimeDialogProps {
  visible: boolean;
  hour: number;
  minute: number;
  onCancel: () => void;
  onConfirm: (hour: number, minute: number) => void;
}

const HOURS = Array.from({ length: 24 }, (_, i) => i);
const MINUTES = [0, 15, 30, 45];

const pad = (value: number) => String(value).padStart(2, '0');

export function TimeDialog({ visible, hour, minute, onCancel, onConfirm }: TimeDialogProps) {
  const [h, setH] = useState(hour);
  const [m, setM] = useState(minute);

  useEffect(() => {
    if (visible) {
      setH(hour);
      setM(minute);
    }
  }, [visible, hour, minute]);

  if (!visible) {
    return null;
  }

  return (
    <View style={styles.overlay}>
      <View style={styles.dialog}>
        <Text style={styles.title}>وقت التذكير</Text>
        <Text style={styles.label}>الساعة</Text>
        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          contentContainerStyle={styles.row}
        >
          {HOURS.map((value) => (
            <Pressable
              key={value}
              style={[styles.chip, h === value && styles.chipOn]}
              onPress={() => setH(value)}
            >
              <Text style={[styles.chipText, h === value && styles.chipTextOn]}>{pad(value)}</Text>
            </Pressable>
          ))}
        </ScrollView>
        <Text style={styles.label}>الدقيقة</Text>
        <View style={styles.row}>
          {MINUTES.map((value) => (
            <Pressable
              key={value}
              style={[styles.chip, m === value && styles.chipOn]}
              onPress={() => setM(value)}
            >
              <Text style={[styles.chipText, m === value && styles.chipTextOn]}>{pad(value)}</Text>
            </Pressable>
          ))}
        </View>
        <View style={styles.actions}>
          <Button label="إلغاء" variant="outline" onPress={onCancel} style={styles.flexBtn} />
          <Button label="حفظ" onPress={() => onConfirm(h, m)} style={styles.flexBtn} />
        </View>
      </View>
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
    zIndex: 40,
    backgroundColor: colors.overlay,
    alignItems: 'center',
    justifyContent: 'center',
  },
  dialog: {
    width: 330,
    borderRadius: 20,
    backgroundColor: colors.paper,
    padding: 20,
  },
  title: {
    fontFamily: fonts.display,
    fontSize: 20,
    color: colors.ink,
    marginBottom: 6,
  },
  label: {
    fontFamily: fonts.body,
    fontSize: 13,
    color: colors.mute,
    marginTop: 10,
    marginBottom: 6,
  },
  row: {
    flexDirection: 'row',
    gap: 6,
  },
  chip: {
    minWidth: 46,
    minHeight: 40,
    paddingHorizontal: 10,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: colors.line,
    backgroundColor: colors.white,
    alignItems: 'center',
    justifyContent: 'center',
  },
  chipOn: {
    backgroundColor: colors.em,
    borderColor: colors.em,
  },
  chipText: {
    fontFamily: fonts.bodySemi,
    fontSize: 15,
    color: colors.em,
  },
  chipTextOn: {
    color: colors.white,
  },
  actions: {
    flexDirection: 'row',
    gap: 10,
    marginTop: 18,
  },
  flexBtn: {
    flex: 1,
  },
});
