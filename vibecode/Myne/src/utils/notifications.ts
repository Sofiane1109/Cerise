import { getItem } from './storage';
import { today } from './helpers';
import type { Task, CalendarEvent } from '../types';

/** True only when running inside the Tauri desktop shell */
const isTauri = () =>
  typeof window !== 'undefined' && '__TAURI_INTERNALS__' in window;

async function notify(title: string, body: string) {
  try {
    const { invoke } = await import('@tauri-apps/api/core');
    await invoke('send_notification', { title, body });
  } catch {
    // Silently ignore: either not in Tauri or notification failed
  }
}

/**
 * Fires native Windows notifications for:
 * - Tasks due today or tomorrow
 * - Calendar events (with reminder flag) scheduled today or tomorrow
 *
 * Runs at most once per calendar day (tracked in localStorage).
 */
export async function checkAndSendNotifications(): Promise<void> {
  if (!isTauri()) return;

  const CHECKED_KEY = 'myne:notifications:lastChecked';
  const todayStr = today();

  // Skip if already checked today
  if (localStorage.getItem(CHECKED_KEY) === todayStr) return;
  localStorage.setItem(CHECKED_KEY, todayStr);

  const tomorrow = new Date(todayStr);
  tomorrow.setDate(tomorrow.getDate() + 1);
  const tomorrowStr = tomorrow.toISOString().slice(0, 10);

  // ── Task deadline notifications ─────────────────────────────────────────────
  const tasks = getItem<Task[]>('myne:tasks', []);
  for (const task of tasks) {
    if (task.status === 'done' || !task.deadline) continue;
    if (task.deadline === todayStr) {
      await notify('Task due today', `📋 ${task.title}`);
    } else if (task.deadline === tomorrowStr) {
      await notify('Task due tomorrow', `📋 ${task.title}`);
    }
  }

  // ── Calendar event reminder notifications ───────────────────────────────────
  const events = getItem<CalendarEvent[]>('myne:events', []);
  for (const event of events) {
    if (!event.reminder) continue;
    if (event.date === todayStr) {
      const time = event.time ? ` at ${event.time}` : '';
      await notify('Event today', `📅 ${event.title}${time}`);
    } else if (event.date === tomorrowStr) {
      await notify('Event tomorrow', `📅 ${event.title}`);
    }
  }
}
