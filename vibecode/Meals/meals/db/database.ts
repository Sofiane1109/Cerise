import type { SQLiteDatabase } from 'expo-sqlite';

export async function initDatabase(db: SQLiteDatabase): Promise<void> {
  await db.execAsync(`
    PRAGMA journal_mode = WAL;
    PRAGMA foreign_keys = ON;

    CREATE TABLE IF NOT EXISTS profile (
      id INTEGER PRIMARY KEY DEFAULT 1,
      age INTEGER NOT NULL,
      gender TEXT NOT NULL,
      weight REAL NOT NULL,
      height REAL NOT NULL,
      goal TEXT NOT NULL,
      activity_level TEXT NOT NULL,
      calorie_target INTEGER NOT NULL,
      protein_target INTEGER NOT NULL,
      carbs_target INTEGER NOT NULL,
      fat_target INTEGER NOT NULL,
      units TEXT NOT NULL DEFAULT 'metric',
      notifications_enabled INTEGER NOT NULL DEFAULT 1,
      updated_at TEXT DEFAULT CURRENT_TIMESTAMP
    );

    CREATE TABLE IF NOT EXISTS food_log (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      date TEXT NOT NULL,
      meal_type TEXT NOT NULL,
      food_name TEXT NOT NULL,
      brand TEXT NOT NULL DEFAULT '',
      quantity REAL NOT NULL DEFAULT 100,
      unit TEXT NOT NULL DEFAULT 'g',
      calories REAL NOT NULL DEFAULT 0,
      protein REAL NOT NULL DEFAULT 0,
      carbs REAL NOT NULL DEFAULT 0,
      fat REAL NOT NULL DEFAULT 0,
      barcode TEXT,
      created_at TEXT DEFAULT CURRENT_TIMESTAMP
    );

    CREATE TABLE IF NOT EXISTS favorites (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      food_name TEXT NOT NULL,
      brand TEXT NOT NULL DEFAULT '',
      calories_per_100g REAL NOT NULL,
      protein_per_100g REAL NOT NULL,
      carbs_per_100g REAL NOT NULL,
      fat_per_100g REAL NOT NULL,
      frequency INTEGER NOT NULL DEFAULT 1,
      last_used TEXT DEFAULT CURRENT_TIMESTAMP,
      barcode TEXT
    );

    CREATE TABLE IF NOT EXISTS weight_history (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      weight REAL NOT NULL,
      unit TEXT NOT NULL DEFAULT 'kg',
      date TEXT NOT NULL DEFAULT CURRENT_DATE,
      created_at TEXT DEFAULT CURRENT_TIMESTAMP
    );

    CREATE INDEX IF NOT EXISTS idx_food_log_date ON food_log(date);
  `);
}
