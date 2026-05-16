import { useCallback, useState } from 'react';
import {
  Alert, Platform, ScrollView, Share, StyleSheet, Switch, Text, TouchableOpacity, View,
} from 'react-native';
import { router, useFocusEffect } from 'expo-router';
import { useSQLiteContext } from 'expo-sqlite';
import { Ionicons } from '@expo/vector-icons';
import { Colors } from '@/constants/colors';
import { addWeightEntry, getFoodLog, getProfile, getWeightHistory, updateProfileSettings } from '@/db/queries';
import { formatDate } from '@/utils/calculations';
import type { Profile, WeightEntry } from '@/types';

export default function ProfileScreen() {
  const db = useSQLiteContext();
  const [profile, setProfile] = useState<Profile | null>(null);
  const [weights, setWeights] = useState<WeightEntry[]>([]);

  const load = useCallback(async () => {
    const [p, w] = await Promise.all([getProfile(db), getWeightHistory(db)]);
    setProfile(p);
    setWeights(w);
  }, [db]);

  useFocusEffect(useCallback(() => { load(); }, [load]));

  const handleEditGoals = () => router.push('/onboarding');

  const handleToggleNotifications = async () => {
    if (!profile) return;
    const next = profile.notifications_enabled ? 0 : 1;
    await updateProfileSettings(db, profile.units, next);
    setProfile(p => p ? { ...p, notifications_enabled: next } : p);
  };

  const handleToggleUnits = async () => {
    if (!profile) return;
    const next = profile.units === 'metric' ? 'imperial' : 'metric';
    await updateProfileSettings(db, next, profile.notifications_enabled);
    setProfile(p => p ? { ...p, units: next } : p);
  };

  const handleAddWeight = () => {
    Alert.prompt(
      'Log weight',
      `Enter your weight in ${profile?.units === 'imperial' ? 'lb' : 'kg'}`,
      async (val) => {
        const w = parseFloat(val || '0');
        if (!w || w <= 0) return;
        await addWeightEntry(db, w, profile?.units === 'imperial' ? 'lb' : 'kg');
        load();
      },
      'plain-text',
      weights[0] ? String(weights[0].weight) : ''
    );
  };

  const handleExport = async () => {
    const today = formatDate(new Date());
    const logs: any[] = [];
    for (let i = 0; i < 90; i++) {
      const d = new Date();
      d.setDate(d.getDate() - i);
      const date = formatDate(d);
      const entries = await getFoodLog(db, date);
      logs.push(...entries.map(e => ({
        date: e.date, meal: e.meal_type, food: e.food_name, brand: e.brand,
        quantity: e.quantity, unit: e.unit,
        calories: e.calories, protein: e.protein, carbs: e.carbs, fat: e.fat,
      })));
    }
    if (!logs.length) { Alert.alert('No data', 'Nothing to export yet.'); return; }
    const headers = Object.keys(logs[0]).join(',');
    const rows = logs.map(l => Object.values(l).join(',')).join('\n');
    await Share.share({ message: `${headers}\n${rows}`, title: 'Meals export' });
  };

  if (!profile) return null;

  const goals = { lose: 'Lose weight', maintain: 'Maintain weight', gain: 'Gain muscle' };
  const activities = {
    sedentary: 'Sedentary', lightly_active: 'Lightly active',
    moderately_active: 'Moderately active', very_active: 'Very active', super_active: 'Super active',
  };

  return (
    <ScrollView style={styles.root} contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>
      <Text style={styles.title}>Profile</Text>

      <View style={styles.card}>
        <Text style={styles.cardTitle}>Daily targets</Text>
        <View style={styles.targetsGrid}>
          <TargetCell label="Calories" value={profile.calorie_target} unit="kcal" color={Colors.primary} />
          <TargetCell label="Protein" value={profile.protein_target} unit="g" color={Colors.protein} />
          <TargetCell label="Carbs" value={profile.carbs_target} unit="g" color={Colors.carbs} />
          <TargetCell label="Fat" value={profile.fat_target} unit="g" color={Colors.fat} />
        </View>
        <TouchableOpacity style={styles.editBtn} onPress={handleEditGoals}>
          <Text style={styles.editBtnText}>Edit goals</Text>
        </TouchableOpacity>
      </View>

      <View style={styles.card}>
        <Text style={styles.cardTitle}>Body stats</Text>
        <InfoRow label="Goal" value={goals[profile.goal]} />
        <InfoRow label="Activity" value={activities[profile.activity_level]} />
        <InfoRow label="Age" value={`${profile.age} years`} />
        <InfoRow label="Height" value={`${profile.height} cm`} />
        <InfoRow label="Weight" value={`${profile.weight} kg`} />
      </View>

      <View style={styles.card}>
        <View style={styles.cardHeader}>
          <Text style={styles.cardTitle}>Weight history</Text>
          <TouchableOpacity onPress={handleAddWeight}>
            <Ionicons name="add-circle-outline" size={22} color={Colors.primary} />
          </TouchableOpacity>
        </View>
        {weights.length === 0 ? (
          <Text style={styles.emptyText}>No entries yet. Tap + to log your weight.</Text>
        ) : (
          weights.slice(0, 10).map(w => (
            <InfoRow key={w.id} label={w.date} value={`${w.weight} ${w.unit}`} />
          ))
        )}
      </View>

      <View style={styles.card}>
        <Text style={styles.cardTitle}>Settings</Text>
        <ToggleRow label="Units" value={profile.units === 'imperial' ? 'Imperial (lb/ft)' : 'Metric (kg/cm)'} onPress={handleToggleUnits} />
        <View style={styles.switchRow}>
          <Text style={styles.switchLabel}>Notifications</Text>
          <Switch
            value={!!profile.notifications_enabled}
            onValueChange={handleToggleNotifications}
            trackColor={{ false: Colors.border, true: Colors.primaryDim }}
            thumbColor={profile.notifications_enabled ? Colors.primary : Colors.textDim}
          />
        </View>
      </View>

      <TouchableOpacity style={styles.exportBtn} onPress={handleExport}>
        <Ionicons name="download-outline" size={18} color={Colors.primary} />
        <Text style={styles.exportText}>Export food log (CSV)</Text>
      </TouchableOpacity>

      <View style={{ height: 40 }} />
    </ScrollView>
  );
}

function TargetCell({ label, value, unit, color }: { label: string; value: number; unit: string; color: string }) {
  return (
    <View style={{ alignItems: 'center', flex: 1 }}>
      <Text style={{ fontSize: 22, fontWeight: '800', color }}>{value}</Text>
      <Text style={{ fontSize: 11, color: Colors.textDim, marginTop: 2 }}>{label} ({unit})</Text>
    </View>
  );
}

function InfoRow({ label, value }: { label: string; value: string }) {
  return (
    <View style={styles.infoRow}>
      <Text style={styles.infoLabel}>{label}</Text>
      <Text style={styles.infoValue}>{value}</Text>
    </View>
  );
}

function ToggleRow({ label, value, onPress }: { label: string; value: string; onPress: () => void }) {
  return (
    <TouchableOpacity style={styles.infoRow} onPress={onPress}>
      <Text style={styles.infoLabel}>{label}</Text>
      <Text style={[styles.infoValue, { color: Colors.primary }]}>{value}</Text>
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: Colors.background },
  content: { paddingHorizontal: 16, paddingTop: 60, paddingBottom: 40 },
  title: { fontSize: 28, fontWeight: '700', color: Colors.text, marginBottom: 20 },
  card: { backgroundColor: Colors.surface, borderRadius: 16, padding: 16, marginBottom: 16 },
  cardTitle: { fontSize: 16, fontWeight: '600', color: Colors.text, marginBottom: 14 },
  cardHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 14 },
  targetsGrid: { flexDirection: 'row', justifyContent: 'space-around', marginBottom: 16 },
  editBtn: {
    backgroundColor: Colors.primaryDim, borderRadius: 10, paddingVertical: 10, alignItems: 'center',
  },
  editBtnText: { color: Colors.primary, fontWeight: '600', fontSize: 14 },
  infoRow: {
    flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center',
    paddingVertical: 10, borderBottomWidth: StyleSheet.hairlineWidth, borderBottomColor: Colors.border,
  },
  infoLabel: { fontSize: 14, color: Colors.textSecondary },
  infoValue: { fontSize: 14, fontWeight: '600', color: Colors.text },
  switchRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingVertical: 8 },
  switchLabel: { fontSize: 14, color: Colors.textSecondary },
  emptyText: { fontSize: 13, color: Colors.textDim, paddingVertical: 8 },
  exportBtn: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 8,
    backgroundColor: Colors.surface, borderRadius: 14, padding: 16,
    borderWidth: 1, borderColor: Colors.primary,
  },
  exportText: { fontSize: 15, fontWeight: '600', color: Colors.primary },
});
