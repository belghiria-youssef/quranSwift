import { StyleSheet, View } from 'react-native';

import { colors } from '@/core/theme/colors';

interface HeatmapProps {
  readDays: boolean[];
}

export function Heatmap({ readDays }: HeatmapProps) {
  return (
    <View style={styles.grid}>
      {readDays.map((on, i) => (
        <View key={i} style={[styles.cell, on && styles.cellOn]} />
      ))}
    </View>
  );
}

const styles = StyleSheet.create({
  grid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 5,
    marginVertical: 10,
    marginBottom: 6,
  },
  cell: {
    width: '14.28%',
    aspectRatio: 1,
    borderRadius: 5,
    backgroundColor: colors.heatOff,
  },
  cellOn: {
    backgroundColor: colors.gold,
  },
});