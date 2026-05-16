import type { ActivityLevel, Gender, Goal } from '@/types';

const ACTIVITY_MULTIPLIERS: Record<ActivityLevel, number> = {
  sedentary: 1.2,
  lightly_active: 1.375,
  moderately_active: 1.55,
  very_active: 1.725,
  super_active: 1.9,
};

const GOAL_ADJUSTMENTS: Record<Goal, number> = {
  lose: -500,
  maintain: 0,
  gain: 500,
};

export function calculateTargets(
  weight: number,
  height: number,
  age: number,
  gender: Gender,
  goal: Goal,
  activityLevel: ActivityLevel
) {
  const bmr = 10 * weight + 6.25 * height - 5 * age + (gender === 'male' ? 5 : -161);
  const tdee = bmr * ACTIVITY_MULTIPLIERS[activityLevel];
  const calories = Math.round(tdee + GOAL_ADJUSTMENTS[goal]);
  const protein = Math.round(weight * 2);
  const fat = Math.round((calories * 0.25) / 9);
  const carbs = Math.round((calories - protein * 4 - fat * 9) / 4);
  return { calories, protein, carbs: Math.max(carbs, 0), fat };
}

export function formatDate(date: Date): string {
  const y = date.getFullYear();
  const m = String(date.getMonth() + 1).padStart(2, '0');
  const d = String(date.getDate()).padStart(2, '0');
  return `${y}-${m}-${d}`;
}

export function parseDate(str: string): Date {
  return new Date(str + 'T12:00:00');
}

export function addDays(dateStr: string, days: number): string {
  const d = parseDate(dateStr);
  d.setDate(d.getDate() + days);
  return formatDate(d);
}

export function getDateLabel(dateStr: string): string {
  const today = formatDate(new Date());
  const yesterday = addDays(today, -1);
  if (dateStr === today) return 'Today';
  if (dateStr === yesterday) return 'Yesterday';
  const date = parseDate(dateStr);
  return date.toLocaleDateString('en-US', { weekday: 'short', month: 'short', day: 'numeric' });
}

export function getDayAbbr(dateStr: string): string {
  return parseDate(dateStr).toLocaleDateString('en-US', { weekday: 'short' });
}

export function kgToLb(kg: number) { return Math.round(kg * 2.2046 * 10) / 10; }
export function lbToKg(lb: number) { return Math.round(lb / 2.2046 * 10) / 10; }
export function cmToFt(cm: number) {
  const totalIn = cm / 2.54;
  const ft = Math.floor(totalIn / 12);
  const inch = Math.round(totalIn % 12);
  return `${ft}'${inch}"`;
}
export function ftInToCm(ft: number, inch: number) { return Math.round((ft * 12 + inch) * 2.54); }
