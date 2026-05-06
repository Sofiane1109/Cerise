import { useState, useMemo } from 'react';
import type { NutritionLog, NutritionTargets } from '../types';
import { getItem, setItem } from '../utils/storage';
import { today, getLast7Days, shortDay } from '../utils/helpers';
import { ProgressBar, Modal, INPUT, LABEL, BTN_PRIMARY, BTN_GHOST, TOOLTIP_STYLE } from '../components/ui';
import { Apple, Droplets, Target, Zap, FlameKindling } from 'lucide-react';
import { BarChart, Bar, XAxis, YAxis, ResponsiveContainer, Tooltip, Legend } from 'recharts';

const DEFAULT_TARGETS: NutritionTargets = { calories: 2500, protein: 150, creatine: 5, water: 2500 };

type NutritionKey = Exclude<keyof NutritionLog, 'date'>;
const METRICS: { key: NutritionKey; label: string; unit: string; icon: React.ReactNode; color: string; barColor: string }[] = [
  { key: 'calories', label: 'Calories',  unit: 'kcal', icon: <FlameKindling size={18} className="text-amber-400" />,  color: 'bg-amber-500',  barColor: '#f59e0b' },
  { key: 'protein',  label: 'Protein',   unit: 'g',    icon: <Zap size={18} className="text-blue-400" />,             color: 'bg-blue-500',   barColor: '#3b82f6' },
  { key: 'water',    label: 'Water',     unit: 'ml',   icon: <Droplets size={18} className="text-cyan-400" />,        color: 'bg-cyan-500',   barColor: '#06b6d4' },
  { key: 'creatine', label: 'Creatine',  unit: 'g',    icon: <Apple size={18} className="text-purple-400" />,         color: 'bg-purple-500', barColor: '#a855f7' },
];

export default function Nutrition() {
  const [logs, setLogs]       = useState<NutritionLog[]>(() => getItem('myne:nutrition', []));
  const [targets, setTargets] = useState<NutritionTargets>(() => getItem('myne:nutrition:targets', DEFAULT_TARGETS));
  const [showTargets, setShowTargets] = useState(false);
  const [targetsForm, setTargetsForm] = useState<NutritionTargets>({ ...targets });

  const todayStr  = today();
  const todayLog  = logs.find(l => l.date === todayStr);
  const [form, setForm] = useState<Omit<NutritionLog, 'date'>>({
    calories: todayLog?.calories ?? 0,
    protein:  todayLog?.protein  ?? 0,
    creatine: todayLog?.creatine ?? 0,
    water:    todayLog?.water    ?? 0,
  });

  const saveLogs = (list: NutritionLog[]) => { setLogs(list); setItem('myne:nutrition', list); };

  const saveToday = () => {
    const updated: NutritionLog = { date: todayStr, ...form };
    saveLogs([...logs.filter(l => l.date !== todayStr), updated]);
  };

  const saveTargets = () => {
    setTargets(targetsForm);
    setItem('myne:nutrition:targets', targetsForm);
    setShowTargets(false);
  };

  const last7 = getLast7Days();
  const chartData = useMemo(() => last7.map(d => {
    const l = logs.find(x => x.date === d);
    return { day: shortDay(d), calories: l?.calories ?? 0, protein: l?.protein ?? 0 };
  }), [logs, last7]);

  const pct = (val: number, target: number) => target > 0 ? Math.round((val / target) * 100) : 0;

  return (
    <div className="p-6 space-y-6 max-w-4xl mx-auto">
      {/* Header */}
      <div className="flex items-center justify-between flex-wrap gap-3">
        <div>
          <h1 className="text-xl font-bold text-white">Nutrition</h1>
          <p className="text-gray-500 text-sm mt-0.5">{new Date().toLocaleDateString('en-US', { weekday: 'long', month: 'long', day: 'numeric' })}</p>
        </div>
        <button onClick={() => { setTargetsForm({ ...targets }); setShowTargets(true); }} className="flex items-center gap-2 px-3 py-2 bg-gray-800 hover:bg-gray-700 text-gray-300 text-sm rounded-lg transition-colors">
          <Target size={16} /> Targets
        </button>
      </div>

      {/* Today's input */}
      <div className="bg-gray-900 border border-gray-800 rounded-xl p-5">
        <h2 className="font-semibold text-white mb-4">Log Today</h2>
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 mb-5">
          {METRICS.map(({ key, label, unit, icon }) => (
            <div key={key}>
              <label className={`${LABEL} flex items-center gap-1.5`}>{icon} {label}</label>
              <div className="relative">
                <input
                  type="number"
                  className={INPUT}
                  placeholder="0"
                  value={form[key] || ''}
                  onChange={e => setForm(f => ({ ...f, [key]: Number(e.target.value) || 0 }))}
                />
                <span className="absolute right-3 top-1/2 -translate-y-1/2 text-xs text-gray-500">{unit}</span>
              </div>
            </div>
          ))}
        </div>
        <button onClick={saveToday} className={`${BTN_PRIMARY} w-full`}>
          {todayLog ? 'Update Today\'s Log' : 'Save Today\'s Log'}
        </button>
      </div>

      {/* Progress */}
      <div className="bg-gray-900 border border-gray-800 rounded-xl p-5">
        <h2 className="font-semibold text-white mb-5">Daily Progress</h2>
        <div className="space-y-5">
          {METRICS.map(({ key, label, unit, color }) => {
            const val = todayLog?.[key] ?? 0;
            const target = targets[key];
            const p = pct(val, target);
            return (
              <div key={key}>
                <div className="flex justify-between items-baseline mb-2">
                  <span className="text-sm text-gray-300 font-medium">{label}</span>
                  <div className="flex items-baseline gap-1">
                    <span className="text-lg font-bold text-white">{val}</span>
                    <span className="text-xs text-gray-500">/ {target} {unit}</span>
                    <span className={`text-xs ml-2 font-medium ${p >= 100 ? 'text-green-400' : p >= 75 ? 'text-amber-400' : 'text-gray-500'}`}>
                      {p}%
                    </span>
                  </div>
                </div>
                <ProgressBar value={p} color={color} height="h-3" />
              </div>
            );
          })}
        </div>
      </div>

      {/* Weekly chart */}
      <div className="bg-gray-900 border border-gray-800 rounded-xl p-5">
        <h2 className="font-semibold text-white mb-4">Last 7 Days</h2>
        <ResponsiveContainer width="100%" height={220}>
          <BarChart data={chartData} barSize={18} barCategoryGap="35%">
            <XAxis dataKey="day" tick={{ fill: '#6b7280', fontSize: 12 }} axisLine={false} tickLine={false} />
            <YAxis yAxisId="cal" tick={{ fill: '#6b7280', fontSize: 11 }} axisLine={false} tickLine={false} width={45} />
            <YAxis yAxisId="prot" orientation="right" tick={{ fill: '#6b7280', fontSize: 11 }} axisLine={false} tickLine={false} width={35} />
            <Tooltip contentStyle={TOOLTIP_STYLE} cursor={{ fill: 'rgba(255,255,255,0.04)' }} />
            <Legend formatter={v => <span style={{ color: '#9ca3af', fontSize: '12px' }}>{v}</span>} />
            <Bar yAxisId="cal"  dataKey="calories" name="Calories (kcal)" fill="#f59e0b" radius={[4, 4, 0, 0]} />
            <Bar yAxisId="prot" dataKey="protein"  name="Protein (g)"    fill="#3b82f6" radius={[4, 4, 0, 0]} />
          </BarChart>
        </ResponsiveContainer>
      </div>

      {/* Recent logs */}
      <div className="bg-gray-900 border border-gray-800 rounded-xl p-5">
        <h2 className="font-semibold text-white mb-4">History</h2>
        {logs.length === 0 ? (
          <p className="text-gray-500 text-sm text-center py-4">No logs yet</p>
        ) : (
          <div className="space-y-2">
            {[...logs].sort((a, b) => b.date.localeCompare(a.date)).slice(0, 10).map(l => (
              <div key={l.date} className="flex items-center justify-between p-3 rounded-lg border border-gray-800 text-sm">
                <span className="text-gray-400">{new Date(l.date + 'T00:00').toLocaleDateString('en-US', { weekday: 'short', month: 'short', day: 'numeric' })}</span>
                <div className="flex gap-4 text-xs text-gray-300 flex-wrap justify-end">
                  <span className="text-amber-400">{l.calories} kcal</span>
                  <span className="text-blue-400">{l.protein}g protein</span>
                  <span className="text-cyan-400">{l.water}ml water</span>
                  <span className="text-purple-400">{l.creatine}g creatine</span>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Targets modal */}
      <Modal isOpen={showTargets} onClose={() => setShowTargets(false)} title="Daily Targets">
        <div className="space-y-4">
          {METRICS.map(({ key, label, unit, icon }) => (
            <div key={key}>
              <label className={`${LABEL} flex items-center gap-1.5`}>{icon} {label} ({unit})</label>
              <input
                type="number"
                className={INPUT}
                value={targetsForm[key]}
                onChange={e => setTargetsForm(f => ({ ...f, [key]: Number(e.target.value) || 0 }))}
              />
            </div>
          ))}
          <div className="flex gap-2 justify-end pt-2">
            <button onClick={() => setShowTargets(false)} className={BTN_GHOST}>Cancel</button>
            <button onClick={saveTargets} className={BTN_PRIMARY}>Save Targets</button>
          </div>
        </div>
      </Modal>
    </div>
  );
}
