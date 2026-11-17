import { useEffect, useState } from 'react';
import { StyleSheet, Text, View } from 'react-native';

import { colors } from '@/core/theme/colors';
import { fonts } from '@/core/theme/fonts';
import { Button } from '@/presentation/components/Button';
import { Field } from '@/presentation/components/Field';

interface InputDialogProps {
  visible: boolean;
  title: string;
  label: string;
  initialValue: string;
  placeholder?: string;
  confirmLabel?: string;
  onSubmit: (value: string) => Promise<void> | void;
  onCancel: () => void;
}

export function InputDialog({
  visible,
  title,
  label,
  initialValue,
  placeholder,
  confirmLabel = 'حفظ',
  onSubmit,
  onCancel,
}: InputDialogProps) {
  const [value, setValue] = useState(initialValue);
  const [error, setError] = useState('');
  const [busy, setBusy] = useState(false);

  useEffect(() => {
    if (visible) {
      setValue(initialValue);
      setError('');
      setBusy(false);
    }
  }, [visible, initialValue]);

  if (!visible) {
    return null;
  }

  const trimmed = value.trim();
  const valid = trimmed.length >= 2;

  const submit = async () => {
    if (!valid) {
      setError('اكتب على الأقل حرفين');
      return;
    }
    setBusy(true);
    try {
      await onSubmit(trimmed);
    } catch {
      setError('تعذر الحفظ، حاول مرة أخرى');
    } finally {
      setBusy(false);
    }
  };

  return (
    <View style={styles.overlay}>
      <View style={styles.dialog}>
        <Text style={styles.title}>{title}</Text>
        <Field
          label={label}
          value={value}
          onChangeText={(next) => {
            setValue(next);
            setError('');
          }}
          placeholder={placeholder}
          error={error}
          autoFocus
        />
        <View style={styles.actions}>
          <Button label="إلغاء" variant="outline" onPress={onCancel} style={styles.flexBtn} />
          <Button
            label={confirmLabel}
            onPress={submit}
            loading={busy}
            disabled={!valid}
            style={styles.flexBtn}
          />
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
    width: 320,
    borderRadius: 20,
    backgroundColor: colors.paper,
    padding: 22,
  },
  title: {
    fontFamily: fonts.display,
    fontSize: 20,
    color: colors.ink,
    marginBottom: 10,
  },
  actions: {
    flexDirection: 'row',
    gap: 10,
    marginTop: 6,
  },
  flexBtn: {
    flex: 1,
  },
});
