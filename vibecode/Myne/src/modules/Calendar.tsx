import { useState, useEffect, useCallback } from 'react';
import type { CalendarEvent, ModuleId, EventCategory } from '../types';
import { getItem, setItem } from '../utils/storage';
import { today, toDateStr, parseLocal, uid } from '../utils/helpers';
import { Modal, INPUT, LABEL, BTN_PRIMARY, BTN_GHOST } from '../components/ui';
import { ChevronLeft, ChevronRight, Plus, Bell, Pencil, Trash2, RefreshCw, GraduationCap, MapPin, Check } from 'lucide-react';

// ── School calendar ───────────────────────────────────────────────────────────
const SCHOOL_COLOR = '#f97316';
const ICAL_URL = 'https://cloud.timeedit.net/be_kuleuven/web/public/s.ics?i=6u1u8X55Z015QZ55QX27XQZ485055Y840Q486y5w501Y095570451425145X5650X54175525X0X9222900656X55X5456650223110X76158509X55X2542654505X015X5X40X504550255464521145255n9706551X2620123ZXQ5609';
const CORS_PROXIES = [
  'https://api.allorigins.win/raw?url=',
  'https://corsproxy.io/?',
  'https://thingproxy.freeboard.io/fetch/',
];

// ── Event categories ──────────────────────────────────────────────────────────
export const DEFAULT_CATEGORIES: EventCategory[] = [
  { id: 'personal', name: 'Personnel',  color: '#6366f1', emoji: '🏠' },
  { id: 'school',   name: 'Cours',      color: '#3b82f6', emoji: '📚' },
  { id: 'work',     name: 'Travail',    color: '#8b5cf6', emoji: '💼' },
  { id: 'sport',    name: 'Sport',      color: '#22c55e', emoji: '🏃' },
  { id: 'social',   name: 'Social',     color: '#ec4899', emoji: '🎉' },
  { id: 'health',   name: 'Santé',      color: '#f59e0b', emoji: '🏥' },
  { id: 'travel',   name: 'Voyage',     color: '#06b6d4', emoji: '✈️' },
];

// ── Group filter ──────────────────────────────────────────────────────────────
const MY_GROUP = '2I4';
const GROUP_OVERRIDES: { keywords: string[]; group: string }[] = [
  { keywords: ['big data'], group: '2I3' },
];

// ── Calendar grid (Monday-first) ──────────────────────────────────────────────
const DAYS_MON = ['Lun', 'Mar', 'Mer', 'Jeu', 'Ven', 'Sam', 'Dim'];

function getMonthGrid(year: number, month: number): Date[] {
  const first = new Date(year, month, 1);
  const dayOfWeek = (first.getDay() + 6) % 7; // Mon=0
  const start = new Date(first);
  start.setDate(start.getDate() - dayOfWeek);
  return Array.from({ length: 42 }, (_, i) => {
    const d = new Date(start);
    d.setDate(start.getDate() + i);
    return d;
  });
}

function getWeekDays(ref: Date): Date[] {
  const dayOfWeek = (ref.getDay() + 6) % 7;
  const start = new Date(ref);
  start.setDate(start.getDate() - dayOfWeek);
  return Array.from({ length: 7 }, (_, i) => {
    const d = new Date(start);
    d.setDate(start.getDate() + i);
    return d;
  });
}

// ── iCal helpers ──────────────────────────────────────────────────────────────
interface SchoolEvent {
  id: string; title: string; date: string;
  time?: string; endTime?: string; location?: string; description?: string;
}
type AnyEvent = {
  id: string; title: string; time?: string; endTime?: string;
  color: string; isSchool: boolean; reminder?: boolean; location?: string;
};

function unesc(s: string): string {
  return s.replace(/\\n/gi, ' ').replace(/\\,/g, ',').replace(/\\;/g, ';').replace(/\\\\/g, '\\');
}

function parseDT(val: string): { date: string; time?: string } | null {
  const v = val.trim();
  if (v.length === 8) return { date: `${v.slice(0,4)}-${v.slice(4,6)}-${v.slice(6,8)}` };
  const tIdx = v.indexOf('T');
  if (tIdx === -1) return null;
  const dp = v.slice(0, tIdx), tp = v.slice(tIdx + 1).replace('Z', '');
  const y = dp.slice(0,4), mo = dp.slice(4,6), d = dp.slice(6,8);
  const hh = tp.slice(0,2), mm = tp.slice(2,4);
  if (v.endsWith('Z')) {
    const dt = new Date(`${y}-${mo}-${d}T${hh}:${mm}:00Z`);
    return {
      date: `${dt.getFullYear()}-${String(dt.getMonth()+1).padStart(2,'0')}-${String(dt.getDate()).padStart(2,'0')}`,
      time: `${String(dt.getHours()).padStart(2,'0')}:${String(dt.getMinutes()).padStart(2,'0')}`,
    };
  }
  return { date: `${y}-${mo}-${d}`, time: `${hh}:${mm}` };
}

const GROUP_RE = /\b\d[A-Z]{1,3}\d+\b/g;

function belongsToGroup(ev: Partial<SchoolEvent>): boolean {
  const raw = `${ev.title ?? ''} ${ev.description ?? ''}`;
  const lower = raw.toLowerCase();
  const groups = raw.match(GROUP_RE);
  if (!groups) return true;
  for (const override of GROUP_OVERRIDES) {
    if (override.keywords.some(kw => lower.includes(kw))) return groups.includes(override.group);
  }
  return groups.includes(MY_GROUP);
}

function parseICS(text: string): SchoolEvent[] {
  const unfolded = text.replace(/\r\n[ \t]/g, '').replace(/\n[ \t]/g, '');
  const lines = unfolded.split(/\r\n|\r|\n/);
  const events: SchoolEvent[] = [];
  let cur: Partial<SchoolEvent> | null = null;
  for (const line of lines) {
    if (line === 'BEGIN:VEVENT') { cur = {}; continue; }
    if (line === 'END:VEVENT') {
      if (cur?.date && belongsToGroup(cur))
        events.push({ id: cur.id ?? uid(), title: cur.title ?? 'Cours', date: cur.date, time: cur.time, endTime: cur.endTime, location: cur.location, description: cur.description });
      cur = null; continue;
    }
    if (!cur) continue;
    const ci = line.indexOf(':');
    if (ci === -1) continue;
    const prop = line.slice(0, ci).split(';')[0].toUpperCase();
    const val  = line.slice(ci + 1);
    if (prop === 'SUMMARY')     cur.title       = unesc(val);
    if (prop === 'UID')         cur.id          = val;
    if (prop === 'LOCATION')    cur.location    = unesc(val) || undefined;
    if (prop === 'DESCRIPTION') cur.description = unesc(val) || undefined;
    if (prop === 'DTSTART') { const p = parseDT(val); if (p) { cur.date = p.date; cur.time = p.time; } }
    if (prop === 'DTEND')   { const p = parseDT(val); if (p) { cur.endTime = p.time; } }
  }
  return events.sort((a, b) => a.date.localeCompare(b.date));
}

// ── Component ─────────────────────────────────────────────────────────────────
const EMPTY_FORM = { title: '', date: today(), time: '', categoryId: 'personal', reminder: false };

interface Props {
  onNavigate?: (id: ModuleId) => void;
  onNavigateToTask?: (taskId: string) => void;
}

export default function Calendar({ onNavigate, onNavigateToTask }: Props) {
  const [events, setEvents]         = useState<CalendarEvent[]>(() => getItem('myne:events', []));
  const [schoolEvents, setSchoolEv] = useState<SchoolEvent[]>(() => getItem('myne:calendar:school', []));
  const [userCategories, setUC]     = useState<EventCategory[]>(() => getItem('myne:calendar:categories', []));
  const [schoolLoading, setLoading] = useState(false);
  const [schoolError, setError]     = useState<string | null>(null);

  const [view, setView]     = useState<'month' | 'week'>('month');
  const [cursor, setCursor] = useState(new Date());
  const [modal, setModal]   = useState(false);
  const [editTarget, setEditTarget]     = useState<CalendarEvent | null>(null);
  const [schoolDetail, setSchoolDet]   = useState<SchoolEvent | null>(null);
  const [evPage, setEvPage]             = useState(0);
  const [form, setForm] = useState<typeof EMPTY_FORM>({ ...EMPTY_FORM });

  // New category form
  const [catModal, setCatModal] = useState(false);
  const [catForm, setCatForm] = useState({ name: '', emoji: '📌', color: '#6366f1' });

  const categories = [...DEFAULT_CATEGORIES, ...userCategories];

  const fetchSchool = useCallback(async () => {
    setLoading(true); setError(null);
    let lastErr: unknown;
    for (const proxy of CORS_PROXIES) {
      try {
        const res = await fetch(proxy + encodeURIComponent(ICAL_URL));
        if (!res.ok) throw new Error(`HTTP ${res.status}`);
        const text = await res.text();
        const parsed = parseICS(text);
        setSchoolEv(parsed);
        setItem('myne:calendar:school', parsed);
        setLoading(false);
        return;
      } catch (e) { lastErr = e; }
    }
    console.error('All CORS proxies failed:', lastErr);
    setError('Impossible de charger le calendrier scolaire');
    setLoading(false);
  }, []);

  useEffect(() => { fetchSchool(); }, [fetchSchool]);

  const save = (list: CalendarEvent[]) => { setEvents(list); setItem('myne:events', list); };

  const openAdd = (date?: string) => {
    setEditTarget(null);
    setForm({ ...EMPTY_FORM, date: date ?? today() });
    setModal(true);
  };

  const openEdit = (e: CalendarEvent) => {
    if (e.taskId) {
      onNavigateToTask?.(e.taskId);
      onNavigate?.('tasks');
      return;
    }
    if (e.subscriptionId) return;
    setEditTarget(e);
    setForm({ title: e.title, date: e.date, time: e.time ?? '', categoryId: e.categoryId ?? 'personal', reminder: e.reminder });
    setModal(true);
  };

  const submit = () => {
    if (!form.title.trim()) return;
    const cat = categories.find(c => c.id === form.categoryId);
    const color = cat?.color ?? '#6366f1';
    if (editTarget) {
      save(events.map(e => e.id === editTarget.id ? { ...editTarget, ...form, color, time: form.time || undefined } : e));
    } else {
      save([...events, { id: uid(), ...form, color, time: form.time || undefined }]);
    }
    setModal(false);
  };

  const remove = (id: string) => save(events.filter(e => e.id !== id));

  const addCategory = () => {
    if (!catForm.name.trim()) return;
    const nc: EventCategory = { id: uid(), name: catForm.name.trim(), emoji: catForm.emoji, color: catForm.color };
    const updated = [...userCategories, nc];
    setUC(updated);
    setItem('myne:calendar:categories', updated);
    setCatModal(false);
    setCatForm({ name: '', emoji: '📌', color: '#6366f1' });
  };

  // ── Merged events for a day ────────────────────────────────────────────────
  const allEventsFor = (d: Date): AnyEvent[] => {
    const s = toDateStr(d);
    const personal: AnyEvent[] = events
      .filter(e => e.date === s)
      .map(e => ({ id: e.id, title: e.title, time: e.time, color: e.color, isSchool: false, reminder: e.reminder }));
    const school: AnyEvent[] = schoolEvents
      .filter(e => e.date === s)
      .map(e => ({ id: e.id, title: e.title, time: e.time, endTime: e.endTime, color: SCHOOL_COLOR, isSchool: true, location: e.location }));
    return [...personal, ...school].sort((a, b) => (a.time ?? '99').localeCompare(b.time ?? '99'));
  };

  const todayStr = today();

  const prev = () => {
    const d = new Date(cursor);
    view === 'month' ? d.setMonth(d.getMonth() - 1) : d.setDate(d.getDate() - 7);
    setCursor(d);
  };
  const next = () => {
    const d = new Date(cursor);
    view === 'month' ? d.setMonth(d.getMonth() + 1) : d.setDate(d.getDate() + 7);
    setCursor(d);
  };

  const headerLabel = view === 'month'
    ? cursor.toLocaleDateString('fr-FR', { month: 'long', year: 'numeric' })
    : (() => {
        const days = getWeekDays(cursor);
        const s = days[0].toLocaleDateString('fr-FR', { month: 'short', day: 'numeric' });
        const e = days[6].toLocaleDateString('fr-FR', { month: 'short', day: 'numeric', year: 'numeric' });
        return `${s} — ${e}`;
      })();

  const monthGrid = view === 'month' ? getMonthGrid(cursor.getFullYear(), cursor.getMonth()) : [];
  const weekDays  = view === 'week'  ? getWeekDays(cursor) : [];

  // ── Event chip renderer ────────────────────────────────────────────────────
  const renderChip = (e: AnyEvent, compact: boolean) => {
    const onClick = (ev: React.MouseEvent) => {
      ev.stopPropagation();
      if (e.isSchool) {
        setSchoolDet(schoolEvents.find(s => s.id === e.id) ?? null);
      } else {
        const personal = events.find(p => p.id === e.id);
        if (personal) openEdit(personal);
      }
    };
    return (
      <div
        key={e.id}
        onClick={onClick}
        className={`text-xs rounded truncate text-white cursor-pointer hover:opacity-80 transition-opacity ${compact ? 'px-1.5 py-0.5' : 'px-2 py-1.5'}`}
        style={{ backgroundColor: e.color + (e.isSchool ? 'dd' : 'cc') }}
      >
        {!compact && e.isSchool && (
          <p className="text-[10px] opacity-70 flex items-center gap-0.5 mb-0.5">
            <GraduationCap size={8} /> École
          </p>
        )}
        {e.time && <span className={`mr-1 opacity-80 ${compact ? '' : 'text-[10px] block'}`}>{e.time}</span>}
        <span className={compact ? '' : 'font-medium'}>{e.title}</span>
        {compact && e.isSchool && <GraduationCap size={8} className="inline ml-1 opacity-70" />}
        {!e.isSchool && e.reminder && <Bell size={9} className="inline ml-1 opacity-70" />}
      </div>
    );
  };

  // ── All upcoming events list ───────────────────────────────────────────────
  const allEvents: (AnyEvent & { _date: string })[] = [
    ...events.map(e => ({ id: e.id, title: e.title, time: e.time, color: e.color, isSchool: false as const, reminder: e.reminder, _date: e.date })),
    ...schoolEvents.map(e => ({ id: e.id, title: e.title, time: e.time, endTime: e.endTime, color: SCHOOL_COLOR, isSchool: true as const, location: e.location, _date: e.date })),
  ]
    .filter(e => e._date >= todayStr)
    .sort((a, b) => a._date.localeCompare(b._date) || (a.time ?? '').localeCompare(b.time ?? ''));

  return (
    <div className="p-6 space-y-5 max-w-6xl mx-auto">
      {/* Header */}
      <div className="flex items-center justify-between flex-wrap gap-3">
        <div className="flex items-center gap-3">
          <button onClick={prev} className="w-8 h-8 flex items-center justify-center rounded-lg bg-gray-800 hover:bg-gray-700 text-gray-300 transition-colors">
            <ChevronLeft size={18} />
          </button>
          <h1 className="text-lg font-bold text-white min-w-[200px] text-center capitalize">{headerLabel}</h1>
          <button onClick={next} className="w-8 h-8 flex items-center justify-center rounded-lg bg-gray-800 hover:bg-gray-700 text-gray-300 transition-colors">
            <ChevronRight size={18} />
          </button>
          <button onClick={() => setCursor(new Date())} className="px-3 py-1.5 text-xs bg-gray-800 hover:bg-gray-700 text-gray-300 rounded-lg transition-colors">
            Auj.
          </button>
        </div>

        <div className="flex items-center gap-2 flex-wrap">
          <div className="flex items-center gap-2 px-3 py-1.5 bg-gray-800/60 rounded-lg">
            <div className="w-2.5 h-2.5 rounded-full shrink-0" style={{ backgroundColor: SCHOOL_COLOR }} />
            <span className="text-xs text-gray-400">École</span>
            {schoolError && <span className="text-xs text-red-400">{schoolError}</span>}
            <button onClick={fetchSchool} disabled={schoolLoading} className="text-gray-500 hover:text-white transition-colors disabled:opacity-40">
              <RefreshCw size={13} className={schoolLoading ? 'animate-spin' : ''} />
            </button>
          </div>

          <div className="flex rounded-lg overflow-hidden border border-gray-800">
            {(['month', 'week'] as const).map(v => (
              <button
                key={v}
                onClick={() => setView(v)}
                className={`px-3 py-1.5 text-xs font-medium transition-colors capitalize ${view === v ? 'text-white' : 'bg-gray-900 text-gray-400 hover:text-white'}`}
                style={view === v ? { backgroundColor: 'var(--accent)' } : {}}
              >
                {v === 'month' ? 'Mois' : 'Semaine'}
              </button>
            ))}
          </div>

          <button onClick={() => openAdd()} className="flex items-center gap-2 px-3 py-1.5 btn-accent text-white text-sm rounded-lg">
            <Plus size={16} /> Ajouter
          </button>
        </div>
      </div>

      {/* Categories row */}
      <div className="flex gap-2 flex-wrap items-center">
        {categories.map(cat => (
          <span key={cat.id} className="flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium text-white"
            style={{ backgroundColor: cat.color + '99' }}>
            {cat.emoji} {cat.name}
          </span>
        ))}
        <button onClick={() => setCatModal(true)} className="flex items-center gap-1 px-2.5 py-1 rounded-full text-xs text-gray-500 border border-dashed border-gray-700 hover:border-gray-500 transition-colors">
          <Plus size={10} /> Catégorie
        </button>
      </div>

      {/* Month view */}
      {view === 'month' && (
        <div className="bg-gray-900 border border-gray-800 rounded-xl overflow-hidden">
          <div className="grid grid-cols-7 border-b border-gray-800">
            {DAYS_MON.map(d => (
              <div key={d} className="py-3 text-center text-xs font-semibold text-gray-500 uppercase tracking-wider">{d}</div>
            ))}
          </div>
          <div className="grid grid-cols-7">
            {monthGrid.map((d, i) => {
              const s = toDateStr(d);
              const isThisMonth = d.getMonth() === cursor.getMonth();
              const isToday = s === todayStr;
              const dayEvents = allEventsFor(d);
              return (
                <div
                  key={i}
                  onClick={() => openAdd(s)}
                  className={`min-h-[90px] p-1.5 border-b border-r border-gray-800 cursor-pointer hover:bg-gray-800/40 transition-colors ${i % 7 === 6 ? 'border-r-0' : ''} ${i >= 35 ? 'border-b-0' : ''}`}
                >
                  <div
                    className={`w-7 h-7 flex items-center justify-center rounded-full text-sm font-medium mb-1 ${isToday ? 'text-white' : isThisMonth ? 'text-gray-200' : 'text-gray-700'}`}
                    style={isToday ? { backgroundColor: 'var(--accent)' } : {}}
                  >
                    {d.getDate()}
                  </div>
                  <div className="space-y-0.5">
                    {dayEvents.slice(0, 3).map(e => renderChip(e, true))}
                    {dayEvents.length > 3 && <p className="text-xs text-gray-500 pl-1">+{dayEvents.length - 3}</p>}
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* Week view */}
      {view === 'week' && (
        <div className="bg-gray-900 border border-gray-800 rounded-xl overflow-hidden">
          <div className="grid grid-cols-7">
            {weekDays.map((d, i) => {
              const s = toDateStr(d);
              const isToday = s === todayStr;
              const dayEvents = allEventsFor(d);
              return (
                <div key={i} className={`border-r border-gray-800 last:border-r-0 ${isToday ? 'bg-indigo-950/20' : ''}`}>
                  <div className="py-3 text-center border-b border-gray-800 cursor-pointer hover:bg-gray-800/30 transition-colors" onClick={() => openAdd(s)}>
                    <p className="text-xs text-gray-500 uppercase">{DAYS_MON[i]}</p>
                    <div
                      className={`w-8 h-8 flex items-center justify-center rounded-full text-sm font-bold mx-auto mt-1 ${isToday ? 'text-white' : 'text-gray-200'}`}
                      style={isToday ? { backgroundColor: 'var(--accent)' } : {}}
                    >
                      {d.getDate()}
                    </div>
                  </div>
                  <div className="p-2 min-h-[200px] space-y-1.5 cursor-pointer" onClick={() => openAdd(s)}>
                    {dayEvents.map(e => renderChip(e, false))}
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* Add/Edit modal */}
      <Modal isOpen={modal} onClose={() => setModal(false)} title={editTarget ? 'Modifier l\'événement' : 'Ajouter un événement'}>
        <div className="space-y-4">
          <div>
            <label className={LABEL}>Titre *</label>
            <input className={INPUT} placeholder="Titre de l'événement" value={form.title} onChange={e => setForm(f => ({ ...f, title: e.target.value }))} autoFocus />
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className={LABEL}>Date *</label>
              <input type="date" className={INPUT} value={form.date} onChange={e => setForm(f => ({ ...f, date: e.target.value }))} />
            </div>
            <div>
              <label className={LABEL}>Heure (optionnel)</label>
              <input type="time" className={INPUT} value={form.time} onChange={e => setForm(f => ({ ...f, time: e.target.value }))} />
            </div>
          </div>
          <div>
            <label className={LABEL}>Catégorie</label>
            <div className="flex gap-2 flex-wrap">
              {categories.map(cat => (
                <button
                  key={cat.id}
                  type="button"
                  onClick={() => setForm(f => ({ ...f, categoryId: cat.id }))}
                  className={`flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-medium transition-all ${
                    form.categoryId === cat.id ? 'text-white ring-2 ring-white ring-offset-1 ring-offset-gray-900' : 'text-gray-200 hover:text-white'
                  }`}
                  style={{ backgroundColor: cat.color + (form.categoryId === cat.id ? 'ff' : '55') }}
                >
                  {cat.emoji} {cat.name}
                  {form.categoryId === cat.id && <Check size={10} className="ml-0.5" />}
                </button>
              ))}
            </div>
          </div>
          <label className="flex items-center gap-3 cursor-pointer">
            <div onClick={() => setForm(f => ({ ...f, reminder: !f.reminder }))}
              className={`w-10 h-6 rounded-full transition-colors flex items-center px-0.5 ${form.reminder ? 'bg-accent' : 'bg-gray-700'}`}
              style={form.reminder ? { backgroundColor: 'var(--accent)' } : {}}>
              <div className={`w-5 h-5 rounded-full bg-white transition-transform ${form.reminder ? 'translate-x-4' : 'translate-x-0'}`} />
            </div>
            <span className="text-sm text-gray-300">Rappel</span>
          </label>
          <div className="flex gap-3 pt-2">
            {editTarget && !editTarget.taskId && (
              <button onClick={() => { remove(editTarget.id); setModal(false); }}
                className="flex items-center gap-2 px-4 py-2 bg-red-900/30 hover:bg-red-900/50 text-red-400 text-sm rounded-lg transition-colors">
                <Trash2 size={14} /> Supprimer
              </button>
            )}
            <div className="flex gap-2 ml-auto">
              <button onClick={() => setModal(false)} className={BTN_GHOST}>Annuler</button>
              <button onClick={submit} className={BTN_PRIMARY}>{editTarget ? 'Sauvegarder' : 'Ajouter'}</button>
            </div>
          </div>
        </div>
      </Modal>

      {/* New category modal */}
      <Modal isOpen={catModal} onClose={() => setCatModal(false)} title="Nouvelle catégorie">
        <div className="space-y-4">
          <div>
            <label className={LABEL}>Nom *</label>
            <input className={INPUT} placeholder="ex: Famille" value={catForm.name} onChange={e => setCatForm(f => ({ ...f, name: e.target.value }))} autoFocus />
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className={LABEL}>Emoji</label>
              <input className={INPUT} placeholder="📌" value={catForm.emoji} onChange={e => setCatForm(f => ({ ...f, emoji: e.target.value }))} />
            </div>
            <div>
              <label className={LABEL}>Couleur</label>
              <input type="color" className="w-full h-[38px] rounded-lg cursor-pointer border border-gray-700 bg-gray-800 p-0.5" value={catForm.color} onChange={e => setCatForm(f => ({ ...f, color: e.target.value }))} />
            </div>
          </div>
          <div className="flex gap-2 justify-end">
            <button onClick={() => setCatModal(false)} className={BTN_GHOST}>Annuler</button>
            <button onClick={addCategory} className={BTN_PRIMARY}>Créer</button>
          </div>
        </div>
      </Modal>

      {/* School detail modal */}
      <Modal isOpen={!!schoolDetail} onClose={() => setSchoolDet(null)} title="Cours — École">
        {schoolDetail && (
          <div className="space-y-3">
            <div className="flex items-center gap-2 mb-1">
              <GraduationCap size={16} style={{ color: SCHOOL_COLOR }} />
              <span className="text-xs px-2 py-0.5 rounded-full text-white font-medium" style={{ backgroundColor: SCHOOL_COLOR }}>KU Leuven</span>
            </div>
            <p className="text-white font-semibold">{schoolDetail.title}</p>
            <p className="text-sm text-gray-400">
              {parseLocal(schoolDetail.date).toLocaleDateString('fr-FR', { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' })}
              {schoolDetail.time && ` · ${schoolDetail.time}`}
              {schoolDetail.endTime && ` → ${schoolDetail.endTime}`}
            </p>
            {schoolDetail.location && (
              <p className="text-sm text-gray-400 flex items-center gap-1.5">
                <MapPin size={13} className="shrink-0" /> {schoolDetail.location}
              </p>
            )}
            <p className="text-xs text-gray-600 pt-2 border-t border-gray-800">Événement scolaire — lecture seule</p>
          </div>
        )}
      </Modal>

      {/* All upcoming events */}
      <div className="bg-gray-900 border border-gray-800 rounded-xl p-5">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-sm font-semibold text-gray-300 flex items-center gap-2">
            <Bell size={16} className="text-accent" style={{ color: 'var(--accent)' }} />
            Événements à venir
            {schoolEvents.length > 0 && (
              <span className="text-xs font-normal text-gray-500">
                · {allEvents.filter(e => !e.isSchool).length} personnels, {allEvents.filter(e => e.isSchool).length} scolaires
              </span>
            )}
          </h2>
          {allEvents.length > 10 && (
            <div className="flex items-center gap-2">
              <span className="text-xs text-gray-500">{evPage * 10 + 1}–{Math.min(evPage * 10 + 10, allEvents.length)} / {allEvents.length}</span>
              <button onClick={() => setEvPage(p => Math.max(0, p - 1))} disabled={evPage === 0}
                className="w-7 h-7 flex items-center justify-center rounded-lg bg-gray-800 hover:bg-gray-700 text-gray-300 disabled:opacity-30 transition-colors">
                <ChevronLeft size={14} />
              </button>
              <button onClick={() => setEvPage(p => Math.min(Math.ceil(allEvents.length / 10) - 1, p + 1))} disabled={evPage >= Math.ceil(allEvents.length / 10) - 1}
                className="w-7 h-7 flex items-center justify-center rounded-lg bg-gray-800 hover:bg-gray-700 text-gray-300 disabled:opacity-30 transition-colors">
                <ChevronRight size={14} />
              </button>
            </div>
          )}
        </div>
        {allEvents.length === 0 ? (
          <p className="text-gray-500 text-sm text-center py-4">Aucun événement à venir</p>
        ) : (
          <div className="space-y-2">
            {allEvents.slice(evPage * 10, evPage * 10 + 10).map(e => (
              <div key={e.id} className="flex items-center gap-3 p-3 rounded-lg border border-gray-800 hover:border-gray-700 transition-colors">
                <div className="w-2 h-10 rounded-full shrink-0" style={{ backgroundColor: e.color }} />
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2">
                    <p className="text-sm text-white font-medium truncate">{e.title}</p>
                    {e.isSchool && (
                      <span className="shrink-0 text-xs px-1.5 py-0.5 rounded-full font-medium" style={{ backgroundColor: SCHOOL_COLOR + '30', color: SCHOOL_COLOR }}>
                        École
                      </span>
                    )}
                  </div>
                  <p className="text-xs text-gray-500">
                    {parseLocal(e._date).toLocaleDateString('fr-FR', { weekday: 'short', month: 'short', day: 'numeric' })}
                    {e.time && ` · ${e.time}`}
                    {e.isSchool && (e as any).endTime && ` → ${(e as any).endTime}`}
                    {!e.isSchool && e.reminder && ' 🔔'}
                  </p>
                  {e.isSchool && e.location && (
                    <p className="text-xs text-gray-600 flex items-center gap-1 mt-0.5">
                      <MapPin size={10} /> {e.location}
                    </p>
                  )}
                </div>
                {!e.isSchool && (
                  <div className="flex items-center gap-1 shrink-0">
                    <button onClick={() => { const p = events.find(x => x.id === e.id); if (p) openEdit(p); }}
                      className="w-8 h-8 flex items-center justify-center rounded-lg text-gray-500 hover:text-white hover:bg-gray-800 transition-colors">
                      <Pencil size={14} />
                    </button>
                    <button onClick={() => remove(e.id)}
                      className="w-8 h-8 flex items-center justify-center rounded-lg text-gray-500 hover:text-red-400 hover:bg-red-950/30 transition-colors">
                      <Trash2 size={14} />
                    </button>
                  </div>
                )}
                {e.isSchool && (
                  <button onClick={() => setSchoolDet(schoolEvents.find(s => s.id === e.id) ?? null)}
                    className="shrink-0 text-xs text-gray-600 hover:text-gray-400 transition-colors px-2">
                    Détails
                  </button>
                )}
              </div>
            ))}
          </div>
        )}
      </div>

      {events.length > 0 && (
        <p className="text-xs text-gray-600 text-center">Cliquer sur un événement pour modifier · Cliquer sur un jour pour ajouter</p>
      )}
    </div>
  );
}
