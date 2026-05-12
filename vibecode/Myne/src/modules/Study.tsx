import { useState, useEffect, useRef, useCallback } from 'react';
import type { StudyCourse, StudyChapter, StudyTopic, StudySession } from '../types';
import { getItem, setItem } from '../utils/storage';
import { uid, today } from '../utils/helpers';
import { Modal, INPUT, LABEL, BTN_PRIMARY, BTN_GHOST } from '../components/ui';
import { spotify, isConnected } from '../lib/spotify';
import {
  BookOpen, Plus, Trash2, Check, ChevronRight, ChevronDown,
  Timer, Play, Pause, Square, RotateCcw, Pencil, X, Lock, History,
} from 'lucide-react';

const SPOTIFY_GREEN = '#1DB954';

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

  // SoundLog: now playing during lock-in
  const [nowPlaying, setNowPlaying] = useState<any>(null);

  // Poll Spotify now-playing while lock-in is open
  useEffect(() => {
    if (!lockIn || !isConnected()) { setNowPlaying(null); return; }
    let alive = true;
    const poll = async () => {
      try {
        const d = await spotify.currentlyPlaying();
        if (alive) setNowPlaying(d?.item ?? null);
      } catch { if (alive) setNowPlaying(null); }
    };
    poll();
    const id = setInterval(poll, 10_000);
    return () => { alive = false; clearInterval(id); };
  }, [lockIn]);

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

  const GLASS: React.CSSProperties = {
    background: 'rgba(255,255,255,0.03)',
    border: '1px solid rgba(255,255,255,0.07)',
    backdropFilter: 'blur(16px)',
    WebkitBackdropFilter: 'blur(16px)',
    borderRadius: 14,
  };

  const totalStudyMin = sessions.filter(s => s.type === 'work').reduce((a, s) => a + s.duration, 0) / 60 | 0;

  return (
    <div className="p-6 space-y-5 max-w-6xl mx-auto">
      {/* Header */}
      <div className="flex items-center justify-between flex-wrap gap-3">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl flex items-center justify-center shrink-0"
            style={{ background: 'rgba(99,102,241,0.12)', border: '1px solid rgba(99,102,241,0.25)' }}>
            <BookOpen size={18} style={{ color: 'var(--accent)' }} />
          </div>
          <div>
            <h1 className="text-xl font-bold text-white">Study Mode</h1>
            <p className="text-gray-500 text-sm">{courses.length} cours · {totalStudyMin} min d'étude</p>
          </div>
        </div>
        <div className="flex gap-2">
          <button onClick={() => setShowHistory(h => !h)}
            className="flex items-center gap-2 px-3 py-2 text-sm rounded-lg text-gray-300 transition-colors hover:text-white"
            style={{ background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.08)' }}>
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
            <div className="text-center py-10 rounded-xl text-gray-600 text-sm"
              style={{ border: '2px dashed rgba(255,255,255,0.06)' }}>
              Aucun cours · ajoutez un cours
            </div>
          ) : courses.map(c => {
            const prog = courseProgress(c);
            const isSelected = selected === c.id;
            return (
              <div key={c.id}
                onClick={() => setSelected(isSelected ? null : c.id)}
                className="p-4 cursor-pointer transition-all"
                style={isSelected
                  ? { ...GLASS, border: '1px solid var(--accent)', background: 'rgba(99,102,241,0.08)' }
                  : GLASS}
              >
                <div className="flex items-center justify-between gap-2 mb-2">
                  <div className="flex items-center gap-2 min-w-0">
                    <div className="w-2.5 h-2.5 rounded-full shrink-0" style={{ backgroundColor: c.color }} />
                    <p className="font-semibold text-white text-sm truncate">{c.name}</p>
                  </div>
                  <div className="flex items-center gap-1 shrink-0">
                    <button onClick={e => { e.stopPropagation(); openEditCourse(c); }}
                      className="text-gray-600 hover:text-blue-400 transition-colors p-0.5"><Pencil size={12} /></button>
                    <button onClick={e => { e.stopPropagation(); removeCourse(c.id); }}
                      className="text-gray-600 hover:text-red-400 transition-colors p-0.5"><Trash2 size={12} /></button>
                  </div>
                </div>
                <div className="flex items-center gap-2 mb-1">
                  <div className="flex-1 h-1 rounded-full overflow-hidden" style={{ background: 'rgba(255,255,255,0.06)' }}>
                    <div className="h-full rounded-full transition-all" style={{ width: `${prog}%`, backgroundColor: c.color, boxShadow: `0 0 6px ${c.color}80` }} />
                  </div>
                  <span className="text-xs text-gray-500 shrink-0">{prog}%</span>
                </div>
                <p className="text-xs text-gray-600">{c.chapters.length} chapitre{c.chapters.length !== 1 ? 's' : ''}</p>
              </div>
            );
          })}

          {/* Lock-in button */}
          {courses.length > 0 && (
            <button
              onClick={() => { setLockCourse(selected ?? courses[0].id); setLockIn(true); }}
              className="w-full flex items-center justify-center gap-2 p-3 rounded-xl text-sm font-semibold transition-all"
              style={{ border: '2px dashed rgba(99,102,241,0.3)', color: 'var(--accent)' }}
              onMouseEnter={e => { e.currentTarget.style.borderColor = 'var(--accent)'; e.currentTarget.style.background = 'rgba(99,102,241,0.06)'; }}
              onMouseLeave={e => { e.currentTarget.style.borderColor = 'rgba(99,102,241,0.3)'; e.currentTarget.style.background = ''; }}
            >
              <Lock size={15} /> Lock-in Mode (Pomodoro)
            </button>
          )}
        </div>

        {/* Chapter / topic editor */}
        <div className="md:col-span-2">
          {!selectedCourse ? (
            <div className="flex flex-col items-center justify-center h-48 text-center text-gray-600 text-sm rounded-xl"
              style={{ border: '2px dashed rgba(255,255,255,0.06)' }}>
              <ChevronRight size={24} className="mb-2" />
              Sélectionnez un cours pour voir les chapitres
            </div>
          ) : (
            <div className="p-5" style={GLASS}>
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
                      <div key={ch.id} className="rounded-xl overflow-hidden" style={{ border: '1px solid rgba(255,255,255,0.06)' }}>
                        {/* Chapter header */}
                        <div className="flex items-center gap-2 px-4 py-3 cursor-pointer" style={{ background: 'rgba(255,255,255,0.03)' }}
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
        <div className="p-5" style={GLASS}>
          <h2 className="font-semibold text-white mb-4 flex items-center gap-2"><History size={16} /> Historique des sessions</h2>
          {sessions.length === 0 ? (
            <p className="text-gray-600 text-sm text-center py-4">Aucune session enregistrée</p>
          ) : (
            <div className="space-y-2">
              {[...sessions].reverse().slice(0, 20).map(s => {
                const course = courses.find(c => c.id === s.courseId);
                return (
                  <div key={s.id} className="flex items-center gap-3 p-3 rounded-lg text-sm" style={{ border: '1px solid rgba(255,255,255,0.05)', background: 'rgba(255,255,255,0.02)' }}>
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
      {lockIn && (() => {
        const phaseColor  = phase === 'break' ? '#22c55e' : phase === 'work' ? 'var(--accent)' : 'rgba(255,255,255,0.3)';
        const totalSecs   = phase === 'work' ? workDur * 60 : breakDur * 60;
        const progress    = phase === 'idle' ? 0 : ((totalSecs - timeLeft) / totalSecs) * 100;
        const todaySecs   = sessions.filter(s => s.date === today() && s.courseId === lockCourse && s.type === 'work').reduce((a, s) => a + s.duration, 0);
        const todayPomos  = sessions.filter(s => s.date === today() && s.courseId === lockCourse && s.type === 'work' && s.duration >= workDur * 60 * 0.8).length;
        const ringSize    = 240;
        const r           = (ringSize - 16) / 2;
        const circ        = 2 * Math.PI * r;
        const offset      = circ - (progress / 100) * circ;
        const spotifyConnected = isConnected();

        return (
          <div className="fixed inset-0 z-50 flex flex-col overflow-hidden" style={{ background: '#06060e' }}>
            {/* Ambient glow */}
            <div className="absolute inset-0 pointer-events-none" style={{
              background: phase === 'work'
                ? 'radial-gradient(ellipse 60% 40% at 50% 60%, rgba(99,102,241,0.12) 0%, transparent 70%)'
                : phase === 'break'
                ? 'radial-gradient(ellipse 60% 40% at 50% 60%, rgba(34,197,94,0.10) 0%, transparent 70%)'
                : 'radial-gradient(ellipse 60% 40% at 50% 60%, rgba(255,255,255,0.03) 0%, transparent 70%)',
              transition: 'background 0.8s ease',
            }} />

            {/* Top bar */}
            <div className="relative flex items-center justify-between px-6 py-4">
              <div className="flex items-center gap-3">
                {/* Course color dot + selector */}
                <div className="w-2.5 h-2.5 rounded-full shrink-0"
                  style={{ backgroundColor: lockCourseObj?.color ?? 'var(--accent)' }} />
                <select
                  value={lockCourse ?? ''}
                  onChange={e => setLockCourse(e.target.value)}
                  disabled={running}
                  className="bg-transparent text-white text-sm font-semibold focus:outline-none cursor-pointer disabled:cursor-default"
                  style={{ border: 'none' }}
                >
                  {courses.map(c => <option key={c.id} value={c.id} style={{ background: '#111' }}>{c.name}</option>)}
                </select>
              </div>

              <div className="flex items-center gap-4">
                {todaySecs > 0 && (
                  <span className="text-xs text-gray-600 font-mono">
                    {Math.floor(todaySecs / 60)} min · {todayPomos} 🍅
                  </span>
                )}
                <button onClick={closeLockIn} className="text-gray-600 hover:text-white transition-colors">
                  <X size={20} />
                </button>
              </div>
            </div>

            {/* Main content */}
            <div className="relative flex-1 flex flex-col items-center justify-center gap-8 px-6">

              {/* Phase label */}
              <p className="text-xs font-bold uppercase tracking-[0.25em] transition-colors"
                style={{ color: phaseColor }}>
                {phase === 'idle' ? 'Prêt à démarrer' : phase === 'work' ? '⚡ Focus' : '☕ Pause'}
              </p>

              {/* Circular timer */}
              <div className="relative flex items-center justify-center" style={{ width: ringSize, height: ringSize }}>
                <svg width={ringSize} height={ringSize} style={{ position: 'absolute', top: 0, left: 0 }}>
                  {/* Track */}
                  <circle cx={ringSize / 2} cy={ringSize / 2} r={r}
                    fill="none" stroke="rgba(255,255,255,0.05)" strokeWidth={6} />
                  {/* Progress */}
                  <circle cx={ringSize / 2} cy={ringSize / 2} r={r}
                    fill="none" stroke={phaseColor} strokeWidth={6}
                    strokeDasharray={circ} strokeDashoffset={offset}
                    strokeLinecap="round"
                    transform={`rotate(-90 ${ringSize / 2} ${ringSize / 2})`}
                    style={{ transition: 'stroke-dashoffset 0.8s linear, stroke 0.6s ease', filter: `drop-shadow(0 0 8px ${phaseColor})` }}
                  />
                </svg>
                {/* Time */}
                <div className="text-center">
                  <p className="font-mono font-bold text-white leading-none"
                    style={{ fontSize: 56 }}>
                    {phase === 'idle' ? fmtTime(workDur * 60) : fmtTime(timeLeft)}
                  </p>
                  {phase !== 'idle' && (
                    <p className="text-xs text-gray-600 mt-1 font-mono">
                      / {fmtTime(totalSecs)}
                    </p>
                  )}
                </div>
              </div>

              {/* Duration settings (idle only) */}
              {phase === 'idle' && (
                <div className="flex gap-6 text-sm">
                  {[{ label: 'Focus', val: workDur, set: setWorkDur, max: 90 }, { label: 'Pause', val: breakDur, set: setBreakDur, max: 30 }].map(({ label, val, set, max }) => (
                    <div key={label} className="flex items-center gap-2">
                      <span className="text-gray-500 text-xs">{label}</span>
                      <input type="number" min="1" max={max} value={val}
                        onChange={e => set(Number(e.target.value) || (label === 'Focus' ? 25 : 5))}
                        className="w-12 text-center text-sm text-white rounded-lg focus:outline-none"
                        style={{ background: 'rgba(255,255,255,0.07)', border: '1px solid rgba(255,255,255,0.1)', padding: '4px 0' }} />
                      <span className="text-gray-600 text-xs">min</span>
                    </div>
                  ))}
                </div>
              )}

              {/* Controls */}
              <div className="flex items-center gap-3">
                {phase === 'idle' ? (
                  <button onClick={() => startTimer('work')}
                    className="flex items-center gap-2.5 px-8 py-3.5 rounded-full text-white font-bold text-sm transition-transform hover:scale-105 active:scale-95"
                    style={{ backgroundColor: 'var(--accent)', boxShadow: '0 0 24px var(--accent)60' }}>
                    <Play size={18} fill="white" /> Démarrer
                  </button>
                ) : (
                  <>
                    <button onClick={pauseResume}
                      className="flex items-center gap-2 px-6 py-3 rounded-full text-white font-semibold text-sm transition-all hover:scale-105"
                      style={{ background: 'rgba(255,255,255,0.08)', border: '1px solid rgba(255,255,255,0.12)' }}>
                      {running ? <Pause size={16} /> : <Play size={16} fill="white" />}
                      {running ? 'Pause' : 'Reprendre'}
                    </button>
                    {phase === 'work' && (
                      <button onClick={() => { stopTimer(); setPhase('break'); setTimeLeft(breakDur * 60); }}
                        className="flex items-center gap-2 px-5 py-3 rounded-full text-green-400 font-semibold text-sm transition-all hover:scale-105"
                        style={{ background: 'rgba(34,197,94,0.1)', border: '1px solid rgba(34,197,94,0.2)' }}>
                        <RotateCcw size={14} /> Pause
                      </button>
                    )}
                    <button onClick={stopSession}
                      className="w-11 h-11 flex items-center justify-center rounded-full text-red-400 transition-all hover:scale-105"
                      style={{ background: 'rgba(239,68,68,0.1)', border: '1px solid rgba(239,68,68,0.2)' }}>
                      <Square size={15} />
                    </button>
                  </>
                )}
              </div>
            </div>

            {/* Bottom — SoundLog */}
            <div className="relative px-6 pb-6">
              <div className="rounded-2xl p-4 flex items-center gap-3"
                style={{ background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.07)' }}>
                {/* Spotify icon */}
                <div className="w-8 h-8 rounded-xl flex items-center justify-center shrink-0"
                  style={{ backgroundColor: SPOTIFY_GREEN + '20' }}>
                  <svg width="16" height="16" viewBox="0 0 24 24" fill={SPOTIFY_GREEN}>
                    <path d="M12 0C5.4 0 0 5.4 0 12s5.4 12 12 12 12-5.4 12-12S18.66 0 12 0zm5.521 17.34c-.24.359-.66.48-1.021.24-2.82-1.74-6.36-2.101-10.561-1.141-.418.122-.779-.179-.899-.539-.12-.421.18-.78.54-.9 4.56-1.021 8.52-.6 11.64 1.32.42.18.479.659.301 1.02zm1.44-3.3c-.301.42-.841.6-1.262.3-3.239-1.98-8.159-2.58-11.939-1.38-.479.12-1.02-.12-1.14-.6-.12-.48.12-1.021.6-1.141C9.6 9.9 15 10.561 18.72 12.84c.361.181.54.78.241 1.2zm.12-3.36C15.24 8.4 8.82 8.16 5.16 9.301c-.6.179-1.2-.181-1.38-.721-.18-.601.18-1.2.72-1.381 4.26-1.26 11.28-1.02 15.721 1.621.539.3.719 1.02.419 1.56-.299.421-1.02.599-1.559.3z"/>
                  </svg>
                </div>

                {!spotifyConnected ? (
                  <div className="flex-1 min-w-0">
                    <p className="text-xs text-gray-500">Spotify non connecté</p>
                    <p className="text-xs text-gray-700">Connecte Spotify dans SoundLog pour voir la musique ici</p>
                  </div>
                ) : nowPlaying ? (
                  <>
                    {nowPlaying.album?.images?.[2]?.url && (
                      <img src={nowPlaying.album.images[2].url} alt=""
                        className="w-9 h-9 rounded-lg object-cover shrink-0" />
                    )}
                    <div className="min-w-0 flex-1">
                      <p className="text-xs font-semibold text-white truncate">{nowPlaying.name}</p>
                      <p className="text-xs truncate" style={{ color: SPOTIFY_GREEN }}>
                        {(nowPlaying.artists ?? []).map((a: any) => a.name).join(', ')}
                      </p>
                    </div>
                    <span className="w-2 h-2 rounded-full animate-pulse shrink-0"
                      style={{ backgroundColor: SPOTIFY_GREEN }} />
                  </>
                ) : (
                  <div className="flex-1 min-w-0">
                    <p className="text-xs text-gray-500">Rien en cours de lecture</p>
                    <p className="text-xs text-gray-700">Lance quelque chose sur Spotify</p>
                  </div>
                )}
              </div>
            </div>
          </div>
        );
      })()}
    </div>
  );
}
