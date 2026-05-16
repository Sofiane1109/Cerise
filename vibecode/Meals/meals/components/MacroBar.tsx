import { StyleSheet, Text, View } from 'react-native';
import { Colors } from '@/constants/colors';

interface Props {
  label: string;
  current: number;
  target: number;
  color: string;
}

export function MacroBar({ label, current, target, color }: Props) {
  const pct = target > 0 ? Math.min(current / target, 1) : 0;
  const over = current > target;

  return (
    <View style={styles.container}>
      <View style={styles.row}>
        <Text style={styles.label}>{label}</Text>
        <Text style={[styles.value, over && { color: Colors.error }]}>
          {Math.round(current)}<Text style={styles.target}>/{target}g</Text>
        </Text>
      </View>
      <View style={styles.track}>
        <View
          style={[
            styles.fill,
            { width: `${pct * 100}%`, backgroundColor: over ? Colors.error : color },
          ]}
        />
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { marginBottom: 12 },
  row: { flexDirection: 'row', justifyContent: 'space-between', marginBottom: 6 },
  label: { fontSize: 13, color: Colors.textSecondary, fontWeight: '500' },
  value: { fontSize: 13, color: Colors.text, fontWeight: '600' },
  target: { fontWeight: '400', color: Colors.textDim },
  track: {
    height: 6,
    backgroundColor: Colors.surface,
    borderRadius: 3,
    overflow: 'hidden',
  },
  fill: { height: '100%', borderRadius: 3 },
});
