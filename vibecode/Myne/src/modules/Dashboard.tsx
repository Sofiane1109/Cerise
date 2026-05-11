import { useState, useEffect, useMemo } from 'react';
import type { ModuleId, Task, NutritionLog, NutritionTargets, CalendarEvent, AccountBalances, BudgetEntry, Subscription, HubLink, HikeDone } from '../types';
import { getItem } from '../utils/storage';
import { today, parseLocal, addDays, addMonths, addYears, diffDays } from '../utils/helpers';
import { ProgressBar } from '../components/ui';
import {
  CheckSquare, Apple, Wallet, Calendar, ChevronRight, PiggyBank,
  Mountain, CreditCard, Globe, Music2, Flame,
} from 'lucide-react';
import { spotify, isConnected } from '../lib/spotify';

// ── Time helpers ──────────────────────────────────────────────────────────────

type TimePeriod = 'dawn' | 'day' | 'sunset' | 'night';

function getTimePeriod(): TimePeriod {
  const h = new Date().getHours();
  if (h >= 5 && h < 9)  return 'dawn';
  if (h >= 9 && h < 17) return 'day';
  if (h >= 17 && h < 20) return 'sunset';
  return 'night';
}

const PERIOD_STYLES: Record<TimePeriod, { gradient: string; emoji: string }> = {
  dawn:   { gradient: 'from-amber-950/50 via-orange-950/20 to-gray-950', emoji: '🌅' },
  day:    { gradient: 'from-blue-950/40 via-indigo-950/20 to-gray-950',  emoji: '☀️' },
  sunset: { gradient: 'from-orange-950/50 via-rose-950/20 to-gray-950',  emoji: '🌇' },
  night:  { gradient: 'from-indigo-950/50 via-purple-950/20 to-gray-950',emoji: '🌙' },
};

function greetingWord(): string {
  const h = new Date().getHours();
  if (h >= 5 && h < 12) return 'Bonjour';
  if (h < 18) return 'Bon après-midi';
  return 'Bonsoir';
}

function getDayPct(): number {
  const now = new Date();
  return Math.min(100, Math.round(((now.getHours() * 60 + now.getMinutes()) / 1440) * 100));
}

// ── Subscription helpers ──────────────────────────────────────────────────────

function getSubNextDate(sub: Subscription): string {
  const todayStr = today();
  let next = sub.startDate;
  let i = 0;
  while (next <= todayStr && i < 1000) {
    i++;
    if (sub.frequency === 'monthly')          next = addMonths(next, 1);
    else if (sub.frequency === 'every4weeks') next = addDays(next, 28);
    else if (sub.frequency === 'yearly')      next = addYears(next, 1);
    else                                      next = addDays(next, sub.customDays ?? 30);
  }
  return next;
}

function getNextSubRenewal(subs: Subscription[]): { sub: Subscription; daysUntil: number } | null {
  if (!subs.length) return null;
  const todayStr = today();
  const sorted = subs
    .map(s => ({ sub: s, nextDate: getSubNextDate(s) }))
    .sort((a, b) => a.nextDate.localeCompare(b.nextDate));
  return { sub: sorted[0].sub, daysUntil: diffDays(todayStr, sorted[0].nextDate) };
}

// ── Spotify Now Playing ───────────────────────────────────────────────────────

interface NowPlaying {
  isPlaying: boolean;
  trackName: string;
  artistName: string;
  albumArt?: string;
  progressMs: number;
  durationMs: number;
}

async function fetchNowPlaying(): Promise<NowPlaying | null> {
  if (!isConnected()) return null;
  try {
    const data = await spotify.currentlyPlaying();
    if (!data?.item) return null;
    return {
      isPlaying:  data.is_playing,
      trackName:  data.item.name,
      artistName: (data.item.artists ?? []).map((a: any) => a.name).join(', '),
      albumArt:   data.item.album?.images?.[1]?.url,
      progressMs: data.progress_ms ?? 0,
      durationMs: data.item.duration_ms ?? 1,
    };
  } catch {
    return null;
  }
}

// ── Dashboard ─────────────────────────────────────────────────────────────────

const DEFAULT_TARGETS: NutritionTargets = { calories: 2500, protein: 150, creatine: 5, water: 2500 };

export default function Dashboard({ onNavigate }: { onNavigate: (id: ModuleId) => void }) {
  const [clock, setClock]           = useState(new Date());
  const [period, setPeriod]         = useState<TimePeriod>(getTimePeriod());
  const [nowPlaying, setNowPlaying] = useState<NowPlaying | null>(null);

  const todayStr = today();
  const userName = getItem<{ name?: string }>('myne:settings', {}).name ?? '';

  const rawTasks      = getItem<any[]>('myne:tasks', []);
  const tasks         = rawTasks.map((t: any): Task => ({ ...t, status: t.status ?? (t.completed ? 'done' : 'todo') }));
  const events        = getItem<CalendarEvent[]>('myne:events', []);
  const nutrition     = getItem<NutritionLog[]>('myne:nutrition', []);
  const targets       = getItem<NutritionTargets>('myne:nutrition:targets', DEFAULT_TARGETS);
  const balances      = getItem<AccountBalances>('myne:budget:balances', { cc: 0, ep: 0 });
  const budgetEntries = getItem<BudgetEntry[]>('myne:budget:entries', []);
  const subs          = getItem<Subscription[]>('myne:subscriptions', []);
  const hubLinks      = getItem<HubLink[]>('myne:hub:links', []);
  const hikesDone     = getItem<HikeDone[]>('myne:hike:done', []);

  useEffect(() => {
    const id = setInterval(() => {
      setClock(new Date());
      setPeriod(getTimePeriod());
    }, 15_000);
    return () => clearInterval(id);
  }, []);

  useEffect(() => {
    let cancelled = false;
    const poll = async () => {
      if (cancelled) return;
      const np = await fetchNowPlaying();
      if (!cancelled) setNowPlaying(np);
    };
    poll();
    const id = setInterval(poll, 30_000);
    return () => { cancelled = true; clearInterval(id); };
  }, []);

  // Derived
  const todayNutrition = nutrition.find(n => n.date === todayStr);
  const pendingCount   = tasks.filter(t => t.status !== 'done').length;
  const overdueTasks   = tasks.filter(t => t.status !== 'done' && t.deadline && t.deadline < todayStr).length;

  const nextEvent = useMemo(() =>
    events
      .filter(e => e.date >= todayStr)
      .sort((a, b) => a.date.localeCompare(b.date) || (a.time ?? '').localeCompare(b.time ?? ''))
    [0] ?? null,
  [events, todayStr]);

  const pendingTasks = useMemo(() =>
    tasks
      .filter(t => t.status !== 'done')
      .sort((a, b) => {
        const po: Record<string, number> = { high: 0, medium: 1, low: 2 };
        const aOver = a.deadline && a.deadline < todayStr ? -1 : 0;
        const bOver = b.deadline && b.deadline < todayStr ? -1 : 0;
        if (aOver !== bOver) return aOver - bOver;
        return (po[a.priority] ?? 1) - (po[b.priority] ?? 1);
      })
      .slice(0, 5),
  [tasks, todayStr]);

  const upcomingEvents = useMemo(() =>
    events
      .filter(e => e.date >= todayStr)
      .sort((a, b) => a.date.localeCompare(b.date) || (a.time ?? '').localeCompare(b.time ?? ''))
      .slice(0, 5),
  [events, todayStr]);

  const computedBalance = (acc: 'cc' | 'ep') => {
    const ents = budgetEntries.filter(e => e.accountId === acc);
    return balances[acc]
      + ents.filter(e => e.type === 'income').reduce((s, e) => s + e.amount, 0)
      - ents.filter(e => e.type === 'expense').reduce((s, e) => s + e.amount, 0);
  };

  const pinnedLinks    = hubLinks.filter(l => l.pinned).slice(0, 6);
  const nextSubRenewal = getNextSubRenewal(subs);
  const dayPct         = getDayPct();
  const ps             = PERIOD_STYLES[period];

  const lastHike = useMemo(() => {
    if (!hikesDone.length) return null;
    const d = [...hikesDone].sort((a, b) => b.date.localeCompare(a.date))[0];
    return { name: d.name, daysAgo: diffDays(d.date, todayStr) };
  }, [hikesDone, todayStr]);

  return (
    <div className="min-h-full">
      {/* Hero with time gradient */}
      <div className={`bg-gradient-to-b ${ps.gradient} p-6 pb-8`}>
        <div className="max-w-7xl mx-auto flex flex-col md:flex-row md:items-end justify-between gap-6">
          <div>
            <p className="text-gray-400 text-sm mb-1">
              {ps.emoji} {new Date().toLocaleDateString('fr-FR', { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' })}
            </p>
            <h1 className="text-2xl font-bold text-white">
              {greetingWord()}{userName ? `, ${userName}` : ''} 👋
            </h1>
            <p className="text-6xl font-mono font-bold text-white mt-3 leading-none tracking-tight">
              {clock.toLocaleTimeString('fr-FR', { hour: '2-digit', minute: '2-digit' })}
            </p>
          </div>
          <div className="md:min-w-[220px]">
            <div className="flex items-center justify-between mb-2">
              <span className="text-xs text-gray-500">Avancement du jour</span>
              <span className="text-xs font-semibold text-gray-300">{dayPct}%</span>
            </div>
            <ProgressBar value={dayPct} color="bg-gray-600" height="h-1.5" />
            <p className="text-xs text-gray-600 mt-2">
              Il reste {23 - clock.getHours()}h {59 - clock.getMinutes()}m dans la journée
            </p>
          </div>
        </div>
      </div>

      <div className="p-6 space-y-5 max-w-7xl mx-auto">

        {/* Quick stats strip */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
          <button onClick={() => onNavigate('calendar')}
            className="bg-gray-900 border border-gray-800 hover:border-gray-700 rounded-xl p-4 text-left transition-colors">
            <p className="text-xs text-gray-500 mb-2 flex items-center gap-1.5">
              <Calendar size={12} /> Prochain événement
            </p>
            {nextEvent ? (
              <>
                <p className="text-sm font-semibold text-white truncate">{nextEvent.title}</p>
                <p className="text-xs text-gray-400 mt-0.5">
                  {nextEvent.date === todayStr ? "Aujourd'hui"
                    : diffDays(todayStr, nextEvent.date) === 1 ? 'Demain'
                    : `Dans ${diffDays(todayStr, nextEvent.date)}j`}
                  {nextEvent.time && ` · ${nextEvent.time}`}
                </p>
              </>
            ) : (
              <p className="text-sm text-gray-600">Aucun événement</p>
            )}
          </button>

          <button onClick={() => onNavigate('tasks')}
            className="bg-gray-900 border border-gray-800 hover:border-gray-700 rounded-xl p-4 text-left transition-colors">
            <p className="text-xs text-gray-500 mb-2 flex items-center gap-1.5">
              <CheckSquare size={12} /> Tâches
            </p>
            <p className="text-3xl font-bold text-white">{pendingCount}</p>
            <p className="text-xs text-gray-400 mt-0.5">
              {overdueTasks > 0
                ? <span className="text-red-400">{overdueTasks} en retard</span>
                : 'en cours'}
            </p>
          </button>

          <button onClick={() => onNavigate('nutrition')}
            className="bg-gray-900 border border-gray-800 hover:border-gray-700 rounded-xl p-4 text-left transition-colors">
            <p className="text-xs text-gray-500 mb-2 flex items-center gap-1.5">
              <Flame size={12} /> Calories du jour
            </p>
            <p className="text-3xl font-bold text-white">{todayNutrition?.calories ?? '—'}</p>
            <p className="text-xs text-gray-400 mt-0.5">/ {targets.calories} kcal</p>
          </button>

          <button onClick={() => onNavigate('subscriptions')}
            className="bg-gray-900 border border-gray-800 hover:border-gray-700 rounded-xl p-4 text-left transition-colors">
            <p className="text-xs text-gray-500 mb-2 flex items-center gap-1.5">
              <CreditCard size={12} /> Prochain abo.
            </p>
            {nextSubRenewal ? (
              <>
                <p className="text-sm font-semibold text-white truncate">
                  {nextSubRenewal.sub.emoji} {nextSubRenewal.sub.name}
                </p>
                <p className={`text-xs mt-0.5 ${
                  nextSubRenewal.daysUntil <= 3 ? 'text-red-400'
                  : nextSubRenewal.daysUntil <= 7 ? 'text-amber-400'
                  : 'text-gray-400'}`}>
                  {nextSubRenewal.daysUntil === 0 ? "Aujourd'hui"
                    : nextSubRenewal.daysUntil === 1 ? 'Demain'
                    : `Dans ${nextSubRenewal.daysUntil}j`}
                </p>
              </>
            ) : (
              <p className="text-sm text-gray-600">Aucun abonnement</p>
            )}
          </button>
        </div>

        {/* Main grid: tasks + events */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">
          <div className="bg-gray-900 border border-gray-800 rounded-xl p-5">
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center gap-2">
                <CheckSquare size={15} style={{ color: 'var(--accent)' }} />
                <h2 className="font-semibold text-white text-sm">Tâches à faire</h2>
                {overdueTasks > 0 && (
                  <span className="text-xs bg-red-500/20 text-red-400 px-2 py-0.5 rounded-full">{overdueTasks} en retard</span>
                )}
              </div>
              <button onClick={() => onNavigate('tasks')}
                className="text-xs text-gray-500 hover:text-white flex items-center gap-1 transition-colors">
                Tout voir <ChevronRight size={12} />
              </button>
            </div>
            {pendingTasks.length === 0 ? (
              <p className="text-gray-500 text-sm text-center py-6">Tout est fait ! 🎉</p>
            ) : (
              <div className="space-y-2">
                {pendingTasks.map(t => {
                  const overdue = t.deadline && t.deadline < todayStr;
                  return (
                    <div key={t.id} className={`flex items-center gap-3 px-3 py-2.5 rounded-lg border ${
                      overdue ? 'border-red-900/50 bg-red-950/20' : 'border-gray-800'}`}>
                      <div className={`w-1.5 h-5 rounded-full shrink-0 ${
                        t.priority === 'high' ? 'bg-red-500' : t.priority === 'medium' ? 'bg-amber-500' : 'bg-gray-600'}`} />
                      <div className="flex-1 min-w-0">
                        <p className="text-sm text-white truncate">{t.title}</p>
                        <div className="flex items-center gap-2 mt-0.5">
                          {t.project && <span className="text-xs text-gray-600">#{t.project}</span>}
                          {t.deadline && (
                            <span className={`text-xs ${overdue ? 'text-red-400' : 'text-gray-500'}`}>
                              {parseLocal(t.deadline).toLocaleDateString('fr-FR', { month: 'short', day: 'numeric' })}
                            </span>
                          )}
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>

          <div className="bg-gray-900 border border-gray-800 rounded-xl p-5">
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center gap-2">
                <Calendar size={15} style={{ color: 'var(--accent)' }} />
                <h2 className="font-semibold text-white text-sm">Événements à venir</h2>
              </div>
              <button onClick={() => onNavigate('calendar')}
                className="text-xs text-gray-500 hover:text-white flex items-center gap-1 transition-colors">
                Calendrier <ChevronRight size={12} />
              </button>
            </div>
            {upcomingEvents.length === 0 ? (
              <p className="text-gray-500 text-sm text-center py-6">Aucun événement à venir</p>
            ) : (
              <div className="space-y-2">
                {upcomingEvents.map(e => {
                  const isToday  = e.date === todayStr;
                  const daysUntil = diffDays(todayStr, e.date);
                  return (
                    <div key={e.id} className="flex items-center gap-3 px-3 py-2.5 rounded-lg border border-gray-800">
                      <div className="w-1 h-10 rounded-full shrink-0" style={{ backgroundColor: e.color ?? 'var(--accent)' }} />
                      <div className="flex-1 min-w-0">
                        <p className="text-sm text-white truncate">{e.title}</p>
                        <p className="text-xs text-gray-500 mt-0.5">
                          {isToday ? "Aujourd'hui" : daysUntil === 1 ? 'Demain'
                            : parseLocal(e.date).toLocaleDateString('fr-FR', { weekday: 'short', month: 'short', day: 'numeric' })}
                          {e.time && ` · ${e.time}`}
                        </p>
                      </div>
                      {isToday && (
                        <span className="text-xs px-2 py-0.5 rounded-full shrink-0 text-white"
                          style={{ backgroundColor: 'var(--accent)' }}>Auj.</span>
                      )}
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        </div>

        {/* Spotify + Hike + Nutrition row */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {/* Spotify Now Playing */}
          <div className="bg-gray-900 border border-gray-800 rounded-xl p-4">
            <div className="flex items-center gap-2 mb-3">
              <Music2 size={13} className="text-green-400" />
              <span className="text-xs text-gray-500 uppercase tracking-wide">Spotify</span>
              <button onClick={() => onNavigate('soundlog')}
                className="ml-auto text-gray-600 hover:text-white transition-colors">
                <ChevronRight size={13} />
              </button>
            </div>
            {nowPlaying ? (
              <div className="flex items-center gap-3">
                {nowPlaying.albumArt && (
                  <img src={nowPlaying.albumArt} alt="" className="w-12 h-12 rounded-lg object-cover shrink-0" />
                )}
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-semibold text-white truncate">{nowPlaying.trackName}</p>
                  <p className="text-xs text-gray-400 truncate">{nowPlaying.artistName}</p>
                  <div className="mt-2">
                    <ProgressBar value={(nowPlaying.progressMs / nowPlaying.durationMs) * 100} color="bg-green-500" height="h-1" />
                  </div>
                </div>
              </div>
            ) : (
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-lg bg-gray-800 flex items-center justify-center shrink-0">
                  <Music2 size={18} className="text-gray-600" />
                </div>
                <div>
                  <p className="text-sm text-gray-500">Rien en cours</p>
                  <button onClick={() => onNavigate('soundlog')}
                    className="text-xs text-gray-600 hover:text-white transition-colors">
                    Ouvrir SoundLog →
                  </button>
                </div>
              </div>
            )}
          </div>

          {/* Last hike */}
          <div className="bg-gray-900 border border-gray-800 rounded-xl p-4">
            <div className="flex items-center gap-2 mb-3">
              <Mountain size={13} style={{ color: 'var(--accent)' }} />
              <span className="text-xs text-gray-500 uppercase tracking-wide">Dernière rando</span>
              <button onClick={() => onNavigate('hike')}
                className="ml-auto text-gray-600 hover:text-white transition-colors">
                <ChevronRight size={13} />
              </button>
            </div>
            {lastHike ? (
              <>
                <p className="text-sm font-semibold text-white truncate">{lastHike.name}</p>
                <p className="text-xs text-gray-400 mt-1">
                  {lastHike.daysAgo === 0 ? "Aujourd'hui 🥾"
                    : lastHike.daysAgo === 1 ? 'Hier 🥾'
                    : `Il y a ${lastHike.daysAgo} jours 🥾`}
                </p>
              </>
            ) : (
              <p className="text-sm text-gray-500">Aucune rando enregistrée</p>
            )}
          </div>

          {/* Nutrition today */}
          <div className="bg-gray-900 border border-gray-800 rounded-xl p-4">
            <div className="flex items-center gap-2 mb-3">
              <Apple size={13} className="text-green-400" />
              <span className="text-xs text-gray-500 uppercase tracking-wide">Nutrition du jour</span>
              <button onClick={() => onNavigate('nutrition')}
                className="ml-auto text-gray-600 hover:text-white transition-colors">
                <ChevronRight size={13} />
              </button>
            </div>
            {todayNutrition ? (
              <div className="space-y-2.5">
                {[
                  { label: 'Calories', val: todayNutrition.calories, target: targets.calories, unit: 'kcal', color: 'bg-amber-500' },
                  { label: 'Protéines', val: todayNutrition.protein, target: targets.protein, unit: 'g', color: 'bg-blue-500' },
                  { label: 'Eau', val: todayNutrition.water, target: targets.water, unit: 'ml', color: 'bg-cyan-500' },
                ].map(({ label, val, target, unit, color }) => (
                  <div key={label}>
                    <div className="flex justify-between text-xs mb-1">
                      <span className="text-gray-500">{label}</span>
                      <span className="text-gray-400">{val}/{target}{unit}</span>
                    </div>
                    <ProgressBar value={target > 0 ? (val / target) * 100 : 0} color={color} height="h-1" />
                  </div>
                ))}
              </div>
            ) : (
              <div>
                <p className="text-sm text-gray-500 mb-3">Pas encore loggé</p>
                <button onClick={() => onNavigate('nutrition')}
                  className="text-xs px-3 py-1.5 rounded-lg btn-accent">
                  Logger maintenant
                </button>
              </div>
            )}
          </div>
        </div>

        {/* Pinned Hub Links */}
        {pinnedLinks.length > 0 && (
          <div className="bg-gray-900 border border-gray-800 rounded-xl p-5">
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center gap-2">
                <Globe size={15} style={{ color: 'var(--accent)' }} />
                <h2 className="font-semibold text-white text-sm">Liens épinglés</h2>
              </div>
              <button onClick={() => onNavigate('hub')}
                className="text-xs text-gray-500 hover:text-white flex items-center gap-1 transition-colors">
                Hub <ChevronRight size={12} />
              </button>
            </div>
            <div className="grid grid-cols-3 sm:grid-cols-6 gap-3">
              {pinnedLinks.map(link => (
                <a key={link.id} href={link.url} target="_blank" rel="noopener noreferrer"
                  className="flex flex-col items-center gap-2 p-3 rounded-xl bg-gray-800 hover:bg-gray-700 border border-gray-700 hover:border-gray-600 transition-colors group">
                  <div className="w-10 h-10 rounded-xl bg-gray-700 flex items-center justify-center overflow-hidden">
                    {link.favicon
                      ? <img src={link.favicon} alt="" className="w-7 h-7 object-contain"
                          onError={e => { (e.currentTarget as HTMLImageElement).style.display = 'none'; }} />
                      : <Globe size={18} className="text-gray-500" />}
                  </div>
                  <p className="text-xs text-gray-300 group-hover:text-white truncate w-full text-center transition-colors leading-tight">
                    {link.title}
                  </p>
                </a>
              ))}
            </div>
          </div>
        )}

        {/* Balance row */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <button onClick={() => onNavigate('budget')}
            className="bg-gray-900 border border-gray-800 hover:border-gray-700 rounded-xl p-4 text-left transition-colors flex items-center gap-4">
            <div className="w-10 h-10 rounded-xl bg-indigo-500/10 flex items-center justify-center shrink-0">
              <Wallet size={18} className="text-indigo-400" />
            </div>
            <div>
              <p className="text-xs text-gray-500 uppercase tracking-wide mb-0.5">Compte courant</p>
              <p className="text-xl font-bold text-white">
                €{computedBalance('cc').toLocaleString('fr-FR', { minimumFractionDigits: 0 })}
              </p>
            </div>
          </button>
          <button onClick={() => onNavigate('budget')}
            className="bg-gray-900 border border-gray-800 hover:border-gray-700 rounded-xl p-4 text-left transition-colors flex items-center gap-4">
            <div className="w-10 h-10 rounded-xl bg-emerald-500/10 flex items-center justify-center shrink-0">
              <PiggyBank size={18} className="text-emerald-400" />
            </div>
            <div>
              <p className="text-xs text-gray-500 uppercase tracking-wide mb-0.5">Épargne</p>
              <p className="text-xl font-bold text-white">
                €{computedBalance('ep').toLocaleString('fr-FR', { minimumFractionDigits: 0 })}
              </p>
            </div>
          </button>
        </div>

      </div>
    </div>
  );
}
