import { useState, useMemo, useEffect, useRef } from 'react';
import type { Task, Priority, KanbanStatus, CalendarEvent } from '../types';
import { getItem, setItem } from '../utils/storage';
import { today, uid, parseLocal } from '../utils/helpers';
import { Modal, INPUT, LABEL, BTN_PRIMARY, BTN_GHOST } from '../components/ui';
import { Plus, Trash2, Clock, Tag, AlertCircle, GripVertical, Pencil } from 'lucide-react';

const PRIORITY_CONFIG: Record<Priority, { label: string; color: string; dot: string }> = {
  high:   { label: 'Haute',   color: 'text-red-400',   dot: 'bg-red-500' },
  medium: { label: 'Moyenne', color: 'text-amber-400', dot: 'bg-amber-500' },
  low:    { label: 'Basse',   color: 'text-gray-400',  dot: 'bg-gray-500' },
};

const COLUMNS: { status: KanbanStatus; label: string; accent: string; badge: string }[] = [
  { status: 'todo',        label: 'À faire',  accent: 'border-t-gray-600',   badge: 'bg-gray-800 text-gray-400' },
  { status: 'in_progress', label: 'En cours', accent: 'border-t-indigo-500', badge: 'bg-indigo-900/40 text-indigo-300' },
  { status: 'done',        label: 'Terminé',  accent: 'border-t-green-500',  badge: 'bg-green-900/40 text-green-300' },
];

const EMPTY_FORM = { title: '', priority: 'medium' as Priority, deadline: '', project: '' };

function syncCalendar(tasks: Task[]) {
  const events = getItem<CalendarEvent[]>('myne:events', []);
  const manual = events.filter(e => !e.taskId);
  const taskEvents: CalendarEvent[] = tasks
    .filter(t => t.deadline && t.status !== 'done')
    .map(t => ({
      id: `task-${t.id}`,
      taskId: t.id,
      title: `📋 ${t.title}`,
      date: t.deadline!,
      color: t.priority === 'high' ? '#ef4444' : t.priority === 'medium' ? '#f59e0b' : '#6b7280',
      reminder: false,
    }));
  setItem('myne:events', [...manual, ...taskEvents]);
}

function loadTasks(): Task[] {
  return getItem<any[]>('myne:tasks', []).map((t: any) => ({
    ...t,
    status: t.status ?? (t.completed ? 'done' : 'todo'),
  }));
}

interface Props {
  pendingTaskId?: string | null;
  onClearPending?: () => void;
}

export default function Tasks({ pendingTaskId, onClearPending }: Props) {
  const [tasks, setTasks] = useState<Task[]>(loadTasks);
  const [showForm, setShowForm] = useState(false);
  const [form, setForm] = useState({ ...EMPTY_FORM });

  // Edit
  const [editTask, setEditTask] = useState<Task | null>(null);
  const [editForm, setEditForm] = useState({ ...EMPTY_FORM });

  // Drag
  const [dragId, setDragId] = useState<string | null>(null);
  const [dropTarget, setDropTarget] = useState<KanbanStatus | null>(null);

  // Touch drag
  const touchDragId = useRef<string | null>(null);
  const touchColRef = useRef<KanbanStatus | null>(null);

  const todayStr = today();

  useEffect(() => { syncCalendar(tasks); }, []);

  // Open edit modal when navigated from Calendar
  useEffect(() => {
    if (!pendingTaskId) return;
    const t = tasks.find(x => x.id === pendingTaskId);
    if (t) openEdit(t);
    onClearPending?.();
  }, [pendingTaskId]);

  const save = (list: Task[]) => {
    setTasks(list);
    setItem('myne:tasks', list);
    syncCalendar(list);
  };

  const addTask = () => {
    if (!form.title.trim()) return;
    const t: Task = {
      id: uid(), title: form.title.trim(), priority: form.priority,
      deadline: form.deadline || undefined, project: form.project.trim() || undefined,
      status: 'todo', createdAt: new Date().toISOString(),
    };
    save([t, ...tasks]);
    setForm({ ...EMPTY_FORM });
    setShowForm(false);
  };

  const openEdit = (t: Task) => {
    setEditTask(t);
    setEditForm({ title: t.title, priority: t.priority, deadline: t.deadline ?? '', project: t.project ?? '' });
  };

  const submitEdit = () => {
    if (!editTask || !editForm.title.trim()) return;
    save(tasks.map(t => t.id === editTask.id ? {
      ...t,
      title: editForm.title.trim(),
      priority: editForm.priority,
      deadline: editForm.deadline || undefined,
      project: editForm.project.trim() || undefined,
    } : t));
    setEditTask(null);
  };

  const remove = (id: string) => save(tasks.filter(t => t.id !== id));

  const handleDrop = (status: KanbanStatus) => {
    if (dragId && tasks.find(t => t.id === dragId)?.status !== status) {
      save(tasks.map(t => t.id === dragId ? { ...t, status } : t));
    }
    setDragId(null);
    setDropTarget(null);
  };

  // Touch handlers for mobile drag
  const handleTouchStart = (e: React.TouchEvent, id: string) => {
    touchDragId.current = id;
  };

  const handleTouchMove = (e: React.TouchEvent) => {
    const touch = e.touches[0];
    const el = document.elementFromPoint(touch.clientX, touch.clientY);
    const colEl = el?.closest('[data-col]');
    touchColRef.current = (colEl?.getAttribute('data-col') as KanbanStatus) ?? null;
  };

  const handleTouchEnd = () => {
    const id = touchDragId.current;
    const col = touchColRef.current;
    if (id && col) {
      const task = tasks.find(t => t.id === id);
      if (task && task.status !== col) {
        save(tasks.map(t => t.id === id ? { ...t, status: col } : t));
      }
    }
    touchDragId.current = null;
    touchColRef.current = null;
  };

  const columnData = useMemo(() => COLUMNS.map(col => ({
    ...col,
    tasks: tasks
      .filter(t => t.status === col.status)
      .sort((a, b) => {
        const po: Record<Priority, number> = { high: 0, medium: 1, low: 2 };
        if (col.status !== 'done') {
          const aOver = a.deadline && a.deadline < todayStr ? -1 : 0;
          const bOver = b.deadline && b.deadline < todayStr ? -1 : 0;
          if (aOver !== bOver) return aOver - bOver;
        }
        return po[a.priority] - po[b.priority];
      }),
  })), [tasks, todayStr]);

  return (
    <div className="p-6 space-y-5 max-w-7xl mx-auto">
      {/* Header */}
      <div className="flex items-center justify-between flex-wrap gap-3">
        <div>
          <h1 className="text-xl font-bold text-white">Tasks</h1>
          <p className="text-gray-500 text-sm mt-0.5">
            {tasks.filter(t => t.status === 'todo').length} à faire ·{' '}
            {tasks.filter(t => t.status === 'in_progress').length} en cours ·{' '}
            {tasks.filter(t => t.status === 'done').length} terminées
          </p>
        </div>
        <button
          onClick={() => setShowForm(f => !f)}
          className={`flex items-center gap-2 px-3 py-2 text-sm rounded-lg transition-colors ${showForm ? BTN_GHOST : BTN_PRIMARY}`}
        >
          <Plus size={16} /> Ajouter
        </button>
      </div>

      {/* Add form */}
      {showForm && (
        <div className="bg-gray-900 border border-gray-800 rounded-xl p-5 space-y-4">
          <div>
            <label className={LABEL}>Titre *</label>
            <input className={INPUT} placeholder="Que faut-il faire ?" value={form.title}
              onChange={e => setForm(f => ({ ...f, title: e.target.value }))}
              onKeyDown={e => e.key === 'Enter' && addTask()} autoFocus />
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
            <div>
              <label className={LABEL}>Priorité</label>
              <select className={INPUT} value={form.priority} onChange={e => setForm(f => ({ ...f, priority: e.target.value as Priority }))}>
                <option value="high">Haute</option>
                <option value="medium">Moyenne</option>
                <option value="low">Basse</option>
              </select>
            </div>
            <div>
              <label className={LABEL}>Échéance (optionnel)</label>
              <input type="date" className={INPUT} value={form.deadline} onChange={e => setForm(f => ({ ...f, deadline: e.target.value }))} />
            </div>
            <div>
              <label className={LABEL}>Projet (optionnel)</label>
              <input className={INPUT} placeholder="ex: travail, perso" value={form.project} onChange={e => setForm(f => ({ ...f, project: e.target.value }))} />
            </div>
          </div>
          <div className="flex gap-2 justify-end">
            <button onClick={() => setShowForm(false)} className={BTN_GHOST}>Annuler</button>
            <button onClick={addTask} className={BTN_PRIMARY}>Ajouter</button>
          </div>
        </div>
      )}

      {/* Kanban board */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        {columnData.map(col => (
          <div
            key={col.status}
            data-col={col.status}
            onDragOver={e => { e.preventDefault(); setDropTarget(col.status); }}
            onDragLeave={e => { if (!e.currentTarget.contains(e.relatedTarget as Node)) setDropTarget(null); }}
            onDrop={() => handleDrop(col.status)}
            className={`flex flex-col rounded-xl border-t-2 ${col.accent} bg-gray-900/50 min-h-96 transition-all ${
              dropTarget === col.status && dragId ? 'bg-gray-800/80 ring-1 ring-inset ring-[var(--accent)]/20' : ''
            }`}
          >
            <div className="flex items-center justify-between px-4 py-3 border-b border-gray-800/60">
              <h2 className="font-semibold text-sm text-white">{col.label}</h2>
              <span className={`text-xs rounded-full px-2 py-0.5 font-medium ${col.badge}`}>{col.tasks.length}</span>
            </div>

            <div className="flex-1 p-3 space-y-2">
              {col.tasks.length === 0 && (
                <div className={`border-2 border-dashed rounded-lg py-10 text-center text-xs transition-colors ${
                  dropTarget === col.status && dragId ? 'border-[var(--accent)]/50 text-[var(--accent)]' : 'border-gray-800 text-gray-700'
                }`}>
                  {dropTarget === col.status && dragId ? 'Déposer ici' : 'Vide'}
                </div>
              )}
              {col.tasks.map(t => {
                const cfg = PRIORITY_CONFIG[t.priority];
                const overdue = t.status !== 'done' && t.deadline && t.deadline < todayStr;
                return (
                  <div
                    key={t.id}
                    draggable
                    onDragStart={e => { e.dataTransfer.effectAllowed = 'move'; setDragId(t.id); }}
                    onDragEnd={() => { setDragId(null); setDropTarget(null); }}
                    onTouchStart={e => handleTouchStart(e, t.id)}
                    onTouchMove={handleTouchMove}
                    onTouchEnd={handleTouchEnd}
                    className={`p-3 rounded-lg border select-none transition-all ${
                      dragId === t.id ? 'opacity-30 scale-95' : 'hover:border-gray-700'
                    } ${overdue ? 'border-red-900/60 bg-red-950/10' : 'border-gray-800 bg-gray-900'}`}
                  >
                    <div className="flex items-start gap-2">
                      <GripVertical size={14} className="text-gray-600 shrink-0 mt-0.5 cursor-grab active:cursor-grabbing" />
                      <div className="flex-1 min-w-0 cursor-pointer" onClick={() => openEdit(t)}>
                        <p className={`text-sm font-medium leading-snug ${t.status === 'done' ? 'line-through text-gray-500' : 'text-white'}`}>
                          {t.title}
                        </p>
                        <div className="flex flex-wrap items-center gap-x-3 gap-y-1 mt-1.5">
                          <span className={`inline-flex items-center gap-1 text-xs ${cfg.color}`}>
                            <div className={`w-1.5 h-1.5 rounded-full ${cfg.dot}`} />
                            {cfg.label}
                          </span>
                          {t.project && (
                            <span className="inline-flex items-center gap-1 text-xs text-gray-500">
                              <Tag size={9} /> {t.project}
                            </span>
                          )}
                          {t.deadline && (
                            <span className={`inline-flex items-center gap-1 text-xs ${overdue ? 'text-red-400' : 'text-gray-500'}`}>
                              {overdue ? <AlertCircle size={9} /> : <Clock size={9} />}
                              {parseLocal(t.deadline).toLocaleDateString('fr-FR', { day: 'numeric', month: 'short' })}
                            </span>
                          )}
                        </div>
                      </div>
                      <div className="flex items-center gap-1 shrink-0">
                        <button
                          onClick={() => openEdit(t)}
                          className="w-6 h-6 flex items-center justify-center rounded text-gray-700 hover:text-blue-400 transition-colors"
                        >
                          <Pencil size={11} />
                        </button>
                        <button
                          onClick={() => remove(t.id)}
                          className="w-6 h-6 flex items-center justify-center rounded text-gray-700 hover:text-red-400 transition-colors"
                        >
                          <Trash2 size={12} />
                        </button>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        ))}
      </div>

      {/* Edit modal */}
      <Modal isOpen={!!editTask} onClose={() => setEditTask(null)} title="Modifier la tâche">
        <div className="space-y-4">
          <div>
            <label className={LABEL}>Titre *</label>
            <input className={INPUT} value={editForm.title}
              onChange={e => setEditForm(f => ({ ...f, title: e.target.value }))}
              onKeyDown={e => e.key === 'Enter' && submitEdit()} autoFocus />
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
            <div>
              <label className={LABEL}>Priorité</label>
              <select className={INPUT} value={editForm.priority} onChange={e => setEditForm(f => ({ ...f, priority: e.target.value as Priority }))}>
                <option value="high">Haute</option>
                <option value="medium">Moyenne</option>
                <option value="low">Basse</option>
              </select>
            </div>
            <div>
              <label className={LABEL}>Statut</label>
              <select className={INPUT} value={editTask?.status ?? 'todo'}
                onChange={e => setEditTask(t => t ? { ...t, status: e.target.value as KanbanStatus } : t)}>
                <option value="todo">À faire</option>
                <option value="in_progress">En cours</option>
                <option value="done">Terminé</option>
              </select>
            </div>
            <div>
              <label className={LABEL}>Échéance</label>
              <input type="date" className={INPUT} value={editForm.deadline}
                onChange={e => setEditForm(f => ({ ...f, deadline: e.target.value }))} />
            </div>
          </div>
          <div>
            <label className={LABEL}>Projet</label>
            <input className={INPUT} placeholder="ex: travail, perso" value={editForm.project}
              onChange={e => setEditForm(f => ({ ...f, project: e.target.value }))} />
          </div>
          <div className="flex gap-3 pt-1">
            <button onClick={() => { if (editTask) remove(editTask.id); setEditTask(null); }}
              className="flex items-center gap-2 px-4 py-2 bg-red-900/30 hover:bg-red-900/50 text-red-400 text-sm rounded-lg transition-colors">
              <Trash2 size={14} /> Supprimer
            </button>
            <div className="flex gap-2 ml-auto">
              <button onClick={() => setEditTask(null)} className={BTN_GHOST}>Annuler</button>
              <button onClick={submitEdit} className={BTN_PRIMARY}>Sauvegarder</button>
            </div>
          </div>
        </div>
      </Modal>
    </div>
  );
}
