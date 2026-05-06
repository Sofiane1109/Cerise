import { useMemo } from 'react';
import type { ModuleId, Task, NutritionLog, NutritionTargets, CalendarEvent, WellbeingLog, BudgetEntry } from '../types';
import { getItem } from '../utils/storage';
import { today, parseLocal, getLast7Days, shortDay } from '../utils/helpers';
import { Card, ProgressBar } from '../components/ui';
import { Flame, CheckSquare, Apple, Heart, Wallet, Calendar, ChevronRight, Moon, Zap } from 'lucide-react';
import { BarChart, Bar, XAxis, YAxis, ResponsiveContainer, Tooltip } from 'recharts';

const DEFAULT_TARGETS: NutritionTargets = { calories: 2500, protein: 150, creatine: 5, water: 2500 };
const MOOD_EMOJI = ['', '😔', '😕', '😐', '🙂', '😊'];
const ENERGY_EMOJI = ['', '😴', '😑', '🙂', '⚡', '🚀'];
const TOOLTIP = { backgroundColor: '#1f2937', border: '1px solid #374151', borderRadius: '8px', color: '#f3f4f6', fontSize: '12px' };

function greeting(): string {
  const h = new Date().getHours();
  if (h < 12) return 'Good morning';
  if (h < 18) return 'Good afternoon';
  return 'Good evening';
}

function calcStreak(logs: WellbeingLog[]): number {
  const dates = new Set(logs.map(l => l.date));
  let streak = 0;
  const d = new Date();
  while (dates.has(`${d.getFullYear()}-${String(d.getMonth()+1).padStart(2,'0')}-${String(d.getDate()).padStart(2,'0')}`)) {
    streak++;
    d.setDate(d.getDate() - 1);
  }
  return streak;
}

interface StatCardProps {
  icon: React.ReactNode;
  label: string;
  value: string;
  sub?: string;
  accent: string;
  onClick?: () => void;
}
function StatCard({ icon, label, value, sub, accent, onClick }: StatCardProps) {
  return (
    <Card onClick={onClick} className="p-5">
      <div className="flex items-start justify-between mb-3">
        <div className={`w-10 h-10 rounded-xl flex items-center justify-center ${accent}`}>
          {icon}
        </div>
        {onClick && <ChevronRight size={16} className="text-gray-600 mt-1" />}
      </div>
      <p className="text-xs text-gray-500 uppercase tracking-wider mb-1">{label}</p>
      <p className="text-2xl font-bold text-white">{value}</p>
      {sub && <p className="text-xs text-gray-500 mt-0.5">{sub}</p>}
    </Card>
  );
}

export default function Dashboard({ onNavigate }: { onNavigate: (id: ModuleId) => void }) {
  const todayStr = today();

  const tasks      = getItem<Task[]>('myne:tasks', []);
  const events     = getItem<CalendarEvent[]>('myne:events', []);
  const nutrition  = getItem<NutritionLog[]>('myne:nutrition', []);
  const targets    = getItem<NutritionTargets>('myne:nutrition:targets', DEFAULT_TARGETS);
  const wellbeing  = getItem<WellbeingLog[]>('myne:wellbeing', []);
  const budget     = getItem<BudgetEntry[]>('myne:budget:entries', []);

  const todayNutrition = nutrition.find(n => n.date === todayStr);
  const todayWellbeing = wellbeing.find(w => w.date === todayStr);

  const streak = useMemo(() => calcStreak(wellbeing), [wellbeing]);

  const pendingTasks = tasks
    .filter(t => !t.completed)
    .sort((a, b) => {
      const po: Record<string, number> = { high: 0, medium: 1, low: 2 };
      return (po[a.priority] ?? 1) - (po[b.priority] ?? 1);
    })
    .slice(0, 6);

  const upcomingEvents = events
    .filter(e => e.date >= todayStr)
    .sort((a, b) => a.date.localeCompare(b.date) || (a.time ?? '').localeCompare(b.time ?? ''))
    .slice(0, 6);

  const monthStr = todayStr.slice(0, 7);
  const monthEntries = budget.filter(e => e.date.startsWith(monthStr));
  const income   = monthEntries.filter(e => e.type === 'income').reduce((s, e) => s + e.amount, 0);
  const expenses = monthEntries.filter(e => e.type === 'expense').reduce((s, e) => s + e.amount, 0);
  const balance  = income - expenses;

  const last7 = getLast7Days();
  const weekChart = last7.map(d => {
    const n = nutrition.find(x => x.date === d);
    return { day: shortDay(d), kcal: n?.calories ?? 0 };
  });

  const overdueTasks = tasks.filter(t => !t.completed && t.deadline && t.deadline < todayStr).length;

  return (
    <div className="p-6 space-y-6 max-w-7xl mx-auto">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-bold text-white">
          {greeting()} 👋
        </h1>
        <p className="text-gray-400 text-sm mt-1">
          {new Date().toLocaleDateString('en-US', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })}
        </p>
      </div>

      {/* Stat cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard
          icon={<Flame size={20} className="text-orange-400" />}
          label="Streak"
          value={`${streak}d`}
          sub="wellbeing logged"
          accent="bg-orange-500/10"
        />
        <StatCard
          icon={<Apple size={20} className="text-green-400" />}
          label="Calories today"
          value={todayNutrition ? `${todayNutrition.calories}` : '—'}
          sub={`/ ${targets.calories} kcal`}
          accent="bg-green-500/10"
          onClick={() => onNavigate('nutrition')}
        />
        <StatCard
          icon={<Heart size={20} className="text-pink-400" />}
          label="Mood today"
          value={todayWellbeing ? `${MOOD_EMOJI[todayWellbeing.mood]} ${todayWellbeing.mood}/5` : '—'}
          sub={todayWellbeing ? undefined : 'not logged yet'}
          accent="bg-pink-500/10"
          onClick={() => onNavigate('wellbeing')}
        />
        <StatCard
          icon={<Wallet size={20} className="text-indigo-400" />}
          label="Month balance"
          value={`€${balance >= 0 ? '+' : ''}${balance.toFixed(0)}`}
          sub={`${expenses.toFixed(0)} spent`}
          accent="bg-indigo-500/10"
          onClick={() => onNavigate('budget')}
        />
      </div>

      {/* Main grid */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Today's tasks */}
        <Card className="p-5">
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-2">
              <CheckSquare size={18} className="text-indigo-400" />
              <h2 className="font-semibold text-white">Pending Tasks</h2>
              {overdueTasks > 0 && (
                <span className="text-xs bg-red-500/20 text-red-400 px-2 py-0.5 rounded-full">
                  {overdueTasks} overdue
                </span>
              )}
            </div>
            <button onClick={() => onNavigate('tasks')} className="text-xs text-indigo-400 hover:text-indigo-300 flex items-center gap-1 transition-colors">
              View all <ChevronRight size={14} />
            </button>
          </div>
          {pendingTasks.length === 0 ? (
            <p className="text-gray-500 text-sm text-center py-6">All done! 🎉</p>
          ) : (
            <div className="space-y-2">
              {pendingTasks.map(t => {
                const overdue = t.deadline && t.deadline < todayStr;
                const pColor: Record<string, string> = { high: 'bg-red-500/20 text-red-400', medium: 'bg-amber-500/20 text-amber-400', low: 'bg-gray-500/20 text-gray-400' };
                return (
                  <div key={t.id} className={`flex items-center gap-3 px-3 py-2.5 rounded-lg border ${overdue ? 'border-red-900/50 bg-red-950/20' : 'border-gray-800 bg-gray-800/30'}`}>
                    <div className={`w-1.5 h-full min-h-[20px] rounded-full flex-shrink-0 ${t.priority === 'high' ? 'bg-red-500' : t.priority === 'medium' ? 'bg-amber-500' : 'bg-gray-600'}`} />
                    <div className="flex-1 min-w-0">
                      <p className="text-sm text-white truncate">{t.title}</p>
                      <div className="flex items-center gap-2 mt-0.5">
                        <span className={`text-xs px-1.5 py-0.5 rounded-md ${pColor[t.priority]}`}>{t.priority}</span>
                        {t.project && <span className="text-xs text-gray-500">#{t.project}</span>}
                        {t.deadline && <span className={`text-xs ${overdue ? 'text-red-400' : 'text-gray-500'}`}>{parseLocal(t.deadline).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}</span>}
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </Card>

        {/* Upcoming events */}
        <Card className="p-5">
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-2">
              <Calendar size={18} className="text-indigo-400" />
              <h2 className="font-semibold text-white">Upcoming Events</h2>
            </div>
            <button onClick={() => onNavigate('calendar')} className="text-xs text-indigo-400 hover:text-indigo-300 flex items-center gap-1 transition-colors">
              Calendar <ChevronRight size={14} />
            </button>
          </div>
          {upcomingEvents.length === 0 ? (
            <p className="text-gray-500 text-sm text-center py-6">No upcoming events</p>
          ) : (
            <div className="space-y-2">
              {upcomingEvents.map(e => {
                const isToday = e.date === todayStr;
                return (
                  <div key={e.id} className="flex items-center gap-3 px-3 py-2.5 rounded-lg border border-gray-800 bg-gray-800/30">
                    <div className="w-1 h-10 rounded-full flex-shrink-0" style={{ backgroundColor: e.color }} />
                    <div className="flex-1 min-w-0">
                      <p className="text-sm text-white truncate">{e.title}</p>
                      <p className="text-xs text-gray-500 mt-0.5">
                        {isToday ? 'Today' : parseLocal(e.date).toLocaleDateString('en-US', { weekday: 'short', month: 'short', day: 'numeric' })}
                        {e.time && ` · ${e.time}`}
                        {e.reminder && ' 🔔'}
                      </p>
                    </div>
                    {isToday && <span className="text-xs bg-indigo-500/20 text-indigo-400 px-2 py-0.5 rounded-full shrink-0">Today</span>}
                  </div>
                );
              })}
            </div>
          )}
        </Card>
      </div>

      {/* Bottom grid */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Nutrition today */}
        <Card className="p-5">
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-2">
              <Apple size={18} className="text-green-400" />
              <h2 className="font-semibold text-white">Nutrition Today</h2>
            </div>
            <button onClick={() => onNavigate('nutrition')} className="text-xs text-indigo-400 hover:text-indigo-300 flex items-center gap-1 transition-colors">
              Log <ChevronRight size={14} />
            </button>
          </div>
          {todayNutrition ? (
            <div className="space-y-4">
              {[
                { label: 'Calories', val: todayNutrition.calories, target: targets.calories, unit: 'kcal', color: 'bg-amber-500' },
                { label: 'Protein',  val: todayNutrition.protein,  target: targets.protein,  unit: 'g',    color: 'bg-blue-500' },
                { label: 'Water',    val: todayNutrition.water,    target: targets.water,    unit: 'ml',   color: 'bg-cyan-500' },
                { label: 'Creatine', val: todayNutrition.creatine, target: targets.creatine, unit: 'g',    color: 'bg-purple-500' },
              ].map(({ label, val, target, unit, color }) => (
                <div key={label}>
                  <div className="flex justify-between text-xs mb-1">
                    <span className="text-gray-400">{label}</span>
                    <span className="text-gray-300">{val} / {target} {unit}</span>
                  </div>
                  <ProgressBar value={(val / target) * 100} color={color} height="h-2" />
                </div>
              ))}
            </div>
          ) : (
            <div className="text-center py-4">
              <p className="text-gray-500 text-sm mb-2">Not logged today</p>
              <div className="h-40">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={weekChart} barSize={16}>
                    <XAxis dataKey="day" tick={{ fill: '#6b7280', fontSize: 11 }} axisLine={false} tickLine={false} />
                    <YAxis tick={{ fill: '#6b7280', fontSize: 11 }} axisLine={false} tickLine={false} width={40} />
                    <Tooltip contentStyle={TOOLTIP} cursor={{ fill: 'rgba(99,102,241,0.1)' }} />
                    <Bar dataKey="kcal" fill="#6366f1" radius={[3, 3, 0, 0]} />
                  </BarChart>
                </ResponsiveContainer>
              </div>
            </div>
          )}
        </Card>

        {/* Wellbeing today */}
        <Card className="p-5">
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-2">
              <Heart size={18} className="text-pink-400" />
              <h2 className="font-semibold text-white">Well-being Today</h2>
            </div>
            <button onClick={() => onNavigate('wellbeing')} className="text-xs text-indigo-400 hover:text-indigo-300 flex items-center gap-1 transition-colors">
              Log <ChevronRight size={14} />
            </button>
          </div>
          {todayWellbeing ? (
            <div className="grid grid-cols-2 gap-4">
              {[
                { label: 'Sleep', value: `${todayWellbeing.sleepDuration}h`, icon: <Moon size={16} className="text-indigo-400" />, sub: `Quality ${todayWellbeing.sleepQuality}/5` },
                { label: 'Mood', value: `${MOOD_EMOJI[todayWellbeing.mood]} ${todayWellbeing.mood}/5`, icon: <Heart size={16} className="text-pink-400" />, sub: undefined },
                { label: 'Energy', value: `${ENERGY_EMOJI[todayWellbeing.energy]} ${todayWellbeing.energy}/5`, icon: <Zap size={16} className="text-amber-400" />, sub: undefined },
                { label: 'Sleep quality', value: `${todayWellbeing.sleepQuality}/5`, icon: <Moon size={16} className="text-blue-400" />, sub: undefined },
              ].map(({ label, value, icon, sub }) => (
                <div key={label} className="bg-gray-800/50 rounded-xl p-3">
                  <div className="flex items-center gap-1.5 mb-2">
                    {icon}
                    <span className="text-xs text-gray-500">{label}</span>
                  </div>
                  <p className="text-lg font-semibold text-white">{value}</p>
                  {sub && <p className="text-xs text-gray-500 mt-0.5">{sub}</p>}
                </div>
              ))}
            </div>
          ) : (
            <div className="text-center py-8">
              <p className="text-4xl mb-3">😴</p>
              <p className="text-gray-400 text-sm">Track your sleep, mood & energy</p>
              <button
                onClick={() => onNavigate('wellbeing')}
                className="mt-3 px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white text-sm rounded-lg transition-colors"
              >
                Log now
              </button>
            </div>
          )}
        </Card>
      </div>
    </div>
  );
}
