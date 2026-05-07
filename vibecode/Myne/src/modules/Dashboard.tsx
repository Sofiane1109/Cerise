import { useMemo } from 'react';
import type { ModuleId, Task, NutritionLog, NutritionTargets, CalendarEvent, AccountBalances, BudgetEntry } from '../types';
import { getItem } from '../utils/storage';
import { today, parseLocal, getLast7Days, shortDay } from '../utils/helpers';
import { Card, ProgressBar } from '../components/ui';
import { Flame, CheckSquare, Apple, Wallet, Calendar, ChevronRight, PiggyBank } from 'lucide-react';
import { BarChart, Bar, XAxis, YAxis, ResponsiveContainer, Tooltip } from 'recharts';

const DEFAULT_TARGETS: NutritionTargets = { calories: 2500, protein: 150, creatine: 5, water: 2500 };
const TOOLTIP = { backgroundColor: '#1f2937', border: '1px solid #374151', borderRadius: '8px', color: '#f3f4f6', fontSize: '12px' };

function greeting(): string {
  const h = new Date().getHours();
  if (h < 12) return 'Bonjour';
  if (h < 18) return 'Bon après-midi';
  return 'Bonsoir';
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
        <div className={`w-10 h-10 rounded-xl flex items-center justify-center ${accent}`}>{icon}</div>
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

  const rawTasks    = getItem<any[]>('myne:tasks', []);
  const tasks       = rawTasks.map((t: any): Task => ({ ...t, status: t.status ?? (t.completed ? 'done' : 'todo') }));
  const events      = getItem<CalendarEvent[]>('myne:events', []);
  const nutrition   = getItem<NutritionLog[]>('myne:nutrition', []);
  const targets     = getItem<NutritionTargets>('myne:nutrition:targets', DEFAULT_TARGETS);
  const balances    = getItem<AccountBalances>('myne:budget:balances', { cc: 0, ep: 0 });
  const budgetEntries = getItem<BudgetEntry[]>('myne:budget:entries', []);

  const computedBalance = (acc: 'cc' | 'ep') => {
    const entries = budgetEntries.filter((e: BudgetEntry) => e.accountId === acc);
    const income   = entries.filter(e => e.type === 'income').reduce((s, e) => s + e.amount, 0);
    const expenses = entries.filter(e => e.type === 'expense').reduce((s, e) => s + e.amount, 0);
    return balances[acc] + income - expenses;
  };

  const todayNutrition = nutrition.find(n => n.date === todayStr);

  const pendingTasks = useMemo(() =>
    tasks
      .filter(t => t.status !== 'done')
      .sort((a, b) => {
        const po: Record<string, number> = { high: 0, medium: 1, low: 2 };
        const aOver = a.deadline && a.deadline < todayStr ? -1 : 0;
        const bOver = b.deadline && b.deadline < todayStr ? -1 : 0;
        if (aOver !== bOver) return aOver - bOver;
        return (po[a.priority] ?? 1) - (po[b.priority] ?? 1);
      })
      .slice(0, 6),
  [tasks, todayStr]);

  const upcomingEvents = useMemo(() =>
    events
      .filter(e => e.date >= todayStr)
      .sort((a, b) => a.date.localeCompare(b.date) || (a.time ?? '').localeCompare(b.time ?? ''))
      .slice(0, 6),
  [events, todayStr]);

  const last7 = getLast7Days();
  const weekChart = last7.map(d => {
    const n = nutrition.find(x => x.date === d);
    return { day: shortDay(d), kcal: n?.calories ?? 0 };
  });

  const overdueTasks = tasks.filter(t => t.status !== 'done' && t.deadline && t.deadline < todayStr).length;

  return (
    <div className="p-6 space-y-6 max-w-7xl mx-auto">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-bold text-white">{greeting()} 👋</h1>
        <p className="text-gray-400 text-sm mt-1">
          {new Date().toLocaleDateString('fr-FR', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })}
        </p>
      </div>

      {/* Stat cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard
          icon={<CheckSquare size={20} className="text-indigo-400" />}
          label="Tâches en cours"
          value={String(tasks.filter(t => t.status !== 'done').length)}
          sub={overdueTasks > 0 ? `${overdueTasks} en retard` : 'tout à jour'}
          accent="bg-indigo-500/10"
          onClick={() => onNavigate('tasks')}
        />
        <StatCard
          icon={<Apple size={20} className="text-green-400" />}
          label="Calories aujourd'hui"
          value={todayNutrition ? `${todayNutrition.calories}` : '—'}
          sub={`/ ${targets.calories} kcal`}
          accent="bg-green-500/10"
          onClick={() => onNavigate('nutrition')}
        />
        <StatCard
          icon={<Wallet size={20} className="text-indigo-400" />}
          label="Compte courant"
          value={`€${computedBalance('cc').toLocaleString('fr-FR', { minimumFractionDigits: 0 })}`}
          accent="bg-indigo-500/10"
          onClick={() => onNavigate('budget')}
        />
        <StatCard
          icon={<PiggyBank size={20} className="text-emerald-400" />}
          label="Épargne"
          value={`€${computedBalance('ep').toLocaleString('fr-FR', { minimumFractionDigits: 0 })}`}
          accent="bg-emerald-500/10"
          onClick={() => onNavigate('budget')}
        />
      </div>

      {/* Main grid */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Pending tasks */}
        <Card className="p-5">
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-2">
              <CheckSquare size={18} className="text-indigo-400" />
              <h2 className="font-semibold text-white">Tâches</h2>
              {overdueTasks > 0 && (
                <span className="text-xs bg-red-500/20 text-red-400 px-2 py-0.5 rounded-full">{overdueTasks} en retard</span>
              )}
            </div>
            <button onClick={() => onNavigate('tasks')} className="text-xs text-indigo-400 hover:text-indigo-300 flex items-center gap-1 transition-colors">
              Voir tout <ChevronRight size={14} />
            </button>
          </div>
          {pendingTasks.length === 0 ? (
            <p className="text-gray-500 text-sm text-center py-6">Tout est fait ! 🎉</p>
          ) : (
            <div className="space-y-2">
              {pendingTasks.map(t => {
                const overdue = t.deadline && t.deadline < todayStr;
                const pColor: Record<string, string> = { high: 'bg-red-500/20 text-red-400', medium: 'bg-amber-500/20 text-amber-400', low: 'bg-gray-500/20 text-gray-400' };
                const statusColor: Record<string, string> = { todo: 'text-gray-500', in_progress: 'text-indigo-400' };
                const statusLabel: Record<string, string> = { todo: 'À faire', in_progress: 'En cours' };
                return (
                  <div key={t.id} className={`flex items-center gap-3 px-3 py-2.5 rounded-lg border ${overdue ? 'border-red-900/50 bg-red-950/20' : 'border-gray-800 bg-gray-800/30'}`}>
                    <div className={`w-1.5 h-full min-h-[20px] rounded-full flex-shrink-0 ${t.priority === 'high' ? 'bg-red-500' : t.priority === 'medium' ? 'bg-amber-500' : 'bg-gray-600'}`} />
                    <div className="flex-1 min-w-0">
                      <p className="text-sm text-white truncate">{t.title}</p>
                      <div className="flex items-center gap-2 mt-0.5 flex-wrap">
                        <span className={`text-xs px-1.5 py-0.5 rounded-md ${pColor[t.priority]}`}>{t.priority}</span>
                        <span className={`text-xs ${statusColor[t.status] ?? 'text-gray-500'}`}>{statusLabel[t.status] ?? t.status}</span>
                        {t.project && <span className="text-xs text-gray-500">#{t.project}</span>}
                        {t.deadline && <span className={`text-xs ${overdue ? 'text-red-400' : 'text-gray-500'}`}>{parseLocal(t.deadline).toLocaleDateString('fr-FR', { month: 'short', day: 'numeric' })}</span>}
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
              <h2 className="font-semibold text-white">Événements à venir</h2>
            </div>
            <button onClick={() => onNavigate('calendar')} className="text-xs text-indigo-400 hover:text-indigo-300 flex items-center gap-1 transition-colors">
              Calendrier <ChevronRight size={14} />
            </button>
          </div>
          {upcomingEvents.length === 0 ? (
            <p className="text-gray-500 text-sm text-center py-6">Aucun événement</p>
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
                        {isToday ? "Aujourd'hui" : parseLocal(e.date).toLocaleDateString('fr-FR', { weekday: 'short', month: 'short', day: 'numeric' })}
                        {e.time && ` · ${e.time}`}
                        {e.reminder && ' 🔔'}
                      </p>
                    </div>
                    {isToday && <span className="text-xs bg-indigo-500/20 text-indigo-400 px-2 py-0.5 rounded-full shrink-0">Auj.</span>}
                  </div>
                );
              })}
            </div>
          )}
        </Card>
      </div>

      {/* Nutrition */}
      <Card className="p-5">
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-2">
            <Apple size={18} className="text-green-400" />
            <h2 className="font-semibold text-white">Nutrition aujourd'hui</h2>
          </div>
          <button onClick={() => onNavigate('nutrition')} className="text-xs text-indigo-400 hover:text-indigo-300 flex items-center gap-1 transition-colors">
            <Flame size={12} /> Logger <ChevronRight size={14} />
          </button>
        </div>
        {todayNutrition ? (
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
            {[
              { label: 'Calories', val: todayNutrition.calories, target: targets.calories, unit: 'kcal', color: 'bg-amber-500' },
              { label: 'Protéines', val: todayNutrition.protein, target: targets.protein, unit: 'g', color: 'bg-blue-500' },
              { label: 'Eau', val: todayNutrition.water, target: targets.water, unit: 'ml', color: 'bg-cyan-500' },
              { label: 'Créatine', val: todayNutrition.creatine, target: targets.creatine, unit: 'g', color: 'bg-purple-500' },
            ].map(({ label, val, target, unit, color }) => (
              <div key={label}>
                <div className="flex justify-between text-xs mb-1.5">
                  <span className="text-gray-400">{label}</span>
                  <span className="text-gray-300">{val} / {target} {unit}</span>
                </div>
                <ProgressBar value={(val / target) * 100} color={color} height="h-2" />
              </div>
            ))}
          </div>
        ) : (
          <div className="text-center py-2">
            <p className="text-gray-500 text-sm mb-3">Pas encore loggé aujourd'hui</p>
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
    </div>
  );
}
