import { useState, useMemo } from 'react';
import type { Task, Priority } from '../types';
import { getItem, setItem } from '../utils/storage';
import { today, uid, parseLocal } from '../utils/helpers';
import { INPUT, LABEL, BTN_PRIMARY, BTN_GHOST } from '../components/ui';
import { Plus, Trash2, Check, Flag, Clock, Tag, ChevronDown, ChevronUp, AlertCircle } from 'lucide-react';

const PRIORITY_CONFIG: Record<Priority, { label: string; color: string; bg: string; dot: string }> = {
  high:   { label: 'High',   color: 'text-red-400',   bg: 'bg-red-500/10 border-red-900/50',   dot: 'bg-red-500' },
  medium: { label: 'Medium', color: 'text-amber-400',  bg: 'bg-amber-500/10 border-amber-900/50', dot: 'bg-amber-500' },
  low:    { label: 'Low',    color: 'text-gray-400',   bg: 'bg-gray-500/10 border-gray-800',    dot: 'bg-gray-500' },
};

const SORT_ORDER: Record<Priority, number> = { high: 0, medium: 1, low: 2 };

export default function Tasks() {
  const [tasks, setTasks] = useState<Task[]>(() => getItem('myne:tasks', []));
  const [showForm, setShowForm] = useState(false);
  const [filterPriority, setFilterPriority] = useState<Priority | 'all'>('all');
  const [filterProject, setFilterProject] = useState('');
  const [showCompleted, setShowCompleted] = useState(false);
  const [form, setForm] = useState({ title: '', priority: 'medium' as Priority, deadline: '', project: '' });

  const save = (list: Task[]) => { setTasks(list); setItem('myne:tasks', list); };

  const addTask = () => {
    if (!form.title.trim()) return;
    const t: Task = {
      id: uid(), title: form.title.trim(), priority: form.priority,
      deadline: form.deadline || undefined, project: form.project.trim() || undefined,
      completed: false, createdAt: new Date().toISOString(),
    };
    save([t, ...tasks]);
    setForm({ title: '', priority: 'medium', deadline: '', project: '' });
    setShowForm(false);
  };

  const toggle = (id: string) => save(tasks.map(t => t.id === id ? { ...t, completed: !t.completed } : t));
  const remove = (id: string) => save(tasks.filter(t => t.id !== id));

  const todayStr = today();

  const projects = useMemo(() => [...new Set(tasks.map(t => t.project).filter(Boolean) as string[])], [tasks]);

  const filtered = useMemo(() => {
    return tasks
      .filter(t => !t.completed)
      .filter(t => filterPriority === 'all' || t.priority === filterPriority)
      .filter(t => !filterProject || t.project === filterProject)
      .sort((a, b) => {
        const aOver = a.deadline && a.deadline < todayStr ? -1 : 0;
        const bOver = b.deadline && b.deadline < todayStr ? -1 : 0;
        if (aOver !== bOver) return aOver - bOver;
        return SORT_ORDER[a.priority] - SORT_ORDER[b.priority];
      });
  }, [tasks, filterPriority, filterProject, todayStr]);

  const completed = useMemo(() => tasks.filter(t => t.completed), [tasks]);
  const overdueCount = useMemo(() => filtered.filter(t => t.deadline && t.deadline < todayStr).length, [filtered, todayStr]);

  return (
    <div className="p-6 space-y-5 max-w-4xl mx-auto">
      {/* Header */}
      <div className="flex items-center justify-between flex-wrap gap-3">
        <div>
          <h1 className="text-xl font-bold text-white">Tasks</h1>
          <p className="text-gray-500 text-sm mt-0.5">
            {filtered.length} pending · {completed.length} done
            {overdueCount > 0 && <span className="text-red-400 ml-2">· {overdueCount} overdue</span>}
          </p>
        </div>
        <button onClick={() => setShowForm(f => !f)} className={`flex items-center gap-2 px-3 py-2 text-sm rounded-lg transition-colors ${showForm ? BTN_GHOST : BTN_PRIMARY}`}>
          <Plus size={16} /> Add Task
        </button>
      </div>

      {/* Add form */}
      {showForm && (
        <div className="bg-gray-900 border border-gray-800 rounded-xl p-5 space-y-4">
          <div>
            <label className={LABEL}>Task title *</label>
            <input
              className={INPUT}
              placeholder="What needs to be done?"
              value={form.title}
              onChange={e => setForm(f => ({ ...f, title: e.target.value }))}
              onKeyDown={e => e.key === 'Enter' && addTask()}
              autoFocus
            />
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
            <div>
              <label className={LABEL}>Priority</label>
              <select
                className={INPUT}
                value={form.priority}
                onChange={e => setForm(f => ({ ...f, priority: e.target.value as Priority }))}
              >
                <option value="high">High</option>
                <option value="medium">Medium</option>
                <option value="low">Low</option>
              </select>
            </div>
            <div>
              <label className={LABEL}>Deadline (optional)</label>
              <input type="date" className={INPUT} value={form.deadline} onChange={e => setForm(f => ({ ...f, deadline: e.target.value }))} />
            </div>
            <div>
              <label className={LABEL}>Project tag (optional)</label>
              <input
                className={INPUT}
                placeholder="e.g. work, personal"
                value={form.project}
                onChange={e => setForm(f => ({ ...f, project: e.target.value }))}
              />
            </div>
          </div>
          <div className="flex gap-2 justify-end">
            <button onClick={() => setShowForm(false)} className={BTN_GHOST}>Cancel</button>
            <button onClick={addTask} className={BTN_PRIMARY}>Add Task</button>
          </div>
        </div>
      )}

      {/* Filters */}
      <div className="flex items-center gap-2 flex-wrap">
        <span className="text-xs text-gray-500 mr-1">Priority:</span>
        {(['all', 'high', 'medium', 'low'] as const).map(p => (
          <button
            key={p}
            onClick={() => setFilterPriority(p)}
            className={`px-3 py-1.5 text-xs font-medium rounded-lg transition-colors capitalize ${
              filterPriority === p
                ? p === 'all' ? 'bg-indigo-600 text-white' : `${PRIORITY_CONFIG[p as Priority]?.bg ?? ''} ${PRIORITY_CONFIG[p as Priority]?.color ?? ''}  border`
                : 'bg-gray-800 text-gray-400 hover:text-white'
            }`}
          >
            {p === 'all' ? 'All' : p}
          </button>
        ))}
        {projects.length > 0 && (
          <>
            <span className="text-xs text-gray-500 ml-2">Project:</span>
            <select
              value={filterProject}
              onChange={e => setFilterProject(e.target.value)}
              className="bg-gray-800 border border-gray-700 text-xs text-gray-300 rounded-lg px-3 py-1.5 focus:outline-none focus:border-indigo-500"
            >
              <option value="">All projects</option>
              {projects.map(p => <option key={p} value={p}>{p}</option>)}
            </select>
          </>
        )}
      </div>

      {/* Task list */}
      <div className="space-y-2">
        {filtered.length === 0 ? (
          <div className="text-center py-12 text-gray-500">
            <Check size={40} className="mx-auto mb-3 opacity-30" />
            <p>No tasks here — well done!</p>
          </div>
        ) : (
          filtered.map(t => {
            const cfg = PRIORITY_CONFIG[t.priority];
            const overdue = !t.completed && t.deadline && t.deadline < todayStr;
            return (
              <div
                key={t.id}
                className={`flex items-start gap-3 p-4 rounded-xl border transition-colors ${
                  overdue ? 'border-red-900/60 bg-red-950/10' : 'border-gray-800 bg-gray-900 hover:border-gray-700'
                }`}
              >
                {/* Checkbox */}
                <button
                  onClick={() => toggle(t.id)}
                  className={`shrink-0 w-5 h-5 rounded-full border-2 flex items-center justify-center mt-0.5 transition-colors ${
                    t.completed ? 'border-indigo-500 bg-indigo-500' : 'border-gray-600 hover:border-indigo-400'
                  }`}
                >
                  {t.completed && <Check size={11} className="text-white" />}
                </button>

                {/* Priority dot */}
                <div className={`shrink-0 w-1.5 h-1.5 rounded-full mt-2 ${cfg.dot}`} />

                {/* Content */}
                <div className="flex-1 min-w-0">
                  <p className={`text-sm font-medium ${t.completed ? 'line-through text-gray-500' : 'text-white'}`}>
                    {t.title}
                  </p>
                  <div className="flex items-center gap-3 mt-1.5 flex-wrap">
                    <span className={`inline-flex items-center gap-1 text-xs ${cfg.color}`}>
                      <Flag size={10} /> {cfg.label}
                    </span>
                    {t.project && (
                      <span className="inline-flex items-center gap-1 text-xs text-gray-500">
                        <Tag size={10} /> {t.project}
                      </span>
                    )}
                    {t.deadline && (
                      <span className={`inline-flex items-center gap-1 text-xs ${overdue ? 'text-red-400' : 'text-gray-500'}`}>
                        {overdue && <AlertCircle size={10} />}
                        {!overdue && <Clock size={10} />}
                        {parseLocal(t.deadline).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}
                        {overdue && ' · overdue'}
                      </span>
                    )}
                  </div>
                </div>

                <button
                  onClick={() => remove(t.id)}
                  className="shrink-0 w-7 h-7 flex items-center justify-center rounded-lg text-gray-600 hover:text-red-400 hover:bg-red-950/30 transition-colors"
                >
                  <Trash2 size={14} />
                </button>
              </div>
            );
          })
        )}
      </div>

      {/* Completed tasks */}
      {completed.length > 0 && (
        <div>
          <button
            onClick={() => setShowCompleted(s => !s)}
            className="flex items-center gap-2 text-sm text-gray-500 hover:text-gray-300 transition-colors mb-3"
          >
            {showCompleted ? <ChevronUp size={16} /> : <ChevronDown size={16} />}
            Completed ({completed.length})
          </button>
          {showCompleted && (
            <div className="space-y-2">
              {completed.map(t => (
                <div key={t.id} className="flex items-center gap-3 p-3 rounded-xl border border-gray-800 bg-gray-900/50 opacity-60">
                  <button onClick={() => toggle(t.id)} className="shrink-0 w-5 h-5 rounded-full border-2 border-indigo-500 bg-indigo-500 flex items-center justify-center">
                    <Check size={11} className="text-white" />
                  </button>
                  <p className="text-sm text-gray-500 line-through flex-1">{t.title}</p>
                  <button onClick={() => remove(t.id)} className="w-6 h-6 flex items-center justify-center rounded text-gray-600 hover:text-red-400 transition-colors">
                    <Trash2 size={12} />
                  </button>
                </div>
              ))}
            </div>
          )}
        </div>
      )}
    </div>
  );
}
