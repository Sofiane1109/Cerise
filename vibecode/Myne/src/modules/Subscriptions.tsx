import { useState, useMemo } from 'react';
import type { Subscription, SubFrequency, CalendarEvent } from '../types';
import { getItem, setItem } from '../utils/storage';
import { today, uid, parseLocal, addDays, addMonths, addYears, diffDays } from '../utils/helpers';
import { Modal, INPUT, LABEL, BTN_PRIMARY, BTN_GHOST } from '../components/ui';
import { CreditCard, Plus, Trash2, Pencil, RefreshCw, TrendingDown } from 'lucide-react';

const FREQ_LABELS: Record<SubFrequency, string> = {
  monthly:     'Monthly',
  every4weeks: 'Every 4 weeks',
  yearly:      'Yearly',
  custom:      'Custom',
};

const CURRENCIES = ['EUR', 'USD', 'GBP'] as const;
const CURRENCY_SYMBOLS: Record<string, string> = { EUR: '€', USD: '$', GBP: '£' };
const COLORS = ['#6366f1','#3b82f6','#8b5cf6','#22c55e','#f59e0b','#ef4444','#06b6d4','#ec4899','#f97316'];

const GLASS: React.CSSProperties = {
  background: 'rgba(255,255,255,0.03)',
  border: '1px solid rgba(255,255,255,0.07)',
  backdropFilter: 'blur(16px)',
  WebkitBackdropFilter: 'blur(16px)',
  borderRadius: 16,
};

function getNextRenewal(sub: Subscription): string {
  const todayStr = today();
  let next = sub.startDate;
  let iterations = 0;
  while (next <= todayStr && iterations < 1000) {
    iterations++;
    if (sub.frequency === 'monthly')         next = addMonths(next, 1);
    else if (sub.frequency === 'every4weeks') next = addDays(next, 28);
    else if (sub.frequency === 'yearly')      next = addYears(next, 1);
    else                                       next = addDays(next, sub.customDays ?? 30);
  }
  return next;
}

function getMonthlyAmount(sub: Subscription): number {
  if (sub.frequency === 'monthly')     return sub.amount;
  if (sub.frequency === 'every4weeks') return sub.amount * (365 / 28 / 12);
  if (sub.frequency === 'yearly')      return sub.amount / 12;
  return sub.amount * (30 / (sub.customDays ?? 30));
}

function syncSubscriptionEvents(subs: Subscription[]) {
  const events = getItem<CalendarEvent[]>('myne:events', []);
  const other = events.filter(e => !e.subscriptionId);
  const subEvents: CalendarEvent[] = subs.map(sub => ({
    id: `sub-${sub.id}`,
    subscriptionId: sub.id,
    title: `💳 ${sub.name}`,
    date: getNextRenewal(sub),
    color: sub.color ?? '#6366f1',
    reminder: true,
  }));
  setItem('myne:events', [...other, ...subEvents]);
}

const EMPTY_FORM = {
  name: '', emoji: '', amount: '', currency: 'EUR' as typeof CURRENCIES[number],
  frequency: 'monthly' as SubFrequency, customDays: '', startDate: today(), color: COLORS[0],
};

export default function Subscriptions() {
  const [subs, setSubs]         = useState<Subscription[]>(() => getItem('myne:subscriptions', []));
  const [modal, setModal]       = useState(false);
  const [editTarget, setEditTarget] = useState<Subscription | null>(null);
  const [form, setForm]         = useState({ ...EMPTY_FORM });

  const saveSubs = (list: Subscription[]) => {
    setSubs(list);
    setItem('myne:subscriptions', list);
    syncSubscriptionEvents(list);
  };

  const openAdd = () => { setEditTarget(null); setForm({ ...EMPTY_FORM }); setModal(true); };

  const openEdit = (sub: Subscription) => {
    setEditTarget(sub);
    setForm({
      name: sub.name, emoji: sub.emoji ?? '', amount: String(sub.amount),
      currency: sub.currency, frequency: sub.frequency,
      customDays: String(sub.customDays ?? ''), startDate: sub.startDate, color: sub.color ?? COLORS[0],
    });
    setModal(true);
  };

  const submit = () => {
    if (!form.name.trim() || !form.amount) return;
    const sub: Subscription = {
      id: editTarget?.id ?? uid(),
      name: form.name.trim(), emoji: form.emoji || undefined,
      amount: Number(form.amount), currency: form.currency,
      frequency: form.frequency,
      customDays: form.frequency === 'custom' ? Number(form.customDays) || 30 : undefined,
      startDate: form.startDate, color: form.color,
    };
    if (editTarget) {
      saveSubs(subs.map(s => s.id === editTarget.id ? sub : s));
    } else {
      saveSubs([...subs, sub]);
    }
    setModal(false);
  };

  const remove = (id: string) => saveSubs(subs.filter(s => s.id !== id));

  const todayStr = today();

  const totalMonthly = useMemo(() =>
    subs.reduce((acc, s) => acc + getMonthlyAmount(s), 0), [subs]);

  const sorted = useMemo(() =>
    [...subs]
      .map(s => ({ ...s, nextRenewal: getNextRenewal(s), daysUntil: diffDays(todayStr, getNextRenewal(s)) }))
      .sort((a, b) => a.nextRenewal.localeCompare(b.nextRenewal)),
    [subs, todayStr]);

  return (
    <div className="p-6 space-y-6 max-w-4xl mx-auto">

      {/* Header */}
      <div className="flex items-center justify-between flex-wrap gap-3">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl flex items-center justify-center shrink-0"
            style={{ background: 'rgba(99,102,241,0.12)', border: '1px solid rgba(99,102,241,0.25)' }}>
            <CreditCard size={18} style={{ color: 'var(--accent)' }} />
          </div>
          <div>
            <h1 className="text-xl font-bold text-white">Subscriptions</h1>
            <p className="text-gray-500 text-sm">{subs.length} active subscription{subs.length !== 1 ? 's' : ''}</p>
          </div>
        </div>
        <button onClick={openAdd} className={`flex items-center gap-2 px-3 py-2 text-sm rounded-lg ${BTN_PRIMARY}`}>
          <Plus size={16} /> Add
        </button>
      </div>

      {/* Total card */}
      {subs.length > 0 && (
        <div className="p-6 relative overflow-hidden" style={GLASS}>
          <div className="absolute inset-0 pointer-events-none"
            style={{ background: 'radial-gradient(circle at 90% 50%, rgba(239,68,68,0.08) 0%, transparent 60%)' }} />
          <div className="relative flex items-end justify-between gap-4 flex-wrap">
            <div>
              <div className="flex items-center gap-2 mb-3">
                <TrendingDown size={15} className="text-red-400" />
                <p className="text-xs font-semibold uppercase tracking-widest text-gray-500">Monthly cost</p>
              </div>
              <p className="text-5xl font-bold text-white tracking-tight leading-none">
                {totalMonthly.toLocaleString('en-GB', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                <span className="text-2xl text-gray-500 ml-2">€</span>
              </p>
              <p className="text-sm text-gray-600 mt-2">
                ≈ {(totalMonthly * 12).toLocaleString('en-GB', { minimumFractionDigits: 0, maximumFractionDigits: 0 })} € per year
              </p>
            </div>
            <div className="flex gap-1.5 items-end pb-1">
              {sorted.slice(0, 6).map(s => (
                <div key={s.id} title={s.name}
                  className="w-2 rounded-full"
                  style={{
                    backgroundColor: s.color ?? '#6366f1',
                    height: `${Math.max(12, Math.min(40, (getMonthlyAmount(s) / Math.max(totalMonthly, 1)) * 60))}px`,
                  }} />
              ))}
            </div>
          </div>
        </div>
      )}

      {/* List */}
      {subs.length === 0 ? (
        <div className="text-center py-16 rounded-2xl" style={{ border: '2px dashed rgba(255,255,255,0.06)' }}>
          <CreditCard size={32} className="mx-auto text-gray-700 mb-3" />
          <p className="text-gray-500 text-sm">No subscriptions · add Netflix, Spotify...</p>
        </div>
      ) : (
        <div className="space-y-3">
          {sorted.map(sub => {
            const sym    = CURRENCY_SYMBOLS[sub.currency] ?? sub.currency;
            const urgent = sub.daysUntil <= 3;
            const soon   = sub.daysUntil <= 7;
            const color  = sub.color ?? '#6366f1';
            return (
              <div key={sub.id} className="flex items-center gap-4 transition-all group"
                style={{ ...GLASS, padding: '16px 20px' }}>
                <div className="w-1 self-stretch rounded-full shrink-0" style={{ backgroundColor: color }} />
                <div className="w-11 h-11 rounded-xl flex items-center justify-center text-xl shrink-0"
                  style={{ backgroundColor: color + '20' }}>
                  {sub.emoji || '💳'}
                </div>
                <div className="flex-1 min-w-0">
                  <p className="font-semibold text-white">{sub.name}</p>
                  <p className="text-sm text-gray-500 mt-0.5">
                    {sym}{sub.amount} · {FREQ_LABELS[sub.frequency]}
                    {sub.frequency === 'custom' && sub.customDays && ` (${sub.customDays}d)`}
                  </p>
                </div>
                <div className="text-right shrink-0">
                  <div className="flex items-center gap-1.5 justify-end">
                    <RefreshCw size={11} className={urgent ? 'text-red-400' : soon ? 'text-amber-400' : 'text-gray-600'} />
                    <p className={`text-sm font-bold ${urgent ? 'text-red-400' : soon ? 'text-amber-400' : 'text-white'}`}>
                      {sub.daysUntil === 0 ? 'Today' : sub.daysUntil === 1 ? 'Tomorrow' : `In ${sub.daysUntil}d`}
                    </p>
                  </div>
                  <p className="text-xs text-gray-600 mt-0.5">
                    {parseLocal(sub.nextRenewal).toLocaleDateString('en-GB', { day: 'numeric', month: 'short' })}
                  </p>
                  <p className="text-xs text-gray-600">≈ {getMonthlyAmount(sub).toFixed(2)}{sym}/mo</p>
                </div>
                <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity shrink-0">
                  <button onClick={() => openEdit(sub)} className="w-8 h-8 flex items-center justify-center rounded-lg text-gray-600 hover:text-blue-400 hover:bg-white/5 transition-colors">
                    <Pencil size={14} />
                  </button>
                  <button onClick={() => remove(sub.id)} className="w-8 h-8 flex items-center justify-center rounded-lg text-gray-600 hover:text-red-400 hover:bg-red-950/30 transition-colors">
                    <Trash2 size={14} />
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Add/Edit modal */}
      <Modal isOpen={modal} onClose={() => setModal(false)} title={editTarget ? 'Edit subscription' : 'New subscription'}>
        <div className="space-y-4">
          <div className="grid grid-cols-4 gap-3">
            <div>
              <label className={LABEL}>Emoji</label>
              <input className={INPUT} placeholder="🎵" value={form.emoji} onChange={e => setForm(f => ({ ...f, emoji: e.target.value }))} />
            </div>
            <div className="col-span-3">
              <label className={LABEL}>Name *</label>
              <input className={INPUT} placeholder="e.g. Spotify, Netflix..." value={form.name}
                onChange={e => setForm(f => ({ ...f, name: e.target.value }))} autoFocus />
            </div>
          </div>
          <div className="grid grid-cols-3 gap-3">
            <div>
              <label className={LABEL}>Amount *</label>
              <input type="number" step="0.01" className={INPUT} placeholder="9.99" value={form.amount}
                onChange={e => setForm(f => ({ ...f, amount: e.target.value }))} />
            </div>
            <div>
              <label className={LABEL}>Currency</label>
              <select className={INPUT} value={form.currency} onChange={e => setForm(f => ({ ...f, currency: e.target.value as typeof CURRENCIES[number] }))}>
                {CURRENCIES.map(c => <option key={c} value={c}>{c}</option>)}
              </select>
            </div>
            <div>
              <label className={LABEL}>Frequency</label>
              <select className={INPUT} value={form.frequency} onChange={e => setForm(f => ({ ...f, frequency: e.target.value as SubFrequency }))}>
                {(Object.entries(FREQ_LABELS) as [SubFrequency, string][]).map(([k, v]) => <option key={k} value={k}>{v}</option>)}
              </select>
            </div>
          </div>
          {form.frequency === 'custom' && (
            <div>
              <label className={LABEL}>Every X days</label>
              <input type="number" className={INPUT} placeholder="30" value={form.customDays}
                onChange={e => setForm(f => ({ ...f, customDays: e.target.value }))} />
            </div>
          )}
          <div>
            <label className={LABEL}>Reference date (first payment)</label>
            <input type="date" className={INPUT} value={form.startDate}
              onChange={e => setForm(f => ({ ...f, startDate: e.target.value }))} />
          </div>
          <div>
            <label className={LABEL}>Color</label>
            <div className="flex gap-2 flex-wrap">
              {COLORS.map(c => (
                <button key={c} type="button" onClick={() => setForm(f => ({ ...f, color: c }))}
                  className="w-8 h-8 rounded-full transition-all flex items-center justify-center hover:scale-110"
                  style={{ backgroundColor: c, outline: form.color === c ? `3px solid ${c}` : 'none', outlineOffset: '3px' }}>
                  {form.color === c && <span className="w-3 h-3 rounded-full bg-white/70 block" />}
                </button>
              ))}
            </div>
          </div>
          <div className="flex gap-2 justify-end pt-1">
            <button onClick={() => setModal(false)} className={BTN_GHOST}>Cancel</button>
            <button onClick={submit} disabled={!form.name.trim() || !form.amount} className={`${BTN_PRIMARY} disabled:opacity-40`}>
              {editTarget ? 'Save' : 'Add'}
            </button>
          </div>
        </div>
      </Modal>
    </div>
  );
}
