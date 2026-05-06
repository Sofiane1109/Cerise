import { useState, useMemo } from 'react';
import type { WellbeingLog } from '../types';
import { getItem, setItem } from '../utils/storage';
import { today, getLast7Days, shortDay } from '../utils/helpers';
import { Rating, TOOLTIP_STYLE } from '../components/ui';
import { Moon, Zap, Heart, Sun, TrendingUp } from 'lucide-react';
import { LineChart, Line, XAxis, YAxis, ResponsiveContainer, Tooltip, Legend } from 'recharts';

const MOOD_EMOJI   = ['', '😔', '😕', '😐', '🙂', '😊'];
const ENERGY_EMOJI = ['', '😴', '😑', '🙂', '⚡', '🚀'];
const SLEEP_EMOJI  = ['', '💤', '😴', '😐', '😊', '⭐'];
const MOOD_LABELS  = ['', 'Terrible', 'Bad', 'Okay', 'Good', 'Great'];
const ENERGY_LABELS= ['', 'Exhausted', 'Tired', 'Okay', 'Energized', 'Supercharged'];
const SLEEP_LABELS = ['', 'Terrible', 'Poor', 'Fair', 'Good', 'Excellent'];

export default function Wellbeing() {
  const [logs, setLogs] = useState<WellbeingLog[]>(() => getItem('myne:wellbeing', []));

  const todayStr  = today();
  const todayLog  = logs.find(l => l.date === todayStr);

  const [form, setForm] = useState({
    sleepDuration: todayLog?.sleepDuration ?? 7,
    sleepQuality:  todayLog?.sleepQuality  ?? 0,
    mood:          todayLog?.mood          ?? 0,
    energy:        todayLog?.energy        ?? 0,
  });

  const saveLogs = (list: WellbeingLog[]) => { setLogs(list); setItem('myne:wellbeing', list); };

  const save = () => {
    if (!form.mood || !form.energy || !form.sleepQuality) return;
    const entry: WellbeingLog = { date: todayStr, ...form };
    saveLogs([...logs.filter(l => l.date !== todayStr), entry]);
  };

  const last7 = getLast7Days();
  const chartData = useMemo(() => last7.map(d => {
    const l = logs.find(x => x.date === d);
    return {
      day:          shortDay(d),
      mood:         l?.mood          ?? null,
      energy:       l?.energy        ?? null,
      sleepQuality: l?.sleepQuality  ?? null,
      sleep:        l?.sleepDuration ?? null,
    };
  }), [logs, last7]);

  const sorted = useMemo(() => [...logs].sort((a, b) => b.date.localeCompare(a.date)), [logs]);

  const avgs = useMemo(() => {
    const recent = sorted.slice(0, 7);
    if (!recent.length) return null;
    return {
      mood:   +(recent.reduce((s, l) => s + l.mood, 0) / recent.length).toFixed(1),
      energy: +(recent.reduce((s, l) => s + l.energy, 0) / recent.length).toFixed(1),
      sleep:  +(recent.reduce((s, l) => s + l.sleepDuration, 0) / recent.length).toFixed(1),
    };
  }, [sorted]);

  return (
    <div className="p-6 space-y-6 max-w-4xl mx-auto">
      {/* Header */}
      <div>
        <h1 className="text-xl font-bold text-white">Well-being</h1>
        <p className="text-gray-500 text-sm mt-0.5">{new Date().toLocaleDateString('en-US', { weekday: 'long', month: 'long', day: 'numeric' })}</p>
      </div>

      {/* 7-day averages */}
      {avgs && (
        <div className="grid grid-cols-3 gap-4">
          {[
            { label: '7d avg mood',   value: `${MOOD_EMOJI[Math.round(avgs.mood)]} ${avgs.mood}`, icon: <Heart size={16} className="text-pink-400" />,   bg: 'bg-pink-500/10' },
            { label: '7d avg energy', value: `${ENERGY_EMOJI[Math.round(avgs.energy)]} ${avgs.energy}`, icon: <Zap size={16} className="text-amber-400" />,   bg: 'bg-amber-500/10' },
            { label: '7d avg sleep',  value: `${avgs.sleep}h`,                                   icon: <Moon size={16} className="text-indigo-400" />, bg: 'bg-indigo-500/10' },
          ].map(({ label, value, icon, bg }) => (
            <div key={label} className={`${bg} rounded-xl p-4 border border-gray-800`}>
              <div className="flex items-center gap-1.5 mb-2">{icon}<span className="text-xs text-gray-500">{label}</span></div>
              <p className="text-xl font-bold text-white">{value}</p>
            </div>
          ))}
        </div>
      )}

      {/* Today's log */}
      <div className="bg-gray-900 border border-gray-800 rounded-xl p-5">
        <div className="flex items-center gap-2 mb-5">
          <Sun size={18} className="text-amber-400" />
          <h2 className="font-semibold text-white">Today's Check-in</h2>
          {todayLog && <span className="text-xs bg-green-500/10 text-green-400 px-2 py-0.5 rounded-full border border-green-900/50">Logged</span>}
        </div>

        <div className="space-y-6">
          {/* Sleep duration */}
          <div>
            <div className="flex items-center justify-between mb-2">
              <label className="text-sm font-medium text-gray-300 flex items-center gap-2"><Moon size={16} className="text-indigo-400" /> Sleep duration</label>
              <span className="text-white font-bold">{form.sleepDuration}h</span>
            </div>
            <input
              type="range"
              min="0" max="14" step="0.5"
              value={form.sleepDuration}
              onChange={e => setForm(f => ({ ...f, sleepDuration: Number(e.target.value) }))}
              className="w-full accent-indigo-500"
            />
            <div className="flex justify-between text-xs text-gray-600 mt-1"><span>0h</span><span>14h</span></div>
          </div>

          {/* Sleep quality */}
          <div>
            <label className="text-sm font-medium text-gray-300 mb-3 flex items-center gap-2 block">
              <Moon size={16} className="text-blue-400" /> Sleep quality
              {form.sleepQuality > 0 && <span className="text-gray-400 font-normal">{SLEEP_EMOJI[form.sleepQuality]} {SLEEP_LABELS[form.sleepQuality]}</span>}
            </label>
            <Rating value={form.sleepQuality} onChange={v => setForm(f => ({ ...f, sleepQuality: v }))} labels={SLEEP_LABELS.slice(1)} />
          </div>

          {/* Mood */}
          <div>
            <label className="text-sm font-medium text-gray-300 mb-3 flex items-center gap-2 block">
              <Heart size={16} className="text-pink-400" /> Mood
              {form.mood > 0 && <span className="text-gray-400 font-normal">{MOOD_EMOJI[form.mood]} {MOOD_LABELS[form.mood]}</span>}
            </label>
            <Rating value={form.mood} onChange={v => setForm(f => ({ ...f, mood: v }))} labels={MOOD_LABELS.slice(1)} />
          </div>

          {/* Energy */}
          <div>
            <label className="text-sm font-medium text-gray-300 mb-3 flex items-center gap-2 block">
              <Zap size={16} className="text-amber-400" /> Energy level
              {form.energy > 0 && <span className="text-gray-400 font-normal">{ENERGY_EMOJI[form.energy]} {ENERGY_LABELS[form.energy]}</span>}
            </label>
            <Rating value={form.energy} onChange={v => setForm(f => ({ ...f, energy: v }))} labels={ENERGY_LABELS.slice(1)} />
          </div>

          <button
            onClick={save}
            disabled={!form.mood || !form.energy || !form.sleepQuality}
            className="w-full px-4 py-2.5 bg-indigo-600 hover:bg-indigo-700 disabled:opacity-40 disabled:cursor-not-allowed text-white text-sm font-medium rounded-lg transition-colors"
          >
            {todayLog ? 'Update Check-in' : 'Save Check-in'}
          </button>
        </div>
      </div>

      {/* Weekly trends */}
      <div className="bg-gray-900 border border-gray-800 rounded-xl p-5">
        <div className="flex items-center gap-2 mb-4">
          <TrendingUp size={18} className="text-indigo-400" />
          <h2 className="font-semibold text-white">7-Day Trends</h2>
        </div>
        <ResponsiveContainer width="100%" height={220}>
          <LineChart data={chartData}>
            <XAxis dataKey="day" tick={{ fill: '#6b7280', fontSize: 12 }} axisLine={false} tickLine={false} />
            <YAxis domain={[0, 5]} ticks={[1, 2, 3, 4, 5]} tick={{ fill: '#6b7280', fontSize: 11 }} axisLine={false} tickLine={false} width={20} />
            <Tooltip contentStyle={TOOLTIP_STYLE} cursor={{ stroke: 'rgba(255,255,255,0.08)' }} />
            <Legend formatter={v => <span style={{ color: '#9ca3af', fontSize: '12px' }}>{v}</span>} />
            <Line type="monotone" dataKey="mood"         name="Mood"          stroke="#ec4899" strokeWidth={2} dot={{ fill: '#ec4899', r: 3 }} connectNulls />
            <Line type="monotone" dataKey="energy"       name="Energy"        stroke="#f59e0b" strokeWidth={2} dot={{ fill: '#f59e0b', r: 3 }} connectNulls />
            <Line type="monotone" dataKey="sleepQuality" name="Sleep quality" stroke="#6366f1" strokeWidth={2} dot={{ fill: '#6366f1', r: 3 }} connectNulls />
          </LineChart>
        </ResponsiveContainer>
      </div>

      {/* Sleep trend */}
      <div className="bg-gray-900 border border-gray-800 rounded-xl p-5">
        <div className="flex items-center gap-2 mb-4">
          <Moon size={18} className="text-indigo-400" />
          <h2 className="font-semibold text-white">Sleep Duration (7 days)</h2>
        </div>
        <ResponsiveContainer width="100%" height={160}>
          <LineChart data={chartData}>
            <XAxis dataKey="day" tick={{ fill: '#6b7280', fontSize: 12 }} axisLine={false} tickLine={false} />
            <YAxis domain={[0, 14]} tick={{ fill: '#6b7280', fontSize: 11 }} axisLine={false} tickLine={false} width={30} unit="h" />
            <Tooltip contentStyle={TOOLTIP_STYLE} cursor={{ stroke: 'rgba(255,255,255,0.08)' }} formatter={(v) => [`${v}h`, 'Sleep']} />
            <Line type="monotone" dataKey="sleep" name="Hours" stroke="#818cf8" strokeWidth={2} dot={{ fill: '#818cf8', r: 4 }} connectNulls />
          </LineChart>
        </ResponsiveContainer>
      </div>

      {/* Recent logs */}
      <div className="bg-gray-900 border border-gray-800 rounded-xl p-5">
        <h2 className="font-semibold text-white mb-4">History</h2>
        {sorted.length === 0 ? (
          <p className="text-gray-500 text-sm text-center py-4">No logs yet — start tracking today!</p>
        ) : (
          <div className="space-y-2">
            {sorted.slice(0, 14).map(l => (
              <div key={l.date} className="flex items-center justify-between p-3 rounded-lg border border-gray-800 hover:border-gray-700 transition-colors flex-wrap gap-2">
                <span className="text-sm text-gray-400">
                  {new Date(l.date + 'T00:00').toLocaleDateString('en-US', { weekday: 'short', month: 'short', day: 'numeric' })}
                </span>
                <div className="flex items-center gap-4 text-sm">
                  <span title="Mood"   >{MOOD_EMOJI[l.mood]}   {l.mood}/5</span>
                  <span title="Energy" >{ENERGY_EMOJI[l.energy]} {l.energy}/5</span>
                  <span title="Sleep"  className="text-indigo-300">{l.sleepDuration}h sleep</span>
                  <span title="Sleep quality" className="text-blue-300">{SLEEP_EMOJI[l.sleepQuality]}</span>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
