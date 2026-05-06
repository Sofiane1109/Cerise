import { useState, useMemo } from 'react';
import type { ActivityLog, HikingLog, GymLog, SportLog, GymExercise, GymSet } from '../types';
import { getItem, setItem } from '../utils/storage';
import { today, uid, parseLocal } from '../utils/helpers';
import { Modal, INPUT, LABEL, BTN_PRIMARY, BTN_GHOST } from '../components/ui';
import { Plus, Trash2, Mountain, Dumbbell, Activity, Trophy, ChevronDown, ChevronUp } from 'lucide-react';

type LogType = 'hiking' | 'gym' | 'sport';

const MUSCLE_GROUPS = ['Chest', 'Back', 'Shoulders', 'Biceps', 'Triceps', 'Legs', 'Core', 'Full Body', 'Cardio'];

function HikingForm({ onSave, onClose }: { onSave: (l: HikingLog) => void; onClose: () => void }) {
  const [f, setF] = useState({ date: today(), distance: '', elevation: '', duration: '', notes: '' });
  const submit = () => {
    if (!f.distance || !f.duration) return;
    onSave({ id: uid(), type: 'hiking', date: f.date, distance: Number(f.distance), elevation: Number(f.elevation) || 0, duration: Number(f.duration), notes: f.notes });
  };
  return (
    <div className="space-y-4">
      <div className="grid grid-cols-2 gap-3">
        <div><label className={LABEL}>Date</label><input type="date" className={INPUT} value={f.date} onChange={e => setF(p => ({ ...p, date: e.target.value }))} /></div>
        <div><label className={LABEL}>Distance (km) *</label><input type="number" step="0.1" className={INPUT} placeholder="5.0" value={f.distance} onChange={e => setF(p => ({ ...p, distance: e.target.value }))} /></div>
        <div><label className={LABEL}>Elevation (m)</label><input type="number" className={INPUT} placeholder="200" value={f.elevation} onChange={e => setF(p => ({ ...p, elevation: e.target.value }))} /></div>
        <div><label className={LABEL}>Duration (min) *</label><input type="number" className={INPUT} placeholder="90" value={f.duration} onChange={e => setF(p => ({ ...p, duration: e.target.value }))} /></div>
      </div>
      <div><label className={LABEL}>Notes</label><textarea className={`${INPUT} resize-none h-20`} placeholder="Trail conditions, how you felt..." value={f.notes} onChange={e => setF(p => ({ ...p, notes: e.target.value }))} /></div>
      <div className="flex gap-2 justify-end"><button onClick={onClose} className={BTN_GHOST}>Cancel</button><button onClick={submit} className={BTN_PRIMARY}>Save</button></div>
    </div>
  );
}

function GymForm({ onSave, onClose }: { onSave: (l: GymLog) => void; onClose: () => void }) {
  const [date, setDate] = useState(today());
  const [exercises, setExercises] = useState<GymExercise[]>([]);
  const [exForm, setExForm] = useState({ name: '', muscleGroup: 'Chest', sets: [{ reps: '', weight: '' }] });
  const [adding, setAdding] = useState(true);

  const addSet = () => setExForm(f => ({ ...f, sets: [...f.sets, { reps: '', weight: '' }] }));
  const removeSet = (i: number) => setExForm(f => ({ ...f, sets: f.sets.filter((_, j) => j !== i) }));
  const updateSet = (i: number, field: 'reps' | 'weight', val: string) =>
    setExForm(f => ({ ...f, sets: f.sets.map((s, j) => j === i ? { ...s, [field]: val } : s) }));

  const saveExercise = () => {
    if (!exForm.name.trim() || exForm.sets.some(s => !s.reps)) return;
    const ex: GymExercise = {
      name: exForm.name.trim(),
      muscleGroup: exForm.muscleGroup,
      sets: exForm.sets.filter(s => s.reps).map(s => ({ reps: Number(s.reps), weight: Number(s.weight) || 0 })),
    };
    setExercises(prev => [...prev, ex]);
    setExForm({ name: '', muscleGroup: 'Chest', sets: [{ reps: '', weight: '' }] });
    setAdding(false);
  };

  const submit = () => {
    if (exercises.length === 0) return;
    onSave({ id: uid(), type: 'gym', date, exercises });
  };

  return (
    <div className="space-y-4">
      <div><label className={LABEL}>Date</label><input type="date" className={INPUT} value={date} onChange={e => setDate(e.target.value)} /></div>

      {exercises.length > 0 && (
        <div className="space-y-2">
          <p className="text-xs text-gray-400 font-medium">Exercises added:</p>
          {exercises.map((ex, i) => (
            <div key={i} className="flex items-center justify-between bg-gray-800 rounded-lg px-3 py-2 text-sm">
              <div>
                <span className="text-white font-medium">{ex.name}</span>
                <span className="text-gray-400 ml-2 text-xs">{ex.muscleGroup}</span>
                <span className="text-gray-500 ml-2 text-xs">{ex.sets.length} set{ex.sets.length !== 1 ? 's' : ''}</span>
              </div>
              <button onClick={() => setExercises(prev => prev.filter((_, j) => j !== i))} className="text-gray-500 hover:text-red-400 transition-colors"><Trash2 size={14} /></button>
            </div>
          ))}
        </div>
      )}

      {adding ? (
        <div className="bg-gray-800/60 rounded-xl p-4 space-y-3">
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className={LABEL}>Exercise name *</label>
              <input className={INPUT} placeholder="Bench Press" value={exForm.name} onChange={e => setExForm(f => ({ ...f, name: e.target.value }))} />
            </div>
            <div>
              <label className={LABEL}>Muscle group</label>
              <select className={INPUT} value={exForm.muscleGroup} onChange={e => setExForm(f => ({ ...f, muscleGroup: e.target.value }))}>
                {MUSCLE_GROUPS.map(g => <option key={g}>{g}</option>)}
              </select>
            </div>
          </div>
          <div>
            <label className={LABEL}>Sets (reps × weight kg)</label>
            <div className="space-y-2">
              {exForm.sets.map((s, i) => (
                <div key={i} className="flex items-center gap-2">
                  <span className="text-xs text-gray-500 w-8">#{i + 1}</span>
                  <input type="number" className={`${INPUT} flex-1`} placeholder="Reps" value={s.reps} onChange={e => updateSet(i, 'reps', e.target.value)} />
                  <span className="text-gray-500 text-xs">×</span>
                  <input type="number" className={`${INPUT} flex-1`} placeholder="kg" value={s.weight} onChange={e => updateSet(i, 'weight', e.target.value)} />
                  {exForm.sets.length > 1 && (
                    <button onClick={() => removeSet(i)} className="text-gray-500 hover:text-red-400 transition-colors"><Trash2 size={14} /></button>
                  )}
                </div>
              ))}
            </div>
            <button onClick={addSet} className="mt-2 text-xs text-indigo-400 hover:text-indigo-300 transition-colors">+ Add set</button>
          </div>
          <div className="flex gap-2 justify-end">
            {exercises.length > 0 && <button onClick={() => setAdding(false)} className={BTN_GHOST}>Done adding</button>}
            <button onClick={saveExercise} className={BTN_PRIMARY}>Add Exercise</button>
          </div>
        </div>
      ) : (
        <button onClick={() => setAdding(true)} className="w-full py-2 border border-dashed border-gray-700 rounded-lg text-sm text-gray-400 hover:text-white hover:border-gray-600 transition-colors flex items-center justify-center gap-2">
          <Plus size={14} /> Add another exercise
        </button>
      )}

      <div className="flex gap-2 justify-end border-t border-gray-800 pt-4">
        <button onClick={onClose} className={BTN_GHOST}>Cancel</button>
        <button onClick={submit} disabled={exercises.length === 0} className={`${BTN_PRIMARY} disabled:opacity-40 disabled:cursor-not-allowed`}>
          Save Session ({exercises.length} exercise{exercises.length !== 1 ? 's' : ''})
        </button>
      </div>
    </div>
  );
}

function SportForm({ onSave, onClose }: { onSave: (l: SportLog) => void; onClose: () => void }) {
  const [f, setF] = useState({ date: today(), sport: '', duration: '', notes: '' });
  const submit = () => {
    if (!f.sport.trim() || !f.duration) return;
    onSave({ id: uid(), type: 'sport', date: f.date, sport: f.sport.trim(), duration: Number(f.duration), notes: f.notes });
  };
  return (
    <div className="space-y-4">
      <div className="grid grid-cols-2 gap-3">
        <div><label className={LABEL}>Date</label><input type="date" className={INPUT} value={f.date} onChange={e => setF(p => ({ ...p, date: e.target.value }))} /></div>
        <div><label className={LABEL}>Sport *</label><input className={INPUT} placeholder="Swimming, cycling..." value={f.sport} onChange={e => setF(p => ({ ...p, sport: e.target.value }))} /></div>
        <div className="col-span-2"><label className={LABEL}>Duration (min) *</label><input type="number" className={INPUT} placeholder="45" value={f.duration} onChange={e => setF(p => ({ ...p, duration: e.target.value }))} /></div>
      </div>
      <div><label className={LABEL}>Notes</label><textarea className={`${INPUT} resize-none h-20`} placeholder="How it went..." value={f.notes} onChange={e => setF(p => ({ ...p, notes: e.target.value }))} /></div>
      <div className="flex gap-2 justify-end"><button onClick={onClose} className={BTN_GHOST}>Cancel</button><button onClick={submit} className={BTN_PRIMARY}>Save</button></div>
    </div>
  );
}

export default function Hobbies() {
  const [activities, setActivities] = useState<ActivityLog[]>(() => getItem('myne:activities', []));
  const [modal, setModal] = useState(false);
  const [actType, setActType] = useState<LogType>('hiking');
  const [showRecords, setShowRecords] = useState(true);

  const save = (list: ActivityLog[]) => { setActivities(list); setItem('myne:activities', list); };

  const addActivity = (a: ActivityLog) => { save([a, ...activities]); setModal(false); };
  const remove = (id: string) => save(activities.filter(a => a.id !== id));

  const sorted = useMemo(() => [...activities].sort((a, b) => b.date.localeCompare(a.date)), [activities]);

  const gymLogs = useMemo(() => activities.filter((a): a is GymLog => a.type === 'gym'), [activities]);

  const personalRecords = useMemo(() => {
    const records: Record<string, { weight: number; date: string; sets: GymSet[] }> = {};
    gymLogs.forEach(log => {
      log.exercises.forEach(ex => {
        const maxW = Math.max(...ex.sets.map(s => s.weight));
        if (!records[ex.name] || maxW > records[ex.name].weight) {
          records[ex.name] = { weight: maxW, date: log.date, sets: ex.sets };
        }
      });
    });
    return Object.entries(records).sort((a, b) => a[0].localeCompare(b[0]));
  }, [gymLogs]);

  const TYPE_ICONS: Record<LogType, React.ReactNode> = {
    hiking: <Mountain size={16} className="text-emerald-400" />,
    gym:    <Dumbbell size={16} className="text-blue-400" />,
    sport:  <Activity size={16} className="text-amber-400" />,
  };
  const TYPE_COLORS: Record<LogType, string> = {
    hiking: 'text-emerald-400 bg-emerald-500/10',
    gym:    'text-blue-400 bg-blue-500/10',
    sport:  'text-amber-400 bg-amber-500/10',
  };

  return (
    <div className="p-6 space-y-6 max-w-5xl mx-auto">
      {/* Header */}
      <div className="flex items-center justify-between flex-wrap gap-3">
        <div>
          <h1 className="text-xl font-bold text-white">Hobbies & Activities</h1>
          <p className="text-gray-500 text-sm mt-0.5">{activities.length} sessions logged</p>
        </div>
        <button onClick={() => setModal(true)} className="flex items-center gap-2 px-3 py-2 bg-indigo-600 hover:bg-indigo-700 text-white text-sm rounded-lg transition-colors">
          <Plus size={16} /> Log Activity
        </button>
      </div>

      {/* Personal Records (gym) */}
      {personalRecords.length > 0 && (
        <div className="bg-gray-900 border border-gray-800 rounded-xl p-5">
          <button
            onClick={() => setShowRecords(s => !s)}
            className="w-full flex items-center justify-between text-left"
          >
            <div className="flex items-center gap-2">
              <Trophy size={18} className="text-amber-400" />
              <h2 className="font-semibold text-white">Personal Records</h2>
              <span className="text-xs text-gray-500">({personalRecords.length} exercises)</span>
            </div>
            {showRecords ? <ChevronUp size={16} className="text-gray-500" /> : <ChevronDown size={16} className="text-gray-500" />}
          </button>
          {showRecords && (
            <div className="mt-4 grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-3">
              {personalRecords.map(([name, rec]) => (
                <div key={name} className="bg-gray-800/60 rounded-xl p-3">
                  <p className="text-xs text-gray-400 mb-1">{name}</p>
                  <p className="text-lg font-bold text-white">{rec.weight > 0 ? `${rec.weight} kg` : `${Math.max(...rec.sets.map(s => s.reps))} reps`}</p>
                  <p className="text-xs text-gray-500 mt-0.5">{parseLocal(rec.date).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}</p>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* Activity history */}
      <div className="space-y-3">
        {sorted.length === 0 ? (
          <div className="text-center py-16 text-gray-500">
            <Dumbbell size={40} className="mx-auto mb-3 opacity-30" />
            <p>No activities logged yet</p>
            <button onClick={() => setModal(true)} className="mt-3 px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white text-sm rounded-lg transition-colors">
              Log your first activity
            </button>
          </div>
        ) : (
          sorted.map(a => {
            const color = TYPE_COLORS[a.type];
            return (
              <div key={a.id} className="bg-gray-900 border border-gray-800 rounded-xl p-4 hover:border-gray-700 transition-colors">
                <div className="flex items-start justify-between gap-3">
                  <div className="flex items-start gap-3 flex-1 min-w-0">
                    <div className={`w-9 h-9 rounded-xl flex items-center justify-center shrink-0 ${color.split(' ')[1]}`}>
                      {TYPE_ICONS[a.type]}
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 flex-wrap">
                        <span className={`text-xs font-semibold uppercase tracking-wider ${color.split(' ')[0]}`}>
                          {a.type === 'sport' ? (a as SportLog).sport : a.type}
                        </span>
                        <span className="text-xs text-gray-500">
                          {parseLocal(a.date).toLocaleDateString('en-US', { weekday: 'short', month: 'short', day: 'numeric' })}
                        </span>
                      </div>
                      {a.type === 'hiking' && (
                        <div className="flex items-center gap-4 mt-2 flex-wrap">
                          <span className="text-sm text-gray-300">🏃 {(a as HikingLog).distance} km</span>
                          {(a as HikingLog).elevation > 0 && <span className="text-sm text-gray-300">⛰ {(a as HikingLog).elevation} m</span>}
                          <span className="text-sm text-gray-300">⏱ {(a as HikingLog).duration} min</span>
                        </div>
                      )}
                      {a.type === 'gym' && (
                        <div className="mt-2 space-y-1">
                          {(a as GymLog).exercises.map((ex, i) => (
                            <div key={i} className="text-sm text-gray-300">
                              <span className="text-white font-medium">{ex.name}</span>
                              <span className="text-gray-500 ml-2 text-xs">{ex.muscleGroup}</span>
                              <span className="text-gray-400 ml-2">
                                {ex.sets.map(s => `${s.reps}×${s.weight}kg`).join(' · ')}
                              </span>
                            </div>
                          ))}
                        </div>
                      )}
                      {a.type === 'sport' && (
                        <span className="text-sm text-gray-300 mt-2 block">⏱ {(a as SportLog).duration} min</span>
                      )}
                      {(a.type === 'hiking' || a.type === 'sport') && (a as HikingLog | SportLog).notes && (
                        <p className="text-xs text-gray-500 mt-1.5 italic">{(a as HikingLog | SportLog).notes}</p>
                      )}
                    </div>
                  </div>
                  <button onClick={() => remove(a.id)} className="shrink-0 w-7 h-7 flex items-center justify-center rounded-lg text-gray-600 hover:text-red-400 hover:bg-red-950/30 transition-colors">
                    <Trash2 size={14} />
                  </button>
                </div>
              </div>
            );
          })
        )}
      </div>

      {/* Add modal */}
      <Modal isOpen={modal} onClose={() => setModal(false)} title="Log Activity" maxWidth="max-w-lg">
        <div className="space-y-4">
          <div>
            <label className={LABEL}>Activity type</label>
            <div className="flex gap-2">
              {(['hiking', 'gym', 'sport'] as LogType[]).map(t => (
                <button
                  key={t}
                  onClick={() => setActType(t)}
                  className={`flex-1 flex items-center justify-center gap-2 py-2.5 rounded-lg text-sm font-medium transition-colors border ${
                    actType === t ? 'border-indigo-500 bg-indigo-600/20 text-indigo-300' : 'border-gray-700 bg-gray-800 text-gray-400 hover:text-white'
                  }`}
                >
                  {TYPE_ICONS[t]}
                  <span className="capitalize">{t}</span>
                </button>
              ))}
            </div>
          </div>
          {actType === 'hiking' && <HikingForm onSave={addActivity} onClose={() => setModal(false)} />}
          {actType === 'gym'    && <GymForm    onSave={addActivity} onClose={() => setModal(false)} />}
          {actType === 'sport'  && <SportForm  onSave={addActivity} onClose={() => setModal(false)} />}
        </div>
      </Modal>
    </div>
  );
}
