import { useState, useMemo, useEffect } from 'react';
import type { NutritionLog, NutritionTargets } from '../types';
import { getItem, setItem } from '../utils/storage';
import { today, getLast7Days, shortDay, toDateStr, parseLocal } from '../utils/helpers';
import { Modal, INPUT, LABEL, BTN_PRIMARY, BTN_GHOST, TOOLTIP_STYLE } from '../components/ui';
import { Apple, Droplets, Target, Zap, FlameKindling, ChevronLeft, ChevronRight } from 'lucide-react';
import { BarChart, Bar, XAxis, YAxis, ResponsiveContainer, Tooltip, Legend } from 'recharts';

const DEFAULT_TARGETS: NutritionTargets = { calories: 2500, protein: 150, creatine: 5, water: 2500 };

type NutritionKey = Exclude<keyof NutritionLog, 'date'>;

const METRICS: {
  key: NutritionKey;
  label: string;
  unit: string;
  icon: React.ReactNode;
  color: string;
  barColor: string;
  glow: string;
}[] = [
  { key: 'calories', label: 'Calories', unit: 'kcal', icon: <FlameKindling size={20} />, color: 'bg-amber-500',  barColor: '#f59e0b', glow: 'rgba(245,158,11,0.3)'  },
  { key: 'protein',  label: 'Protein',  unit: 'g',    icon: <Zap size={20} />,            color: 'bg-blue-500',   barColor: '#3b82f6', glow: 'rgba(59,130,246,0.3)'  },
  { key: 'water',    label: 'Water',    unit: 'ml',   icon: <Droplets size={20} />,       color: 'bg-cyan-500',   barColor: '#06b6d4', glow: 'rgba(6,182,212,0.3)'   },
  { key: 'creatine', label: 'Creatine', unit: 'g',    icon: <Apple size={20} />,          color: 'bg-purple-500', barColor: '#a855f7', glow: 'rgba(168,85,247,0.3)'  },
];

const GLASS: React.CSSProperties = {
  background: 'rgba(255,255,255,0.03)',
  border: '1px solid rgba(255,255,255,0.07)',
  backdropFilter: 'blur(16px)',
  WebkitBackdropFilter: 'blur(16px)',
  borderRadius: 16,
};

export default function Nutrition() {
  const [logs, setLogs]       = useState<NutritionLog[]>(() => getItem('myne:nutrition', []));
  const [targets, setTargets] = useState<NutritionTargets>(() => getItem('myne:nutrition:targets', DEFAULT_TARGETS));
  const [showTargets, setShowTargets] = useState(false);
  const [targetsForm, setTargetsForm] = useState<NutritionTargets>({ ...targets });

  const todayStr  = today();
  const [logDate, setLogDate] = useState(todayStr);
  const isToday = logDate === todayStr;

  const dateLog = logs.find(l => l.date === logDate);
  const [form, setForm] = useState<Omit<NutritionLog, 'date'>>({
    calories: dateLog?.calories ?? 0,
    protein:  dateLog?.protein  ?? 0,
    creatine: dateLog?.creatine ?? 0,
    water:    dateLog?.water    ?? 0,
  });

  useEffect(() => {
    const l = logs.find(x => x.date === logDate);
    setForm({ calories: l?.calories ?? 0, protein: l?.protein ?? 0, creatine: l?.creatine ?? 0, water: l?.water ?? 0 });
  }, [logDate, logs]);

  const saveLogs = (list: NutritionLog[]) => { setLogs(list); setItem('myne:nutrition', list); };

  const saveLog = () => {
    const updated: NutritionLog = { date: logDate, ...form };
    saveLogs([...logs.filter(l => l.date !== logDate), updated]);
  };

  const saveTargets = () => {
    setTargets(targetsForm);
    setItem('myne:nutrition:targets', targetsForm);
    setShowTargets(false);
  };

  const shiftDate = (days: number) => {
    const d = parseLocal(logDate);
    d.setDate(d.getDate() + days);
    const next = toDateStr(d);
    if (next <= todayStr) setLogDate(next);
  };

  const last7 = getLast7Days();
  const chartData = useMemo(() => last7.map(d => {
    const l = logs.find(x => x.date === d);
    return { day: shortDay(d), calories: l?.calories ?? 0, protein: l?.protein ?? 0 };
  }), [logs, last7]);

  const pct = (val: number, target: number) => target > 0 ? Math.min(100, Math.round((val / target) * 100)) : 0;
  const displayLog = logs.find(l => l.date === logDate);

  return (
    <div className="p-6 space-y-6 max-w-4xl mx-auto">

      {/* Header */}
      <div className="flex items-center justify-between flex-wrap gap-3">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl flex items-center justify-center shrink-0"
            style={{ background: 'rgba(245,158,11,0.12)', border: '1px solid rgba(245,158,11,0.25)' }}>
            <FlameKindling size={18} className="text-amber-400" />
          </div>
          <div>
            <h1 className="text-xl font-bold text-white">Nutrition</h1>
            <p className="text-gray-500 text-sm">{new Date().toLocaleDateString('en-GB', { weekday: 'long', month: 'long', day: 'numeric' })}</p>
          </div>
        </div>
        <button onClick={() => { setTargetsForm({ ...targets }); setShowTargets(true); }}
          className="flex items-center gap-2 px-3 py-2 rounded-lg text-sm text-gray-300 transition-colors hover:text-white"
          style={{ background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.08)' }}>
          <Target size={15} /> Goals
        </button>
      </div>

      {/* Metric stat cards */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        {METRICS.map(({ key, label, unit, barColor, glow }) => {
          const val = displayLog?.[key] ?? 0;
          const p   = pct(val, targets[key]);
          return (
            <div key={key} className="p-4" style={GLASS}>
              <p className="text-xs font-medium text-gray-500 mb-1">{label}</p>
              <p className="text-2xl font-bold text-white">{val}</p>
              <p className="text-xs text-gray-600 mb-2">{unit}</p>
              <div className="h-1 rounded-full overflow-hidden" style={{ background: 'rgba(255,255,255,0.06)' }}>
                <div className="h-full rounded-full transition-all duration-500"
                  style={{ width: `${p}%`, backgroundColor: barColor, boxShadow: `0 0 8px ${glow}` }} />
              </div>
              <p className="text-xs mt-1" style={{ color: barColor }}>{p}%</p>
            </div>
          );
        })}
      </div>

      {/* Log input */}
      <div className="p-5" style={GLASS}>
        {/* Date navigator */}
        <div className="flex items-center justify-between mb-5">
          <h2 className="font-semibold text-white">
            Log for {isToday ? 'today' : parseLocal(logDate).toLocaleDateString('en-GB', { weekday: 'long', day: 'numeric', month: 'long' })}
          </h2>
          <div className="flex items-center gap-2">
            <button onClick={() => shiftDate(-1)}
              className="w-7 h-7 flex items-center justify-center rounded-lg text-gray-300 transition-colors hover:text-white"
              style={{ background: 'rgba(255,255,255,0.06)' }}>
              <ChevronLeft size={14} />
            </button>
            <input type="date"
              className="text-xs rounded-lg px-2 py-1.5 text-white focus:outline-none transition-colors"
              style={{ background: 'rgba(255,255,255,0.06)', border: '1px solid rgba(255,255,255,0.08)' }}
              value={logDate} max={todayStr}
              onChange={e => { if (e.target.value <= todayStr) setLogDate(e.target.value); }} />
            <button onClick={() => shiftDate(1)} disabled={isToday}
              className="w-7 h-7 flex items-center justify-center rounded-lg text-gray-300 transition-colors hover:text-white disabled:opacity-30"
              style={{ background: 'rgba(255,255,255,0.06)' }}>
              <ChevronRight size={14} />
            </button>
            {!isToday && (
              <button onClick={() => setLogDate(todayStr)}
                className="text-xs px-2 py-1 rounded-lg text-gray-400 hover:text-white transition-colors"
                style={{ background: 'rgba(255,255,255,0.06)' }}>
                Today
              </button>
            )}
          </div>
        </div>

        <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 mb-5">
          {METRICS.map(({ key, label, unit, icon, barColor }) => (
            <div key={key}>
              <label className="flex items-center gap-1.5 text-xs font-medium mb-1.5" style={{ color: barColor }}>
                {icon} {label}
              </label>
              <div className="relative">
                <input type="number"
                  className="w-full rounded-lg px-3 py-2 text-sm text-white focus:outline-none transition-all"
                  style={{ background: 'rgba(255,255,255,0.05)', border: `1px solid rgba(255,255,255,0.08)` }}
                  placeholder="0" value={form[key] || ''}
                  onChange={e => setForm(f => ({ ...f, [key]: Number(e.target.value) || 0 }))} />
                <span className="absolute right-3 top-1/2 -translate-y-1/2 text-xs text-gray-600">{unit}</span>
              </div>
            </div>
          ))}
        </div>
        <button onClick={saveLog} className={`${BTN_PRIMARY} w-full`}>
          {displayLog ? 'Update' : 'Save'}
        </button>
      </div>

      {/* Weekly chart */}
      <div className="p-5" style={GLASS}>
        <h2 className="font-semibold text-white mb-4">Last 7 days</h2>
        <ResponsiveContainer width="100%" height={200}>
          <BarChart data={chartData} barSize={16} barCategoryGap="35%">
            <XAxis dataKey="day" tick={{ fill: '#6b7280', fontSize: 12 }} axisLine={false} tickLine={false} />
            <YAxis yAxisId="cal" tick={{ fill: '#6b7280', fontSize: 11 }} axisLine={false} tickLine={false} width={40} />
            <YAxis yAxisId="prot" orientation="right" tick={{ fill: '#6b7280', fontSize: 11 }} axisLine={false} tickLine={false} width={30} />
            <Tooltip contentStyle={TOOLTIP_STYLE} cursor={{ fill: 'rgba(255,255,255,0.03)' }} />
            <Legend formatter={v => <span style={{ color: '#9ca3af', fontSize: '12px' }}>{v}</span>} />
            <Bar yAxisId="cal"  dataKey="calories" name="Calories (kcal)" fill="#f59e0b" radius={[4, 4, 0, 0]} />
            <Bar yAxisId="prot" dataKey="protein"  name="Protein (g)"     fill="#3b82f6" radius={[4, 4, 0, 0]} />
          </BarChart>
        </ResponsiveContainer>
      </div>

      {/* History */}
      <div className="p-5" style={GLASS}>
        <h2 className="font-semibold text-white mb-4">History</h2>
        {logs.length === 0 ? (
          <p className="text-gray-500 text-sm text-center py-4">No entries</p>
        ) : (
          <div className="space-y-2">
            {[...logs].sort((a, b) => b.date.localeCompare(a.date)).slice(0, 14).map(l => (
              <button key={l.date} onClick={() => setLogDate(l.date)}
                className="w-full flex items-center justify-between px-4 py-3 rounded-xl text-sm transition-all"
                style={l.date === logDate
                  ? { border: '1px solid var(--accent)', background: 'rgba(99,102,241,0.1)' }
                  : { border: '1px solid rgba(255,255,255,0.05)', background: 'rgba(255,255,255,0.02)' }}>
                <span className="text-gray-400">
                  {parseLocal(l.date).toLocaleDateString('en-GB', { weekday: 'short', month: 'short', day: 'numeric' })}
                </span>
                <div className="flex gap-4 text-xs flex-wrap justify-end">
                  <span className="text-amber-400 font-medium">{l.calories} kcal</span>
                  <span className="text-blue-400 font-medium">{l.protein}g prot.</span>
                  <span className="text-cyan-400 font-medium">{l.water}ml water</span>
                </div>
              </button>
            ))}
          </div>
        )}
      </div>

      {/* Goals modal */}
      <Modal isOpen={showTargets} onClose={() => setShowTargets(false)} title="Daily goals">
        <div className="space-y-4">
          {METRICS.map(({ key, label, unit, icon, barColor }) => (
            <div key={key}>
              <label className={`${LABEL} flex items-center gap-1.5`} style={{ color: barColor }}>{icon} {label} ({unit})</label>
              <input type="number" className={INPUT} value={targetsForm[key]}
                onChange={e => setTargetsForm(f => ({ ...f, [key]: Number(e.target.value) || 0 }))} />
            </div>
          ))}
          <div className="flex gap-2 justify-end pt-2">
            <button onClick={() => setShowTargets(false)} className={BTN_GHOST}>Cancel</button>
            <button onClick={saveTargets} className={BTN_PRIMARY}>Save</button>
          </div>
        </div>
      </Modal>
    </div>
  );
}
