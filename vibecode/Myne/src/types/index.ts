export type ModuleId = 'dashboard' | 'calendar' | 'tasks' | 'hobbies' | 'nutrition' | 'wellbeing' | 'budget';

export interface CalendarEvent {
  id: string;
  title: string;
  date: string;      // YYYY-MM-DD
  time?: string;     // HH:MM
  color: string;
  reminder: boolean;
}

export type Priority = 'high' | 'medium' | 'low';

export interface Task {
  id: string;
  title: string;
  priority: Priority;
  deadline?: string;  // YYYY-MM-DD
  project?: string;
  completed: boolean;
  createdAt: string;
}

export interface GymSet {
  reps: number;
  weight: number;
}

export interface GymExercise {
  name: string;
  muscleGroup: string;
  sets: GymSet[];
}

export interface HikingLog {
  id: string;
  type: 'hiking';
  date: string;
  distance: number;   // km
  elevation: number;  // m
  duration: number;   // minutes
  notes: string;
}

export interface GymLog {
  id: string;
  type: 'gym';
  date: string;
  exercises: GymExercise[];
}

export interface SportLog {
  id: string;
  type: 'sport';
  sport: string;
  date: string;
  duration: number;  // minutes
  notes: string;
}

export type ActivityLog = HikingLog | GymLog | SportLog;

export interface NutritionLog {
  date: string;
  calories: number;
  protein: number;   // g
  creatine: number;  // g
  water: number;     // ml
}

export interface NutritionTargets {
  calories: number;
  protein: number;
  creatine: number;
  water: number;
}

export interface WellbeingLog {
  date: string;
  sleepDuration: number;  // hours
  sleepQuality: number;   // 1-5
  mood: number;           // 1-5
  energy: number;         // 1-5
}

export type ExpenseCategory = 'food' | 'housing' | 'transport' | 'leisure' | 'health' | 'shopping' | 'services' | 'other';

export interface BudgetEntry {
  id: string;
  type: 'expense' | 'income';
  amount: number;
  category: ExpenseCategory | 'income';
  description: string;
  date: string;
}

export interface BudgetGoal {
  month: string;       // YYYY-MM
  savingsGoal: number;
}
