import { useState, useEffect, useCallback, useRef } from 'react';
import { useEditor, EditorContent } from '@tiptap/react';
import StarterKit from '@tiptap/starter-kit';
import Underline from '@tiptap/extension-underline';
import TaskList from '@tiptap/extension-task-list';
import TaskItem from '@tiptap/extension-task-item';
import CodeBlockLowlight from '@tiptap/extension-code-block-lowlight';
import Image from '@tiptap/extension-image';
import Placeholder from '@tiptap/extension-placeholder';
import { Table } from '@tiptap/extension-table';
import TableRow from '@tiptap/extension-table-row';
import TableCell from '@tiptap/extension-table-cell';
import TableHeader from '@tiptap/extension-table-header';
import { common, createLowlight } from 'lowlight';
import type { Note, NoteCategory, StudyCourse } from '../types';
import { getItem, setItem } from '../utils/storage';
import { uid } from '../utils/helpers';
import {
  Bold, Italic, Underline as UnderlineIcon, Strikethrough,
  Heading1, Heading2, Heading3, List, ListOrdered, ListChecks,
  Code, Code2, Minus, Image as ImageIcon, Table as TableIcon,
  Undo2, Redo2, Pin, PinOff, Trash2, Plus, Search, X,
  ChevronRight, NotebookPen, BookOpen, Pencil, Check,
} from 'lucide-react';

const lowlight = createLowlight(common);

// ── Constants ─────────────────────────────────────────────────────────────────

const GLASS: React.CSSProperties = {
  background: 'rgba(255,255,255,0.03)',
  border: '1px solid rgba(255,255,255,0.07)',
  backdropFilter: 'blur(16px)',
  WebkitBackdropFilter: 'blur(16px)',
};

const DEFAULT_CATEGORIES: NoteCategory[] = [
  { id: 'cours',   name: 'Cours',    emoji: '📚', createdAt: '' },
  { id: 'projets', name: 'Projets',  emoji: '🚀', createdAt: '' },
  { id: 'perso',   name: 'Perso',    emoji: '🏠', createdAt: '' },
  { id: 'ideas',   name: 'Idées',    emoji: '💡', createdAt: '' },
];

// ── Helpers ───────────────────────────────────────────────────────────────────

function jsonToText(json: string): string {
  try {
    const doc = JSON.parse(json);
    const extract = (node: any): string => {
      if (node.type === 'text') return node.text ?? '';
      if (node.content) return node.content.map(extract).join(' ');
      return '';
    };
    return extract(doc).replace(/\s+/g, ' ').trim();
  } catch { return ''; }
}

function fmtDate(iso: string): string {
  const d = new Date(iso);
  const now = new Date();
  const diff = now.getTime() - d.getTime();
  if (diff < 60_000) return 'À l\'instant';
  if (diff < 3_600_000) return `${Math.floor(diff / 60_000)}min`;
  if (diff < 86_400_000) return `${Math.floor(diff / 3_600_000)}h`;
  if (diff < 604_800_000) return `${Math.floor(diff / 86_400_000)}j`;
  return d.toLocaleDateString('fr-FR', { day: 'numeric', month: 'short' });
}

// ── Toolbar button ────────────────────────────────────────────────────────────

function TBtn({
  onClick, active, disabled, title, children,
}: {
  onClick: () => void;
  active?: boolean;
  disabled?: boolean;
  title: string;
  children: React.ReactNode;
}) {
  return (
    <button
      type="button"
      onMouseDown={e => { e.preventDefault(); onClick(); }}
      title={title}
      disabled={disabled}
      className={`w-7 h-7 flex items-center justify-center rounded transition-all text-sm ${
        active
          ? 'text-white'
          : 'text-gray-400 hover:text-white hover:bg-white/5'
      } disabled:opacity-30 disabled:cursor-not-allowed`}
      style={active ? { backgroundColor: 'var(--accent)' } : {}}
    >
      {children}
    </button>
  );
}

function TSep() {
  return <div className="w-px h-4 mx-1" style={{ background: 'rgba(255,255,255,0.08)' }} />;
}

// ── Editor toolbar ────────────────────────────────────────────────────────────

function Toolbar({ editor, onImageUrl }: { editor: any; onImageUrl: () => void }) {
  if (!editor) return null;
  return (
    <div
      className="flex flex-wrap items-center gap-0.5 px-3 py-2 shrink-0"
      style={{ borderBottom: '1px solid rgba(255,255,255,0.06)', background: 'rgba(255,255,255,0.02)' }}
    >
      {/* Undo / Redo */}
      <TBtn onClick={() => editor.chain().focus().undo().run()} disabled={!editor.can().undo()} title="Annuler">
        <Undo2 size={13} />
      </TBtn>
      <TBtn onClick={() => editor.chain().focus().redo().run()} disabled={!editor.can().redo()} title="Refaire">
        <Redo2 size={13} />
      </TBtn>
      <TSep />

      {/* Headings */}
      <TBtn onClick={() => editor.chain().focus().toggleHeading({ level: 1 }).run()} active={editor.isActive('heading', { level: 1 })} title="Titre 1">
        <Heading1 size={14} />
      </TBtn>
      <TBtn onClick={() => editor.chain().focus().toggleHeading({ level: 2 }).run()} active={editor.isActive('heading', { level: 2 })} title="Titre 2">
        <Heading2 size={14} />
      </TBtn>
      <TBtn onClick={() => editor.chain().focus().toggleHeading({ level: 3 }).run()} active={editor.isActive('heading', { level: 3 })} title="Titre 3">
        <Heading3 size={14} />
      </TBtn>
      <TSep />

      {/* Inline formatting */}
      <TBtn onClick={() => editor.chain().focus().toggleBold().run()} active={editor.isActive('bold')} title="Gras (Ctrl+B)">
        <Bold size={13} />
      </TBtn>
      <TBtn onClick={() => editor.chain().focus().toggleItalic().run()} active={editor.isActive('italic')} title="Italique (Ctrl+I)">
        <Italic size={13} />
      </TBtn>
      <TBtn onClick={() => editor.chain().focus().toggleUnderline().run()} active={editor.isActive('underline')} title="Souligné (Ctrl+U)">
        <UnderlineIcon size={13} />
      </TBtn>
      <TBtn onClick={() => editor.chain().focus().toggleStrike().run()} active={editor.isActive('strike')} title="Barré">
        <Strikethrough size={13} />
      </TBtn>
      <TSep />

      {/* Lists */}
      <TBtn onClick={() => editor.chain().focus().toggleBulletList().run()} active={editor.isActive('bulletList')} title="Liste à puces">
        <List size={14} />
      </TBtn>
      <TBtn onClick={() => editor.chain().focus().toggleOrderedList().run()} active={editor.isActive('orderedList')} title="Liste numérotée">
        <ListOrdered size={14} />
      </TBtn>
      <TBtn onClick={() => editor.chain().focus().toggleTaskList().run()} active={editor.isActive('taskList')} title="Liste de tâches">
        <ListChecks size={14} />
      </TBtn>
      <TSep />

      {/* Code */}
      <TBtn onClick={() => editor.chain().focus().toggleCode().run()} active={editor.isActive('code')} title="Code inline">
        <Code size={13} />
      </TBtn>
      <TBtn onClick={() => editor.chain().focus().toggleCodeBlock().run()} active={editor.isActive('codeBlock')} title="Bloc de code">
        <Code2 size={13} />
      </TBtn>
      <TSep />

      {/* Table */}
      <TBtn
        onClick={() => editor.chain().focus().insertTable({ rows: 3, cols: 3, withHeaderRow: true }).run()}
        title="Insérer un tableau"
      >
        <TableIcon size={13} />
      </TBtn>

      {/* Image URL */}
      <TBtn onClick={onImageUrl} title="Insérer une image (URL)">
        <ImageIcon size={13} />
      </TBtn>

      {/* Divider */}
      <TBtn onClick={() => editor.chain().focus().setHorizontalRule().run()} title="Séparateur">
        <Minus size={13} />
      </TBtn>
    </div>
  );
}

// ── Main Notes component ──────────────────────────────────────────────────────

interface NotesProps {
  initialCourseId?: string | null;
  onClearCourseFilter?: () => void;
}

export default function Notes({ initialCourseId, onClearCourseFilter }: NotesProps) {
  // Data
  const [categories, setCategories] = useState<NoteCategory[]>(() => {
    const saved = getItem<NoteCategory[]>('myne:notes:categories', []);
    return saved.length ? saved : DEFAULT_CATEGORIES;
  });
  const [notes, setNotes] = useState<Note[]>(() => getItem<Note[]>('myne:notes', []));
  const courses = getItem<StudyCourse[]>('myne:study:courses', []);

  // Navigation
  const [activeCat, setActiveCat]     = useState<string>('all');
  const [selectedId, setSelectedId]   = useState<string | null>(null);
  const [search, setSearch]           = useState('');
  const [courseFilter, setCourseFilter] = useState<string | null>(initialCourseId ?? null);

  // Sync course filter when prop changes (user navigates from Study again)
  useEffect(() => {
    if (initialCourseId) setCourseFilter(initialCourseId);
  }, [initialCourseId]);

  // Category editing
  const [newCatOpen, setNewCatOpen]   = useState(false);
  const [newCatName, setNewCatName]   = useState('');
  const [newCatEmoji, setNewCatEmoji] = useState('📝');
  const [renamingCat, setRenamingCat] = useState<string | null>(null);
  const [renameName, setRenameName]   = useState('');

  // Note title editing
  const [titleDraft, setTitleDraft]   = useState('');

  // Image URL prompt
  const [imgPrompt, setImgPrompt]     = useState(false);
  const [imgUrl, setImgUrl]           = useState('');

  // Auto-save debounce
  const saveTimer = useRef<ReturnType<typeof setTimeout> | null>(null);

  // ── Persist helpers ──────────────────────────────────────────────────────────

  const saveCats = (list: NoteCategory[]) => { setCategories(list); setItem('myne:notes:categories', list); };
  const saveNotes = (list: Note[]) => { setNotes(list); setItem('myne:notes', list); };

  // ── Filtered notes ───────────────────────────────────────────────────────────

  const allCats: NoteCategory[] = categories;

  const filtered = (() => {
    let list = notes;
    if (courseFilter) {
      list = list.filter(n => n.courseId === courseFilter);
    } else if (search.trim()) {
      const q = search.toLowerCase();
      list = list.filter(n =>
        n.title.toLowerCase().includes(q) || jsonToText(n.content).toLowerCase().includes(q)
      );
    } else if (activeCat === 'pinned') {
      list = list.filter(n => n.pinned);
    } else if (activeCat !== 'all') {
      list = list.filter(n => n.categoryId === activeCat);
    }
    return [...list].sort((a, b) => {
      if (a.pinned !== b.pinned) return a.pinned ? -1 : 1;
      return b.updatedAt.localeCompare(a.updatedAt);
    });
  })();

  const selectedNote = notes.find(n => n.id === selectedId) ?? null;

  // ── Editor ───────────────────────────────────────────────────────────────────

  const editor = useEditor({
    extensions: [
      StarterKit.configure({ codeBlock: false }),
      Underline,
      TaskList,
      TaskItem.configure({ nested: true }),
      CodeBlockLowlight.configure({ lowlight }),
      Image.configure({ allowBase64: true }),
      Placeholder.configure({ placeholder: 'Commence à écrire…' }),
      Table.configure({ resizable: false }),
      TableRow,
      TableHeader,
      TableCell,
    ],
    content: '',
    onUpdate: ({ editor }) => {
      if (!selectedId) return;
      const json = JSON.stringify(editor.getJSON());
      if (saveTimer.current) clearTimeout(saveTimer.current);
      saveTimer.current = setTimeout(() => {
        setNotes(prev => {
          const updated = prev.map(n =>
            n.id === selectedId
              ? { ...n, content: json, updatedAt: new Date().toISOString() }
              : n
          );
          setItem('myne:notes', updated);
          return updated;
        });
      }, 600);
    },
    editorProps: {
      attributes: { class: 'prose prose-invert max-w-none focus:outline-none px-8 py-6 min-h-full text-gray-200' },
    },
  });

  // Load note content into editor when selection changes
  useEffect(() => {
    if (!editor) return;
    if (!selectedNote) { editor.commands.clearContent(); setTitleDraft(''); return; }
    setTitleDraft(selectedNote.title);
    try {
      const json = JSON.parse(selectedNote.content);
      editor.commands.setContent(json, { emitUpdate: false });
    } catch {
      editor.commands.setContent('', { emitUpdate: false });
    }
  }, [selectedId, editor]);

  // ── Actions ──────────────────────────────────────────────────────────────────

  const createNote = useCallback(() => {
    const id = uid();
    const now = new Date().toISOString();
    const catId = activeCat === 'all' || activeCat === 'pinned'
      ? (categories[0]?.id ?? 'perso')
      : activeCat;
    const note: Note = {
      id, categoryId: catId, title: 'Nouvelle note',
      content: JSON.stringify({ type: 'doc', content: [] }),
      pinned: false, createdAt: now, updatedAt: now,
    };
    saveNotes([note, ...notes]);
    setSelectedId(id);
    setActiveCat(catId);
  }, [notes, categories, activeCat]);

  const deleteNote = (id: string) => {
    saveNotes(notes.filter(n => n.id !== id));
    if (selectedId === id) setSelectedId(null);
  };

  const togglePin = (id: string) => {
    saveNotes(notes.map(n => n.id === id ? { ...n, pinned: !n.pinned } : n));
  };

  const saveTitle = () => {
    if (!selectedId || !titleDraft.trim()) return;
    saveNotes(notes.map(n => n.id === selectedId
      ? { ...n, title: titleDraft.trim(), updatedAt: new Date().toISOString() }
      : n
    ));
  };

  const saveCourse = (courseId: string) => {
    if (!selectedId) return;
    saveNotes(notes.map(n => n.id === selectedId
      ? { ...n, courseId: courseId || undefined, updatedAt: new Date().toISOString() }
      : n
    ));
  };

  const addCategory = () => {
    if (!newCatName.trim()) return;
    const nc: NoteCategory = { id: uid(), name: newCatName.trim(), emoji: newCatEmoji, createdAt: new Date().toISOString() };
    saveCats([...categories, nc]);
    setNewCatOpen(false);
    setNewCatName('');
    setNewCatEmoji('📝');
  };

  const renameCategory = (id: string) => {
    if (!renameName.trim()) return;
    saveCats(categories.map(c => c.id === id ? { ...c, name: renameName.trim() } : c));
    setRenamingCat(null);
  };

  const deleteCategory = (id: string) => {
    saveCats(categories.filter(c => c.id !== id));
    if (activeCat === id) setActiveCat('all');
    // Move notes to first remaining category
    const remaining = categories.filter(c => c.id !== id);
    if (remaining.length) {
      saveNotes(notes.map(n => n.categoryId === id ? { ...n, categoryId: remaining[0].id } : n));
    }
  };

  const insertImage = () => {
    if (!editor || !imgUrl.trim()) return;
    editor.chain().focus().setImage({ src: imgUrl.trim() }).run();
    setImgUrl('');
    setImgPrompt(false);
  };

  // ── Render ───────────────────────────────────────────────────────────────────

  const linkedCourse = selectedNote?.courseId
    ? courses.find(c => c.id === selectedNote.courseId)
    : null;

  return (
    <div className="flex h-full overflow-hidden" style={{ background: '#09090f' }}>

      {/* ── Category sidebar ── */}
      <div
        className="flex flex-col shrink-0 py-4"
        style={{ width: 200, borderRight: '1px solid rgba(255,255,255,0.06)', background: 'rgba(255,255,255,0.01)' }}
      >
        <p className="text-[10px] font-bold uppercase tracking-widest text-gray-600 px-4 mb-3">Carnets</p>

        {/* All / Pinned */}
        {[
          { id: 'all',    label: 'Toutes',    emoji: '🗂️', count: notes.length },
          { id: 'pinned', label: 'Épinglées', emoji: '⭐', count: notes.filter(n => n.pinned).length },
        ].map(({ id, label, emoji, count }) => (
          <button key={id} onClick={() => setActiveCat(id)}
            className="flex items-center gap-2 px-4 py-2 text-sm transition-all"
            style={activeCat === id
              ? { background: 'rgba(99,102,241,0.12)', color: 'white', borderRight: '2px solid var(--accent)' }
              : { color: '#9ca3af' }}>
            <span>{emoji}</span>
            <span className="flex-1 text-left truncate">{label}</span>
            <span className="text-xs text-gray-700">{count}</span>
          </button>
        ))}

        <div className="mx-4 my-2 h-px" style={{ background: 'rgba(255,255,255,0.06)' }} />

        {/* User categories */}
        <div className="flex-1 overflow-y-auto space-y-0.5">
          {allCats.map(cat => (
            <div key={cat.id} className="group relative flex items-center">
              {renamingCat === cat.id ? (
                <input
                  autoFocus
                  value={renameName}
                  onChange={e => setRenameName(e.target.value)}
                  onBlur={() => renameCategory(cat.id)}
                  onKeyDown={e => { if (e.key === 'Enter') renameCategory(cat.id); if (e.key === 'Escape') setRenamingCat(null); }}
                  className="flex-1 mx-2 px-2 py-1 text-sm text-white rounded focus:outline-none"
                  style={{ background: 'rgba(255,255,255,0.08)', border: '1px solid var(--accent)' }}
                />
              ) : (
                <button
                  onClick={() => setActiveCat(cat.id)}
                  className="flex-1 flex items-center gap-2 px-4 py-2 text-sm transition-all"
                  style={activeCat === cat.id
                    ? { background: 'rgba(99,102,241,0.12)', color: 'white', borderRight: '2px solid var(--accent)' }
                    : { color: '#9ca3af' }}>
                  <span>{cat.emoji}</span>
                  <span className="flex-1 text-left truncate">{cat.name}</span>
                  <span className="text-xs text-gray-700">{notes.filter(n => n.categoryId === cat.id).length}</span>
                </button>
              )}
              {/* Hover actions */}
              <div className="absolute right-2 hidden group-hover:flex items-center gap-0.5">
                <button onClick={() => { setRenamingCat(cat.id); setRenameName(cat.name); }}
                  className="w-5 h-5 flex items-center justify-center text-gray-600 hover:text-blue-400 transition-colors">
                  <Pencil size={10} />
                </button>
                {!DEFAULT_CATEGORIES.some(d => d.id === cat.id) && (
                  <button onClick={() => deleteCategory(cat.id)}
                    className="w-5 h-5 flex items-center justify-center text-gray-600 hover:text-red-400 transition-colors">
                    <X size={10} />
                  </button>
                )}
              </div>
            </div>
          ))}
        </div>

        {/* New category */}
        {newCatOpen ? (
          <div className="px-3 pb-3 space-y-1.5">
            <div className="flex gap-1.5">
              <input value={newCatEmoji} onChange={e => setNewCatEmoji(e.target.value)}
                className="w-10 text-center text-sm rounded focus:outline-none"
                style={{ background: 'rgba(255,255,255,0.07)', border: '1px solid rgba(255,255,255,0.1)', padding: '4px' }} />
              <input autoFocus value={newCatName} onChange={e => setNewCatName(e.target.value)}
                placeholder="Nom…"
                onKeyDown={e => { if (e.key === 'Enter') addCategory(); if (e.key === 'Escape') setNewCatOpen(false); }}
                className="flex-1 text-sm text-white rounded px-2 focus:outline-none"
                style={{ background: 'rgba(255,255,255,0.07)', border: '1px solid rgba(255,255,255,0.1)' }} />
            </div>
            <div className="flex gap-1">
              <button onClick={addCategory} className="flex-1 py-1 text-xs rounded text-white" style={{ backgroundColor: 'var(--accent)' }}>Créer</button>
              <button onClick={() => setNewCatOpen(false)} className="flex-1 py-1 text-xs rounded text-gray-400" style={{ background: 'rgba(255,255,255,0.06)' }}>Annuler</button>
            </div>
          </div>
        ) : (
          <button onClick={() => setNewCatOpen(true)}
            className="flex items-center gap-2 px-4 py-2 text-xs text-gray-600 hover:text-gray-400 transition-colors">
            <Plus size={11} /> Nouveau carnet
          </button>
        )}
      </div>

      {/* ── Note list ── */}
      <div
        className="flex flex-col shrink-0"
        style={{ width: 280, borderRight: '1px solid rgba(255,255,255,0.06)', background: 'rgba(255,255,255,0.01)' }}
      >
        {/* Search + New */}
        <div className="p-3 space-y-2 shrink-0" style={{ borderBottom: '1px solid rgba(255,255,255,0.06)' }}>
          {/* Course filter banner */}
          {courseFilter && (() => {
            const fc = courses.find(c => c.id === courseFilter);
            return fc ? (
              <div className="flex items-center gap-2 px-3 py-1.5 rounded-lg text-xs"
                style={{ background: fc.color + '18', border: `1px solid ${fc.color}40` }}>
                <BookOpen size={11} style={{ color: fc.color, flexShrink: 0 }} />
                <span className="flex-1 truncate font-medium" style={{ color: fc.color }}>{fc.name}</span>
                <button onClick={() => { setCourseFilter(null); onClearCourseFilter?.(); }}
                  className="hover:text-white transition-colors" style={{ color: fc.color + 'aa' }}>
                  <X size={11} />
                </button>
              </div>
            ) : null;
          })()}
          <div className="flex items-center gap-2 px-3 py-2 rounded-lg" style={{ background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.07)' }}>
            <Search size={13} className="text-gray-600 shrink-0" />
            <input
              value={search}
              onChange={e => setSearch(e.target.value)}
              placeholder="Rechercher…"
              className="flex-1 bg-transparent text-sm text-white placeholder-gray-600 focus:outline-none"
              disabled={!!courseFilter}
            />
            {search && !courseFilter && <button onClick={() => setSearch('')}><X size={12} className="text-gray-600 hover:text-white" /></button>}
          </div>
          <button onClick={createNote}
            className="w-full flex items-center justify-center gap-1.5 py-2 rounded-lg text-xs font-semibold text-white transition-all"
            style={{ backgroundColor: 'var(--accent)', boxShadow: '0 0 12px var(--accent)40' }}>
            <Plus size={13} /> Nouvelle note
          </button>
        </div>

        {/* Note list */}
        <div className="flex-1 overflow-y-auto">
          {filtered.length === 0 ? (
            <div className="flex flex-col items-center justify-center h-32 text-gray-700 text-xs text-center px-4">
              <NotebookPen size={24} className="mb-2 opacity-30" />
              {search ? 'Aucun résultat' : 'Aucune note · crée-en une !'}
            </div>
          ) : filtered.map(note => {
            const cat = categories.find(c => c.id === note.categoryId);
            const course = note.courseId ? courses.find(c => c.id === note.courseId) : null;
            const preview = jsonToText(note.content);
            const isSelected = note.id === selectedId;
            return (
              <div key={note.id}
                onClick={() => setSelectedId(note.id)}
                className="group relative px-4 py-3 cursor-pointer transition-all"
                style={isSelected
                  ? { background: 'rgba(99,102,241,0.1)', borderLeft: '2px solid var(--accent)' }
                  : { borderLeft: '2px solid transparent' }}>
                <div className="flex items-start justify-between gap-1 mb-1">
                  <p className="text-sm font-semibold text-white truncate flex-1 pr-2">{note.title || 'Sans titre'}</p>
                  {note.pinned && <Pin size={10} className="text-amber-400 shrink-0 mt-0.5" />}
                </div>
                <p className="text-xs text-gray-600 truncate mb-1.5">{preview || 'Note vide…'}</p>
                <div className="flex items-center gap-2 flex-wrap">
                  <span className="text-[10px] text-gray-700">{fmtDate(note.updatedAt)}</span>
                  {cat && <span className="text-[10px] text-gray-600">{cat.emoji} {cat.name}</span>}
                  {course && (
                    <span className="text-[10px] px-1.5 py-0.5 rounded-full font-medium"
                      style={{ backgroundColor: course.color + '25', color: course.color }}>
                      {course.name}
                    </span>
                  )}
                </div>
                {/* Hover actions */}
                <div className="absolute right-2 top-2 hidden group-hover:flex items-center gap-1">
                  <button onClick={e => { e.stopPropagation(); togglePin(note.id); }}
                    className="w-6 h-6 flex items-center justify-center rounded text-gray-600 hover:text-amber-400 hover:bg-white/5 transition-colors">
                    {note.pinned ? <PinOff size={11} /> : <Pin size={11} />}
                  </button>
                  <button onClick={e => { e.stopPropagation(); deleteNote(note.id); }}
                    className="w-6 h-6 flex items-center justify-center rounded text-gray-600 hover:text-red-400 hover:bg-red-950/30 transition-colors">
                    <Trash2 size={11} />
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* ── Editor panel ── */}
      <div className="flex-1 flex flex-col min-w-0 overflow-hidden">
        {!selectedNote ? (
          <div className="flex-1 flex flex-col items-center justify-center text-center text-gray-700 gap-3">
            <NotebookPen size={40} className="opacity-20" />
            <div>
              <p className="text-sm font-medium">Sélectionne une note</p>
              <p className="text-xs mt-1">ou crée-en une nouvelle</p>
            </div>
            <button onClick={createNote}
              className="mt-2 flex items-center gap-1.5 px-4 py-2 rounded-lg text-sm text-white"
              style={{ backgroundColor: 'var(--accent)' }}>
              <Plus size={14} /> Nouvelle note
            </button>
          </div>
        ) : (
          <>
            {/* Note meta bar */}
            <div className="flex items-center gap-4 px-8 py-3 shrink-0 flex-wrap"
              style={{ borderBottom: '1px solid rgba(255,255,255,0.06)', background: 'rgba(255,255,255,0.01)' }}>

              {/* Title */}
              <input
                value={titleDraft}
                onChange={e => setTitleDraft(e.target.value)}
                onBlur={saveTitle}
                onKeyDown={e => e.key === 'Enter' && (e.currentTarget.blur())}
                placeholder="Titre de la note"
                className="flex-1 min-w-0 bg-transparent text-lg font-bold text-white placeholder-gray-600 focus:outline-none"
              />

              {/* Category badge */}
              <select
                value={selectedNote.categoryId}
                onChange={e => saveNotes(notes.map(n => n.id === selectedId ? { ...n, categoryId: e.target.value } : n))}
                className="text-xs rounded-lg px-2 py-1 text-gray-400 focus:outline-none cursor-pointer"
                style={{ background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.08)' }}>
                {categories.map(c => <option key={c.id} value={c.id} style={{ background: '#111' }}>{c.emoji} {c.name}</option>)}
              </select>

              {/* Linked course */}
              <div className="flex items-center gap-1.5">
                <BookOpen size={12} className="text-gray-600 shrink-0" />
                <select
                  value={selectedNote.courseId ?? ''}
                  onChange={e => saveCourse(e.target.value)}
                  className="text-xs rounded-lg px-2 py-1 text-gray-400 focus:outline-none cursor-pointer"
                  style={{ background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.08)' }}>
                  <option value="" style={{ background: '#111' }}>Aucun cours</option>
                  {courses.map(c => <option key={c.id} value={c.id} style={{ background: '#111' }}>{c.name}</option>)}
                </select>
                {linkedCourse && (
                  <span className="w-2 h-2 rounded-full shrink-0" style={{ backgroundColor: linkedCourse.color }} />
                )}
              </div>

              {/* Pin + date */}
              <button onClick={() => togglePin(selectedNote.id)}
                className="flex items-center gap-1 text-xs transition-colors"
                style={{ color: selectedNote.pinned ? '#fbbf24' : '#6b7280' }}>
                {selectedNote.pinned ? <Pin size={12} /> : <PinOff size={12} />}
                {selectedNote.pinned ? 'Épinglée' : 'Épingler'}
              </button>

              <span className="text-xs text-gray-700 shrink-0">{fmtDate(selectedNote.updatedAt)}</span>
            </div>

            {/* Toolbar */}
            <Toolbar editor={editor} onImageUrl={() => setImgPrompt(true)} />

            {/* Image URL prompt */}
            {imgPrompt && (
              <div className="flex items-center gap-2 px-4 py-2 shrink-0"
                style={{ borderBottom: '1px solid rgba(255,255,255,0.06)', background: 'rgba(255,255,255,0.02)' }}>
                <input
                  autoFocus
                  value={imgUrl}
                  onChange={e => setImgUrl(e.target.value)}
                  placeholder="https://... URL de l'image"
                  onKeyDown={e => { if (e.key === 'Enter') insertImage(); if (e.key === 'Escape') setImgPrompt(false); }}
                  className="flex-1 bg-transparent text-sm text-white placeholder-gray-600 focus:outline-none"
                />
                <button onClick={insertImage} className="w-6 h-6 flex items-center justify-center text-green-400 hover:text-green-300">
                  <Check size={14} />
                </button>
                <button onClick={() => setImgPrompt(false)} className="w-6 h-6 flex items-center justify-center text-gray-600 hover:text-white">
                  <X size={14} />
                </button>
              </div>
            )}

            {/* Editor */}
            <div className="flex-1 overflow-y-auto">
              <EditorContent editor={editor} className="h-full" />
            </div>
          </>
        )}
      </div>
    </div>
  );
}
