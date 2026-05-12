export type ModuleId =
  | 'dashboard' | 'calendar' | 'tasks' | 'hike'
  | 'nutrition' | 'budget' | 'soundlog' | 'settings'
  | 'study' | 'subscriptions' | 'hub';

export interface UserSettings {
  name: string;
  avatar?: string;
  accentColor: string;
  budgetPin?: string;
}

export type KanbanStatus = 'todo' | 'in_progress' | 'done';

// ── Calendar ──────────────────────────────────────────────────────────────────
export interface EventCategory {
  id: string;
  name: string;
  color: string;
  emoji: string;
}

export interface CalendarEvent {
  id: string;
  title: string;
  date: string;
  time?: string;
  color: string;
  reminder: boolean;
  taskId?: string;
  subscriptionId?: string;
  categoryId?: string;
}

// ── Tasks ─────────────────────────────────────────────────────────────────────
export type Priority = 'high' | 'medium' | 'low';

export interface Task {
  id: string;
  title: string;
  priority: Priority;
  deadline?: string;
  project?: string;
  status: KanbanStatus;
  createdAt: string;
}

// ── Hike ──────────────────────────────────────────────────────────────────────
export type HikeDifficulty = 'easy' | 'moderate' | 'hard' | 'expert';

export interface HikeWishlist {
  id: string;
  name: string;
  location: string;
  estimatedDistance: number;
  difficulty: HikeDifficulty;
  link?: string;
}

export interface HikeDone {
  id: string;
  wishlistId?: string;
  name: string;
  date: string;
  duration: number;
  distance: number;
  elevation: number;
  rating: number;
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

// ── Nutrition ─────────────────────────────────────────────────────────────────
export interface NutritionLog {
  date: string;
  calories: number;
  protein: number;
  creatine: number;
  water: number;
}

export interface NutritionTargets {
  calories: number;
  protein: number;
  creatine: number;
  water: number;
}

// ── Budget ────────────────────────────────────────────────────────────────────
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
  month: string;
  accountId: AccountId;
  savingsGoal: number;
}

export interface AccountBalances {
  cc: number;
  ep: number;
}

// ── Subscriptions ─────────────────────────────────────────────────────────────
export type SubFrequency = 'monthly' | 'every4weeks' | 'yearly' | 'custom';

export interface Subscription {
  id: string;
  name: string;
  emoji?: string;
  amount: number;
  currency: 'EUR' | 'USD' | 'GBP';
  frequency: SubFrequency;
  customDays?: number;
  startDate: string; // YYYY-MM-DD reference date
  color?: string;
}

// ── Hub ───────────────────────────────────────────────────────────────────────
export interface HubCategory {
  id: string;
  name: string;
  emoji: string;
}

export interface HubLink {
  id: string;
  title: string;
  url: string;
  categoryId: string;
  pinned: boolean;
  favicon?: string;
}

// ── Study ─────────────────────────────────────────────────────────────────────
export interface StudyTopic {
  id: string;
  name: string;
  completed: boolean;
}

export interface StudyChapter {
  id: string;
  name: string;
  topics: StudyTopic[];
}

export interface StudyCourse {
  id: string;
  name: string;
  color: string;
  chapters: StudyChapter[];
}

export interface StudySession {
  id: string;
  courseId: string;
  date: string;
  duration: number; // seconds
  type: 'work' | 'break';
}
