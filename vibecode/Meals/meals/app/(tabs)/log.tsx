import { useCallback, useEffect, useState } from 'react';
import { Alert, ScrollView, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { router, useFocusEffect } from 'expo-router';
import { useSQLiteContext } from 'expo-sqlite';
import { Ionicons } from '@expo/vector-icons';
import { Colors } from '@/constants/colors';
import { MealSection } from '@/components/MealSection';
import { deleteFoodEntry, getFoodLog, updateFoodEntry } from '@/db/queries';
import { addDays, formatDate, getDateLabel } from '@/utils/calculations';
import type { FoodEntry, MealType } from '@/types';

const MEALS: MealType[] = ['breakfast', 'lunch', 'dinner', 'snack'];

export default function Log() {
  const db = useSQLiteContext();
  const [date, setDate] = useState(formatDate(new Date()));
  const [entries, setEntries] = useState<FoodEntry[]>([]);

  const load = useCallback(async () => {
    setEntries(await getFoodLog(db, date));
  }, [db, date]);

  useFocusEffect(useCallback(() => { load(); }, [load]));
  useEffect(() => { load(); }, [date, load]);

  const totalCal = entries.reduce((s, e) => s + e.calories, 0);
  const totalP = entries.reduce((s, e) => s + e.protein, 0);
  const totalC = entries.reduce((s, e) => s + e.carbs, 0);
  const totalF = entries.reduce((s, e) => s + e.fat, 0);
  const isToday = date === formatDate(new Date());

  const handleDelete = async (id: number) => {
    await deleteFoodEntry(db, id);
    load();
  };

  const handleEdit = (entry: FoodEntry) => {
    Alert.prompt(
      'Edit quantity',
      `${entry.food_name} — current: ${entry.quantity}${entry.unit}`,
      async (val) => {
        const qty = parseFloat(val || '0');
        if (!qty || qty <= 0) return;
        const ratio = qty / entry.quantity;
        await updateFoodEntry(db, entry.id, qty,
          entry.calories * ratio, entry.protein * ratio, entry.carbs * ratio, entry.fat * ratio);
        load();
      },
      'plain-text',
      String(entry.quantity)
    );
  };

  return (
    <View style={styles.root}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => setDate(d => addDays(d, -1))} hitSlop={{ top: 12, bottom: 12, left: 12, right: 12 }}>
          <Ionicons name="chevron-back" size={22} color={Colors.textSecondary} />
        </TouchableOpacity>
        <Text style={styles.dateLabel}>{getDateLabel(date)}</Text>
        <TouchableOpacity
          onPress={() => setDate(d => addDays(d, 1))}
          disabled={isToday}
          hitSlop={{ top: 12, bottom: 12, left: 12, right: 12 }}
        >
          <Ionicons name="chevron-forward" size={22} color={isToday ? Colors.border : Colors.textSecondary} />
        </TouchableOpacity>
      </View>

      {entries.length > 0 && (
        <View style={styles.summaryBar}>
          <SummaryPill label="kcal" value={Math.round(totalCal)} color={Colors.primary} />
          <SummaryPill label="P" value={Math.round(totalP)} color={Colors.protein} unit="g" />
          <SummaryPill label="C" value={Math.round(totalC)} color={Colors.carbs} unit="g" />
          <SummaryPill label="F" value={Math.round(totalF)} color={Colors.fat} unit="g" />
        </View>
      )}

      <ScrollView contentContainerStyle={styles.scroll} showsVerticalScrollIndicator={false}>
        {MEALS.map(meal => (
          <MealSection
            key={meal}
            meal={meal}
            entries={entries.filter(e => e.meal_type === meal)}
            onAdd={() => router.push(`/add-food?meal=${meal}&date=${date}`)}
            onDelete={handleDelete}
            onEdit={handleEdit}
          />
        ))}
        <View style={{ height: 40 }} />
      </ScrollView>
    </View>
  );
}

function SummaryPill({ label, value, color, unit = '' }: { label: string; value: number; color: string; unit?: string }) {
  return (
    <View style={[pillStyles.pill, { borderColor: color }]}>
      <Text style={[pillStyles.label, { color }]}>{label}</Text>
      <Text style={pillStyles.value}>{value}{unit}</Text>
    </View>
  );
}

const pillStyles = StyleSheet.create({
  pill: {
    flex: 1, alignItems: 'center', paddingVertical: 8,
    borderRadius: 10, borderWidth: 1, backgroundColor: Colors.surface,
  },
  label: { fontSize: 11, fontWeight: '700' },
  value: { fontSize: 14, fontWeight: '700', color: Colors.text, marginTop: 2 },
});

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: Colors.background },
  header: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between',
    paddingHorizontal: 20, paddingTop: 60, paddingBottom: 16,
  },
  dateLabel: { fontSize: 18, fontWeight: '700', color: Colors.text },
  summaryBar: {
    flexDirection: 'row', gap: 8, paddingHorizontal: 16, marginBottom: 12,
  },
  scroll: { paddingHorizontal: 16 },
});
