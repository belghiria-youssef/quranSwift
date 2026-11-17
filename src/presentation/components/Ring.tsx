import { StyleSheet, Text, View } from 'react-native';
import Svg, { Line } from 'react-native-svg';

import { colors } from '@/core/theme/colors';
import { fonts } from '@/core/theme/fonts';

interface RingProps {
  filled: number;
  total?: number;
  sub?: string;
  size?: number;
}

export function Ring({ filled, total = 60, sub, size = 176 }: RingProps) {
  return (
    <View style={[styles.wrap, { width: size, height: size }]}>
      <Svg viewBox="0 0 210 210">
        {Array.from({ length: total }, (_, i) => {
          const angle = (i / total) * 2 * Math.PI - Math.PI / 2;
          const c = Math.cos(angle);
          const s = Math.sin(angle);
          const on = i < filled;
          return (
            <Line
              key={i}
              x1={105 + c * 84}
              y1={105 + s * 84}
              x2={105 + c * 100}
              y2={105 + s * 100}
              stroke={on ? colors.gold : colors.tickOff}
              strokeWidth={5}
              strokeLinecap="round"
            />
          );
        })}
      </Svg>
      <View style={styles.mid} pointerEvents="none">
        <Text style={styles.big}>{filled}</Text>
        <Text style={styles.sub}>{sub}</Text>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: {
    alignSelf: 'center',
    marginVertical: 8,
  },
  mid: {
    position: 'absolute',
    top: 0,
    bottom: 0,
    left: 0,
    right: 0,
    alignItems: 'center',
    justifyContent: 'center',
  },
  big: {
    fontFamily: fonts.display,
    fontSize: 46,
    color: colors.heroText,
    lineHeight: 48,
  },
  sub: {
    fontFamily: fonts.body,
    fontSize: 13,
    color: colors.heroSub,
    marginTop: 3,
  },
});
