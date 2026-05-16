import { useState, useMemo } from 'react';
import type { HubCategory, HubLink } from '../types';
import { getItem, setItem } from '../utils/storage';
import { uid } from '../utils/helpers';
import { Modal, INPUT, LABEL, BTN_PRIMARY, BTN_GHOST } from '../components/ui';
import { Link2, Plus, Trash2, Pencil, Star, ExternalLink, X, Globe } from 'lucide-react';

const DEFAULT_CATEGORIES: HubCategory[] = [
  { id: 'studies',  name: 'Studies',  emoji: '📚' },
  { id: 'personal', name: 'Personal', emoji: '🏠' },
  { id: 'tools',    name: 'Tools',    emoji: '🛠️' },
  { id: 'social',   name: 'Social',   emoji: '💬' },
  { id: 'work',     name: 'Work',     emoji: '💼' },
];

const GLASS: React.CSSProperties = {
  background: 'rgba(255,255,255,0.03)',
  border: '1px solid rgba(255,255,255,0.07)',
  backdropFilter: 'blur(16px)',
  WebkitBackdropFilter: 'blur(16px)',
  borderRadius: 14,
};

function extractDomain(url: string): string {
  try { return new URL(url.startsWith('http') ? url : 'https://' + url).hostname; }
  catch { return ''; }
}

function getFaviconUrl(url: string): string {
  const domain = extractDomain(url);
  if (!domain) return '';
  return `https://www.google.com/s2/favicons?domain=${domain}&sz=64`;
}

const EMPTY_FORM = { title: '', url: '', categoryId: '' };

export default function Hub() {
  const [userCats, setUserCats]     = useState<HubCategory[]>(() => getItem('myne:hub:categories', []));
  const [links, setLinks]           = useState<HubLink[]>(() => getItem('myne:hub:links', []));
  const [modal, setModal]           = useState(false);
  const [editTarget, setEditTarget] = useState<HubLink | null>(null);
  const [form, setForm]             = useState({ ...EMPTY_FORM });
  const [catModal, setCatModal]     = useState(false);
  const [catForm, setCatForm]       = useState({ name: '', emoji: '🔗' });
  const [activeCategory, setActiveCategory] = useState<string | 'all' | 'pinned'>('all');

  const categories = [...DEFAULT_CATEGORIES, ...userCats];

  const saveLinks = (list: HubLink[]) => { setLinks(list); setItem('myne:hub:links', list); };

  const openAdd = () => {
    setEditTarget(null);
    setForm({ title: '', url: '', categoryId: categories[0]?.id ?? '' });
    setModal(true);
  };

  const openEdit = (link: HubLink) => {
    setEditTarget(link);
    setForm({ title: link.title, url: link.url, categoryId: link.categoryId });
    setModal(true);
  };

  const submit = () => {
    if (!form.title.trim() || !form.url.trim()) return;
    const url = form.url.startsWith('http') ? form.url : 'https://' + form.url;
    const link: HubLink = {
      id: editTarget?.id ?? uid(),
      title: form.title.trim(), url,
      categoryId: (form.categoryId || categories[0]?.id) ?? '',
      pinned: editTarget?.pinned ?? false,
      favicon: getFaviconUrl(url) || undefined,
    };
    if (editTarget) {
      saveLinks(links.map(l => l.id === editTarget.id ? link : l));
    } else {
      saveLinks([...links, link]);
    }
    setModal(false);
  };

  const remove = (id: string) => saveLinks(links.filter(l => l.id !== id));
  const togglePin = (id: string) => saveLinks(links.map(l => l.id === id ? { ...l, pinned: !l.pinned } : l));

  const addCategory = () => {
    if (!catForm.name.trim()) return;
    const nc: HubCategory = { id: uid(), name: catForm.name.trim(), emoji: catForm.emoji };
    const updated = [...userCats, nc];
    setUserCats(updated);
    setItem('myne:hub:categories', updated);
    setCatModal(false);
    setCatForm({ name: '', emoji: '🔗' });
  };

  const removeCategory = (id: string) => {
    const updated = userCats.filter(c => c.id !== id);
    setUserCats(updated);
    setItem('myne:hub:categories', updated);
  };

  const filtered = useMemo(() => {
    if (activeCategory === 'all')    return links;
    if (activeCategory === 'pinned') return links.filter(l => l.pinned);
    return links.filter(l => l.categoryId === activeCategory);
  }, [links, activeCategory]);

  const TABS = [
    { id: 'all',    name: 'All',    emoji: '🌐' },
    { id: 'pinned', name: 'Pinned', emoji: '⭐' },
    ...categories,
  ];

  return (
    <div className="p-6 space-y-5 max-w-6xl mx-auto">

      {/* Header */}
      <div className="flex items-center justify-between flex-wrap gap-3">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl flex items-center justify-center shrink-0"
            style={{ background: 'rgba(99,102,241,0.12)', border: '1px solid rgba(99,102,241,0.25)' }}>
            <Link2 size={18} style={{ color: 'var(--accent)' }} />
          </div>
          <div>
            <h1 className="text-xl font-bold text-white">Hub</h1>
            <p className="text-gray-500 text-sm">{links.length} links · {links.filter(l => l.pinned).length} pinned</p>
          </div>
        </div>
        <button onClick={openAdd} className={`flex items-center gap-2 px-3 py-2 text-sm rounded-lg ${BTN_PRIMARY}`}>
          <Plus size={16} /> Add a link
        </button>
      </div>

      {/* Category tabs */}
      <div className="flex gap-2 flex-wrap items-center">
        {TABS.map(cat => (
          <button key={cat.id} onClick={() => setActiveCategory(cat.id as any)}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-full text-sm font-medium transition-all"
            style={activeCategory === cat.id
              ? { backgroundColor: 'var(--accent)', color: 'white' }
              : { background: 'rgba(255,255,255,0.05)', color: '#9ca3af', border: '1px solid rgba(255,255,255,0.07)' }}>
            {cat.emoji} {cat.name}
          </button>
        ))}
        <button onClick={() => setCatModal(true)}
          className="flex items-center gap-1 px-2.5 py-1.5 rounded-full text-xs text-gray-500 transition-colors hover:text-gray-300"
          style={{ border: '1px dashed rgba(255,255,255,0.12)' }}>
          <Plus size={10} /> Category
        </button>
      </div>

      {/* Links grid */}
      {filtered.length === 0 ? (
        <div className="text-center py-16 rounded-2xl" style={{ border: '2px dashed rgba(255,255,255,0.06)' }}>
          <Globe size={32} className="mx-auto text-gray-700 mb-3" />
          <p className="text-gray-500 text-sm">No links in this category</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
          {filtered.map(link => {
            const cat = categories.find(c => c.id === link.categoryId);
            return (
              <div key={link.id} className="group p-4 transition-all flex flex-col gap-3" style={GLASS}
                onMouseEnter={e => (e.currentTarget.style.borderColor = 'rgba(255,255,255,0.14)')}
                onMouseLeave={e => (e.currentTarget.style.borderColor = 'rgba(255,255,255,0.07)')}>

                {/* Top row */}
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-xl overflow-hidden flex items-center justify-center shrink-0"
                    style={{ background: 'rgba(255,255,255,0.07)' }}>
                    {link.favicon
                      ? <img src={link.favicon} alt="" className="w-6 h-6 object-contain"
                          onError={e => { (e.currentTarget as HTMLImageElement).style.display = 'none'; }} />
                      : <Globe size={16} className="text-gray-500" />
                    }
                  </div>
                  <div className="min-w-0 flex-1">
                    <p className="text-sm font-semibold text-white truncate">{link.title}</p>
                    <p className="text-xs text-gray-500 truncate">{extractDomain(link.url)}</p>
                  </div>
                  {link.pinned && (
                    <Star size={13} className="text-amber-400 fill-amber-400 shrink-0" />
                  )}
                </div>

                {cat && (
                  <span className="text-xs text-gray-600 self-start">{cat.emoji} {cat.name}</span>
                )}

                {/* Actions */}
                <div className="flex items-center gap-1 pt-2" style={{ borderTop: '1px solid rgba(255,255,255,0.06)' }}>
                  <a href={link.url} target="_blank" rel="noopener noreferrer"
                    className="flex-1 flex items-center justify-center gap-1.5 py-1.5 text-xs text-gray-400 hover:text-white rounded-lg transition-colors hover:bg-white/5">
                    <ExternalLink size={11} /> Open
                  </a>
                  <button onClick={() => togglePin(link.id)}
                    className={`w-8 h-8 flex items-center justify-center rounded-lg transition-colors ${link.pinned ? 'text-amber-400' : 'text-gray-600 hover:text-amber-400 hover:bg-white/5'}`}>
                    <Star size={13} className={link.pinned ? 'fill-amber-400' : ''} />
                  </button>
                  <button onClick={() => openEdit(link)} className="w-8 h-8 flex items-center justify-center rounded-lg text-gray-600 hover:text-blue-400 hover:bg-white/5 transition-colors">
                    <Pencil size={13} />
                  </button>
                  <button onClick={() => remove(link.id)} className="w-8 h-8 flex items-center justify-center rounded-lg text-gray-600 hover:text-red-400 hover:bg-red-950/30 transition-colors">
                    <Trash2 size={13} />
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Custom categories manager */}
      {userCats.length > 0 && (
        <div className="p-4" style={GLASS}>
          <p className="text-xs font-semibold text-gray-500 uppercase tracking-wider mb-3">Custom categories</p>
          <div className="flex gap-2 flex-wrap">
            {userCats.map(cat => (
              <div key={cat.id} className="flex items-center gap-1.5 px-3 py-1.5 rounded-full text-sm text-gray-300"
                style={{ background: 'rgba(255,255,255,0.05)' }}>
                {cat.emoji} {cat.name}
                <button onClick={() => removeCategory(cat.id)} className="text-gray-600 hover:text-red-400 transition-colors ml-1">
                  <X size={11} />
                </button>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Add/Edit link modal */}
      <Modal isOpen={modal} onClose={() => setModal(false)} title={editTarget ? 'Edit link' : 'Add a link'}>
        <div className="space-y-4">
          <div>
            <label className={LABEL}>Title *</label>
            <input className={INPUT} placeholder="e.g. Google Scholar" value={form.title}
              onChange={e => setForm(f => ({ ...f, title: e.target.value }))} autoFocus />
          </div>
          <div>
            <label className={LABEL}>URL *</label>
            <input className={INPUT} placeholder="https://..." value={form.url}
              onChange={e => setForm(f => ({ ...f, url: e.target.value }))} />
          </div>
          <div>
            <label className={LABEL}>Category</label>
            <select className={INPUT} value={form.categoryId} onChange={e => setForm(f => ({ ...f, categoryId: e.target.value }))}>
              {categories.map(c => <option key={c.id} value={c.id}>{c.emoji} {c.name}</option>)}
            </select>
          </div>
          <div className="flex gap-2 justify-end">
            <button onClick={() => setModal(false)} className={BTN_GHOST}>Cancel</button>
            <button onClick={submit} disabled={!form.title.trim() || !form.url.trim()} className={`${BTN_PRIMARY} disabled:opacity-40`}>
              {editTarget ? 'Save' : 'Add'}
            </button>
          </div>
        </div>
      </Modal>

      {/* Add category modal */}
      <Modal isOpen={catModal} onClose={() => setCatModal(false)} title="New category">
        <div className="space-y-4">
          <div className="grid grid-cols-3 gap-3">
            <div>
              <label className={LABEL}>Emoji</label>
              <input className={INPUT} placeholder="🔗" value={catForm.emoji} onChange={e => setCatForm(f => ({ ...f, emoji: e.target.value }))} />
            </div>
            <div className="col-span-2">
              <label className={LABEL}>Name *</label>
              <input className={INPUT} placeholder="e.g. References" value={catForm.name}
                onChange={e => setCatForm(f => ({ ...f, name: e.target.value }))} autoFocus />
            </div>
          </div>
          <div className="flex gap-2 justify-end">
            <button onClick={() => setCatModal(false)} className={BTN_GHOST}>Cancel</button>
            <button onClick={addCategory} disabled={!catForm.name.trim()} className={`${BTN_PRIMARY} disabled:opacity-40`}>Create</button>
          </div>
        </div>
      </Modal>
    </div>
  );
}
