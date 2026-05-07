export type ModuleId = 'dashboard' | 'calendar' | 'tasks' | 'hike' | 'nutrition' | 'budget' | 'settings';

export interface UserSettings {
  name: string;
  avatar?: string;      // base64 data URL
  accentColor: string;  // hex
}

export type KanbanStatus = 'todo' | 'in_progress' | 'done';

export interface CalendarEvent {
  id: string;
  title: string;
  date: string;      // YYYY-MM-DD
  time?: string;     // HH:MM
  color: string;
  reminder: boolean;
  taskId?: string;   // set when auto-synced from a Task
}

export type Priority = 'high' | 'medium' | 'low';

export interface Task {
  id: string;
  title: string;
  priority: Priority;
  deadline?: string;  // YYYY-MM-DD
  project?: string;
  status: KanbanStatus;
  createdAt: string;
}

export type HikeDifficulty = 'easy' | 'moderate' | 'hard' | 'expert';

export interface HikeWishlist {
  id: string;
  name: string;
  location: string;
  estimatedDistance: number; // km
  difficulty: HikeDifficulty;
  link?: string;
}

export interface HikeDone {
  id: string;
  wishlistId?: string;
  name: string;
  date: string;       // YYYY-MM-DD
  duration: number;   // minutes
  distance: number;   // km
  elevation: number;  // m
  rating: number;     // 1-5
  comment: string;
}

export interface HikeGearCheck {
  id: string;
  label: string;
  checked: boolean;
}

export interface HikeGearShop {
  id: string;
  title: string;
  link?: string;
  price?: number;
  bought: boolean;
}

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

export type ExpenseCategory = 'food' | 'housing' | 'transport' | 'leisure' | 'health' | 'shopping' | 'services' | 'other';

export type AccountId = 'cc' | 'ep';

export interface BudgetEntry {
  id: string;
  accountId: AccountId;
  type: 'expense' | 'income';
  amount: number;
  category: ExpenseCategory | 'income';
  description: string;
  date: string;
}

export interface BudgetGoal {
  month: string;       // YYYY-MM
  accountId: AccountId;
  savingsGoal: number;
}

export interface AccountBalances {
  cc: number;
  ep: number;
}
