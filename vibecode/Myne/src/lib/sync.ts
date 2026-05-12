import { supabase } from './supabase';
import { registerSyncCallback } from '../utils/storage';

// All localStorage keys managed by the app (school events excluded — fetched from iCal)
const SYNC_KEYS = [
  'myne:tasks',
  'myne:events',
  'myne:nutrition',
  'myne:nutrition:targets',
  'myne:budget:entries',
  'myne:budget:goals',
  'myne:budget:balances',
  'myne:hike:wishlist',
  'myne:hike:done',
  'myne:hike:gear:check',
  'myne:hike:gear:shop',
  'myne:subscriptions',
  'myne:hub:links',
  'myne:hub:categories',
  'myne:study:courses',
  'myne:study:sessions',
  'myne:settings',
  'myne:calendar:categories',
  'myne:spotify:friends',
];

async function getUserId(): Promise<string | null> {
  const { data: { user } } = await supabase.auth.getUser();
  return user?.id ?? null;
}

async function push(key: string, value: unknown): Promise<void> {
  const userId = await getUserId();
  if (!userId) return;
  await supabase.from('user_data').upsert(
    { user_id: userId, key, value, updated_at: new Date().toISOString() },
    { onConflict: 'user_id,key' }
  );
}

// Called once after login: pulls Supabase data into localStorage,
// and pushes any local-only keys up to Supabase (first-time migration).
export async function syncOnLogin(): Promise<void> {
  const userId = await getUserId();
  if (!userId) return;

  const { data, error } = await supabase
    .from('user_data')
    .select('key, value')
    .eq('user_id', userId);

  if (error) return;

  const remoteKeys = new Set((data ?? []).map((r: { key: string }) => r.key));

  // Pull remote into localStorage (overwrites local — remote is source of truth)
  for (const row of data ?? []) {
    if (SYNC_KEYS.includes(row.key) && row.value !== null) {
      localStorage.setItem(row.key, JSON.stringify(row.value));
    }
  }

  // Push local keys that don't exist in Supabase yet (first-time migration)
  const upserts: { user_id: string; key: string; value: unknown; updated_at: string }[] = [];
  for (const key of SYNC_KEYS) {
    if (!remoteKeys.has(key)) {
      const raw = localStorage.getItem(key);
      if (raw) {
        try {
          upserts.push({ user_id: userId, key, value: JSON.parse(raw), updated_at: new Date().toISOString() });
        } catch { /* ignore malformed */ }
      }
    }
  }
  if (upserts.length > 0) {
    await supabase.from('user_data').upsert(upserts, { onConflict: 'user_id,key' });
  }
}

// Register the push callback so every setItem() automatically syncs to Supabase.
export function initSync(): void {
  registerSyncCallback((key, value) => {
    push(key, value).catch(console.error);
  });
}
