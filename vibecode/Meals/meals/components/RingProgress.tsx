import { StyleSheet, Text, View } from 'react-native';
import Svg, { Circle } from 'react-native-svg';
import { Colors } from '@/constants/colors';

interface Props {
  current: number;
  target: number;
  size?: number;
}

export function RingProgress({ current, target, size = 200 }: Props) {
  const strokeWidth = 16;
  const radius = (size - strokeWidth) / 2;
  const circumference = 2 * Math.PI * radius;
  const progress = target > 0 ? Math.min(current / target, 1) : 0;
  const offset = circumference * (1 - progress);
  const cx = size / 2;
  const cy = size / 2;
  const remaining = Math.max(target - Math.round(current), 0);
  const over = Math.round(current) > target;

  return (
    <View style={{ width: size, height: size, alignItems: 'center', justifyContent: 'center' }}>
      <Svg width={size} height={size} style={StyleSheet.absoluteFill}>
        <Circle
          cx={cx} cy={cy} r={radius}
          stroke={Colors.surface}
          strokeWidth={strokeWidth}
          fill="none"
        />
        <Circle
          cx={cx} cy={cy} r={radius}
          stroke={over ? Colors.error : Colors.primary}
          strokeWidth={strokeWidth}
          fill="none"
          strokeDasharray={`${circumference} ${circumference}`}
          strokeDashoffset={offset}
          strokeLinecap="round"
          rotation="-90"
          origin={`${cx},${cy}`}
        />
      </Svg>
      <Text style={styles.calories}>{Math.round(current)}</Text>
      <Text style={styles.label}>of {target} kcal</Text>
      {over ? (
        <Text style={[styles.sub, { color: Colors.error }]}>{Math.round(current) - target} over</Text>
      ) : (
        <Text style={styles.sub}>{remaining} left</Text>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  calories: { fontSize: 34, fontWeight: '700', color: Colors.text, lineHeight: 40 },
  label: { fontSize: 13, color: Colors.textSecondary, marginTop: 2 },
  sub: { fontSize: 12, color: Colors.textDim, marginTop: 4 },
});
