import { useState, useMemo } from 'react';
import type { BudgetEntry, BudgetGoal, ExpenseCategory, AccountId, AccountBalances, UserSettings } from '../types';
import { getItem, setItem } from '../utils/storage';
import { today, uid, getLast6Months, formatMonthLabel } from '../utils/helpers';
import { Modal, INPUT, LABEL, BTN_PRIMARY, BTN_GHOST, TOOLTIP_STYLE } from '../components/ui';
import {
  Plus, Trash2, Wallet, Target, ChevronLeft, ChevronRight,
  Pencil, ArrowUpRight, ArrowDownRight, TrendingUp, Lock,
} from 'lucide-react';
import { PieChart, Pie, Cell, AreaChart, Area, XAxis, YAxis, ResponsiveContainer, Tooltip, Legend } from 'recharts';

// ── Constants ─────────────────────────────────────────────────────────────────
const CATEGORIES: ExpenseCategory[] = ['food','housing','transport','leisure','health','shopping','services','other'];
const CAT_COLORS: Record<ExpenseCategory, string> = {
  food:'#f59e0b', housing:'#6366f1', transport:'#22c55e', leisure:'#ec4899',
  health:'#06b6d4', shopping:'#f97316', services:'#8b5cf6', other:'#6b7280',
};
const CAT_LABELS: Record<ExpenseCategory, string> = {
  food:'Food', housing:'Housing', transport:'Transport', leisure:'Leisure',
  health:'Health', shopping:'Shopping', services:'Services', other:'Other',
};
const CAT_EMOJI: Record<string, string> = {
  food:'🍔', housing:'🏠', transport:'🚌', leisure:'🎮',
  health:'💊', shopping:'🛍️', services:'⚙️', other:'📦', income:'💸',
};
const ACCOUNTS: { id: AccountId; label: string; sub: string }[] = [
  { id:'cc', label:'Checking', sub:'Visa •••• 4291' },
  { id:'ep', label:'Savings',  sub:'Savings account' },
];

// ── Time filter helpers ───────────────────────────────────────────────────────
type TimeFilter = 'month' | 'quarter' | 'year' | 'all';

function filterByPeriod(entries: BudgetEntry[], ref: Date, tf: TimeFilter): BudgetEntry[] {
  if (tf === 'all') return entries;
  const y = ref.getFullYear(), m = ref.getMonth() + 1;
  if (tf === 'month') return entries.filter(e => e.date.startsWith(`${y}-${String(m).padStart(2,'0')}`));
  if (tf === 'quarter') {
    const s = Math.floor((m-1)/3)*3+1, en = s+2;
    return entries.filter(e => { const [ey,em] = e.date.split('-').map(Number); return ey===y && em>=s && em<=en; });
  }
  return entries.filter(e => e.date.startsWith(`${y}-`));
}

function periodLabel(ref: Date, tf: TimeFilter): string {
  const y = ref.getFullYear(), m = ref.getMonth()+1;
  if (tf==='month') return new Date(y,m-1).toLocaleDateString('en-GB',{month:'long',year:'numeric'});
  if (tf==='quarter') return `Q${Math.floor((m-1)/3)+1} ${y}`;
  if (tf==='year') return String(y);
  return 'All';
}

function shiftRef(ref: Date, tf: TimeFilter, dir: 1|-1): Date {
  const d = new Date(ref);
  if (tf==='month') d.setMonth(d.getMonth()+dir);
  else if (tf==='quarter') d.setMonth(d.getMonth()+dir*3);
  else if (tf==='year') d.setFullYear(d.getFullYear()+dir);
  return d;
}

function monthKey(ref: Date): string {
  return `${ref.getFullYear()}-${String(ref.getMonth()+1).padStart(2,'0')}`;
}

// ── PIN helpers ───────────────────────────────────────────────────────────────

async function sha256(text: string): Promise<string> {
  const buf = await crypto.subtle.digest('SHA-256', new TextEncoder().encode(text));
  return Array.from(new Uint8Array(buf)).map(b => b.toString(16).padStart(2, '0')).join('');
}

function PinLock({ storedHash, onUnlock }: { storedHash: string; onUnlock: () => void }) {
  const accent = getItem<UserSettings>('myne:settings', { name: '', accentColor: '#6366f1' }).accentColor;
  const [digits, setDigits] = useState('');
  const [shaking, setShaking] = useState(false);

  const enter = async (k: string) => {
    if (shaking) return;
    if (k === '⌫') { setDigits(d => d.slice(0, -1)); return; }
    const next = digits + k;
    if (next.length > 4) return;
    setDigits(next);
    if (next.length === 4) {
      const hash = await sha256(next);
      if (hash === storedHash) {
        onUnlock();
      } else {
        setShaking(true);
        setTimeout(() => { setDigits(''); setShaking(false); }, 700);
      }
    }
  };

  const KEYS = ['1','2','3','4','5','6','7','8','9','','0','⌫'];

  return (
    <div className="min-h-full flex items-center justify-center p-6">
      <style>{`@keyframes pin-shake{0%,100%{transform:translateX(0)}20%{transform:translateX(-8px)}40%{transform:translateX(8px)}60%{transform:translateX(-5px)}80%{transform:translateX(5px)}}`}</style>
      <div className="w-full max-w-xs text-center">
        <div className="w-16 h-16 rounded-2xl flex items-center justify-center mx-auto mb-6"
          style={{ background: `${accent}20`, border: `1px solid ${accent}40` }}>
          <Lock size={28} style={{ color: accent }} />
        </div>
        <h2 className="text-xl font-bold text-white mb-1">Budget</h2>
        <p className="text-sm text-gray-500 mb-8">Enter your PIN</p>

        <div className="flex justify-center gap-4 mb-8"
          style={shaking ? { animation: 'pin-shake 0.55s ease' } : {}}>
          {[0,1,2,3].map(i => (
            <div key={i} style={{
              width: 14, height: 14, borderRadius: 7,
              background: i < digits.length ? accent : 'rgba(255,255,255,0.15)',
              transition: 'background 0.15s',
              boxShadow: i < digits.length ? `0 0 8px ${accent}` : 'none',
            }} />
          ))}
        </div>

        <div className="grid grid-cols-3 gap-3">
          {KEYS.map((k, i) => k === '' ? (
            <div key={i} />
          ) : (
            <button key={k} onClick={() => enter(k)}
              disabled={k !== '⌫' && digits.length >= 4}
              className="h-14 rounded-2xl text-white font-semibold transition-all active:scale-95 disabled:opacity-40"
              style={{
                background: k === '⌫' ? 'rgba(255,255,255,0.06)' : 'rgba(255,255,255,0.07)',
                border: '1px solid rgba(255,255,255,0.08)',
                fontSize: k === '⌫' ? 18 : 20,
              }}>
              {k}
            </button>
          ))}
        </div>
      </div>
    </div>
  );
}

// ── BankCard ──────────────────────────────────────────────────────────────────
function BankCard({ account, balance, name, onEdit }: {
  account: typeof ACCOUNTS[0]; balance: number; name: string; onEdit: () => void;
}) {
  const isNeg = balance < 0;
  return (
    <div className="relative w-full max-w-sm rounded-2xl p-6 overflow-hidden select-none"
      style={{ background: 'linear-gradient(135deg, rgba(255,255,255,0.18) 0%, rgba(255,255,255,0.04) 100%)', border: '1px solid rgba(255,255,255,0.15)', backdropFilter: 'blur(12px)' }}>
      {/* Shimmer circles */}
      <div className="absolute -top-8 -right-8 w-36 h-36 rounded-full"
        style={{ background: 'radial-gradient(circle, rgba(255,255,255,0.15) 0%, transparent 70%)' }} />
      <div className="absolute -bottom-6 -left-6 w-28 h-28 rounded-full"
        style={{ background: 'radial-gradient(circle, rgba(255,255,255,0.1) 0%, transparent 70%)' }} />

      <div className="relative">
        {/* Top row */}
        <div className="flex items-start justify-between mb-8">
          <div>
            <p className="text-white/50 text-xs uppercase tracking-widest">{account.label}</p>
            <p className="text-white/40 text-xs mt-0.5">{account.sub}</p>
          </div>
          <div className="w-10 h-10 rounded-full flex items-center justify-center text-white/80"
            style={{ background: 'rgba(255,255,255,0.2)' }}>
            <Wallet size={18} />
          </div>
        </div>

        {/* Balance */}
        <div className="mb-4">
          <p className="text-white/50 text-xs mb-1">Current balance</p>
          <p className={`text-4xl font-bold tracking-tight ${isNeg ? 'text-red-300' : 'text-white'}`}>
            {isNeg ? '-' : ''}€{Math.abs(balance).toLocaleString('en-GB',{minimumFractionDigits:2})}
          </p>
        </div>

        {/* Footer */}
        <div className="flex items-center justify-between">
          <p className="text-white/40 text-xs">{name || 'Myne User'}</p>
          <button onClick={onEdit}
            className="flex items-center gap-1.5 text-white/50 hover:text-white text-xs transition-colors bg-white/10 hover:bg-white/20 px-2.5 py-1 rounded-lg">
            <Pencil size={10} /> Edit
          </button>
        </div>
      </div>
    </div>
  );
}

// ── StatTile ──────────────────────────────────────────────────────────────────
function StatTile({ label, value, sub, gradient, icon }: {
  label: string; value: string; sub?: string;
  gradient: string; icon: React.ReactNode;
}) {
  return (
    <div className={`relative rounded-2xl p-5 overflow-hidden ${gradient}`}>
      <div className="absolute top-0 right-0 w-24 h-24 rounded-full opacity-20"
        style={{ background: 'radial-gradient(circle, white 0%, transparent 70%)', transform: 'translate(30%,-30%)' }} />
      <div className="relative">
        <div className="flex items-center justify-between mb-3">
          <span className="text-white/60 text-xs font-medium uppercase tracking-wide">{label}</span>
          <div className="w-7 h-7 rounded-lg bg-white/20 flex items-center justify-center">{icon}</div>
        </div>
        <p className="text-white text-2xl font-bold leading-none">{value}</p>
        {sub && <p className="text-white/50 text-xs mt-1.5">{sub}</p>}
      </div>
    </div>
  );
}

// ── Main ──────────────────────────────────────────────────────────────────────
function BudgetContent() {
  const [entries,  setEntries]  = useState<BudgetEntry[]>(() =>
    getItem<any[]>('myne:budget:entries',[]).map((e:any)=>({...e, accountId: e.accountId??'cc'}))
  );
  const [goals,    setGoals]    = useState<BudgetGoal[]>(() =>
    getItem<any[]>('myne:budget:goals',[]).map((g:any)=>({...g, accountId: g.accountId??'cc'}))
  );
  const [balances, setBalances] = useState<AccountBalances>(() =>
    getItem('myne:budget:balances',{cc:0,ep:0})
  );

  const [account, setAccount] = useState<AccountId>('cc');
  const [tf,  setTf]  = useState<TimeFilter>('month');
  const [ref, setRef] = useState(new Date());

  const [modal,        setModal]        = useState(false);
  const [goalModal,    setGoalModal]    = useState(false);
  const [balanceModal, setBalanceModal] = useState(false);
  const [goalAmount,   setGoalAmount]   = useState('');
  const [newBalance,   setNewBalance]   = useState('');
  const [form, setForm] = useState({
    type: 'expense' as 'expense'|'income',
    amount:'', category:'food' as ExpenseCategory, description:'', date: today(),
  });

  const saveEntries  = (l: BudgetEntry[])  => { setEntries(l);  setItem('myne:budget:entries', l); };
  const saveGoals    = (l: BudgetGoal[])   => { setGoals(l);    setItem('myne:budget:goals', l); };
  const saveBalances = (b: AccountBalances)=> { setBalances(b); setItem('myne:budget:balances', b); };

  const addEntry = () => {
    if (!form.amount || Number(form.amount)<=0) return;
    const e: BudgetEntry = {
      id: uid(), accountId: account, type: form.type, amount: Number(form.amount),
      category: form.type==='income' ? 'income' : form.category,
      description: form.description.trim(), date: form.date,
    };
    saveEntries([e,...entries]);
    setForm(f=>({...f, amount:'', description:''}));
    setModal(false);
  };

  const saveGoal = () => {
    const amount = Number(goalAmount);
    if (!amount || amount<=0) return;
    const mk = tf==='month' ? monthKey(ref) : monthKey(new Date());
    saveGoals([...goals.filter(g=>!(g.month===mk && g.accountId===account)), {month:mk, accountId:account, savingsGoal:amount}]);
    setGoalModal(false); setGoalAmount('');
  };

  // Derived
  const accountEntries = useMemo(()=>entries.filter(e=>e.accountId===account),[entries,account]);
  const periodEntries  = useMemo(()=>filterByPeriod(accountEntries,ref,tf),[accountEntries,ref,tf]);
  const income   = useMemo(()=>periodEntries.filter(e=>e.type==='income').reduce((s,e)=>s+e.amount,0),[periodEntries]);
  const expenses = useMemo(()=>periodEntries.filter(e=>e.type==='expense').reduce((s,e)=>s+e.amount,0),[periodEntries]);
  const net      = income - expenses;

  const allIncome   = useMemo(()=>accountEntries.filter(e=>e.type==='income').reduce((s,e)=>s+e.amount,0),[accountEntries]);
  const allExpenses = useMemo(()=>accountEntries.filter(e=>e.type==='expense').reduce((s,e)=>s+e.amount,0),[accountEntries]);
  const displayedBalance = balances[account] + allIncome - allExpenses;

  const saveBalance = () => {
    const val = Number(newBalance);
    if (isNaN(val)) return;
    saveBalances({...balances, [account]: val - allIncome + allExpenses});
    setBalanceModal(false);
  };

  const goalMonthKey = tf==='month' ? monthKey(ref) : monthKey(new Date());
  const currentGoal  = goals.find(g=>g.month===goalMonthKey && g.accountId===account);
  const savingsPct   = currentGoal && currentGoal.savingsGoal>0 ? Math.min(100,(net/currentGoal.savingsGoal)*100) : 0;

  const catData = useMemo(()=>{
    const map: Partial<Record<ExpenseCategory,number>> = {};
    periodEntries.filter(e=>e.type==='expense').forEach(e=>{
      const c = e.category as ExpenseCategory; map[c]=(map[c]??0)+e.amount;
    });
    return CATEGORIES.filter(c=>(map[c]??0)>0).map(c=>({name:CAT_LABELS[c], value:map[c]!, color:CAT_COLORS[c]}));
  },[periodEntries]);

  const last6 = getLast6Months();
  const areaData = useMemo(()=>last6.map(m=>{
    const mes = accountEntries.filter(e=>e.date.startsWith(m));
    return {
      month: formatMonthLabel(m),
      income:   mes.filter(e=>e.type==='income').reduce((s,e)=>s+e.amount,0),
      expenses: mes.filter(e=>e.type==='expense').reduce((s,e)=>s+e.amount,0),
    };
  }),[accountEntries,last6]);

  const sorted    = useMemo(()=>[...periodEntries].sort((a,b)=>b.date.localeCompare(a.date)),[periodEntries]);
  const accInfo   = ACCOUNTS.find(a=>a.id===account)!;
  const userName  = getItem<{name?:string}>('myne:settings',{}).name ?? '';
  const TF_OPTS: {value:TimeFilter; label:string}[] = [
    {value:'month',label:'Month'},{value:'quarter',label:'Quarter'},
    {value:'year',label:'Year'},{value:'all',label:'All'},
  ];

  return (
    <div className="min-h-full relative overflow-hidden" style={{ background: '#05050f' }}>

      {/* ── Animated gradient ─────────────────────────────────────────────── */}
      <style>{`
        @keyframes grad-flow {
          0%   { background-position: 0% 50%; }
          50%  { background-position: 100% 50%; }
          100% { background-position: 0% 50%; }
        }
      `}</style>

      <div className="absolute inset-0 pointer-events-none"
        style={{
          background: 'linear-gradient(-45deg, var(--accent), #7c3aed, #1e40af, #0e7490, var(--accent), #7c3aed)',
          backgroundSize: '350% 350%',
          animation: 'grad-flow 7s ease infinite',
          opacity: 0.82,
        }} />

      {/* Dark vignette so content stays readable */}
      <div className="absolute inset-0 pointer-events-none"
        style={{ background: 'radial-gradient(ellipse at 50% 0%, transparent 40%, rgba(0,0,0,0.55) 100%)' }} />

      {/* Dot grid */}
      <div className="absolute inset-0 pointer-events-none opacity-[0.07]"
        style={{ backgroundImage:'radial-gradient(circle at 1px 1px, rgba(255,255,255,1) 1px, transparent 0)', backgroundSize:'26px 26px' }} />

      {/* ══ HERO ══════════════════════════════════════════════════════════════ */}
      <div className="relative overflow-hidden">

        <div className="relative p-6 pb-10">
          {/* Top bar */}
          <div className="flex items-center justify-between mb-8 flex-wrap gap-3">
            <div className="flex gap-1.5 p-1 rounded-xl" style={{background:'rgba(0,0,0,0.3)', backdropFilter:'blur(12px)', border:'1px solid rgba(255,255,255,0.12)'}}>
              {ACCOUNTS.map(acc => (
                <button key={acc.id} onClick={()=>setAccount(acc.id)}
                  className={`px-4 py-1.5 rounded-lg text-sm font-semibold transition-all ${
                    account===acc.id ? 'bg-white text-gray-900 shadow' : 'text-white/60 hover:text-white'
                  }`}>
                  {acc.label}
                </button>
              ))}
            </div>
            <div className="flex gap-2">
              <button onClick={()=>{setGoalAmount(String(currentGoal?.savingsGoal??'')); setGoalModal(true);}}
                className="flex items-center gap-2 px-3 py-2 rounded-xl text-sm text-white/70 hover:text-white transition-colors"
                style={{background:'rgba(255,255,255,0.12)', backdropFilter:'blur(8px)'}}>
                <Target size={15}/> Goal
              </button>
              <button onClick={()=>setModal(true)}
                className="flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-bold text-gray-900 bg-white hover:bg-white/90 transition-colors shadow-lg">
                <Plus size={15}/> Add
              </button>
            </div>
          </div>

          {/* Card + stats grid */}
          <div className="grid grid-cols-1 lg:grid-cols-5 gap-6 items-start">
            {/* Bank card */}
            <div className="lg:col-span-2">
              <BankCard
                account={accInfo}
                balance={displayedBalance}
                name={userName}
                onEdit={()=>{setNewBalance(String(displayedBalance)); setBalanceModal(true);}}
              />
            </div>

            {/* Stat tiles */}
            <div className="lg:col-span-3 grid grid-cols-1 sm:grid-cols-3 gap-3">
              <StatTile
                label="Income"
                value={`€${income.toLocaleString('en-GB',{minimumFractionDigits:0})}`}
                sub={`${periodEntries.filter(e=>e.type==='income').length} transaction(s)`}
                gradient="bg-gradient-to-br from-emerald-600 to-emerald-800"
                icon={<ArrowUpRight size={14} className="text-white"/>}
              />
              <StatTile
                label="Expenses"
                value={`€${expenses.toLocaleString('en-GB',{minimumFractionDigits:0})}`}
                sub={`${periodEntries.filter(e=>e.type==='expense').length} transaction(s)`}
                gradient="bg-gradient-to-br from-rose-600 to-rose-800"
                icon={<ArrowDownRight size={14} className="text-white"/>}
              />
              <StatTile
                label="Net"
                value={`${net>=0?'+':''}€${Math.abs(net).toLocaleString('en-GB',{minimumFractionDigits:0})}`}
                sub={net>=0 ? 'Positive balance ✓' : 'Deficit'}
                gradient={net>=0 ? 'bg-gradient-to-br from-indigo-600 to-violet-700' : 'bg-gradient-to-br from-red-700 to-red-900'}
                icon={<TrendingUp size={14} className="text-white"/>}
              />
              {/* Savings goal inline */}
              {currentGoal && (
                <div className="sm:col-span-3 bg-white/10 backdrop-blur rounded-2xl p-4"
                  style={{border:'1px solid rgba(255,255,255,0.12)'}}>
                  <div className="flex items-center justify-between mb-2">
                    <div className="flex items-center gap-2">
                      <Target size={13} className="text-white/60"/>
                      <span className="text-white/70 text-xs font-medium">Savings goal</span>
                    </div>
                    <span className={`text-sm font-bold ${net>=currentGoal.savingsGoal ? 'text-emerald-300' : 'text-white'}`}>
                      €{net.toFixed(0)} / €{currentGoal.savingsGoal}
                      {net>=currentGoal.savingsGoal && ' 🎉'}
                    </span>
                  </div>
                  <div className="w-full h-1.5 rounded-full bg-white/10 overflow-hidden">
                    <div className="h-full rounded-full transition-all"
                      style={{width:`${Math.min(100,Math.max(0,savingsPct))}%`, background: net>=currentGoal.savingsGoal ? '#34d399' : 'rgba(255,255,255,0.7)'}}/>
                  </div>
                  <p className="text-white/40 text-xs mt-1.5">{Math.round(Math.max(0,savingsPct))}% reached</p>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>

      <div className="p-6 space-y-5">

        {/* ══ PERIOD FILTER ═══════════════════════════════════════════════════ */}
        <div className="flex items-center justify-between flex-wrap gap-3">
          <div className="flex gap-1 p-1 rounded-xl border border-white/20" style={{background:'rgba(0,0,0,0.5)', backdropFilter:'blur(16px)'}}>
            {TF_OPTS.map(opt=>(
              <button key={opt.value} onClick={()=>{setTf(opt.value); setRef(new Date());}}
                className={`px-4 py-1.5 text-xs font-semibold rounded-lg transition-all ${
                  tf===opt.value ? 'text-white shadow-lg' : 'text-white/50 hover:text-white'
                }`}
                style={tf===opt.value ? {backgroundColor:'var(--accent)'} : {}}>
                {opt.label}
              </button>
            ))}
          </div>
          {tf!=='all' && (
            <div className="flex items-center gap-2">
              <button onClick={()=>setRef(shiftRef(ref,tf,-1))}
                className="w-8 h-8 flex items-center justify-center rounded-lg text-white transition-colors border border-white/20" style={{background:'rgba(0,0,0,0.5)', backdropFilter:'blur(16px)'}}>
                <ChevronLeft size={15}/>
              </button>
              <span className="text-sm font-bold text-white min-w-[150px] text-center capitalize drop-shadow">
                {periodLabel(ref,tf)}
              </span>
              <button onClick={()=>setRef(shiftRef(ref,tf,1))}
                className="w-8 h-8 flex items-center justify-center rounded-lg text-white transition-colors border border-white/20" style={{background:'rgba(0,0,0,0.5)', backdropFilter:'blur(16px)'}}>
                <ChevronRight size={15}/>
              </button>
              <button onClick={()=>setRef(new Date())}
                className="px-3 py-1.5 text-xs text-white font-semibold rounded-lg transition-colors border border-white/20" style={{background:'rgba(0,0,0,0.5)', backdropFilter:'blur(16px)'}}>
                Current
              </button>
            </div>
          )}
        </div>

        {/* ══ CHARTS ══════════════════════════════════════════════════════════ */}
        <div className="grid grid-cols-1 lg:grid-cols-5 gap-5">
          {/* Area chart */}
          <div className="lg:col-span-3 rounded-2xl p-5 border border-white/[0.06]" style={{background:'rgba(0,0,0,0.55)', backdropFilter:'blur(20px)'}}>
            <div className="flex items-center justify-between mb-5">
              <div>
                <h2 className="font-bold text-white">Cash flow</h2>
                <p className="text-xs text-gray-500 mt-0.5">Last 6 months · {accInfo.label}</p>
              </div>
            </div>
            <ResponsiveContainer width="100%" height={200}>
              <AreaChart data={areaData} margin={{top:4,right:0,left:0,bottom:0}}>
                <defs>
                  <linearGradient id="gRev" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%"  stopColor="#22c55e" stopOpacity={0.3}/>
                    <stop offset="95%" stopColor="#22c55e" stopOpacity={0}/>
                  </linearGradient>
                  <linearGradient id="gDep" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%"  stopColor="#ef4444" stopOpacity={0.3}/>
                    <stop offset="95%" stopColor="#ef4444" stopOpacity={0}/>
                  </linearGradient>
                </defs>
                <XAxis dataKey="month" tick={{fill:'#6b7280',fontSize:10}} axisLine={false} tickLine={false}/>
                <YAxis tick={{fill:'#6b7280',fontSize:10}} axisLine={false} tickLine={false} width={40}/>
                <Tooltip contentStyle={TOOLTIP_STYLE} formatter={(v:number)=>[`€${v.toFixed(2)}`,'']} cursor={{stroke:'rgba(255,255,255,0.08)',strokeWidth:1}}/>
                <Legend formatter={v=><span style={{color:'#9ca3af',fontSize:'11px'}}>{v}</span>}/>
                <Area type="monotone" dataKey="income"   name="Income"   stroke="#22c55e" strokeWidth={2} fill="url(#gRev)"/>
                <Area type="monotone" dataKey="expenses" name="Expenses" stroke="#ef4444" strokeWidth={2} fill="url(#gDep)"/>
              </AreaChart>
            </ResponsiveContainer>
          </div>

          {/* Pie */}
          <div className="lg:col-span-2 rounded-2xl p-5 border border-white/[0.06]" style={{background:'rgba(0,0,0,0.55)', backdropFilter:'blur(20px)'}}>
            <div className="mb-5">
              <h2 className="font-bold text-white">Breakdown</h2>
              <p className="text-xs text-gray-500 mt-0.5">Expenses by category</p>
            </div>
            {catData.length > 0 ? (
              <>
                <ResponsiveContainer width="100%" height={150}>
                  <PieChart>
                    <Pie data={catData} cx="50%" cy="50%" innerRadius={42} outerRadius={68}
                      paddingAngle={3} dataKey="value" strokeWidth={0}>
                      {catData.map((e,i)=><Cell key={i} fill={e.color}/>)}
                    </Pie>
                    <Tooltip contentStyle={TOOLTIP_STYLE} formatter={(v:number)=>[`€${v.toFixed(2)}`,'']}/>
                  </PieChart>
                </ResponsiveContainer>
                <div className="mt-3 space-y-1.5">
                  {catData.slice(0,4).map(c=>(
                    <div key={c.name} className="flex items-center gap-2.5">
                      <div className="w-2 h-2 rounded-full shrink-0" style={{backgroundColor:c.color}}/>
                      <span className="text-xs text-gray-400 flex-1 truncate">{c.name}</span>
                      <span className="text-xs font-semibold text-white">€{c.value.toFixed(0)}</span>
                      <span className="text-xs text-gray-600">
                        {Math.round((c.value/expenses)*100)}%
                      </span>
                    </div>
                  ))}
                </div>
              </>
            ) : (
              <div className="h-40 flex items-center justify-center text-gray-600 text-sm">
                No expenses
              </div>
            )}
          </div>
        </div>

        {/* ══ TRANSACTIONS ════════════════════════════════════════════════════ */}
        <div className="rounded-2xl overflow-hidden border border-white/[0.06]" style={{background:'rgba(0,0,0,0.55)', backdropFilter:'blur(20px)'}}>
          <div className="flex items-center justify-between px-5 py-4 border-b border-white/[0.06]">
            <div>
              <h2 className="font-bold text-white">Transactions</h2>
              <p className="text-xs text-gray-500 mt-0.5 capitalize">{periodLabel(ref,tf)} · {sorted.length} transaction{sorted.length!==1?'s':''}</p>
            </div>
          </div>

          {sorted.length===0 ? (
            <div className="text-center py-16 text-gray-600">
              <div className="w-14 h-14 rounded-2xl bg-gray-800 flex items-center justify-center mx-auto mb-4">
                <Wallet size={24} className="opacity-40"/>
              </div>
              <p className="text-sm">No transactions in this period</p>
            </div>
          ) : (
            <div>
              {sorted.map((e,idx)=>{
                const cat     = e.category as ExpenseCategory;
                const isInc   = e.type==='income';
                const color   = isInc ? '#22c55e' : (CAT_COLORS[cat]??'#6b7280');
                const emoji   = CAT_EMOJI[isInc?'income':cat]??'💸';
                const catLbl  = isInc ? 'Income' : CAT_LABELS[cat];
                const label   = e.description || catLbl;
                return (
                  <div key={e.id}
                    className={`flex items-center gap-4 px-5 py-3.5 hover:bg-white/[0.04] transition-colors group ${idx!==sorted.length-1?'border-b border-white/[0.05]':''}`}>
                    {/* Icon */}
                    <div className="w-10 h-10 rounded-xl flex items-center justify-center text-lg shrink-0"
                      style={{backgroundColor:color+'22', border:`1px solid ${color}33`}}>
                      {emoji}
                    </div>

                    {/* Info */}
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-semibold text-white truncate">{label}</p>
                      <div className="flex items-center gap-2 mt-0.5">
                        <span className="text-xs text-gray-500">
                          {new Date(e.date+'T00:00').toLocaleDateString('en-GB',{weekday:'short',day:'numeric',month:'short'})}
                        </span>
                        <span className="text-gray-700">·</span>
                        <span className="text-xs px-1.5 py-0.5 rounded-md font-medium"
                          style={{color, backgroundColor:color+'18'}}>
                          {catLbl}
                        </span>
                      </div>
                    </div>

                    {/* Amount */}
                    <div className="text-right shrink-0">
                      <p className={`text-sm font-bold ${isInc?'text-emerald-400':'text-red-400'}`}>
                        {isInc?'+':'-'}€{e.amount.toLocaleString('en-GB',{minimumFractionDigits:2})}
                      </p>
                    </div>

                    {/* Delete */}
                    <button onClick={()=>saveEntries(entries.filter(x=>x.id!==e.id))}
                      className="shrink-0 w-7 h-7 flex items-center justify-center rounded-lg text-gray-700 hover:text-red-400 hover:bg-red-950/30 transition-all opacity-0 group-hover:opacity-100">
                      <Trash2 size={13}/>
                    </button>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      </div>

      {/* ══ MODALS ════════════════════════════════════════════════════════════ */}
      <Modal isOpen={modal} onClose={()=>setModal(false)} title={`New transaction · ${accInfo.label}`}>
        <div className="space-y-4">
          <div className="flex gap-2">
            {(['expense','income'] as const).map(t=>(
              <button key={t} onClick={()=>setForm(f=>({...f,type:t}))}
                className={`flex-1 py-2.5 rounded-xl text-sm font-bold transition-all border ${
                  form.type===t
                    ? t==='income' ? 'border-emerald-500 bg-emerald-500/15 text-emerald-400' : 'border-red-500 bg-red-500/15 text-red-400'
                    : 'border-gray-700 bg-gray-800 text-gray-400 hover:text-white'}`}>
                {t==='income' ? '↑ Income' : '↓ Expense'}
              </button>
            ))}
          </div>
          <div>
            <label className={LABEL}>Amount (€) *</label>
            <input type="number" step="0.01" className={INPUT} placeholder="0.00"
              value={form.amount} onChange={e=>setForm(f=>({...f,amount:e.target.value}))} autoFocus/>
          </div>
          {form.type==='expense' && (
            <div>
              <label className={LABEL}>Category</label>
              <select className={INPUT} value={form.category} onChange={e=>setForm(f=>({...f,category:e.target.value as ExpenseCategory}))}>
                {CATEGORIES.map(c=><option key={c} value={c}>{CAT_EMOJI[c]} {CAT_LABELS[c]}</option>)}
              </select>
            </div>
          )}
          <div>
            <label className={LABEL}>Description</label>
            <input className={INPUT} placeholder="e.g. Groceries, Rent…" value={form.description}
              onChange={e=>setForm(f=>({...f,description:e.target.value}))}/>
          </div>
          <div>
            <label className={LABEL}>Date</label>
            <input type="date" className={INPUT} value={form.date}
              onChange={e=>setForm(f=>({...f,date:e.target.value}))}/>
          </div>
          <div className="flex gap-2 justify-end pt-1">
            <button onClick={()=>setModal(false)} className={BTN_GHOST}>Cancel</button>
            <button onClick={addEntry} disabled={!form.amount||Number(form.amount)<=0}
              className={`${BTN_PRIMARY} disabled:opacity-40`}>Add</button>
          </div>
        </div>
      </Modal>

      <Modal isOpen={goalModal} onClose={()=>setGoalModal(false)} title={`Goal · ${periodLabel(ref,tf)}`}>
        <div className="space-y-4">
          <div>
            <label className={LABEL}>Savings goal (€)</label>
            <input type="number" step="10" className={INPUT} placeholder="500"
              value={goalAmount} onChange={e=>setGoalAmount(e.target.value)} autoFocus/>
          </div>
          <div className="flex gap-2 justify-end">
            <button onClick={()=>setGoalModal(false)} className={BTN_GHOST}>Cancel</button>
            <button onClick={saveGoal} className={BTN_PRIMARY}>Save</button>
          </div>
        </div>
      </Modal>

      <Modal isOpen={balanceModal} onClose={()=>setBalanceModal(false)} title={`Edit balance · ${accInfo.label}`}>
        <div className="space-y-4">
          <div>
            <label className={LABEL}>Actual balance (€)</label>
            <input type="number" step="0.01" className={INPUT} placeholder="0.00"
              value={newBalance} onChange={e=>setNewBalance(e.target.value)} autoFocus/>
          </div>
          <p className="text-xs text-gray-500">This recalibrates the baseline without modifying history.</p>
          <div className="flex gap-2 justify-end">
            <button onClick={()=>setBalanceModal(false)} className={BTN_GHOST}>Cancel</button>
            <button onClick={saveBalance} className={BTN_PRIMARY}>Save</button>
          </div>
        </div>
      </Modal>
    </div>
  );
}

export default function Budget() {
  const settings = getItem<UserSettings>('myne:settings', { name: '', accentColor: '#6366f1' });
  const [unlocked, setUnlocked] = useState(() => !settings.budgetPin);
  if (!unlocked && settings.budgetPin) {
    return <PinLock storedHash={settings.budgetPin} onUnlock={() => setUnlocked(true)} />;
  }
  return <BudgetContent />;
}
