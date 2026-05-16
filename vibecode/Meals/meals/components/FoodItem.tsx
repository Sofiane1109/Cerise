import { StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { Swipeable } from 'react-native-gesture-handler';
import { Colors } from '@/constants/colors';
import type { FoodEntry } from '@/types';

interface Props {
  entry: FoodEntry;
  onDelete: () => void;
  onPress?: () => void;
}

export function FoodItem({ entry, onDelete, onPress }: Props) {
  const renderRight = () => (
    <TouchableOpacity style={styles.deleteAction} onPress={onDelete}>
      <Text style={styles.deleteText}>Delete</Text>
    </TouchableOpacity>
  );

  return (
    <Swipeable renderRightActions={renderRight} overshootRight={false}>
      <TouchableOpacity style={styles.container} onPress={onPress} activeOpacity={0.7}>
        <View style={styles.left}>
          <Text style={styles.name} numberOfLines={1}>{entry.food_name}</Text>
          {!!entry.brand && <Text style={styles.brand} numberOfLines={1}>{entry.brand}</Text>}
          <Text style={styles.qty}>{entry.quantity}{entry.unit}</Text>
        </View>
        <View style={styles.right}>
          <Text style={styles.cal}>{Math.round(entry.calories)}</Text>
          <Text style={styles.calLabel}>kcal</Text>
          <Text style={styles.macros}>
            P{Math.round(entry.protein)} · C{Math.round(entry.carbs)} · F{Math.round(entry.fat)}
          </Text>
        </View>
      </TouchableOpacity>
    </Swipeable>
  );
}

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 10,
    paddingHorizontal: 16,
    backgroundColor: Colors.background,
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: Colors.border,
  },
  left: { flex: 1 },
  name: { fontSize: 14, color: Colors.text, fontWeight: '500' },
  brand: { fontSize: 12, color: Colors.textSecondary, marginTop: 1 },
  qty: { fontSize: 12, color: Colors.textDim, marginTop: 2 },
  right: { alignItems: 'flex-end', marginLeft: 12 },
  cal: { fontSize: 16, fontWeight: '700', color: Colors.text },
  calLabel: { fontSize: 11, color: Colors.textDim },
  macros: { fontSize: 11, color: Colors.textSecondary, marginTop: 3 },
  deleteAction: {
    backgroundColor: Colors.error,
    justifyContent: 'center',
    alignItems: 'center',
    width: 80,
  },
  deleteText: { color: '#fff', fontWeight: '600', fontSize: 13 },
});
