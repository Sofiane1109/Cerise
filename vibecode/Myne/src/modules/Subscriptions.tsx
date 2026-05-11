import { useState, useMemo } from 'react';
import type { Subscription, SubFrequency, CalendarEvent } from '../types';
import { getItem, setItem } from '../utils/storage';
import { today, uid, parseLocal, toDateStr, addDays, addMonths, addYears, diffDays } from '../utils/helpers';
import { Modal, INPUT, LABEL, BTN_PRIMARY, BTN_GHOST } from '../components/ui';
import { CreditCard, Plus, Trash2, Pencil, RefreshCw, TrendingDown } from 'lucide-react';

const FREQ_LABELS: Record<SubFrequency, string> = {
  monthly:    'Mensuel',
  every4weeks:'Toutes les 4 semaines',
  yearly:     'Annuel',
  custom:     'Personnalisé',
};

const CURRENCIES = ['EUR', 'USD', 'GBP'] as const;
const CURRENCY_SYMBOLS: Record<string, string> = { EUR: '€', USD: '$', GBP: '£' };

const COLORS = ['#6366f1','#3b82f6','#8b5cf6','#22c55e','#f59e0b','#ef4444','#06b6d4','#ec4899','#f97316'];

function getNextRenewal(sub: Subscription): string {
  const todayStr = today();
  let next = sub.startDate;
  let iterations = 0;
  while (next <= todayStr && iterations < 1000) {
    iterations++;
    if (sub.frequency === 'monthly')    next = addMonths(next, 1);
    else if (sub.frequency === 'every4weeks') next = addDays(next, 28);
    else if (sub.frequency === 'yearly')next = addYears(next, 1);
    else next = addDays(next, sub.customDays ?? 30);
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
  const subEvents: CalendarEvent[] = subs.map(sub => {
    const next = getNextRenewal(sub);
    return {
      id: `sub-${sub.id}`,
      subscriptionId: sub.id,
      title: `💳 ${sub.name}`,
      date: next,
      color: sub.color ?? '#6366f1',
      reminder: true,
    };
  });
  setItem('myne:events', [...other, ...subEvents]);
}

const EMPTY_FORM = {
  name: '', emoji: '', amount: '', currency: 'EUR' as typeof CURRENCIES[number],
  frequency: 'monthly' as SubFrequency, customDays: '', startDate: today(), color: COLORS[0],
};

export default function Subscriptions() {
  const [subs, setSubs] = useState<Subscription[]>(() => getItem('myne:subscriptions', []));
  const [modal, setModal] = useState(false);
  const [editTarget, setEditTarget] = useState<Subscription | null>(null);
  const [form, setForm] = useState({ ...EMPTY_FORM });

  const saveSubs = (list: Subscription[]) => {
    setSubs(list);
    setItem('myne:subscriptions', list);
    syncSubscriptionEvents(list);
  };

  const openAdd = () => {
    setEditTarget(null);
    setForm({ ...EMPTY_FORM });
    setModal(true);
  };

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
    [...subs].map(s => ({ ...s, nextRenewal: getNextRenewal(s), daysUntil: diffDays(todayStr, getNextRenewal(s)) }))
      .sort((a, b) => a.nextRenewal.localeCompare(b.nextRenewal)), [subs, todayStr]);

  return (
    <div className="p-6 space-y-6 max-w-4xl mx-auto">
      {/* Header */}
      <div className="flex items-center justify-between flex-wrap gap-3">
        <div>
          <h1 className="text-xl font-bold text-white flex items-center gap-2">
            <CreditCard size={22} style={{ color: 'var(--accent)' }} /> Abonnements
          </h1>
          <p className="text-gray-500 text-sm mt-0.5">{subs.length} abonnement{subs.length !== 1 ? 's' : ''}</p>
        </div>
        <button onClick={openAdd} className={`flex items-center gap-2 px-3 py-2 text-sm rounded-lg ${BTN_PRIMARY}`}>
          <Plus size={16} /> Ajouter
        </button>
      </div>

      {/* Total monthly cost */}
      {subs.length > 0 && (
        <div className="bg-gray-900 border border-gray-800 rounded-xl p-6">
          <div className="flex items-center gap-3 mb-1">
            <TrendingDown size={20} className="text-red-400" />
            <p className="text-sm text-gray-400">Coût mensuel total</p>
          </div>
          <p className="text-4xl font-bold text-white">
            {totalMonthly.toLocaleString('fr-FR', { minimumFractionDigits: 0, maximumFractionDigits: 0 })}
            <span className="text-2xl text-gray-400 ml-1">€</span>
          </p>
          <p className="text-sm text-gray-500 mt-1">
            ≈ {(totalMonthly * 12).toLocaleString('fr-FR', { minimumFractionDigits: 0, maximumFractionDigits: 0 })} € / an
          </p>
        </div>
      )}

      {/* List */}
      {subs.length === 0 ? (
        <div className="text-center py-16 border-2 border-dashed border-gray-800 rounded-xl">
          <CreditCard size={32} className="mx-auto text-gray-700 mb-3" />
          <p className="text-gray-500 text-sm">Aucun abonnement · ajoutez Netflix, Spotify...</p>
        </div>
      ) : (
        <div className="space-y-3">
          {sorted.map(sub => {
            const sym = CURRENCY_SYMBOLS[sub.currency] ?? sub.currency;
            const urgent = sub.daysUntil <= 3;
            const soon = sub.daysUntil <= 7;
            return (
              <div key={sub.id} className="bg-gray-900 border border-gray-800 rounded-xl p-4 flex items-center gap-4 hover:border-gray-700 transition-colors">
                {/* Color + emoji */}
                <div className="w-11 h-11 rounded-xl flex items-center justify-center text-xl shrink-0"
                  style={{ backgroundColor: (sub.color ?? '#6366f1') + '30' }}>
                  {sub.emoji || '💳'}
                </div>
                {/* Info */}
                <div className="flex-1 min-w-0">
                  <p className="font-semibold text-white">{sub.name}</p>
                  <p className="text-sm text-gray-500">
                    {sym}{sub.amount} · {FREQ_LABELS[sub.frequency]}
                    {sub.frequency === 'custom' && sub.customDays && ` (${sub.customDays}j)`}
                  </p>
                </div>
                {/* Next renewal */}
                <div className="text-right shrink-0">
                  <div className="flex items-center gap-1.5 justify-end">
                    <RefreshCw size={11} className={urgent ? 'text-red-400' : soon ? 'text-amber-400' : 'text-gray-600'} />
                    <p className={`text-sm font-semibold ${urgent ? 'text-red-400' : soon ? 'text-amber-400' : 'text-gray-300'}`}>
                      {sub.daysUntil === 0 ? "Aujourd'hui" : sub.daysUntil === 1 ? 'Demain' : `Dans ${sub.daysUntil}j`}
                    </p>
                  </div>
                  <p className="text-xs text-gray-600">
                    {parseLocal(sub.nextRenewal).toLocaleDateString('fr-FR', { day: 'numeric', month: 'short' })}
                  </p>
                  <p className="text-xs text-gray-600 mt-0.5">
                    ≈ {getMonthlyAmount(sub).toFixed(0)}{sym}/mois
                  </p>
                </div>
                {/* Actions */}
                <div className="flex items-center gap-1 shrink-0">
                  <button onClick={() => openEdit(sub)} className="w-8 h-8 flex items-center justify-center rounded-lg text-gray-600 hover:text-blue-400 hover:bg-gray-800 transition-colors">
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
      <Modal isOpen={modal} onClose={() => setModal(false)} title={editTarget ? 'Modifier l\'abonnement' : 'Nouvel abonnement'}>
        <div className="space-y-4">
          <div className="grid grid-cols-4 gap-3">
            <div>
              <label className={LABEL}>Emoji</label>
              <input className={INPUT} placeholder="🎵" value={form.emoji} onChange={e => setForm(f => ({ ...f, emoji: e.target.value }))} />
            </div>
            <div className="col-span-3">
              <label className={LABEL}>Nom *</label>
              <input className={INPUT} placeholder="ex: Spotify, Netflix..." value={form.name} onChange={e => setForm(f => ({ ...f, name: e.target.value }))} autoFocus />
            </div>
          </div>
          <div className="grid grid-cols-3 gap-3">
            <div>
              <label className={LABEL}>Montant *</label>
              <input type="number" step="0.01" className={INPUT} placeholder="9.99" value={form.amount} onChange={e => setForm(f => ({ ...f, amount: e.target.value }))} />
            </div>
            <div>
              <label className={LABEL}>Devise</label>
              <select className={INPUT} value={form.currency} onChange={e => setForm(f => ({ ...f, currency: e.target.value as typeof CURRENCIES[number] }))}>
                {CURRENCIES.map(c => <option key={c} value={c}>{c}</option>)}
              </select>
            </div>
            <div>
              <label className={LABEL}>Fréquence</label>
              <select className={INPUT} value={form.frequency} onChange={e => setForm(f => ({ ...f, frequency: e.target.value as SubFrequency }))}>
                {(Object.entries(FREQ_LABELS) as [SubFrequency, string][]).map(([k, v]) => <option key={k} value={k}>{v}</option>)}
              </select>
            </div>
          </div>
          {form.frequency === 'custom' && (
            <div>
              <label className={LABEL}>Tous les X jours</label>
              <input type="number" className={INPUT} placeholder="30" value={form.customDays} onChange={e => setForm(f => ({ ...f, customDays: e.target.value }))} />
            </div>
          )}
          <div>
            <label className={LABEL}>Date de référence (premier paiement)</label>
            <input type="date" className={INPUT} value={form.startDate} onChange={e => setForm(f => ({ ...f, startDate: e.target.value }))} />
          </div>
          <div>
            <label className={LABEL}>Couleur</label>
            <div className="flex gap-2 flex-wrap">
              {COLORS.map(c => (
                <button key={c} type="button" onClick={() => setForm(f => ({ ...f, color: c }))}
                  className="w-8 h-8 rounded-full transition-all flex items-center justify-center"
                  style={{ backgroundColor: c }}>
                  {form.color === c && <span className="w-3 h-3 rounded-full bg-white/70 block" />}
                </button>
              ))}
            </div>
          </div>
          <div className="flex gap-2 justify-end pt-1">
            <button onClick={() => setModal(false)} className={BTN_GHOST}>Annuler</button>
            <button onClick={submit} disabled={!form.name.trim() || !form.amount} className={`${BTN_PRIMARY} disabled:opacity-40`}>
              {editTarget ? 'Sauvegarder' : 'Ajouter'}
            </button>
          </div>
        </div>
      </Modal>
    </div>
  );
}
