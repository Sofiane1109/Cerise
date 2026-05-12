import { useState, useMemo } from 'react';
import type { HikeWishlist, HikeDone, HikeGearCheck, HikeGearShop, HikeDifficulty } from '../types';
import { getItem, setItem } from '../utils/storage';
import { uid, today } from '../utils/helpers';
import { Modal, INPUT, LABEL, BTN_PRIMARY, BTN_GHOST } from '../components/ui';
import {
  Mountain, Plus, Trash2, Star, MapPin, ExternalLink,
  RotateCcw, ShoppingBag, Check, Trophy, Pencil,
} from 'lucide-react';

const DIFF_CONFIG: Record<HikeDifficulty, { label: string; color: string; bg: string; dot: string }> = {
  easy:     { label: 'Facile',    color: 'text-emerald-400', bg: 'bg-emerald-500/10 border-emerald-900/40', dot: '#10b981' },
  moderate: { label: 'Modéré',    color: 'text-amber-400',   bg: 'bg-amber-500/10 border-amber-900/40',     dot: '#f59e0b' },
  hard:     { label: 'Difficile', color: 'text-orange-400',  bg: 'bg-orange-500/10 border-orange-900/40',   dot: '#f97316' },
  expert:   { label: 'Expert',    color: 'text-red-400',     bg: 'bg-red-500/10 border-red-900/40',         dot: '#ef4444' },
};
const DIFFS: HikeDifficulty[] = ['easy', 'moderate', 'hard', 'expert'];

const GLASS: React.CSSProperties = {
  background: 'rgba(255,255,255,0.03)',
  border: '1px solid rgba(255,255,255,0.07)',
  backdropFilter: 'blur(16px)',
  WebkitBackdropFilter: 'blur(16px)',
  borderRadius: 16,
};

function Stars({ value, onChange }: { value: number; onChange?: (v: number) => void }) {
  return (
    <div className="flex gap-0.5">
      {[1,2,3,4,5].map(n => (
        <button key={n} type="button" onClick={() => onChange?.(n)} className={onChange ? 'cursor-pointer' : 'cursor-default'}>
          <Star size={15} className={n <= value ? 'text-amber-400 fill-amber-400' : 'text-gray-700'} />
        </button>
      ))}
    </div>
  );
}

function fmtDuration(min: number): string {
  const h = Math.floor(min / 60), m = min % 60;
  return h > 0 ? `${h}h${m > 0 ? m : ''}` : `${m}min`;
}

const EMPTY_DONE_FORM = { name: '', date: today(), duration: '', distance: '', elevation: '', rating: 0, comment: '', wishlistId: '' };
const EMPTY_WISH_FORM = { name: '', location: '', estimatedDistance: '', difficulty: 'moderate' as HikeDifficulty, link: '' };
const EMPTY_SHOP_FORM = { title: '', link: '', price: '' };

type Tab = 'wishlist' | 'done' | 'ranking' | 'gear';

export default function Hike() {
  const accent = getItem<{ accentColor: string }>('myne:settings', { accentColor: '#6366f1' }).accentColor;

  const [tab, setTab]             = useState<Tab>('wishlist');
  const [wishFilter, setWishFilter] = useState<HikeDifficulty | 'all'>('all');
  const [doneSort, setDoneSort]   = useState<'date' | 'rating'>('date');

  // Wishlist
  const [wishlist, setWishlist]     = useState<HikeWishlist[]>(() => getItem('myne:hike:wishlist', []));
  const [showAddWish, setShowAddWish] = useState(false);
  const [wishForm, setWishForm]     = useState({ ...EMPTY_WISH_FORM });
  const [editWish, setEditWish]     = useState<HikeWishlist | null>(null);

  // Done
  const [done, setDone]             = useState<HikeDone[]>(() => getItem('myne:hike:done', []));
  const [doneModal, setDoneModal]   = useState(false);
  const [editDoneTarget, setEditDoneTarget] = useState<string | null>(null);
  const [doneForm, setDoneForm]     = useState({ ...EMPTY_DONE_FORM });
  const [draggedWishId, setDraggedWishId] = useState<string | null>(null);
  const [dropActive, setDropActive] = useState(false);

  // Gear checklist
  const [gearCheck, setGearCheck]   = useState<HikeGearCheck[]>(() => getItem('myne:hike:gear:check', []));
  const [newLabel, setNewLabel]     = useState('');
  const [editCheckId, setEditCheckId] = useState<string | null>(null);
  const [editCheckLabel, setEditCheckLabel] = useState('');

  // Gear shop
  const [gearShop, setGearShop]     = useState<HikeGearShop[]>(() => getItem('myne:hike:gear:shop', []));
  const [showAddShop, setShowAddShop] = useState(false);
  const [shopForm, setShopForm]     = useState({ ...EMPTY_SHOP_FORM });
  const [editShop, setEditShop]     = useState<HikeGearShop | null>(null);

  // ── Wishlist ─────────────────────────────────────────────────────────────────
  const saveWishlist = (list: HikeWishlist[]) => { setWishlist(list); setItem('myne:hike:wishlist', list); };
  const addWish = () => {
    if (!wishForm.name.trim() || !wishForm.location.trim()) return;
    saveWishlist([{ id: uid(), name: wishForm.name.trim(), location: wishForm.location.trim(), estimatedDistance: Number(wishForm.estimatedDistance) || 0, difficulty: wishForm.difficulty, link: wishForm.link.trim() || undefined }, ...wishlist]);
    setWishForm({ ...EMPTY_WISH_FORM }); setShowAddWish(false);
  };
  const submitEditWish = () => {
    if (!editWish || !wishForm.name.trim()) return;
    saveWishlist(wishlist.map(w => w.id === editWish.id ? { ...w, name: wishForm.name.trim(), location: wishForm.location.trim(), estimatedDistance: Number(wishForm.estimatedDistance) || 0, difficulty: wishForm.difficulty, link: wishForm.link.trim() || undefined } : w));
    setEditWish(null);
  };
  const openEditWish = (w: HikeWishlist) => {
    setEditWish(w);
    setWishForm({ name: w.name, location: w.location, estimatedDistance: String(w.estimatedDistance), difficulty: w.difficulty, link: w.link ?? '' });
    setShowAddWish(false);
  };
  const removeWish = (id: string) => saveWishlist(wishlist.filter(w => w.id !== id));

  // ── Done ─────────────────────────────────────────────────────────────────────
  const saveDone = (list: HikeDone[]) => { setDone(list); setItem('myne:hike:done', list); };
  const openDoneForm = (wishId?: string) => {
    setEditDoneTarget(null);
    const w = wishId ? wishlist.find(x => x.id === wishId) : undefined;
    setDoneForm({ name: w?.name ?? '', date: today(), duration: '', distance: w ? String(w.estimatedDistance) : '', elevation: '', rating: 0, comment: '', wishlistId: wishId ?? '' });
    setDoneModal(true);
  };
  const openEditDone = (d: HikeDone) => {
    setEditDoneTarget(d.id);
    setDoneForm({ name: d.name, date: d.date, duration: String(d.duration), distance: String(d.distance), elevation: String(d.elevation), rating: d.rating, comment: d.comment, wishlistId: d.wishlistId ?? '' });
    setDoneModal(true);
  };
  const submitDone = () => {
    if (!doneForm.name.trim() || !doneForm.rating) return;
    const entry: HikeDone = { id: editDoneTarget ?? uid(), wishlistId: doneForm.wishlistId || undefined, name: doneForm.name.trim(), date: doneForm.date, duration: Number(doneForm.duration) || 0, distance: Number(doneForm.distance) || 0, elevation: Number(doneForm.elevation) || 0, rating: doneForm.rating, comment: doneForm.comment.trim() };
    if (editDoneTarget) { saveDone(done.map(d => d.id === editDoneTarget ? entry : d)); }
    else { if (doneForm.wishlistId) removeWish(doneForm.wishlistId); saveDone([entry, ...done]); }
    setDoneModal(false); setEditDoneTarget(null);
  };
  const removeDone = (id: string) => saveDone(done.filter(d => d.id !== id));
  const handleWishDrop = () => { setDropActive(false); if (draggedWishId) { openDoneForm(draggedWishId); setDraggedWishId(null); } };

  // ── Gear checklist ───────────────────────────────────────────────────────────
  const saveCheck = (list: HikeGearCheck[]) => { setGearCheck(list); setItem('myne:hike:gear:check', list); };
  const addCheck = () => { if (!newLabel.trim()) return; saveCheck([...gearCheck, { id: uid(), label: newLabel.trim(), checked: false }]); setNewLabel(''); };
  const submitEditCheck = (id: string) => { if (!editCheckLabel.trim()) return; saveCheck(gearCheck.map(g => g.id === id ? { ...g, label: editCheckLabel.trim() } : g)); setEditCheckId(null); };

  // ── Gear shop ────────────────────────────────────────────────────────────────
  const saveShop = (list: HikeGearShop[]) => { setGearShop(list); setItem('myne:hike:gear:shop', list); };
  const addShop = () => { if (!shopForm.title.trim()) return; saveShop([{ id: uid(), title: shopForm.title.trim(), link: shopForm.link.trim() || undefined, price: shopForm.price ? Number(shopForm.price) : undefined, bought: false }, ...gearShop]); setShopForm({ ...EMPTY_SHOP_FORM }); setShowAddShop(false); };
  const openEditShop = (g: HikeGearShop) => { setEditShop(g); setShopForm({ title: g.title, link: g.link ?? '', price: g.price !== undefined ? String(g.price) : '' }); setShowAddShop(false); };
  const submitEditShop = () => { if (!editShop || !shopForm.title.trim()) return; saveShop(gearShop.map(g => g.id === editShop.id ? { ...g, title: shopForm.title.trim(), link: shopForm.link.trim() || undefined, price: shopForm.price ? Number(shopForm.price) : undefined } : g)); setEditShop(null); };

  // ── Derived ──────────────────────────────────────────────────────────────────
  const totalDistance  = done.reduce((s, d) => s + d.distance, 0);
  const totalElevation = done.reduce((s, d) => s + d.elevation, 0);
  const avgRating      = done.length > 0 ? Math.round((done.reduce((s, d) => s + d.rating, 0) / done.length) * 10) / 10 : 0;
  const filteredWish   = wishFilter === 'all' ? wishlist : wishlist.filter(w => w.difficulty === wishFilter);
  const sortedDone     = [...done].sort(doneSort === 'date' ? (a, b) => b.date.localeCompare(a.date) : (a, b) => b.rating - a.rating || b.date.localeCompare(a.date));
  const checkPct       = gearCheck.length > 0 ? Math.round((gearCheck.filter(g => g.checked).length / gearCheck.length) * 100) : 0;

  const ranked = useMemo(() => [...done].sort((a, b) => b.rating - a.rating || b.date.localeCompare(a.date)), [done]);
  const podiumSlots = [
    { hike: ranked[1] ?? null, pos: 2, h: 64  },
    { hike: ranked[0] ?? null, pos: 1, h: 96  },
    { hike: ranked[2] ?? null, pos: 3, h: 48  },
  ];
  const rest = ranked.slice(3);

  const wishFormFields = (form: typeof EMPTY_WISH_FORM, set: React.Dispatch<React.SetStateAction<typeof EMPTY_WISH_FORM>>) => (
    <div className="space-y-3">
      <div>
        <label className={LABEL}>Nom *</label>
        <input className={INPUT} placeholder="Nom de la randonnée" value={form.name} onChange={e => set(f => ({ ...f, name: e.target.value }))} autoFocus />
      </div>
      <div>
        <label className={LABEL}>Lieu *</label>
        <input className={INPUT} placeholder="Localisation" value={form.location} onChange={e => set(f => ({ ...f, location: e.target.value }))} />
      </div>
      <div className="grid grid-cols-2 gap-3">
        <div>
          <label className={LABEL}>Distance estimée (km)</label>
          <input type="number" className={INPUT} placeholder="0" value={form.estimatedDistance} onChange={e => set(f => ({ ...f, estimatedDistance: e.target.value }))} />
        </div>
        <div>
          <label className={LABEL}>Difficulté</label>
          <select className={INPUT} value={form.difficulty} onChange={e => set(f => ({ ...f, difficulty: e.target.value as HikeDifficulty }))}>
            {DIFFS.map(d => <option key={d} value={d}>{DIFF_CONFIG[d].label}</option>)}
          </select>
        </div>
      </div>
      <div>
        <label className={LABEL}>Lien (optionnel)</label>
        <input className={INPUT} placeholder="https://..." value={form.link} onChange={e => set(f => ({ ...f, link: e.target.value }))} />
      </div>
    </div>
  );

  const TABS = [
    { id: 'wishlist' as Tab, label: 'Wishlist',    count: wishlist.length },
    { id: 'done'     as Tab, label: 'Effectuées',  count: done.length },
    { id: 'ranking'  as Tab, label: 'Classement',  count: null },
    { id: 'gear'     as Tab, label: 'Équipement',  count: null },
  ];

  return (
    <div style={{ background: '#09090f', minHeight: '100%' }}>

      {/* ── Hero ── */}
      <div className="relative overflow-hidden px-6 pt-8 pb-6">
        <div className="absolute inset-0 pointer-events-none" style={{
          background: `radial-gradient(ellipse 70% 60% at 20% -10%, ${accent}20, transparent 60%)`,
        }} />
        <div className="relative max-w-5xl mx-auto">
          <div className="flex items-center gap-3 mb-5">
            <div className="w-10 h-10 rounded-xl flex items-center justify-center shrink-0"
              style={{ background: `${accent}20`, border: `1px solid ${accent}40` }}>
              <Mountain size={20} style={{ color: accent }} />
            </div>
            <div>
              <h1 className="text-xl font-bold text-white">Hike</h1>
              <p className="text-xs text-gray-500">
                {done.length} rando{done.length !== 1 ? 's' : ''} effectuée{done.length !== 1 ? 's' : ''} · {wishlist.length} en wishlist
              </p>
            </div>
            <button onClick={() => openDoneForm()} className="ml-auto flex items-center gap-1.5 px-4 py-2 rounded-xl text-sm font-semibold text-white"
              style={{ background: accent }}>
              <Plus size={14} /> Ajouter une rando
            </button>
          </div>

          {/* Stats */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
            {[
              { label: 'Randos',   val: String(done.length),                                     unit: '',   icon: '🥾' },
              { label: 'Distance', val: totalDistance > 0 ? totalDistance.toFixed(1) : '—',      unit: 'km', icon: '📏' },
              { label: 'Dénivelé', val: totalElevation > 0 ? totalElevation.toLocaleString('fr-FR') : '—', unit: 'm', icon: '⛰️' },
              { label: 'Note moy.', val: done.length > 0 ? String(avgRating) : '—',              unit: done.length > 0 ? '★' : '', icon: '🏆' },
            ].map(s => (
              <div key={s.label} style={GLASS} className="p-4">
                <p className="text-[10px] text-gray-500 uppercase tracking-widest mb-1.5">{s.icon} {s.label}</p>
                <p className="text-2xl font-black text-white leading-none">
                  {s.val}
                  {s.unit && <span className="text-sm font-normal text-gray-500 ml-1">{s.unit}</span>}
                </p>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* ── Tab bar ── */}
      <div className="px-6 max-w-5xl mx-auto mb-5">
        <div className="flex gap-1 p-1 rounded-xl" style={{ background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.06)' }}>
          {TABS.map(t => (
            <button key={t.id} onClick={() => setTab(t.id)}
              className="relative flex-1 flex items-center justify-center gap-1.5 py-2 text-sm font-medium rounded-lg transition-all"
              style={tab === t.id ? { background: accent, color: 'white' } : { color: 'rgba(255,255,255,0.45)' }}>
              {t.label}
              {t.count !== null && t.count > 0 && (
                <span className="text-[10px] px-1.5 py-0.5 rounded-full"
                  style={{
                    background: tab === t.id ? 'rgba(255,255,255,0.25)' : 'rgba(255,255,255,0.1)',
                    color: tab === t.id ? 'white' : 'rgba(255,255,255,0.5)',
                  }}>
                  {t.count}
                </span>
              )}
            </button>
          ))}
        </div>
      </div>

      {/* ── Tab content ── */}
      <div className="px-6 pb-10 max-w-5xl mx-auto">

        {/* WISHLIST */}
        {tab === 'wishlist' && (
          <div>
            <div className="flex items-center justify-between gap-3 mb-4 flex-wrap">
              <div className="flex gap-1.5 flex-wrap">
                {(['all', ...DIFFS] as const).map(d => (
                  <button key={d} onClick={() => setWishFilter(d)}
                    className="px-3 py-1 text-xs rounded-full transition-all font-medium"
                    style={wishFilter === d
                      ? { background: d === 'all' ? accent : DIFF_CONFIG[d].dot, color: 'white' }
                      : { background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.08)', color: 'rgba(255,255,255,0.5)' }}>
                    {d === 'all' ? 'Toutes' : DIFF_CONFIG[d].label}
                  </button>
                ))}
              </div>
              <button onClick={() => { setShowAddWish(v => !v); setEditWish(null); }}
                className="flex items-center gap-1.5 px-3 py-1.5 text-sm rounded-xl font-medium text-white transition-all"
                style={{ background: showAddWish && !editWish ? 'rgba(255,255,255,0.1)' : accent }}>
                <Plus size={14} /> Ajouter
              </button>
            </div>

            {showAddWish && !editWish && (
              <div style={{ ...GLASS, padding: 20, marginBottom: 16 }} className="space-y-3">
                <p className="text-xs font-semibold text-gray-400 uppercase tracking-wider">Nouvelle randonnée</p>
                {wishFormFields(wishForm, setWishForm)}
                <div className="flex gap-2 justify-end pt-1">
                  <button onClick={() => setShowAddWish(false)} className={BTN_GHOST}>Annuler</button>
                  <button onClick={addWish} className={BTN_PRIMARY}>Ajouter</button>
                </div>
              </div>
            )}

            {editWish && (
              <div style={{ ...GLASS, padding: 20, marginBottom: 16, border: `1px solid ${accent}50` }} className="space-y-3">
                <p className="text-xs font-semibold uppercase tracking-wider" style={{ color: accent }}>Modifier</p>
                {wishFormFields(wishForm, setWishForm)}
                <div className="flex gap-2 justify-end pt-1">
                  <button onClick={() => setEditWish(null)} className={BTN_GHOST}>Annuler</button>
                  <button onClick={submitEditWish} className={BTN_PRIMARY}>Sauvegarder</button>
                </div>
              </div>
            )}

            {filteredWish.length === 0 ? (
              <div className="text-center py-16" style={GLASS}>
                <p className="text-5xl mb-3">🗺️</p>
                <p className="text-gray-400 font-medium mb-1">
                  {wishFilter !== 'all' ? `Aucune rando "${DIFF_CONFIG[wishFilter].label}"` : 'Votre wishlist est vide'}
                </p>
                <p className="text-gray-600 text-sm">
                  {wishFilter !== 'all' ? 'Essayez un autre filtre' : 'Ajoutez vos prochaines aventures !'}
                </p>
              </div>
            ) : (
              <div className="space-y-2">
                {filteredWish.map(w => {
                  const diff = DIFF_CONFIG[w.difficulty];
                  return (
                    <div key={w.id} draggable
                      onDragStart={() => setDraggedWishId(w.id)}
                      onDragEnd={() => setDraggedWishId(null)}
                      className={`group transition-all cursor-grab active:cursor-grabbing ${draggedWishId === w.id ? 'opacity-30 scale-95' : 'hover:brightness-110'}`}
                      style={{ ...GLASS, padding: '16px 18px' }}>
                      <div className="flex items-start justify-between gap-2 mb-2">
                        <p className="font-semibold text-white">{w.name}</p>
                        <span className={`text-xs px-2 py-0.5 rounded-full border shrink-0 ${diff.bg} ${diff.color}`}>{diff.label}</span>
                      </div>
                      <div className="flex items-center gap-3 text-xs text-gray-500 mb-3">
                        <span className="flex items-center gap-1"><MapPin size={10} /> {w.location}</span>
                        {w.estimatedDistance > 0 && <span>≈ {w.estimatedDistance} km</span>}
                      </div>
                      <div className="flex items-center gap-2 flex-wrap">
                        <button onClick={() => openDoneForm(w.id)}
                          className="flex items-center gap-1.5 px-3 py-1 text-xs rounded-lg font-medium transition-all"
                          style={{ background: 'rgba(34,197,94,0.15)', border: '1px solid rgba(34,197,94,0.3)', color: '#86efac' }}>
                          ✓ Marquer comme faite
                        </button>
                        {w.link && (
                          <a href={w.link} target="_blank" rel="noopener noreferrer" onClick={e => e.stopPropagation()}
                            className="flex items-center gap-1 text-xs transition-colors" style={{ color: accent }}>
                            <ExternalLink size={10} /> Voir
                          </a>
                        )}
                        <div className="ml-auto flex gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                          <button onClick={() => openEditWish(w)} className="text-gray-600 hover:text-blue-400 transition-colors">
                            <Pencil size={13} />
                          </button>
                          <button onClick={() => removeWish(w.id)} className="text-gray-600 hover:text-red-400 transition-colors">
                            <Trash2 size={13} />
                          </button>
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}

            <div
              onDragOver={e => { e.preventDefault(); setDropActive(true); }}
              onDragLeave={() => setDropActive(false)}
              onDrop={handleWishDrop}
              className="mt-4 py-5 rounded-xl border-2 border-dashed text-center text-sm transition-all select-none"
              style={dropActive
                ? { borderColor: '#22c55e', background: 'rgba(34,197,94,0.08)', color: '#86efac' }
                : { borderColor: 'rgba(255,255,255,0.08)', color: 'rgba(255,255,255,0.2)' }}>
              {dropActive ? '⬇ Déposez ici pour marquer comme effectuée' : 'Glissez une carte ici pour la marquer comme faite'}
            </div>
          </div>
        )}

        {/* DONE */}
        {tab === 'done' && (
          <div>
            <div className="flex items-center justify-between gap-3 mb-4">
              <div className="flex gap-1 p-1 rounded-xl" style={{ background: 'rgba(255,255,255,0.05)' }}>
                {([{ v: 'date', l: '📅 Date' }, { v: 'rating', l: '⭐ Note' }] as const).map(s => (
                  <button key={s.v} onClick={() => setDoneSort(s.v)}
                    className="px-3 py-1.5 text-xs rounded-lg transition-all font-medium"
                    style={doneSort === s.v ? { background: 'rgba(255,255,255,0.12)', color: 'white' } : { color: 'rgba(255,255,255,0.4)' }}>
                    {s.l}
                  </button>
                ))}
              </div>
              <button onClick={() => openDoneForm()}
                className="flex items-center gap-1.5 px-3 py-1.5 text-sm rounded-xl font-medium text-white"
                style={{ background: accent }}>
                <Plus size={14} /> Ajouter
              </button>
            </div>

            {done.length === 0 ? (
              <div className="text-center py-16" style={GLASS}>
                <p className="text-5xl mb-3">🥾</p>
                <p className="text-gray-400 font-medium mb-1">Pas encore de randonnée effectuée</p>
                <p className="text-gray-600 text-sm">Vos aventures apparaîtront ici !</p>
              </div>
            ) : (
              <div className="space-y-3">
                {sortedDone.map(d => (
                  <div key={d.id} className="group transition-all hover:brightness-110" style={{ ...GLASS, padding: '16px 18px' }}>
                    <div className="flex items-start justify-between gap-3 mb-2">
                      <div>
                        <p className="font-semibold text-white">{d.name}</p>
                        <p className="text-xs text-gray-500 mt-0.5">
                          {new Date(d.date + 'T00:00').toLocaleDateString('fr-FR', { weekday: 'short', day: 'numeric', month: 'long', year: 'numeric' })}
                        </p>
                      </div>
                      <div className="flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity shrink-0">
                        <button onClick={() => openEditDone(d)}
                          className="w-7 h-7 flex items-center justify-center rounded-lg text-gray-600 hover:text-blue-400 hover:bg-white/5 transition-all">
                          <Pencil size={13} />
                        </button>
                        <button onClick={() => removeDone(d.id)}
                          className="w-7 h-7 flex items-center justify-center rounded-lg text-gray-600 hover:text-red-400 hover:bg-red-500/10 transition-all">
                          <Trash2 size={13} />
                        </button>
                      </div>
                    </div>
                    <div className="flex flex-wrap gap-2 mb-2.5">
                      {d.distance > 0  && <span className="text-xs px-2.5 py-0.5 rounded-full" style={{ background: 'rgba(255,255,255,0.06)', color: 'rgba(255,255,255,0.6)' }}>📏 {d.distance} km</span>}
                      {d.elevation > 0 && <span className="text-xs px-2.5 py-0.5 rounded-full" style={{ background: 'rgba(255,255,255,0.06)', color: 'rgba(255,255,255,0.6)' }}>⛰️ +{d.elevation} m</span>}
                      {d.duration > 0  && <span className="text-xs px-2.5 py-0.5 rounded-full" style={{ background: 'rgba(255,255,255,0.06)', color: 'rgba(255,255,255,0.6)' }}>⏱️ {fmtDuration(d.duration)}</span>}
                    </div>
                    <Stars value={d.rating} />
                    {d.comment && (
                      <p className="text-xs text-gray-500 mt-2 italic border-l-2 pl-3" style={{ borderColor: `${accent}60` }}>"{d.comment}"</p>
                    )}
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        {/* RANKING */}
        {tab === 'ranking' && (
          <div>
            {done.length === 0 ? (
              <div className="text-center py-16" style={GLASS}>
                <p className="text-5xl mb-3">🏆</p>
                <p className="text-gray-400 font-medium mb-1">Pas encore de classement</p>
                <p className="text-gray-600 text-sm">Notez vos randonnées pour construire votre top !</p>
              </div>
            ) : (
              <>
                <div style={GLASS} className="p-6 mb-4">
                  <h2 className="font-semibold text-white mb-6 flex items-center gap-2">
                    <Trophy size={16} className="text-amber-400" /> Podium
                  </h2>
                  <div className="grid grid-cols-3 gap-4 items-end">
                    {podiumSlots.map((slot, i) => (
                      <div key={i} className="flex flex-col items-center gap-2">
                        {slot.hike ? (
                          <>
                            <p className="text-xs text-gray-300 text-center font-medium w-full truncate px-1 leading-tight">{slot.hike.name}</p>
                            <Stars value={slot.hike.rating} />
                            <div className="w-full rounded-t-2xl flex items-center justify-center"
                              style={{
                                height: slot.h,
                                background: slot.pos === 1
                                  ? 'linear-gradient(160deg,#fbbf24,#d97706)'
                                  : slot.pos === 2
                                  ? 'linear-gradient(160deg,#d1d5db,#9ca3af)'
                                  : 'linear-gradient(160deg,#cd7f32,#92400e)',
                                boxShadow: slot.pos === 1 ? '0 0 24px rgba(251,191,36,0.4)' : 'none',
                              }}>
                              <span style={{ fontSize: 28 }}>{slot.pos === 1 ? '🥇' : slot.pos === 2 ? '🥈' : '🥉'}</span>
                            </div>
                          </>
                        ) : (
                          <div className="w-full rounded-t-2xl" style={{
                            height: slot.h,
                            background: 'rgba(255,255,255,0.03)',
                            border: '1px dashed rgba(255,255,255,0.07)',
                          }} />
                        )}
                      </div>
                    ))}
                  </div>
                </div>

                {rest.length > 0 && (
                  <div className="space-y-2">
                    {rest.map((h, i) => (
                      <div key={h.id} className="flex items-center gap-4 transition-all hover:brightness-110"
                        style={{ ...GLASS, padding: '12px 16px' }}>
                        <span className="text-gray-600 font-bold text-sm w-5 text-center shrink-0">{i + 4}</span>
                        <div className="flex-1 min-w-0">
                          <p className="text-sm text-white font-medium truncate">{h.name}</p>
                          <p className="text-xs text-gray-500 mt-0.5">
                            {h.distance > 0 ? `${h.distance} km · ` : ''}
                            {new Date(h.date + 'T00:00').toLocaleDateString('fr-FR', { day: 'numeric', month: 'short', year: 'numeric' })}
                          </p>
                        </div>
                        <Stars value={h.rating} />
                      </div>
                    ))}
                  </div>
                )}
              </>
            )}
          </div>
        )}

        {/* GEAR */}
        {tab === 'gear' && (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
            {/* Checklist */}
            <div style={GLASS} className="p-5">
              <div className="flex items-center justify-between mb-1">
                <h3 className="font-semibold text-white text-sm">🎒 Affaires à prendre</h3>
                <button onClick={() => saveCheck(gearCheck.map(g => ({ ...g, checked: false })))}
                  className="text-xs text-gray-500 hover:text-white flex items-center gap-1 transition-colors px-2 py-1 rounded-lg hover:bg-white/5">
                  <RotateCcw size={11} /> Reset
                </button>
              </div>

              {gearCheck.length > 0 && (
                <div className="mb-4">
                  <div className="flex items-center justify-between text-xs text-gray-500 mb-1.5">
                    <span>{gearCheck.filter(g => g.checked).length}/{gearCheck.length} packés</span>
                    <span style={{ color: checkPct === 100 ? '#22c55e' : accent }}>{checkPct}%</span>
                  </div>
                  <div style={{ height: 4, background: 'rgba(255,255,255,0.08)', borderRadius: 99, overflow: 'hidden' }}>
                    <div style={{
                      width: `${checkPct}%`, height: '100%', borderRadius: 99,
                      background: checkPct === 100 ? '#22c55e' : accent,
                      boxShadow: `0 0 8px ${checkPct === 100 ? '#22c55e' : accent}`,
                      transition: 'width 0.3s',
                    }} />
                  </div>
                </div>
              )}

              <div className="flex gap-2 mb-4">
                <input
                  className="flex-1 rounded-xl px-3 py-2 text-sm text-white placeholder-gray-500 focus:outline-none transition-colors"
                  style={{ background: 'rgba(255,255,255,0.06)', border: '1px solid rgba(255,255,255,0.08)' }}
                  placeholder="Ajouter un article..."
                  value={newLabel}
                  onChange={e => setNewLabel(e.target.value)}
                  onKeyDown={e => e.key === 'Enter' && addCheck()}
                />
                <button onClick={addCheck} className="px-3 rounded-xl text-white transition-all" style={{ background: accent }}>
                  <Plus size={14} />
                </button>
              </div>

              {gearCheck.length === 0 ? (
                <div className="text-center py-8">
                  <p className="text-2xl mb-2">📦</p>
                  <p className="text-xs text-gray-600">Aucun article — ajoutez vos affaires</p>
                </div>
              ) : (
                <div className="space-y-1">
                  {gearCheck.map(g => (
                    <div key={g.id} className="flex items-center gap-2.5 py-1.5 group/item">
                      <button
                        onClick={() => saveCheck(gearCheck.map(x => x.id === g.id ? { ...x, checked: !x.checked } : x))}
                        className="w-5 h-5 rounded-md border-2 flex items-center justify-center shrink-0 transition-all"
                        style={g.checked ? { borderColor: accent, background: accent } : { borderColor: 'rgba(255,255,255,0.2)' }}>
                        {g.checked && <Check size={10} className="text-white" />}
                      </button>
                      {editCheckId === g.id ? (
                        <input
                          className="flex-1 rounded-lg px-2 py-0.5 text-sm text-white focus:outline-none"
                          style={{ background: 'rgba(255,255,255,0.08)', border: `1px solid ${accent}` }}
                          value={editCheckLabel}
                          onChange={e => setEditCheckLabel(e.target.value)}
                          onBlur={() => submitEditCheck(g.id)}
                          onKeyDown={e => { if (e.key === 'Enter') submitEditCheck(g.id); if (e.key === 'Escape') setEditCheckId(null); }}
                          autoFocus
                        />
                      ) : (
                        <span
                          className={`text-sm flex-1 cursor-pointer select-none transition-colors ${g.checked ? 'line-through text-gray-600' : 'text-gray-200'}`}
                          onDoubleClick={() => { setEditCheckId(g.id); setEditCheckLabel(g.label); }}>
                          {g.label}
                        </span>
                      )}
                      <div className="flex gap-1 opacity-0 group-hover/item:opacity-100 transition-opacity">
                        <button onClick={() => { setEditCheckId(g.id); setEditCheckLabel(g.label); }} className="text-gray-700 hover:text-blue-400 transition-colors">
                          <Pencil size={11} />
                        </button>
                        <button onClick={() => saveCheck(gearCheck.filter(x => x.id !== g.id))} className="text-gray-700 hover:text-red-400 transition-colors">
                          <Trash2 size={11} />
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>

            {/* Shop list */}
            <div style={GLASS} className="p-5">
              <div className="flex items-center justify-between mb-4">
                <h3 className="font-semibold text-white text-sm flex items-center gap-1.5">
                  <ShoppingBag size={14} style={{ color: accent }} /> Matériel à acheter
                </h3>
                <button onClick={() => { setShowAddShop(v => !v); setEditShop(null); }}
                  className="flex items-center gap-1 text-xs px-2.5 py-1 rounded-lg font-medium transition-all"
                  style={{ background: `${accent}20`, color: accent, border: `1px solid ${accent}30` }}>
                  <Plus size={11} /> Ajouter
                </button>
              </div>

              {showAddShop && !editShop && (
                <div className="rounded-xl p-3 mb-3 space-y-2" style={{ background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.06)' }}>
                  <input className={INPUT} placeholder="Nom de l'article *" value={shopForm.title} onChange={e => setShopForm(f => ({ ...f, title: e.target.value }))} autoFocus />
                  <input className={INPUT} placeholder="Lien boutique (optionnel)" value={shopForm.link} onChange={e => setShopForm(f => ({ ...f, link: e.target.value }))} />
                  <input type="number" step="0.01" className={INPUT} placeholder="Prix (€, optionnel)" value={shopForm.price} onChange={e => setShopForm(f => ({ ...f, price: e.target.value }))} />
                  <div className="flex gap-2 justify-end">
                    <button onClick={() => setShowAddShop(false)} className={BTN_GHOST}>Annuler</button>
                    <button onClick={addShop} className={BTN_PRIMARY}>Ajouter</button>
                  </div>
                </div>
              )}

              {editShop && (
                <div className="rounded-xl p-3 mb-3 space-y-2" style={{ background: 'rgba(255,255,255,0.04)', border: `1px solid ${accent}40` }}>
                  <p className="text-xs font-semibold" style={{ color: accent }}>Modifier</p>
                  <input className={INPUT} value={shopForm.title} onChange={e => setShopForm(f => ({ ...f, title: e.target.value }))} autoFocus />
                  <input className={INPUT} placeholder="Lien boutique" value={shopForm.link} onChange={e => setShopForm(f => ({ ...f, link: e.target.value }))} />
                  <input type="number" step="0.01" className={INPUT} placeholder="Prix (€)" value={shopForm.price} onChange={e => setShopForm(f => ({ ...f, price: e.target.value }))} />
                  <div className="flex gap-2 justify-end">
                    <button onClick={() => setEditShop(null)} className={BTN_GHOST}>Annuler</button>
                    <button onClick={submitEditShop} className={BTN_PRIMARY}>Sauvegarder</button>
                  </div>
                </div>
              )}

              {gearShop.length === 0 && !showAddShop && !editShop ? (
                <div className="text-center py-8">
                  <p className="text-2xl mb-2">🛍️</p>
                  <p className="text-xs text-gray-600">Liste vide — ajoutez votre matériel</p>
                </div>
              ) : (
                <div className="space-y-2">
                  {gearShop.map(g => (
                    <div key={g.id}
                      className={`flex items-center gap-2.5 p-2.5 rounded-xl group/shop transition-all ${g.bought ? 'opacity-40' : 'hover:bg-white/[0.03]'}`}
                      style={{ border: '1px solid rgba(255,255,255,0.05)' }}>
                      <button onClick={() => saveShop(gearShop.map(x => x.id === g.id ? { ...x, bought: !x.bought } : x))}
                        className="w-5 h-5 rounded-md border-2 flex items-center justify-center shrink-0 transition-all"
                        style={g.bought ? { borderColor: '#22c55e', background: '#22c55e' } : { borderColor: 'rgba(255,255,255,0.2)' }}>
                        {g.bought && <Check size={10} className="text-white" />}
                      </button>
                      <div className="flex-1 min-w-0">
                        <p className={`text-sm ${g.bought ? 'line-through text-gray-500' : 'text-gray-200'}`}>{g.title}</p>
                        <div className="flex items-center gap-2 mt-0.5">
                          {g.price !== undefined && <span className="text-xs text-gray-500">€{g.price.toFixed(2)}</span>}
                          {g.link && (
                            <a href={g.link} target="_blank" rel="noopener noreferrer"
                              className="text-xs flex items-center gap-0.5 transition-colors" style={{ color: accent }}>
                              <ExternalLink size={9} /> Boutique
                            </a>
                          )}
                        </div>
                      </div>
                      <div className="flex gap-1 opacity-0 group-hover/shop:opacity-100 transition-opacity">
                        <button onClick={() => openEditShop(g)} className="text-gray-700 hover:text-blue-400 transition-colors"><Pencil size={12} /></button>
                        <button onClick={() => saveShop(gearShop.filter(x => x.id !== g.id))} className="text-gray-700 hover:text-red-400 transition-colors"><Trash2 size={12} /></button>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        )}
      </div>

      {/* ── Done modal ── */}
      <Modal isOpen={doneModal} onClose={() => { setDoneModal(false); setEditDoneTarget(null); }} title={editDoneTarget ? 'Modifier la randonnée' : 'Randonnée effectuée 🥾'}>
        <div className="space-y-4">
          <div>
            <label className={LABEL}>Nom *</label>
            <input className={INPUT} placeholder="Nom de la randonnée" value={doneForm.name} onChange={e => setDoneForm(f => ({ ...f, name: e.target.value }))} autoFocus />
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className={LABEL}>Date</label>
              <input type="date" className={INPUT} value={doneForm.date} onChange={e => setDoneForm(f => ({ ...f, date: e.target.value }))} />
            </div>
            <div>
              <label className={LABEL}>Durée (minutes)</label>
              <input type="number" className={INPUT} placeholder="180" value={doneForm.duration} onChange={e => setDoneForm(f => ({ ...f, duration: e.target.value }))} />
            </div>
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className={LABEL}>Distance (km)</label>
              <input type="number" step="0.1" className={INPUT} placeholder="12" value={doneForm.distance} onChange={e => setDoneForm(f => ({ ...f, distance: e.target.value }))} />
            </div>
            <div>
              <label className={LABEL}>Dénivelé + (m)</label>
              <input type="number" className={INPUT} placeholder="500" value={doneForm.elevation} onChange={e => setDoneForm(f => ({ ...f, elevation: e.target.value }))} />
            </div>
          </div>
          <div>
            <label className={LABEL}>Note *</label>
            <Stars value={doneForm.rating} onChange={v => setDoneForm(f => ({ ...f, rating: v }))} />
          </div>
          <div>
            <label className={LABEL}>Commentaire (optionnel)</label>
            <textarea className={INPUT} rows={2} placeholder="Impressions, conditions météo..." value={doneForm.comment} onChange={e => setDoneForm(f => ({ ...f, comment: e.target.value }))} />
          </div>
          <div className="flex gap-2 justify-end pt-1">
            <button onClick={() => { setDoneModal(false); setEditDoneTarget(null); }} className={BTN_GHOST}>Annuler</button>
            <button onClick={submitDone} disabled={!doneForm.name.trim() || !doneForm.rating}
              className={`${BTN_PRIMARY} disabled:opacity-40 disabled:cursor-not-allowed`}>
              Enregistrer
            </button>
          </div>
        </div>
      </Modal>
    </div>
  );
}
