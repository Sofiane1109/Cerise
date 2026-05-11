import { useState, useMemo } from 'react';
import type { HubCategory, HubLink } from '../types';
import { getItem, setItem } from '../utils/storage';
import { uid } from '../utils/helpers';
import { Modal, INPUT, LABEL, BTN_PRIMARY, BTN_GHOST } from '../components/ui';
import { Link2, Plus, Trash2, Pencil, Star, ExternalLink, X, Globe } from 'lucide-react';

const DEFAULT_CATEGORIES: HubCategory[] = [
  { id: 'studies', name: 'Études',    emoji: '📚' },
  { id: 'personal',name: 'Personnel', emoji: '🏠' },
  { id: 'tools',   name: 'Outils',    emoji: '🛠️' },
  { id: 'social',  name: 'Social',    emoji: '💬' },
  { id: 'work',    name: 'Travail',   emoji: '💼' },
];

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
  const [userCats, setUserCats] = useState<HubCategory[]>(() => getItem('myne:hub:categories', []));
  const [links, setLinks]       = useState<HubLink[]>(() => getItem('myne:hub:links', []));

  const [modal, setModal]         = useState(false);
  const [editTarget, setEditTarget] = useState<HubLink | null>(null);
  const [form, setForm]           = useState({ ...EMPTY_FORM });

  const [catModal, setCatModal]   = useState(false);
  const [catForm, setCatForm]     = useState({ name: '', emoji: '🔗' });

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
      title: form.title.trim(),
      url,
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

  return (
    <div className="p-6 space-y-5 max-w-6xl mx-auto">
      {/* Header */}
      <div className="flex items-center justify-between flex-wrap gap-3">
        <div>
          <h1 className="text-xl font-bold text-white flex items-center gap-2">
            <Link2 size={22} style={{ color: 'var(--accent)' }} /> Hub
          </h1>
          <p className="text-gray-500 text-sm mt-0.5">{links.length} liens · {links.filter(l => l.pinned).length} épinglés</p>
        </div>
        <button onClick={openAdd} className={`flex items-center gap-2 px-3 py-2 text-sm rounded-lg ${BTN_PRIMARY}`}>
          <Plus size={16} /> Ajouter un lien
        </button>
      </div>

      {/* Category tabs */}
      <div className="flex gap-2 flex-wrap items-center">
        {[
          { id: 'all', name: 'Tous', emoji: '🌐' },
          { id: 'pinned', name: 'Épinglés', emoji: '⭐' },
          ...categories,
        ].map(cat => (
          <button key={cat.id} onClick={() => setActiveCategory(cat.id as any)}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-full text-sm font-medium transition-colors ${
              activeCategory === cat.id ? 'text-white' : 'bg-gray-800 text-gray-400 hover:text-white'
            }`}
            style={activeCategory === cat.id ? { backgroundColor: 'var(--accent)' } : {}}>
            {cat.emoji} {cat.name}
          </button>
        ))}
        <button onClick={() => setCatModal(true)} className="flex items-center gap-1 px-2.5 py-1.5 rounded-full text-xs text-gray-500 border border-dashed border-gray-700 hover:border-gray-500 transition-colors">
          <Plus size={10} /> Catégorie
        </button>
      </div>

      {/* Links grid */}
      {filtered.length === 0 ? (
        <div className="text-center py-16 border-2 border-dashed border-gray-800 rounded-xl">
          <Globe size={32} className="mx-auto text-gray-700 mb-3" />
          <p className="text-gray-500 text-sm">Aucun lien dans cette catégorie</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
          {filtered.map(link => {
            const cat = categories.find(c => c.id === link.categoryId);
            return (
              <div key={link.id} className="group bg-gray-900 border border-gray-800 hover:border-gray-700 rounded-xl p-4 transition-all">
                <div className="flex items-start gap-3">
                  {/* Favicon */}
                  <div className="w-9 h-9 rounded-lg overflow-hidden bg-gray-800 flex items-center justify-center shrink-0">
                    {link.favicon
                      ? <img src={link.favicon} alt="" className="w-6 h-6 object-contain"
                          onError={e => { (e.currentTarget as HTMLImageElement).style.display = 'none'; }} />
                      : <Globe size={16} className="text-gray-500" />
                    }
                  </div>
                  {/* Info */}
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-semibold text-white truncate">{link.title}</p>
                    <p className="text-xs text-gray-500 truncate">{extractDomain(link.url)}</p>
                    {cat && <span className="text-xs text-gray-600">{cat.emoji} {cat.name}</span>}
                  </div>
                </div>
                {/* Actions */}
                <div className="flex items-center gap-1 mt-3 pt-3 border-t border-gray-800">
                  <a href={link.url} target="_blank" rel="noopener noreferrer"
                    className="flex-1 flex items-center justify-center gap-1.5 py-1.5 text-xs text-gray-400 hover:text-white bg-gray-800 hover:bg-gray-700 rounded-lg transition-colors">
                    <ExternalLink size={11} /> Ouvrir
                  </a>
                  <button onClick={() => togglePin(link.id)}
                    className={`w-8 h-8 flex items-center justify-center rounded-lg transition-colors ${link.pinned ? 'text-amber-400 bg-amber-400/10' : 'text-gray-600 hover:text-amber-400 hover:bg-gray-800'}`}>
                    <Star size={13} className={link.pinned ? 'fill-amber-400' : ''} />
                  </button>
                  <button onClick={() => openEdit(link)} className="w-8 h-8 flex items-center justify-center rounded-lg text-gray-600 hover:text-blue-400 hover:bg-gray-800 transition-colors">
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

      {/* Manage categories */}
      {userCats.length > 0 && (
        <div className="bg-gray-900 border border-gray-800 rounded-xl p-4">
          <p className="text-xs font-semibold text-gray-500 uppercase tracking-wider mb-3">Catégories personnalisées</p>
          <div className="flex gap-2 flex-wrap">
            {userCats.map(cat => (
              <div key={cat.id} className="flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-gray-800 text-sm text-gray-300">
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
      <Modal isOpen={modal} onClose={() => setModal(false)} title={editTarget ? 'Modifier le lien' : 'Ajouter un lien'}>
        <div className="space-y-4">
          <div>
            <label className={LABEL}>Titre *</label>
            <input className={INPUT} placeholder="ex: Google Scholar" value={form.title}
              onChange={e => setForm(f => ({ ...f, title: e.target.value }))} autoFocus />
          </div>
          <div>
            <label className={LABEL}>URL *</label>
            <input className={INPUT} placeholder="https://..." value={form.url}
              onChange={e => setForm(f => ({ ...f, url: e.target.value }))} />
          </div>
          <div>
            <label className={LABEL}>Catégorie</label>
            <select className={INPUT} value={form.categoryId} onChange={e => setForm(f => ({ ...f, categoryId: e.target.value }))}>
              {categories.map(c => <option key={c.id} value={c.id}>{c.emoji} {c.name}</option>)}
            </select>
          </div>
          <div className="flex gap-2 justify-end">
            <button onClick={() => setModal(false)} className={BTN_GHOST}>Annuler</button>
            <button onClick={submit} disabled={!form.title.trim() || !form.url.trim()} className={`${BTN_PRIMARY} disabled:opacity-40`}>
              {editTarget ? 'Sauvegarder' : 'Ajouter'}
            </button>
          </div>
        </div>
      </Modal>

      {/* Add category modal */}
      <Modal isOpen={catModal} onClose={() => setCatModal(false)} title="Nouvelle catégorie">
        <div className="space-y-4">
          <div className="grid grid-cols-3 gap-3">
            <div>
              <label className={LABEL}>Emoji</label>
              <input className={INPUT} placeholder="🔗" value={catForm.emoji} onChange={e => setCatForm(f => ({ ...f, emoji: e.target.value }))} />
            </div>
            <div className="col-span-2">
              <label className={LABEL}>Nom *</label>
              <input className={INPUT} placeholder="ex: Références" value={catForm.name} onChange={e => setCatForm(f => ({ ...f, name: e.target.value }))} autoFocus />
            </div>
          </div>
          <div className="flex gap-2 justify-end">
            <button onClick={() => setCatModal(false)} className={BTN_GHOST}>Annuler</button>
            <button onClick={addCategory} disabled={!catForm.name.trim()} className={`${BTN_PRIMARY} disabled:opacity-40`}>Créer</button>
          </div>
        </div>
      </Modal>
    </div>
  );
}
