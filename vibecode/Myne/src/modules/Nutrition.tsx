import { useState, useMemo, useEffect } from 'react';
import type { NutritionLog, NutritionTargets } from '../types';
import { getItem, setItem } from '../utils/storage';
import { today, getLast7Days, shortDay, toDateStr, parseLocal } from '../utils/helpers';
import { ProgressBar, Modal, INPUT, LABEL, BTN_PRIMARY, BTN_GHOST, TOOLTIP_STYLE } from '../components/ui';
import { Apple, Droplets, Target, Zap, FlameKindling, ChevronLeft, ChevronRight } from 'lucide-react';
import { BarChart, Bar, XAxis, YAxis, ResponsiveContainer, Tooltip, Legend } from 'recharts';

const DEFAULT_TARGETS: NutritionTargets = { calories: 2500, protein: 150, creatine: 5, water: 2500 };

type NutritionKey = Exclude<keyof NutritionLog, 'date'>;
const METRICS: { key: NutritionKey; label: string; unit: string; icon: React.ReactNode; color: string; barColor: string }[] = [
  { key: 'calories', label: 'Calories',  unit: 'kcal', icon: <FlameKindling size={18} className="text-amber-400" />,  color: 'bg-amber-500',  barColor: '#f59e0b' },
  { key: 'protein',  label: 'Protéines', unit: 'g',    icon: <Zap size={18} className="text-blue-400" />,             color: 'bg-blue-500',   barColor: '#3b82f6' },
  { key: 'water',    label: 'Eau',       unit: 'ml',   icon: <Droplets size={18} className="text-cyan-400" />,        color: 'bg-cyan-500',   barColor: '#06b6d4' },
  { key: 'creatine', label: 'Créatine',  unit: 'g',    icon: <Apple size={18} className="text-purple-400" />,         color: 'bg-purple-500', barColor: '#a855f7' },
];

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

  // Sync form when logDate changes
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

  const pct = (val: number, target: number) => target > 0 ? Math.round((val / target) * 100) : 0;
  const displayLog = logs.find(l => l.date === logDate);

  return (
    <div className="p-6 space-y-6 max-w-4xl mx-auto">
      {/* Header */}
      <div className="flex items-center justify-between flex-wrap gap-3">
        <div>
          <h1 className="text-xl font-bold text-white">Nutrition</h1>
          <p className="text-gray-500 text-sm mt-0.5">{new Date().toLocaleDateString('fr-FR', { weekday: 'long', month: 'long', day: 'numeric' })}</p>
        </div>
        <button onClick={() => { setTargetsForm({ ...targets }); setShowTargets(true); }}
          className="flex items-center gap-2 px-3 py-2 bg-gray-800 hover:bg-gray-700 text-gray-300 text-sm rounded-lg transition-colors">
          <Target size={16} /> Objectifs
        </button>
      </div>

      {/* Log input */}
      <div className="bg-gray-900 border border-gray-800 rounded-xl p-5">
        {/* Date navigator */}
        <div className="flex items-center justify-between mb-4">
          <h2 className="font-semibold text-white">Saisir {isToday ? "aujourd'hui" : parseLocal(logDate).toLocaleDateString('fr-FR', { weekday: 'long', day: 'numeric', month: 'long' })}</h2>
          <div className="flex items-center gap-2">
            <button onClick={() => shiftDate(-1)} className="w-7 h-7 flex items-center justify-center rounded-lg bg-gray-800 hover:bg-gray-700 text-gray-300 transition-colors">
              <ChevronLeft size={14} />
            </button>
            <input
              type="date"
              className="text-xs bg-gray-800 border border-gray-700 rounded-lg px-2 py-1.5 text-white focus:outline-none focus:border-[var(--accent)] transition-colors"
              value={logDate}
              max={todayStr}
              onChange={e => { if (e.target.value <= todayStr) setLogDate(e.target.value); }}
            />
            <button onClick={() => shiftDate(1)} disabled={isToday}
              className="w-7 h-7 flex items-center justify-center rounded-lg bg-gray-800 hover:bg-gray-700 text-gray-300 transition-colors disabled:opacity-30">
              <ChevronRight size={14} />
            </button>
            {!isToday && (
              <button onClick={() => setLogDate(todayStr)} className="text-xs px-2 py-1 rounded-lg bg-gray-800 hover:bg-gray-700 text-gray-400 transition-colors">
                Auj.
              </button>
            )}
          </div>
        </div>
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 mb-5">
          {METRICS.map(({ key, label, unit, icon }) => (
            <div key={key}>
              <label className={`${LABEL} flex items-center gap-1.5`}>{icon} {label}</label>
              <div className="relative">
                <input type="number" className={INPUT} placeholder="0" value={form[key] || ''}
                  onChange={e => setForm(f => ({ ...f, [key]: Number(e.target.value) || 0 }))} />
                <span className="absolute right-3 top-1/2 -translate-y-1/2 text-xs text-gray-500">{unit}</span>
              </div>
            </div>
          ))}
        </div>
        <button onClick={saveLog} className={`${BTN_PRIMARY} w-full`}>
          {displayLog ? 'Mettre à jour' : 'Enregistrer'}
        </button>
      </div>

      {/* Progress */}
      <div className="bg-gray-900 border border-gray-800 rounded-xl p-5">
        <h2 className="font-semibold text-white mb-5">Progression {isToday ? "du jour" : parseLocal(logDate).toLocaleDateString('fr-FR', { weekday: 'long' })}</h2>
        <div className="space-y-5">
          {METRICS.map(({ key, label, unit, color }) => {
            const val = displayLog?.[key] ?? 0;
            const target = targets[key];
            const p = pct(val, target);
            return (
              <div key={key}>
                <div className="flex justify-between items-baseline mb-2">
                  <span className="text-sm text-gray-300 font-medium">{label}</span>
                  <div className="flex items-baseline gap-1">
                    <span className="text-lg font-bold text-white">{val}</span>
                    <span className="text-xs text-gray-500">/ {target} {unit}</span>
                    <span className={`text-xs ml-2 font-medium ${p >= 100 ? 'text-green-400' : p >= 75 ? 'text-amber-400' : 'text-gray-500'}`}>{p}%</span>
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
        <h2 className="font-semibold text-white mb-4">7 derniers jours</h2>
        <ResponsiveContainer width="100%" height={220}>
          <BarChart data={chartData} barSize={18} barCategoryGap="35%">
            <XAxis dataKey="day" tick={{ fill: '#6b7280', fontSize: 12 }} axisLine={false} tickLine={false} />
            <YAxis yAxisId="cal" tick={{ fill: '#6b7280', fontSize: 11 }} axisLine={false} tickLine={false} width={45} />
            <YAxis yAxisId="prot" orientation="right" tick={{ fill: '#6b7280', fontSize: 11 }} axisLine={false} tickLine={false} width={35} />
            <Tooltip contentStyle={TOOLTIP_STYLE} cursor={{ fill: 'rgba(255,255,255,0.04)' }} />
            <Legend formatter={v => <span style={{ color: '#9ca3af', fontSize: '12px' }}>{v}</span>} />
            <Bar yAxisId="cal"  dataKey="calories" name="Calories (kcal)" fill="#f59e0b" radius={[4, 4, 0, 0]} />
            <Bar yAxisId="prot" dataKey="protein"  name="Protéines (g)"   fill="#3b82f6" radius={[4, 4, 0, 0]} />
          </BarChart>
        </ResponsiveContainer>
      </div>

      {/* History */}
      <div className="bg-gray-900 border border-gray-800 rounded-xl p-5">
        <h2 className="font-semibold text-white mb-4">Historique</h2>
        {logs.length === 0 ? (
          <p className="text-gray-500 text-sm text-center py-4">Aucune entrée</p>
        ) : (
          <div className="space-y-2">
            {[...logs].sort((a, b) => b.date.localeCompare(a.date)).slice(0, 14).map(l => (
              <button key={l.date} onClick={() => setLogDate(l.date)}
                className={`w-full flex items-center justify-between p-3 rounded-lg border text-sm transition-colors ${l.date === logDate ? 'border-[var(--accent)] bg-gray-800' : 'border-gray-800 hover:border-gray-700'}`}>
                <span className="text-gray-400">{parseLocal(l.date).toLocaleDateString('fr-FR', { weekday: 'short', month: 'short', day: 'numeric' })}</span>
                <div className="flex gap-4 text-xs text-gray-300 flex-wrap justify-end">
                  <span className="text-amber-400">{l.calories} kcal</span>
                  <span className="text-blue-400">{l.protein}g prot.</span>
                  <span className="text-cyan-400">{l.water}ml eau</span>
                </div>
              </button>
            ))}
          </div>
        )}
      </div>

      {/* Targets modal */}
      <Modal isOpen={showTargets} onClose={() => setShowTargets(false)} title="Objectifs journaliers">
        <div className="space-y-4">
          {METRICS.map(({ key, label, unit, icon }) => (
            <div key={key}>
              <label className={`${LABEL} flex items-center gap-1.5`}>{icon} {label} ({unit})</label>
              <input type="number" className={INPUT} value={targetsForm[key]}
                onChange={e => setTargetsForm(f => ({ ...f, [key]: Number(e.target.value) || 0 }))} />
            </div>
          ))}
          <div className="flex gap-2 justify-end pt-2">
            <button onClick={() => setShowTargets(false)} className={BTN_GHOST}>Annuler</button>
            <button onClick={saveTargets} className={BTN_PRIMARY}>Enregistrer</button>
          </div>
        </div>
      </Modal>
    </div>
  );
}
