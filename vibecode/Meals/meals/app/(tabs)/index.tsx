import { useCallback, useEffect, useState } from 'react';
import {
  Alert, ScrollView, StyleSheet, Text, TouchableOpacity, View,
} from 'react-native';
import { router, useFocusEffect } from 'expo-router';
import { useSQLiteContext } from 'expo-sqlite';
import { Ionicons } from '@expo/vector-icons';
import { Colors } from '@/constants/colors';
import { RingProgress } from '@/components/RingProgress';
import { MacroBar } from '@/components/MacroBar';
import { MealSection } from '@/components/MealSection';
import { deleteFoodEntry, getFoodLog, getProfile, updateFoodEntry } from '@/db/queries';
import { formatDate, getDateLabel, addDays } from '@/utils/calculations';
import type { FoodEntry, MealType, Profile } from '@/types';

const MEALS: MealType[] = ['breakfast', 'lunch', 'dinner', 'snack'];

export default function Dashboard() {
  const db = useSQLiteContext();
  const [date, setDate] = useState(formatDate(new Date()));
  const [profile, setProfile] = useState<Profile | null>(null);
  const [entries, setEntries] = useState<FoodEntry[]>([]);
  const [editEntry, setEditEntry] = useState<FoodEntry | null>(null);

  const load = useCallback(async () => {
    const [p, log] = await Promise.all([getProfile(db), getFoodLog(db, date)]);
    setProfile(p);
    setEntries(log);
  }, [db, date]);

  useFocusEffect(useCallback(() => { load(); }, [load]));
  useEffect(() => { load(); }, [date, load]);

  const totals = entries.reduce(
    (acc, e) => ({ cal: acc.cal + e.calories, p: acc.p + e.protein, c: acc.c + e.carbs, f: acc.f + e.fat }),
    { cal: 0, p: 0, c: 0, f: 0 }
  );

  const mealEntries = (meal: MealType) => entries.filter(e => e.meal_type === meal);

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

  const isToday = date === formatDate(new Date());

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

      <ScrollView contentContainerStyle={styles.scroll} showsVerticalScrollIndicator={false}>
        <View style={styles.ringRow}>
          <RingProgress current={totals.cal} target={profile?.calorie_target ?? 2000} />
        </View>

        <View style={styles.macroCard}>
          <MacroBar label="Protein" current={totals.p} target={profile?.protein_target ?? 150} color={Colors.protein} />
          <MacroBar label="Carbs" current={totals.c} target={profile?.carbs_target ?? 250} color={Colors.carbs} />
          <MacroBar label="Fat" current={totals.f} target={profile?.fat_target ?? 65} color={Colors.fat} />
        </View>

        {MEALS.map(meal => (
          <MealSection
            key={meal}
            meal={meal}
            entries={mealEntries(meal)}
            onAdd={() => router.push(`/add-food?meal=${meal}&date=${date}`)}
            onDelete={handleDelete}
            onEdit={handleEdit}
          />
        ))}

        <View style={{ height: 100 }} />
      </ScrollView>

      <TouchableOpacity
        style={styles.fab}
        onPress={() => router.push(`/add-food?meal=snack&date=${date}`)}
        activeOpacity={0.85}
      >
        <Ionicons name="add" size={28} color="#0f172a" />
      </TouchableOpacity>
    </View>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: Colors.background },
  header: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between',
    paddingHorizontal: 20, paddingTop: 60, paddingBottom: 16,
  },
  dateLabel: { fontSize: 18, fontWeight: '700', color: Colors.text },
  scroll: { paddingHorizontal: 16, paddingTop: 8 },
  ringRow: { alignItems: 'center', marginBottom: 24 },
  macroCard: {
    backgroundColor: Colors.surface, borderRadius: 16, padding: 16, marginBottom: 16,
  },
  fab: {
    position: 'absolute', right: 24, bottom: 28,
    width: 58, height: 58, borderRadius: 29,
    backgroundColor: Colors.primary,
    alignItems: 'center', justifyContent: 'center',
    shadowColor: Colors.primary, shadowOpacity: 0.5, shadowRadius: 12, shadowOffset: { width: 0, height: 4 },
    elevation: 8,
  },
});
