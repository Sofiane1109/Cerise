import { useCallback, useState } from 'react';
import { Dimensions, ScrollView, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { useFocusEffect } from 'expo-router';
import { useSQLiteContext } from 'expo-sqlite';
import { LineChart, PieChart } from 'react-native-chart-kit';
import { Colors } from '@/constants/colors';
import { getDailyStats, getProfile } from '@/db/queries';
import { getDayAbbr } from '@/utils/calculations';
import type { DailyStat, Profile } from '@/types';

const W = Dimensions.get('window').width - 32;

const CHART_CONFIG = {
  backgroundGradientFrom: Colors.surface,
  backgroundGradientTo: Colors.surface,
  color: (opacity = 1) => `rgba(74, 222, 128, ${opacity})`,
  labelColor: () => Colors.textSecondary,
  strokeWidth: 2,
  propsForDots: { r: '4', strokeWidth: '2', stroke: Colors.primary },
  propsForBackgroundLines: { stroke: Colors.border, strokeDasharray: '4' },
  decimalPlaces: 0,
};

export default function Stats() {
  const db = useSQLiteContext();
  const [period, setPeriod] = useState<7 | 30>(7);
  const [stats, setStats] = useState<DailyStat[]>([]);
  const [profile, setProfile] = useState<Profile | null>(null);

  const load = useCallback(async () => {
    const [s, p] = await Promise.all([getDailyStats(db, period), getProfile(db)]);
    setStats(s);
    setProfile(p);
  }, [db, period]);

  useFocusEffect(useCallback(() => { load(); }, [load]));

  const filledStats = (() => {
    const today = new Date();
    return Array.from({ length: period }, (_, i) => {
      const d = new Date(today);
      d.setDate(d.getDate() - (period - 1 - i));
      const key = d.toISOString().split('T')[0];
      const found = stats.find(s => s.date === key);
      return found ?? { date: key, calories: 0, protein: 0, carbs: 0, fat: 0 };
    });
  })();

  const labels = filledStats.map(s => getDayAbbr(s.date));
  const calData = filledStats.map(s => s.calories || 0);
  const avgCal = stats.length ? Math.round(stats.reduce((a, s) => a + s.calories, 0) / stats.length) : 0;
  const totalP = stats.reduce((a, s) => a + s.protein, 0);
  const totalC = stats.reduce((a, s) => a + s.carbs, 0);
  const totalF = stats.reduce((a, s) => a + s.fat, 0);
  const macroTotal = totalP * 4 + totalC * 4 + totalF * 9;

  const pieData = macroTotal > 0 ? [
    { name: 'Protein', population: Math.round((totalP * 4 / macroTotal) * 100), color: Colors.protein, legendFontColor: Colors.textSecondary, legendFontSize: 13 },
    { name: 'Carbs',   population: Math.round((totalC * 4 / macroTotal) * 100), color: Colors.carbs,   legendFontColor: Colors.textSecondary, legendFontSize: 13 },
    { name: 'Fat',     population: Math.round((totalF * 9 / macroTotal) * 100), color: Colors.fat,     legendFontColor: Colors.textSecondary, legendFontSize: 13 },
  ] : [];

  const showLabels = period === 7 ? labels : labels.filter((_, i) => i % 5 === 0 || i === labels.length - 1);
  const displayLabels = period === 7 ? labels : filledStats.map((s, i) =>
    i % 5 === 0 || i === filledStats.length - 1 ? getDayAbbr(s.date) : ''
  );

  return (
    <ScrollView style={styles.root} contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>
      <Text style={styles.title}>Statistics</Text>

      <View style={styles.periodRow}>
        {([7, 30] as const).map(p => (
          <TouchableOpacity
            key={p}
            style={[styles.periodBtn, period === p && styles.periodBtnActive]}
            onPress={() => setPeriod(p)}
          >
            <Text style={[styles.periodText, period === p && styles.periodTextActive]}>
              {p} days
            </Text>
          </TouchableOpacity>
        ))}
      </View>

      <View style={styles.card}>
        <Text style={styles.cardTitle}>Calories</Text>
        <View style={styles.statsRow}>
          <StatBit label="Avg/day" value={`${avgCal} kcal`} />
          <StatBit label="Target" value={`${profile?.calorie_target ?? '—'} kcal`} color={Colors.primary} />
          <StatBit label="Days tracked" value={`${stats.length}`} />
        </View>

        {calData.some(v => v > 0) ? (
          <LineChart
            data={{ labels: displayLabels, datasets: [{ data: calData }] }}
            width={W}
            height={200}
            chartConfig={CHART_CONFIG}
            bezier
            style={styles.chart}
            withShadow={false}
            fromZero
          />
        ) : (
          <EmptyChart label="No data yet — start logging!" />
        )}
      </View>

      <View style={styles.card}>
        <Text style={styles.cardTitle}>Macro split</Text>
        {pieData.length > 0 ? (
          <PieChart
            data={pieData}
            width={W}
            height={180}
            chartConfig={CHART_CONFIG}
            accessor="population"
            backgroundColor="transparent"
            paddingLeft="0"
            style={styles.chart}
          />
        ) : (
          <EmptyChart label="No macro data yet" />
        )}
        <View style={styles.macroRow}>
          <MacroStat label="Protein" value={Math.round(totalP)} unit="g" color={Colors.protein} />
          <MacroStat label="Carbs" value={Math.round(totalC)} unit="g" color={Colors.carbs} />
          <MacroStat label="Fat" value={Math.round(totalF)} unit="g" color={Colors.fat} />
        </View>
      </View>
    </ScrollView>
  );
}

function StatBit({ label, value, color }: { label: string; value: string; color?: string }) {
  return (
    <View style={{ alignItems: 'center' }}>
      <Text style={[{ fontSize: 16, fontWeight: '700', color: color ?? Colors.text }]}>{value}</Text>
      <Text style={{ fontSize: 11, color: Colors.textDim, marginTop: 2 }}>{label}</Text>
    </View>
  );
}

function MacroStat({ label, value, unit, color }: { label: string; value: number; unit: string; color: string }) {
  return (
    <View style={{ alignItems: 'center', flex: 1 }}>
      <Text style={{ fontSize: 18, fontWeight: '700', color }}>{value}{unit}</Text>
      <Text style={{ fontSize: 12, color: Colors.textDim, marginTop: 2 }}>{label} total</Text>
    </View>
  );
}

function EmptyChart({ label }: { label: string }) {
  return (
    <View style={styles.emptyChart}>
      <Text style={styles.emptyText}>{label}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: Colors.background },
  content: { paddingHorizontal: 16, paddingTop: 60, paddingBottom: 40 },
  title: { fontSize: 28, fontWeight: '700', color: Colors.text, marginBottom: 20 },
  periodRow: { flexDirection: 'row', gap: 8, marginBottom: 20 },
  periodBtn: {
    flex: 1, paddingVertical: 10, borderRadius: 10,
    backgroundColor: Colors.surface, alignItems: 'center',
  },
  periodBtnActive: { backgroundColor: Colors.primaryDim },
  periodText: { fontSize: 14, fontWeight: '600', color: Colors.textSecondary },
  periodTextActive: { color: Colors.primary },
  card: {
    backgroundColor: Colors.surface, borderRadius: 16, padding: 16, marginBottom: 16,
  },
  cardTitle: { fontSize: 16, fontWeight: '600', color: Colors.text, marginBottom: 12 },
  statsRow: { flexDirection: 'row', justifyContent: 'space-around', marginBottom: 16 },
  chart: { borderRadius: 12, marginHorizontal: -8 },
  macroRow: { flexDirection: 'row', justifyContent: 'space-around', marginTop: 12 },
  emptyChart: { height: 120, alignItems: 'center', justifyContent: 'center' },
  emptyText: { fontSize: 14, color: Colors.textDim },
});
