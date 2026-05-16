import type { SQLiteDatabase } from 'expo-sqlite';
import type { DailyStat, Favorite, FoodEntry, Profile, WeightEntry } from '@/types';

// ── Profile ──────────────────────────────────────────────────────────────────

export async function getProfile(db: SQLiteDatabase): Promise<Profile | null> {
  return db.getFirstAsync<Profile>('SELECT * FROM profile WHERE id = 1');
}

export async function saveProfile(
  db: SQLiteDatabase,
  p: Omit<Profile, 'id' | 'notifications_enabled'>
): Promise<void> {
  const exists = await db.getFirstAsync('SELECT id FROM profile WHERE id = 1');
  if (exists) {
    await db.runAsync(
      `UPDATE profile SET age=?, gender=?, weight=?, height=?, goal=?, activity_level=?,
       calorie_target=?, protein_target=?, carbs_target=?, fat_target=?, units=?,
       updated_at=CURRENT_TIMESTAMP WHERE id=1`,
      [p.age, p.gender, p.weight, p.height, p.goal, p.activity_level,
       p.calorie_target, p.protein_target, p.carbs_target, p.fat_target, p.units]
    );
  } else {
    await db.runAsync(
      `INSERT INTO profile (id, age, gender, weight, height, goal, activity_level,
       calorie_target, protein_target, carbs_target, fat_target, units)
       VALUES (1,?,?,?,?,?,?,?,?,?,?,?)`,
      [p.age, p.gender, p.weight, p.height, p.goal, p.activity_level,
       p.calorie_target, p.protein_target, p.carbs_target, p.fat_target, p.units]
    );
  }
}

export async function updateProfileSettings(
  db: SQLiteDatabase,
  units: string,
  notifications: number
): Promise<void> {
  await db.runAsync(
    'UPDATE profile SET units=?, notifications_enabled=?, updated_at=CURRENT_TIMESTAMP WHERE id=1',
    [units, notifications]
  );
}

// ── Food log ─────────────────────────────────────────────────────────────────

export async function getFoodLog(db: SQLiteDatabase, date: string): Promise<FoodEntry[]> {
  return db.getAllAsync<FoodEntry>(
    'SELECT * FROM food_log WHERE date=? ORDER BY created_at ASC',
    [date]
  );
}

export async function addFoodEntry(
  db: SQLiteDatabase,
  entry: Omit<FoodEntry, 'id' | 'created_at'>
): Promise<number> {
  const r = await db.runAsync(
    `INSERT INTO food_log (date, meal_type, food_name, brand, quantity, unit, calories, protein, carbs, fat, barcode)
     VALUES (?,?,?,?,?,?,?,?,?,?,?)`,
    [entry.date, entry.meal_type, entry.food_name, entry.brand ?? '', entry.quantity,
     entry.unit, entry.calories, entry.protein, entry.carbs, entry.fat, entry.barcode ?? null]
  );
  return r.lastInsertRowId;
}

export async function updateFoodEntry(
  db: SQLiteDatabase,
  id: number,
  quantity: number,
  calories: number,
  protein: number,
  carbs: number,
  fat: number
): Promise<void> {
  await db.runAsync(
    'UPDATE food_log SET quantity=?, calories=?, protein=?, carbs=?, fat=? WHERE id=?',
    [quantity, calories, protein, carbs, fat, id]
  );
}

export async function deleteFoodEntry(db: SQLiteDatabase, id: number): Promise<void> {
  await db.runAsync('DELETE FROM food_log WHERE id=?', [id]);
}

// ── Stats ────────────────────────────────────────────────────────────────────

export async function getDailyStats(db: SQLiteDatabase, days: number): Promise<DailyStat[]> {
  return db.getAllAsync<DailyStat>(
    `SELECT date,
            ROUND(SUM(calories),1) AS calories,
            ROUND(SUM(protein),1)  AS protein,
            ROUND(SUM(carbs),1)    AS carbs,
            ROUND(SUM(fat),1)      AS fat
     FROM food_log
     WHERE date >= date('now', ?)
     GROUP BY date
     ORDER BY date ASC`,
    [`-${days - 1} days`]
  );
}

// ── Favorites ────────────────────────────────────────────────────────────────

export async function getFavorites(db: SQLiteDatabase): Promise<Favorite[]> {
  return db.getAllAsync<Favorite>(
    'SELECT * FROM favorites ORDER BY frequency DESC, last_used DESC LIMIT 50'
  );
}

export async function upsertFavorite(
  db: SQLiteDatabase,
  food: Omit<Favorite, 'id' | 'frequency' | 'last_used'>
): Promise<void> {
  const existing = await db.getFirstAsync<{ id: number }>(
    'SELECT id FROM favorites WHERE food_name=? AND brand=?',
    [food.food_name, food.brand]
  );
  if (existing) {
    await db.runAsync(
      'UPDATE favorites SET frequency=frequency+1, last_used=CURRENT_TIMESTAMP WHERE id=?',
      [existing.id]
    );
  } else {
    await db.runAsync(
      `INSERT INTO favorites (food_name, brand, calories_per_100g, protein_per_100g, carbs_per_100g, fat_per_100g, barcode)
       VALUES (?,?,?,?,?,?,?)`,
      [food.food_name, food.brand, food.calories_per_100g, food.protein_per_100g,
       food.carbs_per_100g, food.fat_per_100g, food.barcode ?? null]
    );
  }
}

export async function deleteFavorite(db: SQLiteDatabase, id: number): Promise<void> {
  await db.runAsync('DELETE FROM favorites WHERE id=?', [id]);
}

// ── Weight ───────────────────────────────────────────────────────────────────

export async function addWeightEntry(db: SQLiteDatabase, weight: number, unit = 'kg'): Promise<void> {
  await db.runAsync(
    "INSERT INTO weight_history (weight, unit, date) VALUES (?, ?, date('now'))",
    [weight, unit]
  );
}

export async function getWeightHistory(db: SQLiteDatabase): Promise<WeightEntry[]> {
  return db.getAllAsync<WeightEntry>(
    'SELECT * FROM weight_history ORDER BY date DESC LIMIT 60'
  );
}
