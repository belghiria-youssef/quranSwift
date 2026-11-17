import { StyleSheet, Text, View } from 'react-native';

import { colors } from '@/core/theme/colors';

const DAY_LABELS = ['أح', 'إث', 'ث', 'أر', 'خ', 'ج', 'سب'];

interface WeekDotsProps {
  readDays: boolean[];
}

export function WeekDots({ readDays }: WeekDotsProps) {
  const todayIndex = new Date().getDay();
  return (
    <View style={styles.row} accessibilityLabel="أيام الأسبوع">
      {readDays.map((on, i) => {
        const isToday = i === todayIndex;
        return (
          <View key={i} style={styles.col}>
            <View style={[styles.dotWrap, isToday && styles.todayRing]}>
              <View style={[styles.dot, on && styles.dotOn]} />
            </View>
            <Text style={styles.label}>{DAY_LABELS[i]}</Text>
          </View>
        );
      })}
    </View>
  );
}

const styles = StyleSheet.create({
  row: {
    flexDirection: 'row',
    justifyContent: 'center',
    gap: 9,
    marginVertical: 12,
  },
  col: {
    alignItems: 'center',
    gap: 5,
  },
  dotWrap: {
    width: 16,
    height: 16,
    borderRadius: 8,
    alignItems: 'center',
    justifyContent: 'center',
  },
  todayRing: {
    borderWidth: 1.5,
    borderColor: colors.gold,
    padding: 1.5,
    borderRadius: 10,
  },
  dot: {
    width: 16,
    height: 16,
    borderRadius: 8,
    backgroundColor: colors.tickOff,
  },
  dotOn: {
    backgroundColor: colors.gold,
  },
  label: {
    fontSize: 11,
    color: colors.heroSub,
  },
});
