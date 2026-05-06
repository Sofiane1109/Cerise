import { useState } from 'react';
import type { CalendarEvent } from '../types';
import { getItem, setItem } from '../utils/storage';
import { today, toDateStr, parseLocal, uid } from '../utils/helpers';
import { Modal, INPUT, LABEL, BTN_PRIMARY, BTN_GHOST } from '../components/ui';
import { ChevronLeft, ChevronRight, Plus, Bell, Pencil, Trash2 } from 'lucide-react';

const COLORS = ['#6366f1', '#22c55e', '#f59e0b', '#ef4444', '#8b5cf6', '#06b6d4', '#f97316', '#ec4899'];
const DAYS = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];

function getMonthGrid(year: number, month: number): Date[] {
  const first = new Date(year, month, 1);
  const start = new Date(first);
  start.setDate(start.getDate() - start.getDay());
  return Array.from({ length: 42 }, (_, i) => {
    const d = new Date(start);
    d.setDate(start.getDate() + i);
    return d;
  });
}

function getWeekDays(ref: Date): Date[] {
  const start = new Date(ref);
  start.setDate(start.getDate() - start.getDay());
  return Array.from({ length: 7 }, (_, i) => {
    const d = new Date(start);
    d.setDate(start.getDate() + i);
    return d;
  });
}

const EMPTY_EVENT = { title: '', date: today(), time: '', color: COLORS[0], reminder: false };

export default function Calendar() {
  const [events, setEvents]     = useState<CalendarEvent[]>(() => getItem('myne:events', []));
  const [view, setView]         = useState<'month' | 'week'>('month');
  const [cursor, setCursor]     = useState(new Date());
  const [modal, setModal]       = useState(false);
  const [editTarget, setEditTarget] = useState<CalendarEvent | null>(null);
  const [form, setForm]         = useState<typeof EMPTY_EVENT>({ ...EMPTY_EVENT, date: today() });

  const save = (list: CalendarEvent[]) => { setEvents(list); setItem('myne:events', list); };

  const openAdd = (date?: string) => {
    setEditTarget(null);
    setForm({ ...EMPTY_EVENT, date: date ?? today() });
    setModal(true);
  };

  const openEdit = (e: CalendarEvent) => {
    setEditTarget(e);
    setForm({ title: e.title, date: e.date, time: e.time ?? '', color: e.color, reminder: e.reminder });
    setModal(true);
  };

  const submit = () => {
    if (!form.title.trim()) return;
    if (editTarget) {
      save(events.map(e => e.id === editTarget.id ? { ...editTarget, ...form, time: form.time || undefined } : e));
    } else {
      save([...events, { id: uid(), ...form, time: form.time || undefined }]);
    }
    setModal(false);
  };

  const remove = (id: string) => save(events.filter(e => e.id !== id));

  const todayStr = today();

  // Navigation
  const prev = () => {
    const d = new Date(cursor);
    if (view === 'month') d.setMonth(d.getMonth() - 1);
    else d.setDate(d.getDate() - 7);
    setCursor(d);
  };
  const next = () => {
    const d = new Date(cursor);
    if (view === 'month') d.setMonth(d.getMonth() + 1);
    else d.setDate(d.getDate() + 7);
    setCursor(d);
  };

  const headerLabel = view === 'month'
    ? cursor.toLocaleDateString('en-US', { month: 'long', year: 'numeric' })
    : (() => {
        const days = getWeekDays(cursor);
        const s = days[0].toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
        const e = days[6].toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
        return `${s} — ${e}`;
      })();

  const monthGrid = view === 'month' ? getMonthGrid(cursor.getFullYear(), cursor.getMonth()) : [];
  const weekDays  = view === 'week'  ? getWeekDays(cursor) : [];

  const eventsFor = (d: Date) => {
    const s = toDateStr(d);
    return events.filter(e => e.date === s).sort((a, b) => (a.time ?? '').localeCompare(b.time ?? ''));
  };

  return (
    <div className="p-6 space-y-5 max-w-6xl mx-auto">
      {/* Header */}
      <div className="flex items-center justify-between flex-wrap gap-3">
        <div className="flex items-center gap-3">
          <button onClick={prev} className="w-8 h-8 flex items-center justify-center rounded-lg bg-gray-800 hover:bg-gray-700 text-gray-300 transition-colors">
            <ChevronLeft size={18} />
          </button>
          <h1 className="text-lg font-bold text-white min-w-[200px] text-center">{headerLabel}</h1>
          <button onClick={next} className="w-8 h-8 flex items-center justify-center rounded-lg bg-gray-800 hover:bg-gray-700 text-gray-300 transition-colors">
            <ChevronRight size={18} />
          </button>
          <button
            onClick={() => setCursor(new Date())}
            className="px-3 py-1.5 text-xs bg-gray-800 hover:bg-gray-700 text-gray-300 rounded-lg transition-colors"
          >
            Today
          </button>
        </div>
        <div className="flex items-center gap-2">
          <div className="flex rounded-lg overflow-hidden border border-gray-800">
            {(['month', 'week'] as const).map(v => (
              <button
                key={v}
                onClick={() => setView(v)}
                className={`px-3 py-1.5 text-xs font-medium transition-colors capitalize ${view === v ? 'bg-indigo-600 text-white' : 'bg-gray-900 text-gray-400 hover:text-white'}`}
              >
                {v}
              </button>
            ))}
          </div>
          <button onClick={() => openAdd()} className="flex items-center gap-2 px-3 py-1.5 bg-indigo-600 hover:bg-indigo-700 text-white text-sm rounded-lg transition-colors">
            <Plus size={16} /> Add event
          </button>
        </div>
      </div>

      {/* Month view */}
      {view === 'month' && (
        <div className="bg-gray-900 border border-gray-800 rounded-xl overflow-hidden">
          <div className="grid grid-cols-7 border-b border-gray-800">
            {DAYS.map(d => (
              <div key={d} className="py-3 text-center text-xs font-semibold text-gray-500 uppercase tracking-wider">{d}</div>
            ))}
          </div>
          <div className="grid grid-cols-7">
            {monthGrid.map((d, i) => {
              const s = toDateStr(d);
              const isThisMonth = d.getMonth() === cursor.getMonth();
              const isToday = s === todayStr;
              const dayEvents = eventsFor(d);
              return (
                <div
                  key={i}
                  onClick={() => openAdd(s)}
                  className={`min-h-[90px] p-1.5 border-b border-r border-gray-800 cursor-pointer hover:bg-gray-800/40 transition-colors ${
                    i % 7 === 6 ? 'border-r-0' : ''
                  } ${i >= 35 ? 'border-b-0' : ''}`}
                >
                  <div className={`w-7 h-7 flex items-center justify-center rounded-full text-sm font-medium mb-1 ${
                    isToday ? 'bg-indigo-600 text-white' : isThisMonth ? 'text-gray-200' : 'text-gray-700'
                  }`}>
                    {d.getDate()}
                  </div>
                  <div className="space-y-0.5">
                    {dayEvents.slice(0, 3).map(e => (
                      <div
                        key={e.id}
                        onClick={ev => { ev.stopPropagation(); openEdit(e); }}
                        className="text-xs px-1.5 py-0.5 rounded truncate text-white cursor-pointer hover:opacity-80 transition-opacity"
                        style={{ backgroundColor: e.color + 'cc' }}
                      >
                        {e.time && <span className="mr-1 opacity-80">{e.time}</span>}
                        {e.title}
                        {e.reminder && <Bell size={9} className="inline ml-1 opacity-70" />}
                      </div>
                    ))}
                    {dayEvents.length > 3 && (
                      <p className="text-xs text-gray-500 pl-1">+{dayEvents.length - 3} more</p>
                    )}
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
              const dayEvents = eventsFor(d);
              return (
                <div key={i} className={`border-r border-gray-800 last:border-r-0 ${isToday ? 'bg-indigo-950/20' : ''}`}>
                  <div
                    className={`py-3 text-center border-b border-gray-800 cursor-pointer hover:bg-gray-800/30 transition-colors`}
                    onClick={() => openAdd(s)}
                  >
                    <p className="text-xs text-gray-500 uppercase">{DAYS[d.getDay()]}</p>
                    <div className={`w-8 h-8 flex items-center justify-center rounded-full text-sm font-bold mx-auto mt-1 ${
                      isToday ? 'bg-indigo-600 text-white' : 'text-gray-200'
                    }`}>
                      {d.getDate()}
                    </div>
                  </div>
                  <div className="p-2 min-h-[200px] space-y-1.5 cursor-pointer" onClick={() => openAdd(s)}>
                    {dayEvents.map(e => (
                      <div
                        key={e.id}
                        onClick={ev => { ev.stopPropagation(); openEdit(e); }}
                        className="text-xs px-2 py-1.5 rounded-lg text-white cursor-pointer hover:opacity-80 transition-opacity"
                        style={{ backgroundColor: e.color + 'cc' }}
                      >
                        {e.time && <p className="opacity-80 text-[10px]">{e.time}</p>}
                        <p className="font-medium truncate">{e.title}</p>
                        {e.reminder && <Bell size={9} className="mt-0.5 opacity-70" />}
                      </div>
                    ))}
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* Add/Edit Modal */}
      <Modal isOpen={modal} onClose={() => setModal(false)} title={editTarget ? 'Edit Event' : 'Add Event'}>
        <div className="space-y-4">
          <div>
            <label className={LABEL}>Title *</label>
            <input
              className={INPUT}
              placeholder="Event title"
              value={form.title}
              onChange={e => setForm(f => ({ ...f, title: e.target.value }))}
              autoFocus
            />
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className={LABEL}>Date *</label>
              <input type="date" className={INPUT} value={form.date} onChange={e => setForm(f => ({ ...f, date: e.target.value }))} />
            </div>
            <div>
              <label className={LABEL}>Time (optional)</label>
              <input type="time" className={INPUT} value={form.time} onChange={e => setForm(f => ({ ...f, time: e.target.value }))} />
            </div>
          </div>
          <div>
            <label className={LABEL}>Color</label>
            <div className="flex gap-2 flex-wrap">
              {COLORS.map(c => (
                <button
                  key={c}
                  type="button"
                  onClick={() => setForm(f => ({ ...f, color: c }))}
                  className={`w-8 h-8 rounded-full transition-transform ${form.color === c ? 'scale-125 ring-2 ring-white ring-offset-2 ring-offset-gray-900' : 'hover:scale-110'}`}
                  style={{ backgroundColor: c }}
                />
              ))}
            </div>
          </div>
          <label className="flex items-center gap-3 cursor-pointer">
            <div
              onClick={() => setForm(f => ({ ...f, reminder: !f.reminder }))}
              className={`w-10 h-6 rounded-full transition-colors flex items-center px-0.5 ${form.reminder ? 'bg-indigo-600' : 'bg-gray-700'}`}
            >
              <div className={`w-5 h-5 rounded-full bg-white transition-transform ${form.reminder ? 'translate-x-4' : 'translate-x-0'}`} />
            </div>
            <span className="text-sm text-gray-300">Reminder</span>
          </label>
          <div className="flex gap-3 pt-2">
            {editTarget && (
              <button
                onClick={() => { remove(editTarget.id); setModal(false); }}
                className="flex items-center gap-2 px-4 py-2 bg-red-900/30 hover:bg-red-900/50 text-red-400 text-sm rounded-lg transition-colors"
              >
                <Trash2 size={14} /> Delete
              </button>
            )}
            <div className="flex gap-2 ml-auto">
              <button onClick={() => setModal(false)} className={BTN_GHOST}>Cancel</button>
              <button onClick={submit} className={BTN_PRIMARY}>{editTarget ? 'Save' : 'Add'}</button>
            </div>
          </div>
        </div>
      </Modal>

      {/* Edit event shortcut info */}
      {events.length > 0 && (
        <p className="text-xs text-gray-600 text-center">Click an event to edit · Click a day to add</p>
      )}

      {/* Upcoming events list */}
      <div className="bg-gray-900 border border-gray-800 rounded-xl p-5">
        <h2 className="text-sm font-semibold text-gray-300 mb-4 flex items-center gap-2">
          <Bell size={16} className="text-indigo-400" /> All events
        </h2>
        {events.length === 0 ? (
          <p className="text-gray-500 text-sm text-center py-4">No events yet — click a day to add one</p>
        ) : (
          <div className="space-y-2">
            {[...events]
              .sort((a, b) => a.date.localeCompare(b.date) || (a.time ?? '').localeCompare(b.time ?? ''))
              .map(e => (
                <div key={e.id} className="flex items-center gap-3 p-3 rounded-lg border border-gray-800 hover:border-gray-700 transition-colors">
                  <div className="w-2 h-10 rounded-full shrink-0" style={{ backgroundColor: e.color }} />
                  <div className="flex-1 min-w-0">
                    <p className="text-sm text-white font-medium">{e.title}</p>
                    <p className="text-xs text-gray-500">
                      {parseLocal(e.date).toLocaleDateString('en-US', { weekday: 'short', month: 'short', day: 'numeric' })}
                      {e.time && ` · ${e.time}`}
                      {e.reminder && ' 🔔'}
                    </p>
                  </div>
                  <div className="flex items-center gap-1 shrink-0">
                    <button onClick={() => openEdit(e)} className="w-8 h-8 flex items-center justify-center rounded-lg text-gray-500 hover:text-white hover:bg-gray-800 transition-colors">
                      <Pencil size={14} />
                    </button>
                    <button onClick={() => remove(e.id)} className="w-8 h-8 flex items-center justify-center rounded-lg text-gray-500 hover:text-red-400 hover:bg-red-950/30 transition-colors">
                      <Trash2 size={14} />
                    </button>
                  </div>
                </div>
              ))}
          </div>
        )}
      </div>
    </div>
  );
}
