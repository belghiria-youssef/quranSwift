import { StyleSheet, Text, View } from 'react-native';

import { colors } from '@/core/theme/colors';
import { fonts } from '@/core/theme/fonts';
import { Button } from '@/presentation/components/Button';

interface ConfirmDialogProps {
  visible: boolean;
  title: string;
  message: string;
  confirmLabel: string;
  cancelLabel: string;
  danger?: boolean;
  onConfirm: () => void;
  onCancel: () => void;
}

export function ConfirmDialog({
  visible,
  title,
  message,
  confirmLabel,
  cancelLabel,
  danger = false,
  onConfirm,
  onCancel,
}: ConfirmDialogProps) {
  if (!visible) {
    return null;
  }

  return (
    <View style={styles.overlay}>
      <View style={styles.dialog}>
        <Text style={styles.title}>{title}</Text>
        <Text style={styles.message}>{message}</Text>
        <View style={styles.actions}>
          <Button label={cancelLabel} onPress={onCancel} variant="outline" style={styles.flexBtn} />
          <Button
            label={confirmLabel}
            onPress={onConfirm}
            variant={danger ? 'danger' : 'primary'}
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
    width: 300,
    borderRadius: 20,
    backgroundColor: colors.paper,
    padding: 22,
  },
  title: {
    fontFamily: fonts.display,
    fontSize: 20,
    color: colors.ink,
    marginBottom: 6,
  },
  message: {
    fontFamily: fonts.body,
    fontSize: 14,
    color: colors.mute,
    lineHeight: 22,
    marginBottom: 18,
  },
  actions: {
    flexDirection: 'row',
    gap: 10,
  },
  flexBtn: {
    flex: 1,
  },
});
