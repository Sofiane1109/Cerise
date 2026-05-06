import { useState, useMemo } from 'react';
import type { BudgetEntry, BudgetGoal, ExpenseCategory } from '../types';
import { getItem, setItem } from '../utils/storage';
import { today, uid, currentMonth, getLast6Months, formatMonthLabel } from '../utils/helpers';
import { ProgressBar, Modal, INPUT, LABEL, BTN_PRIMARY, BTN_GHOST, TOOLTIP_STYLE } from '../components/ui';
import { Plus, Trash2, TrendingUp, TrendingDown, Wallet, Target, ChevronLeft, ChevronRight } from 'lucide-react';
import { PieChart, Pie, Cell, BarChart, Bar, XAxis, YAxis, ResponsiveContainer, Tooltip, Legend } from 'recharts';

const CATEGORIES: ExpenseCategory[] = ['food', 'housing', 'transport', 'leisure', 'health', 'shopping', 'services', 'other'];
const CAT_COLORS: Record<ExpenseCategory, string> = {
  food:      '#f59e0b',
  housing:   '#6366f1',
  transport: '#22c55e',
  leisure:   '#ec4899',
  health:    '#06b6d4',
  shopping:  '#f97316',
  services:  '#8b5cf6',
  other:     '#6b7280',
};
const CAT_LABELS: Record<ExpenseCategory, string> = {
  food: 'Food', housing: 'Housing', transport: 'Transport', leisure: 'Leisure',
  health: 'Health', shopping: 'Shopping', services: 'Services', other: 'Other',
};

function prevMonth(m: string): string {
  const [y, mo] = m.split('-').map(Number);
  const d = new Date(y, mo - 2, 1);
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`;
}
function nextMonth(m: string): string {
  const [y, mo] = m.split('-').map(Number);
  const d = new Date(y, mo, 1);
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`;
}
function displayMonth(m: string): string {
  const [y, mo] = m.split('-').map(Number);
  return new Date(y, mo - 1).toLocaleDateString('en-US', { month: 'long', year: 'numeric' });
}

export default function Budget() {
  const [entries, setEntries] = useState<BudgetEntry[]>(() => getItem('myne:budget:entries', []));
  const [goals,   setGoals]   = useState<BudgetGoal[]>(() => getItem('myne:budget:goals', []));
  const [month,   setMonth]   = useState(currentMonth());
  const [modal,   setModal]   = useState(false);
  const [goalModal, setGoalModal] = useState(false);
  const [goalAmount, setGoalAmount] = useState('');
  const [form, setForm] = useState({
    type: 'expense' as 'expense' | 'income',
    amount: '',
    category: 'food' as ExpenseCategory,
    description: '',
    date: today(),
  });

  const saveEntries = (list: BudgetEntry[]) => { setEntries(list); setItem('myne:budget:entries', list); };
  const saveGoals   = (list: BudgetGoal[])   => { setGoals(list);   setItem('myne:budget:goals',   list); };

  const addEntry = () => {
    if (!form.amount || Number(form.amount) <= 0) return;
    const e: BudgetEntry = {
      id: uid(),
      type: form.type,
      amount: Number(form.amount),
      category: form.type === 'income' ? 'income' : form.category,
      description: form.description.trim(),
      date: form.date,
    };
    saveEntries([e, ...entries]);
    setForm(f => ({ ...f, amount: '', description: '' }));
    setModal(false);
  };

  const removeEntry = (id: string) => saveEntries(entries.filter(e => e.id !== id));

  const saveGoal = () => {
    const amount = Number(goalAmount);
    if (!amount || amount <= 0) return;
    const updated = goals.filter(g => g.month !== month);
    saveGoals([...updated, { month, savingsGoal: amount }]);
    setGoalModal(false);
    setGoalAmount('');
  };

  const monthEntries = useMemo(() => entries.filter(e => e.date.startsWith(month)), [entries, month]);

  const income   = useMemo(() => monthEntries.filter(e => e.type === 'income').reduce((s, e) => s + e.amount, 0), [monthEntries]);
  const expenses = useMemo(() => monthEntries.filter(e => e.type === 'expense').reduce((s, e) => s + e.amount, 0), [monthEntries]);
  const balance  = income - expenses;

  const currentGoal = goals.find(g => g.month === month);
  const savingsPct  = currentGoal ? Math.min(100, (balance / currentGoal.savingsGoal) * 100) : 0;

  const catData = useMemo(() => {
    const expensesBycat: Partial<Record<ExpenseCategory, number>> = {};
    monthEntries.filter(e => e.type === 'expense').forEach(e => {
      const cat = e.category as ExpenseCategory;
      expensesBycat[cat] = (expensesBycat[cat] ?? 0) + e.amount;
    });
    return CATEGORIES
      .filter(c => (expensesBycat[c] ?? 0) > 0)
      .map(c => ({ name: CAT_LABELS[c], value: expensesBycat[c] ?? 0, color: CAT_COLORS[c] }));
  }, [monthEntries]);

  const last6 = getLast6Months();
  const barData = useMemo(() => last6.map(m => {
    const mes = entries.filter(e => e.date.startsWith(m));
    const inc = mes.filter(e => e.type === 'income').reduce((s, e) => s + e.amount, 0);
    const exp = mes.filter(e => e.type === 'expense').reduce((s, e) => s + e.amount, 0);
    return { month: formatMonthLabel(m), income: inc, expenses: exp, savings: inc - exp };
  }), [entries, last6]);

  const sortedEntries = useMemo(() => [...monthEntries].sort((a, b) => b.date.localeCompare(a.date)), [monthEntries]);

  return (
    <div className="p-6 space-y-6 max-w-5xl mx-auto">
      {/* Header + month nav */}
      <div className="flex items-center justify-between flex-wrap gap-3">
        <div className="flex items-center gap-3">
          <button onClick={() => setMonth(prevMonth(month))} className="w-8 h-8 flex items-center justify-center rounded-lg bg-gray-800 hover:bg-gray-700 text-gray-300 transition-colors">
            <ChevronLeft size={18} />
          </button>
          <h1 className="text-lg font-bold text-white min-w-[180px] text-center">{displayMonth(month)}</h1>
          <button onClick={() => setMonth(nextMonth(month))} className="w-8 h-8 flex items-center justify-center rounded-lg bg-gray-800 hover:bg-gray-700 text-gray-300 transition-colors">
            <ChevronRight size={18} />
          </button>
          <button onClick={() => setMonth(currentMonth())} className="px-3 py-1.5 text-xs bg-gray-800 hover:bg-gray-700 text-gray-300 rounded-lg transition-colors">
            This month
          </button>
        </div>
        <div className="flex gap-2">
          <button onClick={() => { setGoalAmount(String(currentGoal?.savingsGoal ?? '')); setGoalModal(true); }} className="flex items-center gap-2 px-3 py-2 bg-gray-800 hover:bg-gray-700 text-gray-300 text-sm rounded-lg transition-colors">
            <Target size={16} /> Savings goal
          </button>
          <button onClick={() => setModal(true)} className="flex items-center gap-2 px-3 py-2 bg-indigo-600 hover:bg-indigo-700 text-white text-sm rounded-lg transition-colors">
            <Plus size={16} /> Add entry
          </button>
        </div>
      </div>

      {/* Summary cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {[
          { label: 'Income',   value: `€${income.toFixed(2)}`,   icon: <TrendingUp size={18} className="text-green-400" />,  bg: 'bg-green-500/10',  text: 'text-green-400' },
          { label: 'Expenses', value: `€${expenses.toFixed(2)}`, icon: <TrendingDown size={18} className="text-red-400" />, bg: 'bg-red-500/10',    text: 'text-red-400' },
          { label: 'Balance',  value: `€${balance >= 0 ? '+' : ''}${balance.toFixed(2)}`, icon: <Wallet size={18} className={balance >= 0 ? 'text-indigo-400' : 'text-red-400'} />, bg: balance >= 0 ? 'bg-indigo-500/10' : 'bg-red-500/10', text: balance >= 0 ? 'text-indigo-400' : 'text-red-400' },
          { label: 'Entries',  value: String(monthEntries.length), icon: <Target size={18} className="text-gray-400" />,     bg: 'bg-gray-500/10',   text: 'text-gray-400' },
        ].map(({ label, value, icon, bg, text }) => (
          <div key={label} className={`${bg} border border-gray-800 rounded-xl p-5`}>
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
              <h2 className="font-semibold text-white">Savings Goal</h2>
            </div>
            <span className={`text-sm font-medium ${balance >= currentGoal.savingsGoal ? 'text-green-400' : 'text-gray-400'}`}>
              €{balance.toFixed(0)} / €{currentGoal.savingsGoal}
              {balance >= currentGoal.savingsGoal && ' 🎉'}
            </span>
          </div>
          <ProgressBar value={savingsPct} color={balance >= currentGoal.savingsGoal ? 'bg-green-500' : 'bg-indigo-500'} height="h-3" />
          <p className="text-xs text-gray-500 mt-2">{Math.round(savingsPct)}% of goal reached</p>
        </div>
      )}

      {/* Charts */}
      {catData.length > 0 && (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Donut */}
          <div className="bg-gray-900 border border-gray-800 rounded-xl p-5">
            <h2 className="font-semibold text-white mb-4">Expenses by Category</h2>
            <ResponsiveContainer width="100%" height={220}>
              <PieChart>
                <Pie data={catData} cx="50%" cy="50%" innerRadius={55} outerRadius={90} paddingAngle={2} dataKey="value">
                  {catData.map((entry, i) => <Cell key={i} fill={entry.color} />)}
                </Pie>
                <Tooltip contentStyle={TOOLTIP_STYLE} formatter={(v: number) => [`€${v.toFixed(2)}`, '']} />
                <Legend formatter={v => <span style={{ color: '#9ca3af', fontSize: '11px' }}>{v}</span>} />
              </PieChart>
            </ResponsiveContainer>
          </div>

          {/* 6-month bar */}
          <div className="bg-gray-900 border border-gray-800 rounded-xl p-5">
            <h2 className="font-semibold text-white mb-4">Last 6 Months</h2>
            <ResponsiveContainer width="100%" height={220}>
              <BarChart data={barData} barSize={14}>
                <XAxis dataKey="month" tick={{ fill: '#6b7280', fontSize: 10 }} axisLine={false} tickLine={false} />
                <YAxis tick={{ fill: '#6b7280', fontSize: 10 }} axisLine={false} tickLine={false} width={40} />
                <Tooltip contentStyle={TOOLTIP_STYLE} formatter={(v: number) => [`€${v.toFixed(2)}`, '']} cursor={{ fill: 'rgba(255,255,255,0.04)' }} />
                <Legend formatter={v => <span style={{ color: '#9ca3af', fontSize: '11px' }}>{v}</span>} />
                <Bar dataKey="income"   name="Income"   fill="#22c55e" radius={[3, 3, 0, 0]} />
                <Bar dataKey="expenses" name="Expenses" fill="#ef4444" radius={[3, 3, 0, 0]} />
                <Bar dataKey="savings"  name="Savings"  fill="#6366f1" radius={[3, 3, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>
      )}

      {/* Entries list */}
      <div className="bg-gray-900 border border-gray-800 rounded-xl p-5">
        <h2 className="font-semibold text-white mb-4">
          Transactions {sortedEntries.length > 0 && <span className="text-gray-500 font-normal text-sm">({sortedEntries.length})</span>}
        </h2>
        {sortedEntries.length === 0 ? (
          <div className="text-center py-10 text-gray-500">
            <Wallet size={36} className="mx-auto mb-3 opacity-30" />
            <p>No entries for this month</p>
          </div>
        ) : (
          <div className="space-y-2">
            {sortedEntries.map(e => {
              const cat = e.category as ExpenseCategory;
              const color = e.type === 'income' ? '#22c55e' : CAT_COLORS[cat] ?? '#6b7280';
              return (
                <div key={e.id} className="flex items-center gap-3 p-3 rounded-lg border border-gray-800 hover:border-gray-700 transition-colors">
                  <div className="w-2 h-10 rounded-full shrink-0" style={{ backgroundColor: color }} />
                  <div className="flex-1 min-w-0">
                    <p className="text-sm text-white font-medium">{e.description || (e.type === 'income' ? 'Income' : CAT_LABELS[cat])}</p>
                    <p className="text-xs text-gray-500">
                      {new Date(e.date + 'T00:00').toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}
                      {' · '}
                      {e.type === 'income' ? 'Income' : CAT_LABELS[cat]}
                    </p>
                  </div>
                  <span className={`text-sm font-bold shrink-0 ${e.type === 'income' ? 'text-green-400' : 'text-red-400'}`}>
                    {e.type === 'income' ? '+' : '-'}€{e.amount.toFixed(2)}
                  </span>
                  <button onClick={() => removeEntry(e.id)} className="shrink-0 w-7 h-7 flex items-center justify-center rounded-lg text-gray-600 hover:text-red-400 hover:bg-red-950/30 transition-colors">
                    <Trash2 size={14} />
                  </button>
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* Add entry modal */}
      <Modal isOpen={modal} onClose={() => setModal(false)} title="Add Transaction">
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
                  {t}
                </button>
              ))}
            </div>
          </div>
          <div>
            <label className={LABEL}>Amount (€) *</label>
            <input type="number" step="0.01" className={INPUT} placeholder="0.00" value={form.amount} onChange={e => setForm(f => ({ ...f, amount: e.target.value }))} autoFocus />
          </div>
          {form.type === 'expense' && (
            <div>
              <label className={LABEL}>Category</label>
              <select className={INPUT} value={form.category} onChange={e => setForm(f => ({ ...f, category: e.target.value as ExpenseCategory }))}>
                {CATEGORIES.map(c => <option key={c} value={c}>{CAT_LABELS[c]}</option>)}
              </select>
            </div>
          )}
          <div>
            <label className={LABEL}>Description (optional)</label>
            <input className={INPUT} placeholder="e.g. Grocery run" value={form.description} onChange={e => setForm(f => ({ ...f, description: e.target.value }))} />
          </div>
          <div>
            <label className={LABEL}>Date</label>
            <input type="date" className={INPUT} value={form.date} onChange={e => setForm(f => ({ ...f, date: e.target.value }))} />
          </div>
          <div className="flex gap-2 justify-end pt-1">
            <button onClick={() => setModal(false)} className={BTN_GHOST}>Cancel</button>
            <button onClick={addEntry} className={BTN_PRIMARY}>Add Entry</button>
          </div>
        </div>
      </Modal>

      {/* Savings goal modal */}
      <Modal isOpen={goalModal} onClose={() => setGoalModal(false)} title={`Savings Goal — ${displayMonth(month)}`}>
        <div className="space-y-4">
          <div>
            <label className={LABEL}>Target savings (€)</label>
            <input type="number" step="10" className={INPUT} placeholder="500" value={goalAmount} onChange={e => setGoalAmount(e.target.value)} autoFocus />
          </div>
          <div className="flex gap-2 justify-end pt-1">
            <button onClick={() => setGoalModal(false)} className={BTN_GHOST}>Cancel</button>
            <button onClick={saveGoal} className={BTN_PRIMARY}>Save Goal</button>
          </div>
        </div>
      </Modal>
    </div>
  );
}
