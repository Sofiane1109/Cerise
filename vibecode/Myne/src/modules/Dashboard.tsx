import { useState, useEffect, useMemo } from 'react';
import type { ModuleId, Task, NutritionLog, NutritionTargets, CalendarEvent, Subscription, HubLink, HikeDone } from '../types';
import { getItem } from '../utils/storage';
import { today, parseLocal, addDays, addMonths, addYears, diffDays } from '../utils/helpers';
import {
  CheckSquare, Apple, Calendar, ChevronRight,
  Mountain, CreditCard, Globe, Music2, Flame,
} from 'lucide-react';
import { spotify, isConnected } from '../lib/spotify';

type TimePeriod = 'dawn' | 'day' | 'sunset' | 'night';

function getTimePeriod(): TimePeriod {
  const h = new Date().getHours();
  if (h >= 5 && h < 9)  return 'dawn';
  if (h >= 9 && h < 17) return 'day';
  if (h >= 17 && h < 20) return 'sunset';
  return 'night';
}

const PERIOD_EMOJI: Record<TimePeriod, string> = {
  dawn: '🌅', day: '☀️', sunset: '🌇', night: '🌙',
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

function hexToRgba(hex: string, alpha: number): string {
  const r = parseInt(hex.slice(1, 3), 16);
  const g = parseInt(hex.slice(3, 5), 16);
  const b = parseInt(hex.slice(5, 7), 16);
  return `rgba(${r},${g},${b},${alpha})`;
}

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

const DEFAULT_TARGETS: NutritionTargets = { calories: 2500, protein: 150, creatine: 5, water: 2500 };

const GLASS: React.CSSProperties = {
  background: 'rgba(255,255,255,0.03)',
  border: '1px solid rgba(255,255,255,0.07)',
  backdropFilter: 'blur(16px)',
  WebkitBackdropFilter: 'blur(16px)',
  borderRadius: 16,
};

export default function Dashboard({ onNavigate }: { onNavigate: (id: ModuleId) => void }) {
  const [clock, setClock]           = useState(new Date());
  const [period, setPeriod]         = useState<TimePeriod>(getTimePeriod());
  const [nowPlaying, setNowPlaying] = useState<NowPlaying | null>(null);

  const todayStr = today();
  const accent   = getItem<{ accentColor: string }>('myne:settings', { accentColor: '#6366f1' }).accentColor;
  const userName = getItem<{ name?: string }>('myne:settings', {}).name ?? '';

  const rawTasks  = getItem<any[]>('myne:tasks', []);
  const tasks     = rawTasks.map((t: any): Task => ({ ...t, status: t.status ?? (t.completed ? 'done' : 'todo') }));
  const events    = getItem<CalendarEvent[]>('myne:events', []);
  const nutrition = getItem<NutritionLog[]>('myne:nutrition', []);
  const targets   = getItem<NutritionTargets>('myne:nutrition:targets', DEFAULT_TARGETS);
  const subs      = getItem<Subscription[]>('myne:subscriptions', []);
  const hubLinks  = getItem<HubLink[]>('myne:hub:links', []);
  const hikesDone = getItem<HikeDone[]>('myne:hike:done', []);

  useEffect(() => {
    const id = setInterval(() => { setClock(new Date()); setPeriod(getTimePeriod()); }, 1_000);
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

  const todayNutrition = nutrition.find(n => n.date === todayStr);
  const pendingCount   = tasks.filter(t => t.status !== 'done').length;
  const overdueTasks   = tasks.filter(t => t.status !== 'done' && t.deadline && t.deadline < todayStr).length;

  const nextEvent = useMemo(() =>
    events.filter(e => e.date >= todayStr)
      .sort((a, b) => a.date.localeCompare(b.date) || (a.time ?? '').localeCompare(b.time ?? ''))[0] ?? null,
  [events, todayStr]);

  const pendingTasks = useMemo(() =>
    tasks.filter(t => t.status !== 'done')
      .sort((a, b) => {
        const po: Record<string, number> = { high: 0, medium: 1, low: 2 };
        const aOver = a.deadline && a.deadline < todayStr ? -1 : 0;
        const bOver = b.deadline && b.deadline < todayStr ? -1 : 0;
        if (aOver !== bOver) return aOver - bOver;
        return (po[a.priority] ?? 1) - (po[b.priority] ?? 1);
      }).slice(0, 5),
  [tasks, todayStr]);

  const upcomingEvents = useMemo(() =>
    events.filter(e => e.date >= todayStr)
      .sort((a, b) => a.date.localeCompare(b.date) || (a.time ?? '').localeCompare(b.time ?? ''))
      .slice(0, 5),
  [events, todayStr]);

  const pinnedLinks    = hubLinks.filter(l => l.pinned).slice(0, 6);
  const nextSubRenewal = getNextSubRenewal(subs);
  const dayPct         = getDayPct();

  const lastHike = useMemo(() => {
    if (!hikesDone.length) return null;
    const d = [...hikesDone].sort((a, b) => b.date.localeCompare(a.date))[0];
    return { name: d.name, daysAgo: diffDays(d.date, todayStr) };
  }, [hikesDone, todayStr]);

  const bar = (pct: number, color: string) => (
    <div style={{ height: 3, background: 'rgba(255,255,255,0.08)', borderRadius: 99, overflow: 'hidden' }}>
      <div style={{ width: `${Math.min(100, pct)}%`, height: '100%', background: color, borderRadius: 99, boxShadow: `0 0 6px ${color}` }} />
    </div>
  );

  return (
    <div className="min-h-full" style={{ background: '#09090f' }}>

      {/* Hero */}
      <div className="relative overflow-hidden px-6 pt-10 pb-8">
        <div className="absolute inset-0 pointer-events-none" style={{
          background: `radial-gradient(ellipse 110% 80% at 65% -10%, ${hexToRgba(accent, 0.16)}, transparent 65%)`,
        }} />
        <div className="relative max-w-7xl mx-auto">
          <p className="text-sm text-gray-500 mb-5 flex items-center gap-2">
            <span>{PERIOD_EMOJI[period]}</span>
            <span className="capitalize">
              {new Date().toLocaleDateString('fr-FR', { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' })}
            </span>
          </p>

          <div className="flex flex-col md:flex-row md:items-end justify-between gap-6">
            <div>
              <div style={{
                fontSize: 'clamp(60px, 9vw, 88px)',
                fontWeight: 900,
                color: 'white',
                letterSpacing: '-0.04em',
                lineHeight: 1,
                textShadow: `0 0 60px ${hexToRgba(accent, 0.7)}, 0 0 140px ${hexToRgba(accent, 0.25)}`,
              }}>
                {clock.toLocaleTimeString('fr-FR', { hour: '2-digit', minute: '2-digit', second: '2-digit' })}
              </div>
              <p className="text-gray-300 text-lg font-medium mt-4">
                {greetingWord()}{userName ? `, ${userName}` : ''}{userName ? ' 👋' : ''}
              </p>
            </div>

            <div style={{ ...GLASS, padding: '16px 20px', minWidth: 200 }}>
              <div className="flex items-center justify-between mb-2">
                <span className="text-xs text-gray-500">Journée écoulée</span>
                <span className="text-xs font-bold" style={{ color: accent }}>{dayPct}%</span>
              </div>
              {bar(dayPct, accent)}
              <p className="text-xs text-gray-600 mt-1.5">
                {23 - clock.getHours()}h {59 - clock.getMinutes()}m restantes
              </p>
            </div>
          </div>
        </div>
      </div>

      <div className="p-6 space-y-5 max-w-7xl mx-auto">

        {/* Quick stats */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
          <button onClick={() => onNavigate('calendar')}
            style={GLASS} className="p-4 text-left hover:brightness-125 transition-all hover:-translate-y-0.5">
            <div className="flex items-center gap-1.5 mb-3">
              <Calendar size={11} style={{ color: accent }} />
              <span className="text-[10px] text-gray-500 uppercase tracking-widest">Prochain évt.</span>
            </div>
            {nextEvent ? (
              <>
                <p className="text-sm font-bold text-white truncate">{nextEvent.title}</p>
                <p className="text-xs text-gray-400 mt-1">
                  {nextEvent.date === todayStr ? 'Auj.' : diffDays(todayStr, nextEvent.date) === 1 ? 'Demain' : `Dans ${diffDays(todayStr, nextEvent.date)}j`}
                  {nextEvent.time && ` · ${nextEvent.time}`}
                </p>
              </>
            ) : <p className="text-sm text-gray-600 mt-2">Aucun</p>}
          </button>

          <button onClick={() => onNavigate('tasks')}
            style={GLASS} className="p-4 text-left hover:brightness-125 transition-all hover:-translate-y-0.5">
            <div className="flex items-center gap-1.5 mb-3">
              <CheckSquare size={11} style={{ color: accent }} />
              <span className="text-[10px] text-gray-500 uppercase tracking-widest">Tâches</span>
            </div>
            <p className="text-4xl font-black text-white leading-none"
              style={{ textShadow: overdueTasks > 0 ? '0 0 20px rgba(239,68,68,0.5)' : undefined }}>
              {pendingCount}
            </p>
            <p className="text-xs mt-1">
              {overdueTasks > 0
                ? <span className="text-red-400">{overdueTasks} en retard</span>
                : <span className="text-gray-500">en cours</span>}
            </p>
          </button>

          <button onClick={() => onNavigate('nutrition')}
            style={GLASS} className="p-4 text-left hover:brightness-125 transition-all hover:-translate-y-0.5">
            <div className="flex items-center gap-1.5 mb-3">
              <Flame size={11} className="text-amber-400" />
              <span className="text-[10px] text-gray-500 uppercase tracking-widest">Calories</span>
            </div>
            <p className="text-4xl font-black text-white leading-none">{todayNutrition?.calories ?? '—'}</p>
            <p className="text-xs text-gray-500 mt-1">/ {targets.calories} kcal</p>
          </button>

          <button onClick={() => onNavigate('subscriptions')}
            style={GLASS} className="p-4 text-left hover:brightness-125 transition-all hover:-translate-y-0.5">
            <div className="flex items-center gap-1.5 mb-3">
              <CreditCard size={11} style={{ color: accent }} />
              <span className="text-[10px] text-gray-500 uppercase tracking-widest">Prochain abo.</span>
            </div>
            {nextSubRenewal ? (
              <>
                <p className="text-sm font-bold text-white truncate">{nextSubRenewal.sub.emoji} {nextSubRenewal.sub.name}</p>
                <p className={`text-xs mt-1 ${nextSubRenewal.daysUntil <= 3 ? 'text-red-400' : nextSubRenewal.daysUntil <= 7 ? 'text-amber-400' : 'text-gray-500'}`}>
                  {nextSubRenewal.daysUntil === 0 ? 'Auj.' : nextSubRenewal.daysUntil === 1 ? 'Demain' : `Dans ${nextSubRenewal.daysUntil}j`}
                </p>
              </>
            ) : <p className="text-sm text-gray-600 mt-2">Aucun</p>}
          </button>
        </div>

        {/* Tasks + Events */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">
          <div style={GLASS} className="p-5">
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center gap-2">
                <CheckSquare size={14} style={{ color: accent }} />
                <h2 className="font-semibold text-white text-sm">Tâches à faire</h2>
                {overdueTasks > 0 && (
                  <span className="text-xs bg-red-500/20 text-red-400 px-2 py-0.5 rounded-full">{overdueTasks} en retard</span>
                )}
              </div>
              <button onClick={() => onNavigate('tasks')}
                className="text-xs text-gray-600 hover:text-white flex items-center gap-1 transition-colors">
                Tout voir <ChevronRight size={12} />
              </button>
            </div>
            {pendingTasks.length === 0 ? (
              <p className="text-gray-500 text-sm text-center py-8">Tout est fait ! 🎉</p>
            ) : (
              <div className="space-y-2">
                {pendingTasks.map(t => {
                  const overdue = t.deadline && t.deadline < todayStr;
                  const pc = t.priority === 'high' ? '#ef4444' : t.priority === 'medium' ? '#f59e0b' : '#6b7280';
                  return (
                    <div key={t.id} style={{
                      background: overdue ? 'rgba(239,68,68,0.06)' : 'rgba(255,255,255,0.02)',
                      border: `1px solid ${overdue ? 'rgba(239,68,68,0.2)' : 'rgba(255,255,255,0.05)'}`,
                      borderRadius: 10, padding: '10px 12px', display: 'flex', alignItems: 'center', gap: 10,
                    }}>
                      <div style={{ width: 3, height: 20, borderRadius: 2, background: pc, boxShadow: `0 0 6px ${pc}`, flexShrink: 0 }} />
                      <div className="flex-1 min-w-0">
                        <p className="text-sm text-white truncate">{t.title}</p>
                        <div className="flex gap-2 mt-0.5">
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

          <div style={GLASS} className="p-5">
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center gap-2">
                <Calendar size={14} style={{ color: accent }} />
                <h2 className="font-semibold text-white text-sm">Événements à venir</h2>
              </div>
              <button onClick={() => onNavigate('calendar')}
                className="text-xs text-gray-600 hover:text-white flex items-center gap-1 transition-colors">
                Calendrier <ChevronRight size={12} />
              </button>
            </div>
            {upcomingEvents.length === 0 ? (
              <p className="text-gray-500 text-sm text-center py-8">Aucun événement à venir</p>
            ) : (
              <div className="space-y-2">
                {upcomingEvents.map(e => {
                  const isToday   = e.date === todayStr;
                  const daysUntil = diffDays(todayStr, e.date);
                  return (
                    <div key={e.id} style={{
                      background: 'rgba(255,255,255,0.02)',
                      border: '1px solid rgba(255,255,255,0.05)',
                      borderRadius: 10, padding: '10px 12px', display: 'flex', alignItems: 'center', gap: 10,
                    }}>
                      <div style={{ width: 3, height: 28, borderRadius: 2, background: e.color ?? accent, boxShadow: `0 0 6px ${e.color ?? accent}`, flexShrink: 0 }} />
                      <div className="flex-1 min-w-0">
                        <p className="text-sm text-white truncate">{e.title}</p>
                        <p className="text-xs text-gray-500 mt-0.5">
                          {isToday ? "Aujourd'hui" : daysUntil === 1 ? 'Demain'
                            : parseLocal(e.date).toLocaleDateString('fr-FR', { weekday: 'short', month: 'short', day: 'numeric' })}
                          {e.time && ` · ${e.time}`}
                        </p>
                      </div>
                      {isToday && (
                        <span className="text-xs px-2 py-0.5 rounded-full text-white shrink-0"
                          style={{ background: accent }}>Auj.</span>
                      )}
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        </div>

        {/* Spotify + Hike + Nutrition */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div style={GLASS} className="p-4">
            <div className="flex items-center gap-2 mb-4">
              <Music2 size={12} className="text-green-400" />
              <span className="text-[10px] text-gray-500 uppercase tracking-widest">Spotify</span>
              <button onClick={() => onNavigate('soundlog')} className="ml-auto text-gray-600 hover:text-white transition-colors">
                <ChevronRight size={13} />
              </button>
            </div>
            {nowPlaying ? (
              <div className="flex items-center gap-3">
                {nowPlaying.albumArt ? (
                  <img src={nowPlaying.albumArt} alt="" className="w-14 h-14 rounded-xl object-cover shrink-0"
                    style={{ boxShadow: '0 4px 20px rgba(0,0,0,0.6)' }} />
                ) : (
                  <div className="w-14 h-14 rounded-xl flex items-center justify-center shrink-0"
                    style={{ background: 'rgba(255,255,255,0.06)' }}>
                    <Music2 size={20} className="text-gray-600" />
                  </div>
                )}
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-bold text-white truncate">{nowPlaying.trackName}</p>
                  <p className="text-xs text-gray-400 truncate">{nowPlaying.artistName}</p>
                  <div className="mt-2">{bar((nowPlaying.progressMs / nowPlaying.durationMs) * 100, '#22c55e')}</div>
                </div>
              </div>
            ) : (
              <div className="flex items-center gap-3">
                <div className="w-12 h-12 rounded-xl flex items-center justify-center shrink-0"
                  style={{ background: 'rgba(255,255,255,0.05)' }}>
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

          <div style={GLASS} className="p-4">
            <div className="flex items-center gap-2 mb-4">
              <Mountain size={12} style={{ color: accent }} />
              <span className="text-[10px] text-gray-500 uppercase tracking-widest">Dernière rando</span>
              <button onClick={() => onNavigate('hike')} className="ml-auto text-gray-600 hover:text-white transition-colors">
                <ChevronRight size={13} />
              </button>
            </div>
            {lastHike ? (
              <>
                <p className="text-base font-bold text-white">{lastHike.name}</p>
                <p className="text-xs text-gray-400 mt-1">
                  {lastHike.daysAgo === 0 ? "Aujourd'hui 🥾" : lastHike.daysAgo === 1 ? 'Hier 🥾' : `Il y a ${lastHike.daysAgo}j 🥾`}
                </p>
              </>
            ) : (
              <p className="text-sm text-gray-500">Aucune rando enregistrée</p>
            )}
          </div>

          <div style={GLASS} className="p-4">
            <div className="flex items-center gap-2 mb-4">
              <Apple size={12} className="text-green-400" />
              <span className="text-[10px] text-gray-500 uppercase tracking-widest">Nutrition</span>
              <button onClick={() => onNavigate('nutrition')} className="ml-auto text-gray-600 hover:text-white transition-colors">
                <ChevronRight size={13} />
              </button>
            </div>
            {todayNutrition ? (
              <div className="space-y-2.5">
                {[
                  { label: 'Calories',  val: todayNutrition.calories, target: targets.calories, unit: 'kcal', color: '#f59e0b' },
                  { label: 'Protéines', val: todayNutrition.protein,  target: targets.protein,  unit: 'g',    color: '#3b82f6' },
                  { label: 'Eau',       val: todayNutrition.water,    target: targets.water,    unit: 'ml',   color: '#06b6d4' },
                ].map(({ label, val, target, unit, color }) => (
                  <div key={label}>
                    <div className="flex justify-between text-xs mb-1">
                      <span className="text-gray-500">{label}</span>
                      <span className="text-gray-400">{val}/{target}{unit}</span>
                    </div>
                    {bar(target > 0 ? (val / target) * 100 : 0, color)}
                  </div>
                ))}
              </div>
            ) : (
              <div>
                <p className="text-sm text-gray-500 mb-3">Pas encore loggé</p>
                <button onClick={() => onNavigate('nutrition')}
                  className="text-xs px-3 py-1.5 rounded-lg text-white"
                  style={{ background: accent }}>
                  Logger maintenant
                </button>
              </div>
            )}
          </div>
        </div>

        {/* Pinned links */}
        {pinnedLinks.length > 0 && (
          <div style={GLASS} className="p-5">
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center gap-2">
                <Globe size={14} style={{ color: accent }} />
                <h2 className="font-semibold text-white text-sm">Liens épinglés</h2>
              </div>
              <button onClick={() => onNavigate('hub')}
                className="text-xs text-gray-600 hover:text-white flex items-center gap-1 transition-colors">
                Hub <ChevronRight size={12} />
              </button>
            </div>
            <div className="grid grid-cols-3 sm:grid-cols-6 gap-3">
              {pinnedLinks.map(link => (
                <a key={link.id} href={link.url} target="_blank" rel="noopener noreferrer"
                  className="flex flex-col items-center gap-2 p-3 rounded-xl transition-all hover:-translate-y-1 group"
                  style={{ background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.06)' }}>
                  <div className="w-10 h-10 rounded-xl flex items-center justify-center overflow-hidden"
                    style={{ background: 'rgba(255,255,255,0.08)' }}>
                    {link.favicon
                      ? <img src={link.favicon} alt="" className="w-7 h-7 object-contain"
                          onError={e => { (e.currentTarget as HTMLImageElement).style.display = 'none'; }} />
                      : <Globe size={18} className="text-gray-500" />}
                  </div>
                  <p className="text-xs text-gray-400 group-hover:text-white truncate w-full text-center transition-colors">
                    {link.title}
                  </p>
                </a>
              ))}
            </div>
          </div>
        )}

      </div>
    </div>
  );
}
