import { StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { Colors } from '@/constants/colors';
import { FoodItem } from '@/components/FoodItem';
import type { FoodEntry, MealType } from '@/types';

interface Props {
  meal: MealType;
  entries: FoodEntry[];
  onAdd: () => void;
  onDelete: (id: number) => void;
  onEdit: (entry: FoodEntry) => void;
}

const MEAL_META: Record<MealType, { label: string; icon: string; color: string }> = {
  breakfast: { label: 'Breakfast', icon: 'sunny-outline', color: Colors.breakfast },
  lunch:     { label: 'Lunch',     icon: 'restaurant-outline', color: Colors.lunch },
  dinner:    { label: 'Dinner',    icon: 'moon-outline', color: Colors.dinner },
  snack:     { label: 'Snack',     icon: 'nutrition-outline', color: Colors.snack },
};

export function MealSection({ meal, entries, onAdd, onDelete, onEdit }: Props) {
  const meta = MEAL_META[meal];
  const total = entries.reduce((s, e) => s + e.calories, 0);

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <View style={styles.titleRow}>
          <View style={[styles.dot, { backgroundColor: meta.color }]} />
          <Text style={styles.title}>{meta.label}</Text>
          {total > 0 && <Text style={styles.total}>{Math.round(total)} kcal</Text>}
        </View>
        <TouchableOpacity onPress={onAdd} hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}>
          <Ionicons name="add-circle-outline" size={22} color={Colors.primary} />
        </TouchableOpacity>
      </View>

      {entries.map(e => (
        <FoodItem
          key={e.id}
          entry={e}
          onDelete={() => onDelete(e.id)}
          onPress={() => onEdit(e)}
        />
      ))}

      {entries.length === 0 && (
        <TouchableOpacity style={styles.empty} onPress={onAdd}>
          <Text style={styles.emptyText}>Tap to add food</Text>
        </TouchableOpacity>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    marginBottom: 8,
    backgroundColor: Colors.surface,
    borderRadius: 16,
    overflow: 'hidden',
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingVertical: 12,
  },
  titleRow: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  dot: { width: 8, height: 8, borderRadius: 4 },
  title: { fontSize: 15, fontWeight: '600', color: Colors.text },
  total: { fontSize: 13, color: Colors.textSecondary },
  empty: { paddingVertical: 12, paddingHorizontal: 16 },
  emptyText: { fontSize: 13, color: Colors.textDim },
});
