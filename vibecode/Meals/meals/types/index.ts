export type Gender = 'male' | 'female';
export type Goal = 'lose' | 'maintain' | 'gain';
export type ActivityLevel =
  | 'sedentary'
  | 'lightly_active'
  | 'moderately_active'
  | 'very_active'
  | 'super_active';
export type MealType = 'breakfast' | 'lunch' | 'dinner' | 'snack';
export type Units = 'metric' | 'imperial';

export interface Profile {
  id: number;
  age: number;
  gender: Gender;
  weight: number;
  height: number;
  goal: Goal;
  activity_level: ActivityLevel;
  calorie_target: number;
  protein_target: number;
  carbs_target: number;
  fat_target: number;
  units: Units;
  notifications_enabled: number;
}

export interface FoodEntry {
  id: number;
  date: string;
  meal_type: MealType;
  food_name: string;
  brand: string;
  quantity: number;
  unit: string;
  calories: number;
  protein: number;
  carbs: number;
  fat: number;
  barcode?: string;
  created_at: string;
}

export interface Favorite {
  id: number;
  food_name: string;
  brand: string;
  calories_per_100g: number;
  protein_per_100g: number;
  carbs_per_100g: number;
  fat_per_100g: number;
  frequency: number;
  last_used: string;
  barcode?: string;
}

export interface WeightEntry {
  id: number;
  weight: number;
  unit: string;
  date: string;
  created_at: string;
}

export interface DailyStat {
  date: string;
  calories: number;
  protein: number;
  carbs: number;
  fat: number;
}

export interface FoodData {
  name: string;
  brand: string;
  calories: number;
  protein: number;
  carbs: number;
  fat: number;
  fiber: number;
  barcode?: string;
}
