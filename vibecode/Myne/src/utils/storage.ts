type SyncFn = (key: string, value: unknown) => void;
let _syncFn: SyncFn | null = null;

export function registerSyncCallback(fn: SyncFn): void {
  _syncFn = fn;
}

export function getItem<T>(key: string, defaultValue: T): T {
  try {
    const raw = localStorage.getItem(key);
    return raw ? (JSON.parse(raw) as T) : defaultValue;
  } catch {
    return defaultValue;
  }
}

export function setItem<T>(key: string, value: T): void {
  try {
    localStorage.setItem(key, JSON.stringify(value));
    _syncFn?.(key, value);
  } catch {
    // storage full or unavailable
  }
}
