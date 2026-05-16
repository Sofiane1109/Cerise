import { useRef, useState } from 'react';
import {
  Animated, KeyboardAvoidingView, Platform, Pressable, ScrollView,
  StyleSheet, Text, TextInput, TouchableOpacity, View,
} from 'react-native';
import { router } from 'expo-router';
import { useSQLiteContext } from 'expo-sqlite';
import { Colors } from '@/constants/colors';
import { calculateTargets } from '@/utils/calculations';
import { saveProfile } from '@/db/queries';
import type { ActivityLevel, Gender, Goal } from '@/types';

const STEPS = ['gender', 'age', 'height', 'weight', 'goal', 'activity'] as const;
type Step = typeof STEPS[number];

interface FormState {
  gender: Gender;
  age: string;
  height: string;
  weight: string;
  goal: Goal;
  activity: ActivityLevel;
}

const GOALS: { value: Goal; label: string; desc: string }[] = [
  { value: 'lose', label: 'Lose weight', desc: '−500 kcal/day deficit' },
  { value: 'maintain', label: 'Maintain weight', desc: 'Balance intake & output' },
  { value: 'gain', label: 'Gain muscle', desc: '+500 kcal/day surplus' },
];

const ACTIVITIES: { value: ActivityLevel; label: string; desc: string }[] = [
  { value: 'sedentary', label: 'Sedentary', desc: 'Little or no exercise' },
  { value: 'lightly_active', label: 'Lightly active', desc: '1–3 days/week' },
  { value: 'moderately_active', label: 'Moderately active', desc: '3–5 days/week' },
  { value: 'very_active', label: 'Very active', desc: '6–7 days/week' },
  { value: 'super_active', label: 'Super active', desc: 'Physical job + daily training' },
];

export default function Onboarding() {
  const db = useSQLiteContext();
  const [step, setStep] = useState(0);
  const [saving, setSaving] = useState(false);
  const [form, setForm] = useState<FormState>({
    gender: 'male',
    age: '',
    height: '',
    weight: '',
    goal: 'maintain',
    activity: 'moderately_active',
  });
  const fadeAnim = useRef(new Animated.Value(1)).current;

  const transition = (next: () => void) => {
    Animated.sequence([
      Animated.timing(fadeAnim, { toValue: 0, duration: 150, useNativeDriver: true }),
      Animated.timing(fadeAnim, { toValue: 1, duration: 200, useNativeDriver: true }),
    ]).start();
    setTimeout(next, 150);
  };

  const goNext = () => {
    if (step < STEPS.length - 1) transition(() => setStep(s => s + 1));
    else handleFinish();
  };

  const goBack = () => {
    if (step > 0) transition(() => setStep(s => s - 1));
  };

  const canProceed = (): boolean => {
    const s = STEPS[step];
    if (s === 'age') return !!form.age && Number(form.age) > 0 && Number(form.age) < 120;
    if (s === 'height') return !!form.height && Number(form.height) > 0;
    if (s === 'weight') return !!form.weight && Number(form.weight) > 0;
    return true;
  };

  const handleFinish = async () => {
    setSaving(true);
    const weight = parseFloat(form.weight);
    const height = parseFloat(form.height);
    const age = parseInt(form.age, 10);
    const targets = calculateTargets(weight, height, age, form.gender, form.goal, form.activity);
    await saveProfile(db, {
      age, gender: form.gender, weight, height,
      goal: form.goal, activity_level: form.activity,
      calorie_target: targets.calories,
      protein_target: targets.protein,
      carbs_target: targets.carbs,
      fat_target: targets.fat,
      units: 'metric',
    });
    router.replace('/(tabs)');
  };

  const currentStep = STEPS[step];

  return (
    <KeyboardAvoidingView style={styles.root} behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
      <View style={styles.progressBar}>
        {STEPS.map((_, i) => (
          <View
            key={i}
            style={[styles.progressDot, { backgroundColor: i <= step ? Colors.primary : Colors.border }]}
          />
        ))}
      </View>

      <Animated.View style={[styles.content, { opacity: fadeAnim }]}>
        {currentStep === 'gender' && (
          <StepWrapper title="What's your biological sex?" subtitle="Used for accurate calorie calculation">
            <View style={styles.optionRow}>
              {(['male', 'female'] as Gender[]).map(g => (
                <TouchableOpacity
                  key={g}
                  style={[styles.optionCard, form.gender === g && styles.optionSelected]}
                  onPress={() => setForm(f => ({ ...f, gender: g }))}
                >
                  <Text style={styles.optionEmoji}>{g === 'male' ? '♂' : '♀'}</Text>
                  <Text style={[styles.optionLabel, form.gender === g && styles.optionLabelSelected]}>
                    {g.charAt(0).toUpperCase() + g.slice(1)}
                  </Text>
                </TouchableOpacity>
              ))}
            </View>
          </StepWrapper>
        )}

        {currentStep === 'age' && (
          <StepWrapper title="How old are you?" subtitle="Your age affects your metabolic rate">
            <TextInput
              style={styles.input}
              value={form.age}
              onChangeText={v => setForm(f => ({ ...f, age: v.replace(/\D/g, '') }))}
              keyboardType="number-pad"
              placeholder="25"
              placeholderTextColor={Colors.textDim}
              maxLength={3}
              autoFocus
            />
            <Text style={styles.unit}>years old</Text>
          </StepWrapper>
        )}

        {currentStep === 'height' && (
          <StepWrapper title="What's your height?" subtitle="Enter in centimeters">
            <TextInput
              style={styles.input}
              value={form.height}
              onChangeText={v => setForm(f => ({ ...f, height: v.replace(/[^0-9.]/g, '') }))}
              keyboardType="decimal-pad"
              placeholder="175"
              placeholderTextColor={Colors.textDim}
              maxLength={5}
              autoFocus
            />
            <Text style={styles.unit}>cm</Text>
          </StepWrapper>
        )}

        {currentStep === 'weight' && (
          <StepWrapper title="What's your weight?" subtitle="Enter in kilograms">
            <TextInput
              style={styles.input}
              value={form.weight}
              onChangeText={v => setForm(f => ({ ...f, weight: v.replace(/[^0-9.]/g, '') }))}
              keyboardType="decimal-pad"
              placeholder="70"
              placeholderTextColor={Colors.textDim}
              maxLength={5}
              autoFocus
            />
            <Text style={styles.unit}>kg</Text>
          </StepWrapper>
        )}

        {currentStep === 'goal' && (
          <StepWrapper title="What's your goal?" subtitle="We'll adjust your daily targets accordingly">
            {GOALS.map(g => (
              <TouchableOpacity
                key={g.value}
                style={[styles.listOption, form.goal === g.value && styles.listOptionSelected]}
                onPress={() => setForm(f => ({ ...f, goal: g.value }))}
              >
                <Text style={[styles.listLabel, form.goal === g.value && styles.listLabelSelected]}>
                  {g.label}
                </Text>
                <Text style={styles.listDesc}>{g.desc}</Text>
              </TouchableOpacity>
            ))}
          </StepWrapper>
        )}

        {currentStep === 'activity' && (
          <StepWrapper title="How active are you?" subtitle="Include all exercise, not just workouts">
            <ScrollView showsVerticalScrollIndicator={false}>
              {ACTIVITIES.map(a => (
                <TouchableOpacity
                  key={a.value}
                  style={[styles.listOption, form.activity === a.value && styles.listOptionSelected]}
                  onPress={() => setForm(f => ({ ...f, activity: a.value }))}
                >
                  <Text style={[styles.listLabel, form.activity === a.value && styles.listLabelSelected]}>
                    {a.label}
                  </Text>
                  <Text style={styles.listDesc}>{a.desc}</Text>
                </TouchableOpacity>
              ))}
            </ScrollView>
          </StepWrapper>
        )}
      </Animated.View>

      <View style={styles.footer}>
        {step > 0 && (
          <TouchableOpacity style={styles.backBtn} onPress={goBack}>
            <Text style={styles.backText}>Back</Text>
          </TouchableOpacity>
        )}
        <TouchableOpacity
          style={[styles.nextBtn, !canProceed() && styles.nextBtnDisabled]}
          onPress={goNext}
          disabled={!canProceed() || saving}
        >
          <Text style={styles.nextText}>
            {step === STEPS.length - 1 ? (saving ? 'Saving…' : 'Get started') : 'Continue'}
          </Text>
        </TouchableOpacity>
      </View>
    </KeyboardAvoidingView>
  );
}

function StepWrapper({ title, subtitle, children }: { title: string; subtitle: string; children: React.ReactNode }) {
  return (
    <View style={styles.step}>
      <Text style={styles.stepTitle}>{title}</Text>
      <Text style={styles.stepSubtitle}>{subtitle}</Text>
      <View style={styles.stepBody}>{children}</View>
    </View>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: Colors.background, paddingTop: 60 },
  progressBar: { flexDirection: 'row', gap: 6, paddingHorizontal: 24, marginBottom: 40 },
  progressDot: { flex: 1, height: 4, borderRadius: 2 },
  content: { flex: 1, paddingHorizontal: 24 },
  step: { flex: 1 },
  stepTitle: { fontSize: 28, fontWeight: '700', color: Colors.text, marginBottom: 8 },
  stepSubtitle: { fontSize: 15, color: Colors.textSecondary, marginBottom: 32 },
  stepBody: { flex: 1 },
  optionRow: { flexDirection: 'row', gap: 16 },
  optionCard: {
    flex: 1, backgroundColor: Colors.surface, borderRadius: 16, paddingVertical: 32,
    alignItems: 'center', borderWidth: 2, borderColor: Colors.border,
  },
  optionSelected: { borderColor: Colors.primary, backgroundColor: Colors.primaryDim },
  optionEmoji: { fontSize: 40, marginBottom: 12 },
  optionLabel: { fontSize: 16, fontWeight: '600', color: Colors.textSecondary },
  optionLabelSelected: { color: Colors.primary },
  input: {
    fontSize: 52, fontWeight: '700', color: Colors.text, textAlign: 'center',
    borderBottomWidth: 2, borderBottomColor: Colors.primary, paddingBottom: 8, marginBottom: 12,
  },
  unit: { fontSize: 18, color: Colors.textSecondary, textAlign: 'center' },
  listOption: {
    backgroundColor: Colors.surface, borderRadius: 14, padding: 16, marginBottom: 10,
    borderWidth: 2, borderColor: Colors.border,
  },
  listOptionSelected: { borderColor: Colors.primary, backgroundColor: Colors.primaryDim },
  listLabel: { fontSize: 16, fontWeight: '600', color: Colors.text, marginBottom: 3 },
  listLabelSelected: { color: Colors.primary },
  listDesc: { fontSize: 13, color: Colors.textSecondary },
  footer: {
    flexDirection: 'row', gap: 12, padding: 24,
    paddingBottom: Platform.OS === 'ios' ? 44 : 24,
  },
  backBtn: {
    flex: 1, height: 54, borderRadius: 14, borderWidth: 2, borderColor: Colors.border,
    alignItems: 'center', justifyContent: 'center',
  },
  backText: { fontSize: 16, fontWeight: '600', color: Colors.textSecondary },
  nextBtn: {
    flex: 2, height: 54, borderRadius: 14, backgroundColor: Colors.primary,
    alignItems: 'center', justifyContent: 'center',
  },
  nextBtnDisabled: { opacity: 0.4 },
  nextText: { fontSize: 16, fontWeight: '700', color: '#0f172a' },
});
