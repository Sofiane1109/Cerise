import { useState, useMemo } from 'react';
import type { BudgetEntry, BudgetGoal, ExpenseCategory, AccountId, AccountBalances } from '../types';
import { getItem, setItem } from '../utils/storage';
import { today, uid, getLast6Months, formatMonthLabel } from '../utils/helpers';
import { ProgressBar, Modal, INPUT, LABEL, BTN_PRIMARY, BTN_GHOST, TOOLTIP_STYLE } from '../components/ui';
import { Plus, Trash2, TrendingUp, TrendingDown, Wallet, Target, ChevronLeft, ChevronRight, Pencil } from 'lucide-react';
import { PieChart, Pie, Cell, BarChart, Bar, XAxis, YAxis, ResponsiveContainer, Tooltip, Legend } from 'recharts';

// ── Constants ─────────────────────────────────────────────────────────────────
const CATEGORIES: ExpenseCategory[] = ['food', 'housing', 'transport', 'leisure', 'health', 'shopping', 'services', 'other'];
const CAT_COLORS: Record<ExpenseCategory, string> = {
  food: '#f59e0b', housing: '#6366f1', transport: '#22c55e', leisure: '#ec4899',
  health: '#06b6d4', shopping: '#f97316', services: '#8b5cf6', other: '#6b7280',
};
const CAT_LABELS: Record<ExpenseCategory, string> = {
  food: 'Alimentation', housing: 'Logement', transport: 'Transport', leisure: 'Loisirs',
  health: 'Santé', shopping: 'Shopping', services: 'Services', other: 'Autre',
};
const ACCOUNTS: { id: AccountId; label: string }[] = [
  { id: 'cc', label: 'Compte courant' },
  { id: 'ep', label: 'Épargne' },
];

// ── Time filter helpers ───────────────────────────────────────────────────────
type TimeFilter = 'month' | 'quarter' | 'year' | 'all';

function filterByPeriod(entries: BudgetEntry[], ref: Date, tf: TimeFilter): BudgetEntry[] {
  if (tf === 'all') return entries;
  const y = ref.getFullYear();
  const m = ref.getMonth() + 1;
  if (tf === 'month') {
    const prefix = `${y}-${String(m).padStart(2, '0')}`;
    return entries.filter(e => e.date.startsWith(prefix));
  }
  if (tf === 'quarter') {
    const q = Math.floor((m - 1) / 3);
    const s = q * 3 + 1, en = s + 2;
    return entries.filter(e => {
      const [ey, em] = e.date.split('-').map(Number);
      return ey === y && em >= s && em <= en;
    });
  }
  // year
  return entries.filter(e => e.date.startsWith(`${y}-`));
}

function periodLabel(ref: Date, tf: TimeFilter): string {
  const y = ref.getFullYear();
  const m = ref.getMonth() + 1;
  if (tf === 'month') return new Date(y, m - 1).toLocaleDateString('fr-FR', { month: 'long', year: 'numeric' });
  if (tf === 'quarter') return `T${Math.floor((m - 1) / 3) + 1} ${y}`;
  if (tf === 'year') return String(y);
  return 'Tout';
}

function shiftRef(ref: Date, tf: TimeFilter, dir: 1 | -1): Date {
  const d = new Date(ref);
  if (tf === 'month') d.setMonth(d.getMonth() + dir);
  else if (tf === 'quarter') d.setMonth(d.getMonth() + dir * 3);
  else if (tf === 'year') d.setFullYear(d.getFullYear() + dir);
  return d;
}

function monthKey(ref: Date): string {
  return `${ref.getFullYear()}-${String(ref.getMonth() + 1).padStart(2, '0')}`;
}

// ── Component ─────────────────────────────────────────────────────────────────
export default function Budget() {
  const [entries, setEntries] = useState<BudgetEntry[]>(() =>
    getItem<any[]>('myne:budget:entries', []).map((e: any) => ({ ...e, accountId: e.accountId ?? 'cc' }))
  );
  const [goals, setGoals] = useState<BudgetGoal[]>(() =>
    getItem<any[]>('myne:budget:goals', []).map((g: any) => ({ ...g, accountId: g.accountId ?? 'cc' }))
  );
  const [balances, setBalances] = useState<AccountBalances>(() =>
    getItem('myne:budget:balances', { cc: 0, ep: 0 })
  );

  const [account, setAccount] = useState<AccountId>('cc');
  const [tf, setTf] = useState<TimeFilter>('month');
  const [ref, setRef] = useState(new Date());

  const [modal, setModal] = useState(false);
  const [goalModal, setGoalModal] = useState(false);
  const [balanceModal, setBalanceModal] = useState(false);
  const [goalAmount, setGoalAmount] = useState('');
  const [newBalance, setNewBalance] = useState('');
  const [form, setForm] = useState({
    type: 'expense' as 'expense' | 'income',
    amount: '',
    category: 'food' as ExpenseCategory,
    description: '',
    date: today(),
  });

  const saveEntries = (list: BudgetEntry[]) => { setEntries(list); setItem('myne:budget:entries', list); };
  const saveGoals = (list: BudgetGoal[]) => { setGoals(list); setItem('myne:budget:goals', list); };
  const saveBalances = (b: AccountBalances) => { setBalances(b); setItem('myne:budget:balances', b); };

  const addEntry = () => {
    if (!form.amount || Number(form.amount) <= 0) return;
    const e: BudgetEntry = {
      id: uid(), accountId: account,
      type: form.type, amount: Number(form.amount),
      category: form.type === 'income' ? 'income' : form.category,
      description: form.description.trim(), date: form.date,
    };
    saveEntries([e, ...entries]);
    setForm(f => ({ ...f, amount: '', description: '' }));
    setModal(false);
  };

  const saveGoal = () => {
    const amount = Number(goalAmount);
    if (!amount || amount <= 0) return;
    const mk = tf === 'month' ? monthKey(ref) : monthKey(new Date());
    saveGoals([...goals.filter(g => !(g.month === mk && g.accountId === account)), { month: mk, accountId: account, savingsGoal: amount }]);
    setGoalModal(false);
    setGoalAmount('');
  };

  // Filtered data for current account + period
  const accountEntries = useMemo(() => entries.filter(e => e.accountId === account), [entries, account]);
  const periodEntries = useMemo(() => filterByPeriod(accountEntries, ref, tf), [accountEntries, ref, tf]);

  const income   = useMemo(() => periodEntries.filter(e => e.type === 'income').reduce((s, e) => s + e.amount, 0), [periodEntries]);
  const expenses = useMemo(() => periodEntries.filter(e => e.type === 'expense').reduce((s, e) => s + e.amount, 0), [periodEntries]);
  const net = income - expenses;

  // Displayed balance = base + all-time transactions for this account
  const allIncome   = useMemo(() => accountEntries.filter(e => e.type === 'income').reduce((s, e) => s + e.amount, 0), [accountEntries]);
  const allExpenses = useMemo(() => accountEntries.filter(e => e.type === 'expense').reduce((s, e) => s + e.amount, 0), [accountEntries]);
  const displayedBalance = balances[account] + allIncome - allExpenses;

  const saveBalance = () => {
    const val = Number(newBalance);
    if (isNaN(val)) return;
    // Recalibrate base so that base + allIncome - allExpenses = val
    saveBalances({ ...balances, [account]: val - allIncome + allExpenses });
    setBalanceModal(false);
  };

  const goalMonthKey = tf === 'month' ? monthKey(ref) : monthKey(new Date());
  const currentGoal = goals.find(g => g.month === goalMonthKey && g.accountId === account);
  const savingsPct  = currentGoal && currentGoal.savingsGoal > 0 ? Math.min(100, (net / currentGoal.savingsGoal) * 100) : 0;

  const catData = useMemo(() => {
    const map: Partial<Record<ExpenseCategory, number>> = {};
    periodEntries.filter(e => e.type === 'expense').forEach(e => {
      const c = e.category as ExpenseCategory;
      map[c] = (map[c] ?? 0) + e.amount;
    });
    return CATEGORIES.filter(c => (map[c] ?? 0) > 0).map(c => ({ name: CAT_LABELS[c], value: map[c]!, color: CAT_COLORS[c] }));
  }, [periodEntries]);

  const last6 = getLast6Months();
  const barData = useMemo(() => last6.map(m => {
    const mes = accountEntries.filter(e => e.date.startsWith(m));
    const inc = mes.filter(e => e.type === 'income').reduce((s, e) => s + e.amount, 0);
    const exp = mes.filter(e => e.type === 'expense').reduce((s, e) => s + e.amount, 0);
    return { month: formatMonthLabel(m), income: inc, expenses: exp, épargne: inc - exp };
  }), [accountEntries, last6]);

  const sorted = useMemo(() => [...periodEntries].sort((a, b) => b.date.localeCompare(a.date)), [periodEntries]);

  const accountLabel = ACCOUNTS.find(a => a.id === account)!.label;
  const TF_OPTIONS: { value: TimeFilter; label: string }[] = [
    { value: 'month', label: 'Mois' }, { value: 'quarter', label: 'Trimestre' },
    { value: 'year', label: 'Année' }, { value: 'all', label: 'Tout' },
  ];

  return (
    <div className="p-6 space-y-6 max-w-5xl mx-auto">
      {/* Header */}
      <div className="flex items-center justify-between flex-wrap gap-3">
        <h1 className="text-xl font-bold text-white">Budget</h1>
        <div className="flex gap-2">
          <button onClick={() => { setGoalAmount(String(currentGoal?.savingsGoal ?? '')); setGoalModal(true); }} className="flex items-center gap-2 px-3 py-2 bg-gray-800 hover:bg-gray-700 text-gray-300 text-sm rounded-lg transition-colors">
            <Target size={16} /> Objectif
          </button>
          <button onClick={() => setModal(true)} className="flex items-center gap-2 px-3 py-2 bg-indigo-600 hover:bg-indigo-700 text-white text-sm rounded-lg transition-colors">
            <Plus size={16} /> Ajouter
          </button>
        </div>
      </div>

      {/* Account tabs */}
      <div className="flex gap-2">
        {ACCOUNTS.map(acc => (
          <button
            key={acc.id}
            onClick={() => setAccount(acc.id)}
            className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${account === acc.id ? 'bg-indigo-600 text-white' : 'bg-gray-800 text-gray-400 hover:text-white'}`}
          >
            {acc.label}
          </button>
        ))}
      </div>

      {/* Current balance */}
      <div className="bg-gray-900 border border-gray-800 rounded-xl p-5 flex items-center justify-between gap-4">
        <div>
          <p className="text-xs text-gray-500 uppercase tracking-wider mb-1">Solde actuel · {accountLabel}</p>
          <p className={`text-3xl font-bold ${displayedBalance >= 0 ? 'text-white' : 'text-red-400'}`}>
            {displayedBalance >= 0 ? '' : '-'}€{Math.abs(displayedBalance).toLocaleString('fr-FR', { minimumFractionDigits: 2 })}
          </p>
        </div>
        <button
          onClick={() => { setNewBalance(String(displayedBalance)); setBalanceModal(true); }}
          className="flex items-center gap-2 px-3 py-2 bg-gray-800 hover:bg-gray-700 text-gray-300 text-sm rounded-lg transition-colors shrink-0"
        >
          <Pencil size={14} /> Modifier le solde
        </button>
      </div>

      {/* Time filter + navigator */}
      <div className="flex items-center justify-between flex-wrap gap-3">
        <div className="flex gap-1">
          {TF_OPTIONS.map(opt => (
            <button
              key={opt.value}
              onClick={() => { setTf(opt.value); setRef(new Date()); }}
              className={`px-3 py-1.5 text-xs font-medium rounded-lg transition-colors ${tf === opt.value ? 'bg-indigo-600 text-white' : 'bg-gray-800 text-gray-400 hover:text-white'}`}
            >
              {opt.label}
            </button>
          ))}
        </div>
        {tf !== 'all' && (
          <div className="flex items-center gap-2">
            <button onClick={() => setRef(shiftRef(ref, tf, -1))} className="w-7 h-7 flex items-center justify-center rounded-lg bg-gray-800 hover:bg-gray-700 text-gray-300 transition-colors">
              <ChevronLeft size={16} />
            </button>
            <span className="text-sm font-medium text-white min-w-[150px] text-center capitalize">{periodLabel(ref, tf)}</span>
            <button onClick={() => setRef(shiftRef(ref, tf, 1))} className="w-7 h-7 flex items-center justify-center rounded-lg bg-gray-800 hover:bg-gray-700 text-gray-300 transition-colors">
              <ChevronRight size={16} />
            </button>
            <button onClick={() => setRef(new Date())} className="px-2.5 py-1 text-xs bg-gray-800 hover:bg-gray-700 text-gray-400 rounded-lg transition-colors">
              Actuel
            </button>
          </div>
        )}
      </div>

      {/* Summary cards */}
      <div className="grid grid-cols-2 lg:grid-cols-3 gap-4">
        {[
          { label: 'Revenus',  value: `€${income.toFixed(2)}`,   icon: <TrendingUp size={18} className="text-green-400" />,  bg: 'bg-green-500/10',  text: 'text-green-400' },
          { label: 'Dépenses', value: `€${expenses.toFixed(2)}`, icon: <TrendingDown size={18} className="text-red-400" />, bg: 'bg-red-500/10',    text: 'text-red-400' },
          { label: 'Net',      value: `${net >= 0 ? '+' : ''}€${net.toFixed(2)}`, icon: <Wallet size={18} className={net >= 0 ? 'text-indigo-400' : 'text-red-400'} />, bg: net >= 0 ? 'bg-indigo-500/10' : 'bg-red-500/10', text: net >= 0 ? 'text-indigo-400' : 'text-red-400' },
        ].map(({ label, value, icon, bg, text }) => (
          <div key={label} className={`${bg} border border-gray-800 rounded-xl p-4`}>
            <div className="flex items-center gap-2 mb-2">{icon}<span className="text-xs text-gray-500">{label}</span></div>
            <p className={`text-xl font-bold ${text}`}>{value}</p>
          </div>
        ))}
      </div>

      {/* Savings goal */}
      {currentGoal && (
        <div className="bg-gray-900 border border-gray-800 rounded-xl p-5">
          <div className="flex items-center justify-between mb-3">
            <div className="flex items-center gap-2">
              <Target size={16} className="text-indigo-400" />
              <h2 className="font-semibold text-white">Objectif épargne</h2>
            </div>
            <span className={`text-sm font-medium ${net >= currentGoal.savingsGoal ? 'text-green-400' : 'text-gray-400'}`}>
              €{net.toFixed(0)} / €{currentGoal.savingsGoal}
              {net >= currentGoal.savingsGoal && ' 🎉'}
            </span>
          </div>
          <ProgressBar value={savingsPct} color={net >= currentGoal.savingsGoal ? 'bg-green-500' : 'bg-indigo-500'} height="h-3" />
          <p className="text-xs text-gray-500 mt-2">{Math.round(Math.max(0, savingsPct))}% atteint</p>
        </div>
      )}

      {/* Charts */}
      {catData.length > 0 && (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <div className="bg-gray-900 border border-gray-800 rounded-xl p-5">
            <h2 className="font-semibold text-white mb-4">Dépenses par catégorie</h2>
            <ResponsiveContainer width="100%" height={220}>
              <PieChart>
                <Pie data={catData} cx="50%" cy="50%" innerRadius={55} outerRadius={90} paddingAngle={2} dataKey="value">
                  {catData.map((e, i) => <Cell key={i} fill={e.color} />)}
                </Pie>
                <Tooltip contentStyle={TOOLTIP_STYLE} formatter={(v: number) => [`€${v.toFixed(2)}`, '']} />
                <Legend formatter={v => <span style={{ color: '#9ca3af', fontSize: '11px' }}>{v}</span>} />
              </PieChart>
            </ResponsiveContainer>
          </div>
          <div className="bg-gray-900 border border-gray-800 rounded-xl p-5">
            <h2 className="font-semibold text-white mb-4">6 derniers mois — {accountLabel}</h2>
            <ResponsiveContainer width="100%" height={220}>
              <BarChart data={barData} barSize={12}>
                <XAxis dataKey="month" tick={{ fill: '#6b7280', fontSize: 10 }} axisLine={false} tickLine={false} />
                <YAxis tick={{ fill: '#6b7280', fontSize: 10 }} axisLine={false} tickLine={false} width={40} />
                <Tooltip contentStyle={TOOLTIP_STYLE} formatter={(v: number) => [`€${v.toFixed(2)}`, '']} cursor={{ fill: 'rgba(255,255,255,0.04)' }} />
                <Legend formatter={v => <span style={{ color: '#9ca3af', fontSize: '11px' }}>{v}</span>} />
                <Bar dataKey="income"   name="Revenus"   fill="#22c55e" radius={[3, 3, 0, 0]} />
                <Bar dataKey="expenses" name="Dépenses"  fill="#ef4444" radius={[3, 3, 0, 0]} />
                <Bar dataKey="épargne"  name="Net"       fill="#6366f1" radius={[3, 3, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>
      )}

      {/* Transactions */}
      <div className="bg-gray-900 border border-gray-800 rounded-xl p-5">
        <h2 className="font-semibold text-white mb-4">
          Transactions{' '}
          {sorted.length > 0 && <span className="text-gray-500 font-normal text-sm">({sorted.length})</span>}
        </h2>
        {sorted.length === 0 ? (
          <div className="text-center py-10 text-gray-500">
            <Wallet size={36} className="mx-auto mb-3 opacity-30" />
            <p>Aucune transaction</p>
          </div>
        ) : (
          <div className="space-y-2">
            {sorted.map(e => {
              const cat = e.category as ExpenseCategory;
              const color = e.type === 'income' ? '#22c55e' : CAT_COLORS[cat] ?? '#6b7280';
              return (
                <div key={e.id} className="flex items-center gap-3 p-3 rounded-lg border border-gray-800 hover:border-gray-700 transition-colors">
                  <div className="w-1.5 h-10 rounded-full shrink-0" style={{ backgroundColor: color }} />
                  <div className="flex-1 min-w-0">
                    <p className="text-sm text-white font-medium">{e.description || (e.type === 'income' ? 'Revenu' : CAT_LABELS[cat])}</p>
                    <p className="text-xs text-gray-500">
                      {new Date(e.date + 'T00:00').toLocaleDateString('fr-FR', { day: 'numeric', month: 'short' })}
                      {' · '}
                      {e.type === 'income' ? 'Revenu' : CAT_LABELS[cat]}
                    </p>
                  </div>
                  <span className={`text-sm font-bold shrink-0 ${e.type === 'income' ? 'text-green-400' : 'text-red-400'}`}>
                    {e.type === 'income' ? '+' : '-'}€{e.amount.toFixed(2)}
                  </span>
                  <button onClick={() => saveEntries(entries.filter(x => x.id !== e.id))} className="shrink-0 w-7 h-7 flex items-center justify-center rounded-lg text-gray-600 hover:text-red-400 hover:bg-red-950/30 transition-colors">
                    <Trash2 size={14} />
                  </button>
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* Add entry modal */}
      <Modal isOpen={modal} onClose={() => setModal(false)} title={`Ajouter — ${accountLabel}`}>
        <div className="space-y-4">
          <div>
            <label className={LABEL}>Type</label>
            <div className="flex gap-2">
              {(['expense', 'income'] as const).map(t => (
                <button
                  key={t}
                  onClick={() => setForm(f => ({ ...f, type: t }))}
                  className={`flex-1 py-2 rounded-lg text-sm font-medium transition-colors border capitalize ${
                    form.type === t
                      ? t === 'income' ? 'border-green-500 bg-green-500/10 text-green-400' : 'border-red-500 bg-red-500/10 text-red-400'
                      : 'border-gray-700 bg-gray-800 text-gray-400 hover:text-white'
                  }`}
                >
                  {t === 'income' ? 'Revenu' : 'Dépense'}
                </button>
              ))}
            </div>
          </div>
          <div>
            <label className={LABEL}>Montant (€) *</label>
            <input type="number" step="0.01" className={INPUT} placeholder="0.00" value={form.amount} onChange={e => setForm(f => ({ ...f, amount: e.target.value }))} autoFocus />
          </div>
          {form.type === 'expense' && (
            <div>
              <label className={LABEL}>Catégorie</label>
              <select className={INPUT} value={form.category} onChange={e => setForm(f => ({ ...f, category: e.target.value as ExpenseCategory }))}>
                {CATEGORIES.map(c => <option key={c} value={c}>{CAT_LABELS[c]}</option>)}
              </select>
            </div>
          )}
          <div>
            <label className={LABEL}>Description (optionnel)</label>
            <input className={INPUT} placeholder="ex: Courses, Loyer..." value={form.description} onChange={e => setForm(f => ({ ...f, description: e.target.value }))} />
          </div>
          <div>
            <label className={LABEL}>Date</label>
            <input type="date" className={INPUT} value={form.date} onChange={e => setForm(f => ({ ...f, date: e.target.value }))} />
          </div>
          <div className="flex gap-2 justify-end pt-1">
            <button onClick={() => setModal(false)} className={BTN_GHOST}>Annuler</button>
            <button onClick={addEntry} className={BTN_PRIMARY}>Ajouter</button>
          </div>
        </div>
      </Modal>

      {/* Savings goal modal */}
      <Modal isOpen={goalModal} onClose={() => setGoalModal(false)} title={`Objectif — ${accountLabel} · ${periodLabel(ref, tf)}`}>
        <div className="space-y-4">
          <div>
            <label className={LABEL}>Objectif épargne (€)</label>
            <input type="number" step="10" className={INPUT} placeholder="500" value={goalAmount} onChange={e => setGoalAmount(e.target.value)} autoFocus />
          </div>
          <div className="flex gap-2 justify-end pt-1">
            <button onClick={() => setGoalModal(false)} className={BTN_GHOST}>Annuler</button>
            <button onClick={saveGoal} className={BTN_PRIMARY}>Enregistrer</button>
          </div>
        </div>
      </Modal>

      {/* Modify balance modal */}
      <Modal isOpen={balanceModal} onClose={() => setBalanceModal(false)} title={`Modifier le solde — ${accountLabel}`}>
        <div className="space-y-4">
          <div>
            <label className={LABEL}>Nouveau solde (€)</label>
            <input type="number" step="0.01" className={INPUT} placeholder="0.00" value={newBalance} onChange={e => setNewBalance(e.target.value)} autoFocus />
          </div>
          <p className="text-xs text-gray-500">Ce montant reflète le solde réel de votre compte.</p>
          <div className="flex gap-2 justify-end pt-1">
            <button onClick={() => setBalanceModal(false)} className={BTN_GHOST}>Annuler</button>
            <button onClick={saveBalance} className={BTN_PRIMARY}>Enregistrer</button>
          </div>
        </div>
      </Modal>
    </div>
  );
}
