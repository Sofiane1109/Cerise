import { useState, useEffect, useRef, useCallback } from 'react';
import type { StudyCourse, StudyChapter, StudyTopic, StudySession } from '../types';
import { getItem, setItem } from '../utils/storage';
import { uid, today } from '../utils/helpers';
import { Modal, INPUT, LABEL, BTN_PRIMARY, BTN_GHOST } from '../components/ui';
import {
  BookOpen, Plus, Trash2, Check, ChevronRight, ChevronDown,
  Timer, Play, Pause, Square, RotateCcw, Pencil, X, Lock, History,
} from 'lucide-react';

const COURSE_COLORS = ['#6366f1','#3b82f6','#22c55e','#f59e0b','#ef4444','#8b5cf6','#06b6d4','#ec4899','#f97316'];

function fmtTime(s: number): string {
  const m = Math.floor(s / 60), sec = s % 60;
  return `${String(m).padStart(2, '0')}:${String(sec).padStart(2, '0')}`;
}

function courseProgress(course: StudyCourse): number {
  const topics = course.chapters.flatMap(c => c.topics);
  if (!topics.length) return 0;
  return Math.round((topics.filter(t => t.completed).length / topics.length) * 100);
}

function chapterProgress(chapter: StudyChapter): number {
  if (!chapter.topics.length) return 0;
  return Math.round((chapter.topics.filter(t => t.completed).length / chapter.topics.length) * 100);
}

type LockPhase = 'idle' | 'work' | 'break';

export default function Study() {
  const [courses, setCourses]   = useState<StudyCourse[]>(() => getItem('myne:study:courses', []));
  const [sessions, setSessions] = useState<StudySession[]>(() => getItem('myne:study:sessions', []));
  const [selected, setSelected] = useState<string | null>(null);
  const [expanded, setExpanded] = useState<Set<string>>(new Set());

  // Course modal
  const [courseModal, setCourseModal] = useState(false);
  const [editCourse, setEditCourse]   = useState<StudyCourse | null>(null);
  const [courseForm, setCourseForm]   = useState({ name: '', color: COURSE_COLORS[0] });

  // Chapter modal
  const [chapterModal, setChapterModal] = useState<string | null>(null); // courseId
  const [editChapter, setEditChapter]   = useState<{ courseId: string; chapter: StudyChapter } | null>(null);
  const [chapterName, setChapterName]   = useState('');

  // Topic
  const [editTopicId, setEditTopicId]   = useState<string | null>(null);
  const [newTopicName, setNewTopicName] = useState<Record<string, string>>({});

  // Lock-in (Pomodoro)
  const [lockIn, setLockIn]       = useState(false);
  const [lockCourse, setLockCourse] = useState<string | null>(null);
  const [phase, setPhase]           = useState<LockPhase>('idle');
  const [workDur, setWorkDur]       = useState(25);
  const [breakDur, setBreakDur]     = useState(5);
  const [timeLeft, setTimeLeft]     = useState(0);
  const [running, setRunning]       = useState(false);
  const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const sessionStartRef = useRef<number>(0);

  const [showHistory, setShowHistory] = useState(false);

  // ── Persistence helpers ───────────────────────────────────────────────────
  const saveCourses = (list: StudyCourse[]) => { setCourses(list); setItem('myne:study:courses', list); };
  const saveSessions = (list: StudySession[]) => { setSessions(list); setItem('myne:study:sessions', list); };

  // ── Course CRUD ───────────────────────────────────────────────────────────
  const openAddCourse = () => { setEditCourse(null); setCourseForm({ name: '', color: COURSE_COLORS[0] }); setCourseModal(true); };
  const openEditCourse = (c: StudyCourse) => { setEditCourse(c); setCourseForm({ name: c.name, color: c.color }); setCourseModal(true); };

  const submitCourse = () => {
    if (!courseForm.name.trim()) return;
    if (editCourse) {
      saveCourses(courses.map(c => c.id === editCourse.id ? { ...c, name: courseForm.name.trim(), color: courseForm.color } : c));
    } else {
      saveCourses([...courses, { id: uid(), name: courseForm.name.trim(), color: courseForm.color, chapters: [] }]);
    }
    setCourseModal(false);
  };

  const removeCourse = (id: string) => {
    saveCourses(courses.filter(c => c.id !== id));
    if (selected === id) setSelected(null);
  };

  // ── Chapter CRUD ──────────────────────────────────────────────────────────
  const addChapter = (courseId: string) => {
    if (!chapterName.trim()) return;
    saveCourses(courses.map(c => c.id === courseId ? { ...c, chapters: [...c.chapters, { id: uid(), name: chapterName.trim(), topics: [] }] } : c));
    setChapterName('');
    setChapterModal(null);
  };

  const updateChapterName = (courseId: string, chapterId: string, name: string) => {
    saveCourses(courses.map(c => c.id === courseId ? { ...c, chapters: c.chapters.map(ch => ch.id === chapterId ? { ...ch, name } : ch) } : c));
    setEditChapter(null);
  };

  const removeChapter = (courseId: string, chapterId: string) => {
    saveCourses(courses.map(c => c.id === courseId ? { ...c, chapters: c.chapters.filter(ch => ch.id !== chapterId) } : c));
  };

  // ── Topic CRUD ─────────────────────────────────────────────────────────────
  const addTopic = (courseId: string, chapterId: string) => {
    const name = newTopicName[chapterId]?.trim();
    if (!name) return;
    saveCourses(courses.map(c => c.id === courseId ? {
      ...c,
      chapters: c.chapters.map(ch => ch.id === chapterId ? { ...ch, topics: [...ch.topics, { id: uid(), name, completed: false }] } : ch)
    } : c));
    setNewTopicName(prev => ({ ...prev, [chapterId]: '' }));
  };

  const toggleTopic = (courseId: string, chapterId: string, topicId: string) => {
    saveCourses(courses.map(c => c.id === courseId ? {
      ...c,
      chapters: c.chapters.map(ch => ch.id === chapterId ? {
        ...ch, topics: ch.topics.map(t => t.id === topicId ? { ...t, completed: !t.completed } : t)
      } : ch)
    } : c));
  };

  const removeTopic = (courseId: string, chapterId: string, topicId: string) => {
    saveCourses(courses.map(c => c.id === courseId ? {
      ...c,
      chapters: c.chapters.map(ch => ch.id === chapterId ? { ...ch, topics: ch.topics.filter(t => t.id !== topicId) } : ch)
    } : c));
  };

  const updateTopicName = (courseId: string, chapterId: string, topicId: string, name: string) => {
    if (!name.trim()) return;
    saveCourses(courses.map(c => c.id === courseId ? {
      ...c,
      chapters: c.chapters.map(ch => ch.id === chapterId ? {
        ...ch, topics: ch.topics.map(t => t.id === topicId ? { ...t, name: name.trim() } : t)
      } : ch)
    } : c));
    setEditTopicId(null);
  };

  // ── Pomodoro logic ────────────────────────────────────────────────────────
  const stopTimer = useCallback(() => {
    if (intervalRef.current) clearInterval(intervalRef.current);
    intervalRef.current = null;
    setRunning(false);
  }, []);

  const recordSession = useCallback((phaseType: 'work' | 'break', duration: number) => {
    if (!lockCourse || duration < 10) return;
    const sess: StudySession = { id: uid(), courseId: lockCourse, date: today(), duration, type: phaseType };
    setSessions(prev => { const updated = [...prev, sess]; setItem('myne:study:sessions', updated); return updated; });
  }, [lockCourse]);

  useEffect(() => {
    if (!running) return;
    intervalRef.current = setInterval(() => {
      setTimeLeft(t => {
        if (t <= 1) {
          clearInterval(intervalRef.current!);
          setRunning(false);
          const dur = (phase === 'work' ? workDur : breakDur) * 60;
          if (phase === 'work' || phase === 'break') recordSession(phase, dur);
          // auto-switch
          if (phase === 'work') {
            setPhase('break');
            setTimeLeft(breakDur * 60);
          } else {
            setPhase('idle');
          }
          return 0;
        }
        return t - 1;
      });
    }, 1000);
    return () => { if (intervalRef.current) clearInterval(intervalRef.current); };
  }, [running, phase, workDur, breakDur, recordSession]);

  const startTimer = (p: 'work' | 'break') => {
    const dur = p === 'work' ? workDur * 60 : breakDur * 60;
    setPhase(p);
    setTimeLeft(dur);
    setRunning(true);
    sessionStartRef.current = Date.now();
  };

  const pauseResume = () => setRunning(r => !r);

  const stopSession = () => {
    const elapsed = Math.round((Date.now() - sessionStartRef.current) / 1000);
    if (phase === 'work' || phase === 'break') recordSession(phase, elapsed);
    stopTimer();
    setPhase('idle');
    setTimeLeft(0);
  };

  const closeLockIn = () => {
    stopTimer();
    setPhase('idle');
    setLockIn(false);
    setLockCourse(null);
  };

  const selectedCourse = courses.find(c => c.id === selected);
  const lockCourseObj = courses.find(c => c.id === lockCourse);

  return (
    <div className="p-6 space-y-5 max-w-6xl mx-auto">
      {/* Header */}
      <div className="flex items-center justify-between flex-wrap gap-3">
        <div>
          <h1 className="text-xl font-bold text-white flex items-center gap-2">
            <BookOpen size={22} style={{ color: 'var(--accent)' }} /> Study Mode
          </h1>
          <p className="text-gray-500 text-sm mt-0.5">{courses.length} cours · {sessions.filter(s => s.type === 'work').reduce((a, s) => a + s.duration, 0) / 60 | 0} min d'étude</p>
        </div>
        <div className="flex gap-2">
          <button onClick={() => setShowHistory(h => !h)}
            className="flex items-center gap-2 px-3 py-2 text-sm bg-gray-800 hover:bg-gray-700 text-gray-300 rounded-lg transition-colors">
            <History size={15} /> Historique
          </button>
          <button onClick={openAddCourse} className={`flex items-center gap-2 px-3 py-2 text-sm rounded-lg ${BTN_PRIMARY}`}>
            <Plus size={16} /> Cours
          </button>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
        {/* Course list */}
        <div className="space-y-2">
          {courses.length === 0 ? (
            <div className="text-center py-10 border-2 border-dashed border-gray-800 rounded-xl text-gray-600 text-sm">
              Aucun cours · ajoutez un cours
            </div>
          ) : courses.map(c => {
            const prog = courseProgress(c);
            const isSelected = selected === c.id;
            return (
              <div key={c.id}
                onClick={() => setSelected(isSelected ? null : c.id)}
                className={`p-4 rounded-xl border cursor-pointer transition-all ${isSelected ? 'border-[var(--accent)] bg-gray-900' : 'border-gray-800 bg-gray-900/50 hover:border-gray-700'}`}
              >
                <div className="flex items-center justify-between gap-2 mb-2">
                  <div className="flex items-center gap-2 min-w-0">
                    <div className="w-3 h-3 rounded-full shrink-0" style={{ backgroundColor: c.color }} />
                    <p className="font-semibold text-white text-sm truncate">{c.name}</p>
                  </div>
                  <div className="flex items-center gap-1 shrink-0">
                    <button onClick={e => { e.stopPropagation(); openEditCourse(c); }} className="text-gray-600 hover:text-blue-400 transition-colors p-0.5"><Pencil size={12} /></button>
                    <button onClick={e => { e.stopPropagation(); removeCourse(c.id); }} className="text-gray-600 hover:text-red-400 transition-colors p-0.5"><Trash2 size={12} /></button>
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  <div className="flex-1 h-1.5 bg-gray-800 rounded-full overflow-hidden">
                    <div className="h-full rounded-full transition-all" style={{ width: `${prog}%`, backgroundColor: c.color }} />
                  </div>
                  <span className="text-xs text-gray-500 shrink-0">{prog}%</span>
                </div>
                <p className="text-xs text-gray-600 mt-1">{c.chapters.length} chapitre{c.chapters.length !== 1 ? 's' : ''}</p>
              </div>
            );
          })}

          {/* Lock-in button */}
          {courses.length > 0 && (
            <button
              onClick={() => { setLockCourse(selected ?? courses[0].id); setLockIn(true); }}
              className="w-full flex items-center justify-center gap-2 p-3 border-2 border-dashed border-[var(--accent)]/40 rounded-xl text-sm font-semibold hover:border-[var(--accent)] hover:bg-[var(--accent)]/5 transition-all"
              style={{ color: 'var(--accent)' }}
            >
              <Lock size={15} /> Lock-in Mode (Pomodoro)
            </button>
          )}
        </div>

        {/* Chapter / topic editor */}
        <div className="md:col-span-2">
          {!selectedCourse ? (
            <div className="flex flex-col items-center justify-center h-48 text-center text-gray-600 text-sm border-2 border-dashed border-gray-800 rounded-xl">
              <ChevronRight size={24} className="mb-2" />
              Sélectionnez un cours pour voir les chapitres
            </div>
          ) : (
            <div className="bg-gray-900 border border-gray-800 rounded-xl p-5">
              <div className="flex items-center justify-between mb-4">
                <div className="flex items-center gap-2">
                  <div className="w-3 h-3 rounded-full" style={{ backgroundColor: selectedCourse.color }} />
                  <h2 className="font-bold text-white">{selectedCourse.name}</h2>
                  <span className="text-xs text-gray-500">{courseProgress(selectedCourse)}%</span>
                </div>
                <button onClick={() => setChapterModal(selectedCourse.id)}
                  className="flex items-center gap-1.5 text-xs px-3 py-1.5 btn-accent rounded-lg">
                  <Plus size={12} /> Chapitre
                </button>
              </div>

              {selectedCourse.chapters.length === 0 ? (
                <p className="text-gray-600 text-sm text-center py-6">Aucun chapitre · ajoutez-en un</p>
              ) : (
                <div className="space-y-3">
                  {selectedCourse.chapters.map(ch => {
                    const chProg = chapterProgress(ch);
                    const isExp = expanded.has(ch.id);
                    return (
                      <div key={ch.id} className="border border-gray-800 rounded-lg overflow-hidden">
                        {/* Chapter header */}
                        <div className="flex items-center gap-2 px-4 py-3 bg-gray-800/30 cursor-pointer"
                          onClick={() => setExpanded(prev => { const next = new Set(prev); isExp ? next.delete(ch.id) : next.add(ch.id); return next; })}>
                          {isExp ? <ChevronDown size={14} className="text-gray-500 shrink-0" /> : <ChevronRight size={14} className="text-gray-500 shrink-0" />}
                          {editChapter?.chapter.id === ch.id ? (
                            <input autoFocus className="flex-1 bg-transparent text-white text-sm font-medium focus:outline-none border-b border-[var(--accent)]"
                              value={editChapter.chapter.name}
                              onChange={e => setEditChapter(prev => prev ? { ...prev, chapter: { ...prev.chapter, name: e.target.value } } : null)}
                              onBlur={() => updateChapterName(selectedCourse.id, ch.id, editChapter?.chapter.name ?? ch.name)}
                              onKeyDown={e => { if (e.key === 'Enter') updateChapterName(selectedCourse.id, ch.id, editChapter?.chapter.name ?? ch.name); if (e.key === 'Escape') setEditChapter(null); }}
                              onClick={e => e.stopPropagation()} />
                          ) : (
                            <span className="flex-1 text-sm font-medium text-white">{ch.name}</span>
                          )}
                          <div className="flex items-center gap-2 shrink-0">
                            <span className="text-xs text-gray-500">{chProg}%</span>
                            <button onClick={e => { e.stopPropagation(); setEditChapter({ courseId: selectedCourse.id, chapter: ch }); setExpanded(prev => new Set(prev).add(ch.id)); }}
                              className="text-gray-600 hover:text-blue-400 transition-colors p-0.5"><Pencil size={11} /></button>
                            <button onClick={e => { e.stopPropagation(); removeChapter(selectedCourse.id, ch.id); }}
                              className="text-gray-600 hover:text-red-400 transition-colors p-0.5"><Trash2 size={11} /></button>
                          </div>
                        </div>

                        {/* Topics */}
                        {isExp && (
                          <div className="px-4 py-3 space-y-2">
                            {ch.topics.map(topic => (
                              <div key={topic.id} className="flex items-center gap-2.5">
                                <button onClick={() => toggleTopic(selectedCourse.id, ch.id, topic.id)}
                                  className={`w-5 h-5 rounded border-2 flex items-center justify-center shrink-0 transition-colors ${topic.completed ? 'border-[var(--accent)] bg-[var(--accent)]' : 'border-gray-600 hover:border-[var(--accent)]'}`}>
                                  {topic.completed && <Check size={10} className="text-white" />}
                                </button>
                                {editTopicId === topic.id ? (
                                  <input autoFocus className="flex-1 bg-transparent text-sm text-white focus:outline-none border-b border-[var(--accent)]"
                                    defaultValue={topic.name}
                                    onBlur={e => updateTopicName(selectedCourse.id, ch.id, topic.id, e.target.value)}
                                    onKeyDown={e => { if (e.key === 'Enter') updateTopicName(selectedCourse.id, ch.id, topic.id, (e.target as HTMLInputElement).value); if (e.key === 'Escape') setEditTopicId(null); }} />
                                ) : (
                                  <span className={`flex-1 text-sm cursor-pointer ${topic.completed ? 'line-through text-gray-500' : 'text-gray-200'}`}
                                    onDoubleClick={() => setEditTopicId(topic.id)}>
                                    {topic.name}
                                  </span>
                                )}
                                <button onClick={() => setEditTopicId(topic.id)} className="text-gray-700 hover:text-blue-400 transition-colors"><Pencil size={10} /></button>
                                <button onClick={() => removeTopic(selectedCourse.id, ch.id, topic.id)} className="text-gray-700 hover:text-red-400 transition-colors"><Trash2 size={10} /></button>
                              </div>
                            ))}

                            {/* Add topic */}
                            <div className="flex gap-2 mt-2">
                              <input
                                className="flex-1 bg-gray-800 border border-gray-700 rounded px-2 py-1 text-xs text-white placeholder-gray-600 focus:outline-none focus:border-[var(--accent)] transition-colors"
                                placeholder="Ajouter un sujet..."
                                value={newTopicName[ch.id] ?? ''}
                                onChange={e => setNewTopicName(prev => ({ ...prev, [ch.id]: e.target.value }))}
                                onKeyDown={e => e.key === 'Enter' && addTopic(selectedCourse.id, ch.id)}
                              />
                              <button onClick={() => addTopic(selectedCourse.id, ch.id)} className="px-2 py-1 btn-accent rounded text-xs">
                                <Plus size={11} />
                              </button>
                            </div>
                          </div>
                        )}
                      </div>
                    );
                  })}
                </div>
              )}
            </div>
          )}
        </div>
      </div>

      {/* Session history */}
      {showHistory && (
        <div className="bg-gray-900 border border-gray-800 rounded-xl p-5">
          <h2 className="font-semibold text-white mb-4 flex items-center gap-2"><History size={16} /> Historique des sessions</h2>
          {sessions.length === 0 ? (
            <p className="text-gray-600 text-sm text-center py-4">Aucune session enregistrée</p>
          ) : (
            <div className="space-y-2">
              {[...sessions].reverse().slice(0, 20).map(s => {
                const course = courses.find(c => c.id === s.courseId);
                return (
                  <div key={s.id} className="flex items-center gap-3 p-3 rounded-lg border border-gray-800 text-sm">
                    <div className="w-2 h-2 rounded-full shrink-0" style={{ backgroundColor: course?.color ?? '#6b7280' }} />
                    <span className="text-gray-400 shrink-0">{new Date(s.date + 'T00:00').toLocaleDateString('fr-FR', { day: 'numeric', month: 'short' })}</span>
                    <span className="text-white flex-1">{course?.name ?? 'Cours supprimé'}</span>
                    <span className={`text-xs px-2 py-0.5 rounded-full ${s.type === 'work' ? 'bg-green-500/20 text-green-400' : 'bg-blue-500/20 text-blue-400'}`}>{s.type === 'work' ? 'Travail' : 'Pause'}</span>
                    <span className="text-gray-500 shrink-0">{Math.round(s.duration / 60)} min</span>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      )}

      {/* Course modal */}
      <Modal isOpen={courseModal} onClose={() => setCourseModal(false)} title={editCourse ? 'Modifier le cours' : 'Nouveau cours'}>
        <div className="space-y-4">
          <div>
            <label className={LABEL}>Nom *</label>
            <input className={INPUT} placeholder="ex: Algorithmes" value={courseForm.name}
              onChange={e => setCourseForm(f => ({ ...f, name: e.target.value }))}
              onKeyDown={e => e.key === 'Enter' && submitCourse()} autoFocus />
          </div>
          <div>
            <label className={LABEL}>Couleur</label>
            <div className="flex gap-2 flex-wrap">
              {COURSE_COLORS.map(c => (
                <button key={c} type="button" onClick={() => setCourseForm(f => ({ ...f, color: c }))}
                  className="w-8 h-8 rounded-full transition-all flex items-center justify-center"
                  style={{ backgroundColor: c }}>
                  {courseForm.color === c && <span className="w-3 h-3 rounded-full bg-white/70 block" />}
                </button>
              ))}
            </div>
          </div>
          <div className="flex gap-2 justify-end">
            <button onClick={() => setCourseModal(false)} className={BTN_GHOST}>Annuler</button>
            <button onClick={submitCourse} className={BTN_PRIMARY}>{editCourse ? 'Sauvegarder' : 'Créer'}</button>
          </div>
        </div>
      </Modal>

      {/* Chapter modal */}
      <Modal isOpen={!!chapterModal} onClose={() => setChapterModal(null)} title="Nouveau chapitre">
        <div className="space-y-4">
          <div>
            <label className={LABEL}>Nom du chapitre *</label>
            <input className={INPUT} placeholder="ex: Chapitre 1 - Introduction" value={chapterName}
              onChange={e => setChapterName(e.target.value)}
              onKeyDown={e => e.key === 'Enter' && chapterModal && addChapter(chapterModal)} autoFocus />
          </div>
          <div className="flex gap-2 justify-end">
            <button onClick={() => setChapterModal(null)} className={BTN_GHOST}>Annuler</button>
            <button onClick={() => chapterModal && addChapter(chapterModal)} className={BTN_PRIMARY}>Ajouter</button>
          </div>
        </div>
      </Modal>

      {/* Lock-in overlay */}
      {lockIn && (
        <div className="fixed inset-0 bg-gray-950/95 z-50 flex flex-col items-center justify-center backdrop-blur-sm">
          <button onClick={closeLockIn} className="absolute top-6 right-6 text-gray-500 hover:text-white transition-colors">
            <X size={24} />
          </button>

          <div className="text-center space-y-6 w-full max-w-sm px-6">
            {/* Course selector */}
            <div className="flex justify-center">
              <select className="bg-gray-900 border border-gray-800 rounded-lg px-4 py-2 text-sm text-white focus:outline-none focus:border-[var(--accent)] transition-colors"
                value={lockCourse ?? ''} onChange={e => setLockCourse(e.target.value)}
                disabled={running}>
                {courses.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
              </select>
            </div>

            {/* Phase indicator */}
            <p className="text-sm font-semibold uppercase tracking-widest" style={{ color: phase === 'idle' ? '#6b7280' : phase === 'work' ? 'var(--accent)' : '#22c55e' }}>
              {phase === 'idle' ? 'Prêt' : phase === 'work' ? '🎯 Focus' : '☕ Pause'}
            </p>

            {/* Timer display */}
            <div className="text-8xl font-mono font-bold tracking-tight" style={{ color: phase === 'break' ? '#22c55e' : 'white' }}>
              {phase === 'idle' ? fmtTime(workDur * 60) : fmtTime(timeLeft)}
            </div>

            {/* Duration settings (when idle) */}
            {phase === 'idle' && (
              <div className="flex justify-center gap-6 text-sm">
                <div className="flex items-center gap-2">
                  <label className="text-gray-500">Focus</label>
                  <input type="number" min="1" max="90" value={workDur} onChange={e => setWorkDur(Number(e.target.value) || 25)}
                    className="w-14 bg-gray-800 border border-gray-700 rounded px-2 py-1 text-white text-center text-sm focus:outline-none" />
                  <span className="text-gray-500">min</span>
                </div>
                <div className="flex items-center gap-2">
                  <label className="text-gray-500">Pause</label>
                  <input type="number" min="1" max="30" value={breakDur} onChange={e => setBreakDur(Number(e.target.value) || 5)}
                    className="w-14 bg-gray-800 border border-gray-700 rounded px-2 py-1 text-white text-center text-sm focus:outline-none" />
                  <span className="text-gray-500">min</span>
                </div>
              </div>
            )}

            {/* Controls */}
            <div className="flex items-center justify-center gap-4">
              {phase === 'idle' ? (
                <button onClick={() => startTimer('work')}
                  className="flex items-center gap-2 px-8 py-3 rounded-full text-white font-semibold btn-accent">
                  <Play size={18} /> Démarrer
                </button>
              ) : (
                <>
                  <button onClick={pauseResume}
                    className="flex items-center gap-2 px-6 py-3 rounded-full bg-gray-800 hover:bg-gray-700 text-white font-semibold transition-colors">
                    {running ? <Pause size={18} /> : <Play size={18} />}
                    {running ? 'Pause' : 'Reprendre'}
                  </button>
                  <button onClick={stopSession}
                    className="flex items-center gap-2 px-6 py-3 rounded-full bg-red-900/40 hover:bg-red-900/60 text-red-400 font-semibold transition-colors">
                    <Square size={18} /> Stop
                  </button>
                  {phase === 'work' && (
                    <button onClick={() => { stopTimer(); setPhase('break'); setTimeLeft(breakDur * 60); }}
                      className="flex items-center gap-2 px-4 py-3 rounded-full bg-green-900/30 hover:bg-green-900/50 text-green-400 font-semibold transition-colors">
                      <RotateCcw size={14} /> Pause
                    </button>
                  )}
                </>
              )}
            </div>

            {/* Recent sessions today */}
            {sessions.filter(s => s.date === today() && s.courseId === lockCourse && s.type === 'work').length > 0 && (
              <p className="text-xs text-gray-600">
                {sessions.filter(s => s.date === today() && s.courseId === lockCourse && s.type === 'work').reduce((a, s) => a + s.duration, 0) / 60 | 0} min de focus aujourd'hui
              </p>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
