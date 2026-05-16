import { useCallback, useState } from 'react';
import {
  Alert, FlatList, StyleSheet, Text, TouchableOpacity, View,
} from 'react-native';
import { router, useFocusEffect } from 'expo-router';
import { useSQLiteContext } from 'expo-sqlite';
import { Swipeable } from 'react-native-gesture-handler';
import { Ionicons } from '@expo/vector-icons';
import { Colors } from '@/constants/colors';
import { addFoodEntry, deleteFavorite, getFavorites } from '@/db/queries';
import { formatDate } from '@/utils/calculations';
import type { Favorite, MealType } from '@/types';

export default function Favorites() {
  const db = useSQLiteContext();
  const [favorites, setFavorites] = useState<Favorite[]>([]);

  const load = useCallback(async () => {
    setFavorites(await getFavorites(db));
  }, [db]);

  useFocusEffect(useCallback(() => { load(); }, [load]));

  const handleAdd = (fav: Favorite) => {
    Alert.alert(
      `Add ${fav.food_name}`,
      'Choose a meal to add this to',
      (['breakfast', 'lunch', 'dinner', 'snack'] as MealType[]).map(meal => ({
        text: meal.charAt(0).toUpperCase() + meal.slice(1),
        onPress: async () => {
          const today = formatDate(new Date());
          const qty = 100;
          await addFoodEntry(db, {
            date: today, meal_type: meal,
            food_name: fav.food_name, brand: fav.brand,
            quantity: qty, unit: 'g',
            calories: fav.calories_per_100g,
            protein: fav.protein_per_100g,
            carbs: fav.carbs_per_100g,
            fat: fav.fat_per_100g,
            barcode: fav.barcode,
          });
          Alert.alert('Added!', `${fav.food_name} added to ${meal}.`);
        },
      })).concat([{ text: 'Cancel', style: 'cancel' } as any])
    );
  };

  const handleDelete = async (id: number) => {
    await deleteFavorite(db, id);
    load();
  };

  const renderRight = (id: number) => () => (
    <TouchableOpacity style={styles.deleteAction} onPress={() => handleDelete(id)}>
      <Ionicons name="trash-outline" size={20} color="#fff" />
    </TouchableOpacity>
  );

  const renderItem = ({ item }: { item: Favorite }) => (
    <Swipeable renderRightActions={renderRight(item.id)} overshootRight={false}>
      <TouchableOpacity style={styles.item} onPress={() => handleAdd(item)} activeOpacity={0.7}>
        <View style={styles.itemLeft}>
          <Text style={styles.itemName} numberOfLines={1}>{item.food_name}</Text>
          {!!item.brand && <Text style={styles.itemBrand}>{item.brand}</Text>}
          <Text style={styles.itemMacros}>
            P{Math.round(item.protein_per_100g)}g · C{Math.round(item.carbs_per_100g)}g · F{Math.round(item.fat_per_100g)}g per 100g
          </Text>
        </View>
        <View style={styles.itemRight}>
          <Text style={styles.itemCal}>{Math.round(item.calories_per_100g)}</Text>
          <Text style={styles.itemCalLabel}>kcal</Text>
          <View style={styles.freqBadge}>
            <Text style={styles.freqText}>×{item.frequency}</Text>
          </View>
        </View>
      </TouchableOpacity>
    </Swipeable>
  );

  return (
    <View style={styles.root}>
      <Text style={styles.title}>Favorites</Text>
      <Text style={styles.subtitle}>Swipe left to delete · Tap to quick-add</Text>

      {favorites.length === 0 ? (
        <View style={styles.empty}>
          <Ionicons name="star-outline" size={48} color={Colors.textDim} />
          <Text style={styles.emptyTitle}>No favorites yet</Text>
          <Text style={styles.emptyDesc}>
            When you log food, it's automatically saved here for quick access.
          </Text>
        </View>
      ) : (
        <FlatList
          data={favorites}
          keyExtractor={i => String(i.id)}
          renderItem={renderItem}
          contentContainerStyle={styles.list}
          showsVerticalScrollIndicator={false}
        />
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: Colors.background },
  title: { fontSize: 28, fontWeight: '700', color: Colors.text, paddingHorizontal: 16, paddingTop: 60 },
  subtitle: { fontSize: 13, color: Colors.textDim, paddingHorizontal: 16, marginTop: 4, marginBottom: 16 },
  list: { paddingBottom: 40 },
  item: {
    flexDirection: 'row', alignItems: 'center', paddingVertical: 14, paddingHorizontal: 16,
    backgroundColor: Colors.surface, marginHorizontal: 16, marginBottom: 8, borderRadius: 14,
  },
  itemLeft: { flex: 1 },
  itemName: { fontSize: 15, fontWeight: '600', color: Colors.text },
  itemBrand: { fontSize: 12, color: Colors.textSecondary, marginTop: 2 },
  itemMacros: { fontSize: 11, color: Colors.textDim, marginTop: 4 },
  itemRight: { alignItems: 'flex-end', marginLeft: 12 },
  itemCal: { fontSize: 18, fontWeight: '700', color: Colors.text },
  itemCalLabel: { fontSize: 11, color: Colors.textDim },
  freqBadge: {
    marginTop: 6, backgroundColor: Colors.primaryDim, borderRadius: 6,
    paddingHorizontal: 6, paddingVertical: 2,
  },
  freqText: { fontSize: 11, fontWeight: '700', color: Colors.primary },
  deleteAction: {
    width: 70, backgroundColor: Colors.error, borderRadius: 14,
    marginBottom: 8, marginRight: 16, alignItems: 'center', justifyContent: 'center',
  },
  empty: { flex: 1, alignItems: 'center', justifyContent: 'center', padding: 40, gap: 12 },
  emptyTitle: { fontSize: 18, fontWeight: '600', color: Colors.textSecondary },
  emptyDesc: { fontSize: 14, color: Colors.textDim, textAlign: 'center', lineHeight: 22 },
});
