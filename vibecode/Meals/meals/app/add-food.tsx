import { useEffect, useRef, useState } from 'react';
import {
  ActivityIndicator, Alert, FlatList, KeyboardAvoidingView, Platform,
  StyleSheet, Text, TextInput, TouchableOpacity, View,
} from 'react-native';
import { router, useLocalSearchParams } from 'expo-router';
import { useSQLiteContext } from 'expo-sqlite';
import { Ionicons } from '@expo/vector-icons';
import { Colors } from '@/constants/colors';
import { addFoodEntry, upsertFavorite } from '@/db/queries';
import { searchFoods, fetchByBarcode } from '@/utils/api';
import type { FoodData, MealType } from '@/types';

type Tab = 'search' | 'manual';

interface SelectedFood extends FoodData {
  confirmed: boolean;
}

export default function AddFood() {
  const db = useSQLiteContext();
  const params = useLocalSearchParams<{ meal: MealType; date: string; barcode?: string }>();
  const meal = (params.meal ?? 'snack') as MealType;
  const date = params.date ?? new Date().toISOString().split('T')[0];

  const [tab, setTab] = useState<Tab>('search');
  const [query, setQuery] = useState('');
  const [results, setResults] = useState<FoodData[]>([]);
  const [searching, setSearching] = useState(false);
  const [selected, setSelected] = useState<SelectedFood | null>(null);
  const [qty, setQty] = useState('100');
  const [saving, setSaving] = useState(false);

  // Manual entry form
  const [manual, setManual] = useState({ name: '', brand: '', calories: '', protein: '', carbs: '', fat: '' });

  const searchTimeout = useRef<ReturnType<typeof setTimeout> | undefined>(undefined);

  useEffect(() => {
    if (params.barcode) {
      resolveBarcode(params.barcode);
    }
  }, [params.barcode]);

  const resolveBarcode = async (code: string) => {
    setSearching(true);
    const food = await fetchByBarcode(code);
    setSearching(false);
    if (food) selectFood(food);
    else Alert.alert('Not found', 'Product not found in Open Food Facts database. Try searching by name or enter manually.');
  };

  const handleSearchChange = (text: string) => {
    setQuery(text);
    clearTimeout(searchTimeout.current);
    if (!text.trim()) { setResults([]); return; }
    searchTimeout.current = setTimeout(async () => {
      setSearching(true);
      const res = await searchFoods(text);
      setResults(res);
      setSearching(false);
    }, 500);
  };

  const selectFood = (food: FoodData) => {
    setSelected({ ...food, confirmed: false });
    setQty('100');
  };

  const calcNutrition = (food: FoodData, q: number) => {
    const ratio = q / 100;
    return {
      calories: food.calories * ratio,
      protein: food.protein * ratio,
      carbs: food.carbs * ratio,
      fat: food.fat * ratio,
    };
  };

  const handleAdd = async () => {
    if (!selected) return;
    const q = parseFloat(qty);
    if (!q || q <= 0) { Alert.alert('Invalid quantity'); return; }
    setSaving(true);
    const nutrition = calcNutrition(selected, q);
    await addFoodEntry(db, {
      date, meal_type: meal,
      food_name: selected.name, brand: selected.brand ?? '',
      quantity: q, unit: 'g',
      ...nutrition,
      barcode: selected.barcode,
    });
    await upsertFavorite(db, {
      food_name: selected.name, brand: selected.brand ?? '',
      calories_per_100g: selected.calories,
      protein_per_100g: selected.protein,
      carbs_per_100g: selected.carbs,
      fat_per_100g: selected.fat,
      barcode: selected.barcode,
    });
    setSaving(false);
    router.back();
  };

  const handleAddManual = async () => {
    if (!manual.name.trim()) { Alert.alert('Enter a food name'); return; }
    const cal = parseFloat(manual.calories) || 0;
    const prot = parseFloat(manual.protein) || 0;
    const carb = parseFloat(manual.carbs) || 0;
    const fat = parseFloat(manual.fat) || 0;
    const q = parseFloat(qty) || 100;
    setSaving(true);
    const ratio = q / 100;
    await addFoodEntry(db, {
      date, meal_type: meal,
      food_name: manual.name, brand: manual.brand,
      quantity: q, unit: 'g',
      calories: cal * ratio, protein: prot * ratio, carbs: carb * ratio, fat: fat * ratio,
    });
    await upsertFavorite(db, {
      food_name: manual.name, brand: manual.brand,
      calories_per_100g: cal, protein_per_100g: prot, carbs_per_100g: carb, fat_per_100g: fat,
    });
    setSaving(false);
    router.back();
  };

  const qNum = parseFloat(qty) || 0;
  const preview = selected ? calcNutrition(selected, qNum) : null;
  const mealLabel = meal.charAt(0).toUpperCase() + meal.slice(1);

  return (
    <KeyboardAvoidingView style={styles.root} behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.back()} hitSlop={{ top: 12, bottom: 12, left: 12, right: 12 }}>
          <Ionicons name="close" size={24} color={Colors.text} />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Add to {mealLabel}</Text>
        <View style={{ width: 24 }} />
      </View>

      {!selected ? (
        <>
          <View style={styles.tabs}>
            {(['search', 'manual'] as Tab[]).map(t => (
              <TouchableOpacity
                key={t}
                style={[styles.tabBtn, tab === t && styles.tabBtnActive]}
                onPress={() => setTab(t)}
              >
                <Text style={[styles.tabText, tab === t && styles.tabTextActive]}>
                  {t.charAt(0).toUpperCase() + t.slice(1)}
                </Text>
              </TouchableOpacity>
            ))}
            <TouchableOpacity
              style={styles.scanBtn}
              onPress={() => router.push(`/scan?meal=${meal}&date=${date}`)}
            >
              <Ionicons name="barcode-outline" size={20} color={Colors.primary} />
              <Text style={styles.scanText}>Scan</Text>
            </TouchableOpacity>
          </View>

          {tab === 'search' ? (
            <>
              <View style={styles.searchBar}>
                <Ionicons name="search-outline" size={18} color={Colors.textDim} />
                <TextInput
                  style={styles.searchInput}
                  value={query}
                  onChangeText={handleSearchChange}
                  placeholder="Search foods…"
                  placeholderTextColor={Colors.textDim}
                  autoFocus
                  returnKeyType="search"
                />
                {searching && <ActivityIndicator size="small" color={Colors.primary} />}
              </View>

              <FlatList
                data={results}
                keyExtractor={(_, i) => String(i)}
                renderItem={({ item }) => (
                  <TouchableOpacity style={styles.resultItem} onPress={() => selectFood(item)}>
                    <View style={{ flex: 1 }}>
                      <Text style={styles.resultName} numberOfLines={1}>{item.name}</Text>
                      {!!item.brand && <Text style={styles.resultBrand}>{item.brand}</Text>}
                      <Text style={styles.resultMacros}>
                        P{Math.round(item.protein)}g · C{Math.round(item.carbs)}g · F{Math.round(item.fat)}g per 100g
                      </Text>
                    </View>
                    <View style={{ alignItems: 'flex-end' }}>
                      <Text style={styles.resultCal}>{Math.round(item.calories)}</Text>
                      <Text style={styles.resultCalLabel}>kcal/100g</Text>
                    </View>
                  </TouchableOpacity>
                )}
                ListEmptyComponent={
                  query.length > 1 && !searching ? (
                    <Text style={styles.emptyText}>No results. Try a different search.</Text>
                  ) : query.length === 0 ? (
                    <Text style={styles.emptyText}>Start typing to search Open Food Facts…</Text>
                  ) : null
                }
                contentContainerStyle={{ paddingBottom: 40 }}
              />
            </>
          ) : (
            <ManualForm
              form={manual}
              qty={qty}
              onChange={(k, v) => setManual(f => ({ ...f, [k]: v }))}
              onQtyChange={setQty}
              onSubmit={handleAddManual}
              saving={saving}
            />
          )}
        </>
      ) : (
        <FoodConfirm
          food={selected}
          qty={qty}
          preview={preview!}
          onQtyChange={setQty}
          onBack={() => setSelected(null)}
          onAdd={handleAdd}
          saving={saving}
        />
      )}
    </KeyboardAvoidingView>
  );
}

function FoodConfirm({
  food, qty, preview, onQtyChange, onBack, onAdd, saving,
}: {
  food: FoodData; qty: string; preview: { calories: number; protein: number; carbs: number; fat: number };
  onQtyChange: (v: string) => void; onBack: () => void; onAdd: () => void; saving: boolean;
}) {
  return (
    <View style={{ flex: 1, paddingHorizontal: 16 }}>
      <TouchableOpacity onPress={onBack} style={styles.backRow}>
        <Ionicons name="arrow-back" size={16} color={Colors.textSecondary} />
        <Text style={styles.backText}>Back to search</Text>
      </TouchableOpacity>

      <View style={styles.confirmCard}>
        <Text style={styles.confirmName}>{food.name}</Text>
        {!!food.brand && <Text style={styles.confirmBrand}>{food.brand}</Text>}
        <View style={styles.per100}>
          <Text style={styles.per100Title}>Per 100g</Text>
          <View style={styles.per100Row}>
            <NutrPill label="kcal" value={food.calories} color={Colors.primary} />
            <NutrPill label="protein" value={food.protein} color={Colors.protein} />
            <NutrPill label="carbs" value={food.carbs} color={Colors.carbs} />
            <NutrPill label="fat" value={food.fat} color={Colors.fat} />
          </View>
        </View>
      </View>

      <View style={styles.qtyCard}>
        <Text style={styles.qtyLabel}>Quantity (g)</Text>
        <TextInput
          style={styles.qtyInput}
          value={qty}
          onChangeText={onQtyChange}
          keyboardType="decimal-pad"
          selectTextOnFocus
        />
      </View>

      <View style={styles.previewCard}>
        <Text style={styles.previewTitle}>Total for {qty || 0}g</Text>
        <View style={styles.per100Row}>
          <NutrPill label="kcal" value={preview.calories} color={Colors.primary} large />
          <NutrPill label="protein" value={preview.protein} color={Colors.protein} />
          <NutrPill label="carbs" value={preview.carbs} color={Colors.carbs} />
          <NutrPill label="fat" value={preview.fat} color={Colors.fat} />
        </View>
      </View>

      <TouchableOpacity style={styles.addBtn} onPress={onAdd} disabled={saving}>
        {saving ? (
          <ActivityIndicator color="#0f172a" />
        ) : (
          <Text style={styles.addBtnText}>Add to log</Text>
        )}
      </TouchableOpacity>
    </View>
  );
}

function NutrPill({ label, value, color, large }: { label: string; value: number; color: string; large?: boolean }) {
  return (
    <View style={{ alignItems: 'center' }}>
      <Text style={{ fontSize: large ? 22 : 16, fontWeight: '700', color }}>{Math.round(value)}</Text>
      <Text style={{ fontSize: 11, color: Colors.textDim, marginTop: 2 }}>{label}</Text>
    </View>
  );
}

function ManualForm({ form, qty, onChange, onQtyChange, onSubmit, saving }: {
  form: Record<string, string>;
  qty: string;
  onChange: (key: string, val: string) => void;
  onQtyChange: (v: string) => void;
  onSubmit: () => void;
  saving: boolean;
}) {
  return (
    <View style={{ flex: 1, paddingHorizontal: 16 }}>
      <Text style={styles.manualHint}>Values per 100g</Text>
      <ManualField label="Food name *" value={form.name} onChangeText={v => onChange('name', v)} />
      <ManualField label="Brand" value={form.brand} onChangeText={v => onChange('brand', v)} />
      <View style={styles.manualRow}>
        <View style={{ flex: 1 }}>
          <ManualField label="Calories" value={form.calories} onChangeText={v => onChange('calories', v)} numeric />
        </View>
        <View style={{ flex: 1, marginLeft: 12 }}>
          <ManualField label="Protein (g)" value={form.protein} onChangeText={v => onChange('protein', v)} numeric />
        </View>
      </View>
      <View style={styles.manualRow}>
        <View style={{ flex: 1 }}>
          <ManualField label="Carbs (g)" value={form.carbs} onChangeText={v => onChange('carbs', v)} numeric />
        </View>
        <View style={{ flex: 1, marginLeft: 12 }}>
          <ManualField label="Fat (g)" value={form.fat} onChangeText={v => onChange('fat', v)} numeric />
        </View>
      </View>
      <ManualField label="Quantity (g)" value={qty} onChangeText={onQtyChange} numeric />
      <TouchableOpacity style={styles.addBtn} onPress={onSubmit} disabled={saving}>
        {saving ? <ActivityIndicator color="#0f172a" /> : <Text style={styles.addBtnText}>Add to log</Text>}
      </TouchableOpacity>
    </View>
  );
}

function ManualField({ label, value, onChangeText, numeric }: {
  label: string; value: string; onChangeText: (v: string) => void; numeric?: boolean;
}) {
  return (
    <View style={styles.field}>
      <Text style={styles.fieldLabel}>{label}</Text>
      <TextInput
        style={styles.fieldInput}
        value={value}
        onChangeText={onChangeText}
        keyboardType={numeric ? 'decimal-pad' : 'default'}
        placeholderTextColor={Colors.textDim}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: Colors.background, paddingTop: Platform.OS === 'ios' ? 54 : 20 },
  header: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingHorizontal: 16, paddingBottom: 12 },
  headerTitle: { fontSize: 17, fontWeight: '700', color: Colors.text },
  tabs: { flexDirection: 'row', paddingHorizontal: 16, gap: 8, marginBottom: 12 },
  tabBtn: { flex: 1, paddingVertical: 9, borderRadius: 10, backgroundColor: Colors.surface, alignItems: 'center' },
  tabBtnActive: { backgroundColor: Colors.primaryDim },
  tabText: { fontSize: 14, fontWeight: '600', color: Colors.textSecondary },
  tabTextActive: { color: Colors.primary },
  scanBtn: { flexDirection: 'row', alignItems: 'center', gap: 4, paddingHorizontal: 12, paddingVertical: 9, borderRadius: 10, backgroundColor: Colors.surface },
  scanText: { fontSize: 13, fontWeight: '600', color: Colors.primary },
  searchBar: { flexDirection: 'row', alignItems: 'center', gap: 10, marginHorizontal: 16, marginBottom: 12, backgroundColor: Colors.surface, borderRadius: 12, paddingHorizontal: 14, paddingVertical: 10 },
  searchInput: { flex: 1, fontSize: 16, color: Colors.text },
  resultItem: { flexDirection: 'row', alignItems: 'center', paddingVertical: 12, paddingHorizontal: 16, borderBottomWidth: StyleSheet.hairlineWidth, borderBottomColor: Colors.border },
  resultName: { fontSize: 14, fontWeight: '600', color: Colors.text },
  resultBrand: { fontSize: 12, color: Colors.textSecondary, marginTop: 2 },
  resultMacros: { fontSize: 11, color: Colors.textDim, marginTop: 3 },
  resultCal: { fontSize: 16, fontWeight: '700', color: Colors.text },
  resultCalLabel: { fontSize: 11, color: Colors.textDim },
  emptyText: { textAlign: 'center', color: Colors.textDim, padding: 32, fontSize: 14 },
  backRow: { flexDirection: 'row', alignItems: 'center', gap: 6, paddingVertical: 12 },
  backText: { fontSize: 14, color: Colors.textSecondary },
  confirmCard: { backgroundColor: Colors.surface, borderRadius: 16, padding: 16, marginBottom: 12 },
  confirmName: { fontSize: 18, fontWeight: '700', color: Colors.text },
  confirmBrand: { fontSize: 14, color: Colors.textSecondary, marginTop: 4 },
  per100: { marginTop: 12 },
  per100Title: { fontSize: 12, color: Colors.textDim, marginBottom: 8 },
  per100Row: { flexDirection: 'row', justifyContent: 'space-around' },
  qtyCard: { backgroundColor: Colors.surface, borderRadius: 14, padding: 14, marginBottom: 12, flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
  qtyLabel: { fontSize: 15, fontWeight: '600', color: Colors.text },
  qtyInput: { fontSize: 24, fontWeight: '700', color: Colors.primary, textAlign: 'right', minWidth: 80 },
  previewCard: { backgroundColor: Colors.surface, borderRadius: 14, padding: 14, marginBottom: 20 },
  previewTitle: { fontSize: 13, color: Colors.textDim, marginBottom: 10 },
  addBtn: { backgroundColor: Colors.primary, borderRadius: 14, height: 54, alignItems: 'center', justifyContent: 'center' },
  addBtnText: { fontSize: 16, fontWeight: '700', color: '#0f172a' },
  manualHint: { fontSize: 12, color: Colors.textDim, marginBottom: 8 },
  manualRow: { flexDirection: 'row' },
  field: { marginBottom: 10 },
  fieldLabel: { fontSize: 12, color: Colors.textSecondary, marginBottom: 4 },
  fieldInput: { backgroundColor: Colors.surface, borderRadius: 10, paddingHorizontal: 12, paddingVertical: 10, fontSize: 15, color: Colors.text },
});
