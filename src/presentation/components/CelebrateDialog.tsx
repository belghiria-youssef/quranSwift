import { useMemo } from 'react';
import { StyleSheet, Text, View } from 'react-native';
import Svg, { Path } from 'react-native-svg';

import { colors } from '@/core/theme/colors';
import { fonts } from '@/core/theme/fonts';
import { Button } from '@/presentation/components/Button';

const BADGES: Record<number, string> = {
  3: 'البداية',
  7: 'الأسبوع',
  14: 'الأسبوعين',
  30: 'الشهر',
};

const CONFETTI_COLORS = [colors.gold, colors.flame, colors.em2, colors.tick];

interface CelebrateDialogProps {
  visible: boolean;
  streak: number;
  best: number;
  onClose: () => void;
}

export function CelebrateDialog({ visible, streak, best, onClose }: CelebrateDialogProps) {
  const pieces = useMemo(
    () =>
      Array.from({ length: 22 }, (_, index) => ({
        left: Math.random() * 100,
        color: CONFETTI_COLORS[index % CONFETTI_COLORS.length],
        top: -(index % 5) * 24,
      })),
    [],
  );

  if (!visible) {
    return null;
  }

  let message: string;
  if (BADGES[streak]) {
    message = `حصلت على وسام ${BADGES[streak]}`;
  } else if (streak >= best) {
    message = 'هادي أطول سلسلة عندك';
  } else {
    message = `باقي ${best - streak + 1} أيام باش تكسر رقمك القياسي`;
  }

  return (
    <View style={[StyleSheet.absoluteFill, styles.overlay]}>
      <View style={styles.dialogWrap} pointerEvents="box-none">
        {pieces.map((piece, index) => (
          <View
            key={index}
            pointerEvents="none"
            style={[
              styles.confetti,
              {
                left: `${piece.left}%`,
                top: piece.top,
                backgroundColor: piece.color,
              } as const,
            ]}
          />
        ))}
        <View style={styles.dialog}>
          <View style={styles.iconBox}>
            <FlameIcon width={40} height={40} />
          </View>
          <Text style={styles.big}>{streak}</Text>
          <Text style={styles.title}>أيام متتالية</Text>
          <Text style={styles.message}>{message}</Text>
          <Button label="متابعة" onPress={onClose} style={styles.button} />
        </View>
      </View>
    </View>
  );
}

export function FlameIcon({ width = 24, height = 24 }: { width?: number; height?: number }) {
  return (
    <Svg width={width} height={height} viewBox="0 0 24 24">
      <Path
        d="M12 2c1 4-3 5-3 9a3 3 0 006 0c0-1-.5-2-1-3 3 1 5 4 5 7a7 7 0 01-14 0c0-6 6-8 7-13z"
        fill={colors.gold}
      />
    </Svg>
  );
}

const styles = StyleSheet.create({
  overlay: {
    zIndex: 40,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: colors.overlay,
  },
  dialogWrap: {
    width: 320,
    position: 'relative',
  },
  confetti: {
    position: 'absolute',
    top: -14,
    width: 8,
    height: 12,
    borderRadius: 2,
  },
  dialog: {
    borderRadius: 20,
    backgroundColor: colors.paper,
    padding: 22,
    alignItems: 'center',
  },
  iconBox: {
    width: 72,
    height: 72,
    borderRadius: 22,
    backgroundColor: 'rgba(200, 160, 74, 0.18)',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 10,
  },
  big: {
    fontFamily: fonts.display,
    fontSize: 46,
    color: colors.em,
  },
  title: {
    fontFamily: fonts.bodySemi,
    fontSize: 16,
    color: colors.ink,
    marginBottom: 4,
  },
  message: {
    fontFamily: fonts.body,
    fontSize: 14,
    color: colors.mute,
    marginBottom: 16,
    textAlign: 'center',
    minHeight: 22,
  },
  button: {
    alignSelf: 'stretch',
  },
});
