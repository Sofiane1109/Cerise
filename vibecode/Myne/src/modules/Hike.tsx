import { useState, useMemo } from 'react';
import type { HikeWishlist, HikeDone, HikeGearCheck, HikeGearShop, HikeDifficulty } from '../types';
import { getItem, setItem } from '../utils/storage';
import { uid, today } from '../utils/helpers';
import { Modal, INPUT, LABEL, BTN_PRIMARY, BTN_GHOST } from '../components/ui';
import {
  Mountain, Plus, Trash2, Star, MapPin, ExternalLink,
  RotateCcw, ShoppingBag, GripVertical, Check, Trophy, Package, Pencil,
} from 'lucide-react';

const DIFF_CONFIG: Record<HikeDifficulty, { label: string; color: string; bg: string }> = {
  easy:     { label: 'Facile',    color: 'text-green-400',  bg: 'bg-green-500/10 border-green-900/40' },
  moderate: { label: 'Modéré',    color: 'text-amber-400',  bg: 'bg-amber-500/10 border-amber-900/40' },
  hard:     { label: 'Difficile', color: 'text-orange-400', bg: 'bg-orange-500/10 border-orange-900/40' },
  expert:   { label: 'Expert',    color: 'text-red-400',    bg: 'bg-red-500/10 border-red-900/40' },
};
const DIFFS: HikeDifficulty[] = ['easy', 'moderate', 'hard', 'expert'];

function Stars({ value, onChange }: { value: number; onChange?: (v: number) => void }) {
  return (
    <div className="flex gap-0.5">
      {[1,2,3,4,5].map(n => (
        <button key={n} type="button" onClick={() => onChange?.(n)} className={onChange ? 'cursor-pointer' : 'cursor-default'}>
          <Star size={16} className={n <= value ? 'text-amber-400 fill-amber-400' : 'text-gray-700'} />
        </button>
      ))}
    </div>
  );
}

function fmtDuration(min: number): string {
  const h = Math.floor(min / 60), m = min % 60;
  return h > 0 ? `${h}h${m > 0 ? `${m}` : ''}` : `${m}min`;
}

const EMPTY_DONE_FORM = { name: '', date: today(), duration: '', distance: '', elevation: '', rating: 0, comment: '', wishlistId: '' };
const EMPTY_WISH_FORM = { name: '', location: '', estimatedDistance: '', difficulty: 'moderate' as HikeDifficulty, link: '' };
const EMPTY_SHOP_FORM = { title: '', link: '', price: '' };

export default function Hike() {
  // Wishlist
  const [wishlist, setWishlist] = useState<HikeWishlist[]>(() => getItem('myne:hike:wishlist', []));
  const [showAddWish, setShowAddWish] = useState(false);
  const [wishForm, setWishForm] = useState({ ...EMPTY_WISH_FORM });
  const [editWish, setEditWish] = useState<HikeWishlist | null>(null);

  // Done
  const [done, setDone] = useState<HikeDone[]>(() => getItem('myne:hike:done', []));
  const [doneModal, setDoneModal] = useState(false);
  const [editDoneTarget, setEditDoneTarget] = useState<string | null>(null); // id of done being edited
  const [doneForm, setDoneForm] = useState({ ...EMPTY_DONE_FORM });
  const [draggedWishId, setDraggedWishId] = useState<string | null>(null);
  const [dropActive, setDropActive] = useState(false);

  // Gear checklist
  const [gearCheck, setGearCheck] = useState<HikeGearCheck[]>(() => getItem('myne:hike:gear:check', []));
  const [newLabel, setNewLabel] = useState('');
  const [editCheckId, setEditCheckId] = useState<string | null>(null);
  const [editCheckLabel, setEditCheckLabel] = useState('');

  // Gear shop
  const [gearShop, setGearShop] = useState<HikeGearShop[]>(() => getItem('myne:hike:gear:shop', []));
  const [showAddShop, setShowAddShop] = useState(false);
  const [shopForm, setShopForm] = useState({ ...EMPTY_SHOP_FORM });
  const [editShop, setEditShop] = useState<HikeGearShop | null>(null);

  // ── Wishlist ───────────────────────────────────────────────────────────────
  const saveWishlist = (list: HikeWishlist[]) => { setWishlist(list); setItem('myne:hike:wishlist', list); };

  const addWish = () => {
    if (!wishForm.name.trim() || !wishForm.location.trim()) return;
    saveWishlist([{ id: uid(), name: wishForm.name.trim(), location: wishForm.location.trim(), estimatedDistance: Number(wishForm.estimatedDistance) || 0, difficulty: wishForm.difficulty, link: wishForm.link.trim() || undefined }, ...wishlist]);
    setWishForm({ ...EMPTY_WISH_FORM });
    setShowAddWish(false);
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

  // ── Done ──────────────────────────────────────────────────────────────────
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
    const entry: HikeDone = {
      id: editDoneTarget ?? uid(),
      wishlistId: doneForm.wishlistId || undefined,
      name: doneForm.name.trim(), date: doneForm.date,
      duration: Number(doneForm.duration) || 0, distance: Number(doneForm.distance) || 0,
      elevation: Number(doneForm.elevation) || 0, rating: doneForm.rating, comment: doneForm.comment.trim(),
    };
    if (editDoneTarget) {
      saveDone(done.map(d => d.id === editDoneTarget ? entry : d));
    } else {
      if (doneForm.wishlistId) removeWish(doneForm.wishlistId);
      saveDone([entry, ...done]);
    }
    setDoneModal(false);
    setEditDoneTarget(null);
  };

  const removeDone = (id: string) => saveDone(done.filter(d => d.id !== id));

  const handleWishDrop = () => {
    setDropActive(false);
    if (draggedWishId) { openDoneForm(draggedWishId); setDraggedWishId(null); }
  };

  // ── Gear check ─────────────────────────────────────────────────────────────
  const saveCheck = (list: HikeGearCheck[]) => { setGearCheck(list); setItem('myne:hike:gear:check', list); };
  const addCheck = () => {
    if (!newLabel.trim()) return;
    saveCheck([...gearCheck, { id: uid(), label: newLabel.trim(), checked: false }]);
    setNewLabel('');
  };

  const submitEditCheck = (id: string) => {
    if (!editCheckLabel.trim()) return;
    saveCheck(gearCheck.map(g => g.id === id ? { ...g, label: editCheckLabel.trim() } : g));
    setEditCheckId(null);
  };

  // ── Gear shop ──────────────────────────────────────────────────────────────
  const saveShop = (list: HikeGearShop[]) => { setGearShop(list); setItem('myne:hike:gear:shop', list); };
  const addShop = () => {
    if (!shopForm.title.trim()) return;
    saveShop([{ id: uid(), title: shopForm.title.trim(), link: shopForm.link.trim() || undefined, price: shopForm.price ? Number(shopForm.price) : undefined, bought: false }, ...gearShop]);
    setShopForm({ ...EMPTY_SHOP_FORM });
    setShowAddShop(false);
  };

  const openEditShop = (g: HikeGearShop) => {
    setEditShop(g);
    setShopForm({ title: g.title, link: g.link ?? '', price: g.price !== undefined ? String(g.price) : '' });
    setShowAddShop(false);
  };

  const submitEditShop = () => {
    if (!editShop || !shopForm.title.trim()) return;
    saveShop(gearShop.map(g => g.id === editShop.id ? { ...g, title: shopForm.title.trim(), link: shopForm.link.trim() || undefined, price: shopForm.price ? Number(shopForm.price) : undefined } : g));
    setEditShop(null);
  };

  // ── Ranking ────────────────────────────────────────────────────────────────
  const ranked = useMemo(() => [...done].sort((a, b) => b.rating - a.rating || b.date.localeCompare(a.date)), [done]);
  const podium = ranked.slice(0, 3);
  const rest = ranked.slice(3);
  const podiumSlots = [
    { hike: podium[1] ?? null, pos: 2, barH: 'h-16', color: 'bg-gray-500' },
    { hike: podium[0] ?? null, pos: 1, barH: 'h-24', color: 'bg-amber-500' },
    { hike: podium[2] ?? null, pos: 3, barH: 'h-12', color: 'bg-amber-800' },
  ];

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

  return (
    <div className="p-6 space-y-8 max-w-6xl mx-auto">
      <div>
        <h1 className="text-xl font-bold text-white flex items-center gap-2">
          <Mountain size={22} style={{ color: 'var(--accent)' }} /> Hike
        </h1>
        <p className="text-gray-500 text-sm mt-0.5">{wishlist.length} en wishlist · {done.length} effectuées</p>
      </div>

      {/* Wishlist + Done */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* Wishlist */}
        <div>
          <div className="flex items-center justify-between mb-3">
            <h2 className="font-semibold text-white">Wishlist</h2>
            <button onClick={() => { setShowAddWish(v => !v); setEditWish(null); }}
              className={`flex items-center gap-1.5 px-3 py-1.5 text-sm rounded-lg transition-colors ${showAddWish && !editWish ? BTN_GHOST : BTN_PRIMARY}`}>
              <Plus size={14} /> Ajouter
            </button>
          </div>

          {showAddWish && !editWish && (
            <div className="bg-gray-900 border border-gray-800 rounded-xl p-4 mb-3 space-y-3">
              {wishFormFields(wishForm, setWishForm)}
              <div className="flex gap-2 justify-end">
                <button onClick={() => setShowAddWish(false)} className={BTN_GHOST}>Annuler</button>
                <button onClick={addWish} className={BTN_PRIMARY}>Ajouter</button>
              </div>
            </div>
          )}

          {editWish && (
            <div className="bg-gray-900 border border-[var(--accent)] rounded-xl p-4 mb-3 space-y-3">
              <p className="text-xs font-semibold text-gray-400 uppercase tracking-wider">Modifier</p>
              {wishFormFields(wishForm, setWishForm)}
              <div className="flex gap-2 justify-end">
                <button onClick={() => setEditWish(null)} className={BTN_GHOST}>Annuler</button>
                <button onClick={submitEditWish} className={BTN_PRIMARY}>Sauvegarder</button>
              </div>
            </div>
          )}

          <div className="space-y-2">
            {wishlist.length === 0 && (
              <div className="text-center py-10 text-gray-600 text-sm border-2 border-dashed border-gray-800 rounded-xl">
                Aucune randonnée en liste
              </div>
            )}
            {wishlist.map(w => {
              const diff = DIFF_CONFIG[w.difficulty];
              return (
                <div key={w.id} draggable onDragStart={() => setDraggedWishId(w.id)} onDragEnd={() => setDraggedWishId(null)}
                  className={`bg-gray-900 border border-gray-800 rounded-xl p-4 select-none transition-all ${draggedWishId === w.id ? 'opacity-30 scale-95' : 'hover:border-gray-700'}`}
                >
                  <div className="flex items-start gap-3">
                    <GripVertical size={15} className="text-gray-600 shrink-0 mt-0.5 cursor-grab" />
                    <div className="flex-1 min-w-0">
                      <div className="flex items-start justify-between gap-2 mb-1">
                        <p className="font-medium text-white text-sm">{w.name}</p>
                        <span className={`text-xs px-2 py-0.5 rounded-full border ${diff.bg} ${diff.color} shrink-0`}>{diff.label}</span>
                      </div>
                      <p className="text-xs text-gray-500 flex items-center gap-1"><MapPin size={10} /> {w.location}</p>
                      {w.estimatedDistance > 0 && <p className="text-xs text-gray-600 mt-0.5">≈ {w.estimatedDistance} km</p>}
                      <div className="flex items-center gap-3 mt-2">
                        {w.link && (
                          <a href={w.link} target="_blank" rel="noopener noreferrer" onClick={e => e.stopPropagation()}
                            className="text-xs text-[var(--accent)] hover:opacity-80 flex items-center gap-1 transition-colors">
                            <ExternalLink size={10} /> Voir
                          </a>
                        )}
                        <button onClick={() => openDoneForm(w.id)} className="ml-auto text-xs px-2 py-0.5 rounded-md bg-green-500/10 border border-green-900/40 text-green-400 hover:bg-green-500/20 transition-colors">
                          Marquer comme faite →
                        </button>
                        <button onClick={() => openEditWish(w)} className="text-gray-600 hover:text-blue-400 transition-colors">
                          <Pencil size={13} />
                        </button>
                        <button onClick={() => removeWish(w.id)} className="text-gray-600 hover:text-red-400 transition-colors">
                          <Trash2 size={13} />
                        </button>
                      </div>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* Done */}
        <div>
          <div className="flex items-center justify-between mb-3">
            <h2 className="font-semibold text-white">Effectuées</h2>
            <button onClick={() => openDoneForm()} className="flex items-center gap-1.5 px-3 py-1.5 text-sm bg-gray-800 hover:bg-gray-700 text-gray-300 rounded-lg transition-colors">
              <Plus size={14} /> Ajouter
            </button>
          </div>

          <div onDragOver={e => { e.preventDefault(); setDropActive(true); }} onDragLeave={() => setDropActive(false)} onDrop={handleWishDrop}
            className={`border-2 border-dashed rounded-xl py-4 mb-3 text-center text-sm transition-colors ${dropActive ? 'border-green-500 bg-green-500/5 text-green-400' : 'border-gray-800 text-gray-600'}`}>
            {dropActive ? '⬇ Déposer pour marquer comme effectuée' : 'Glisser une rando depuis la wishlist'}
          </div>

          <div className="space-y-2">
            {done.length === 0 && <div className="text-center py-8 text-gray-600 text-sm">Aucune randonnée effectuée</div>}
            {[...done].sort((a, b) => b.date.localeCompare(a.date)).map(d => (
              <div key={d.id} className="bg-gray-900 border border-gray-800 rounded-xl p-4 hover:border-gray-700 transition-colors">
                <div className="flex items-start justify-between gap-2">
                  <div className="flex-1 min-w-0">
                    <p className="font-medium text-white text-sm">{d.name}</p>
                    <p className="text-xs text-gray-500 mt-0.5">
                      {new Date(d.date + 'T00:00').toLocaleDateString('fr-FR', { day: 'numeric', month: 'short', year: 'numeric' })}
                    </p>
                    <div className="flex flex-wrap gap-3 mt-1.5 text-xs text-gray-400">
                      {d.distance > 0 && <span>{d.distance} km</span>}
                      {d.elevation > 0 && <span>+{d.elevation} m</span>}
                      {d.duration > 0 && <span>{fmtDuration(d.duration)}</span>}
                    </div>
                    <div className="mt-2"><Stars value={d.rating} /></div>
                    {d.comment && <p className="text-xs text-gray-500 mt-1.5 italic">"{d.comment}"</p>}
                  </div>
                  <div className="flex items-center gap-1 shrink-0">
                    <button onClick={() => openEditDone(d)} className="text-gray-600 hover:text-blue-400 transition-colors">
                      <Pencil size={14} />
                    </button>
                    <button onClick={() => removeDone(d.id)} className="text-gray-600 hover:text-red-400 transition-colors">
                      <Trash2 size={14} />
                    </button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Ranking */}
      {done.length > 0 && (
        <div>
          <h2 className="font-semibold text-white mb-4 flex items-center gap-2">
            <Trophy size={18} className="text-amber-400" /> Classement
          </h2>
          <div className="grid grid-cols-3 gap-3 mb-4 items-end">
            {podiumSlots.map((slot, i) => (
              <div key={i} className="flex flex-col items-center">
                {slot.hike ? (
                  <>
                    <p className="text-xs text-gray-300 text-center mb-1 font-medium w-full truncate px-1">{slot.hike.name}</p>
                    <Stars value={slot.hike.rating} />
                    <div className={`w-full mt-2 ${slot.barH} ${slot.color} rounded-t-lg flex items-center justify-center`}>
                      <span className="text-white font-black text-xl">{slot.pos}</span>
                    </div>
                  </>
                ) : (
                  <div className={`w-full ${slot.barH} bg-gray-800/30 rounded-t-lg border border-dashed border-gray-800`} />
                )}
              </div>
            ))}
          </div>
          {rest.length > 0 && (
            <div className="space-y-2">
              {rest.map((h, i) => (
                <div key={h.id} className="flex items-center gap-4 p-3 bg-gray-900 border border-gray-800 rounded-lg hover:border-gray-700 transition-colors">
                  <span className="text-gray-500 font-bold w-6 text-sm text-center">{i + 4}</span>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm text-white font-medium">{h.name}</p>
                    <p className="text-xs text-gray-500">{h.distance > 0 ? `${h.distance} km · ` : ''}{new Date(h.date + 'T00:00').toLocaleDateString('fr-FR', { day: 'numeric', month: 'short', year: 'numeric' })}</p>
                  </div>
                  <Stars value={h.rating} />
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* Gear */}
      <div>
        <h2 className="font-semibold text-white mb-4 flex items-center gap-2">
          <Package size={18} style={{ color: 'var(--accent)' }} /> Équipement
        </h2>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {/* Checklist */}
          <div className="bg-gray-900 border border-gray-800 rounded-xl p-4">
            <div className="flex items-center justify-between mb-3">
              <h3 className="font-medium text-white text-sm">Affaires à prendre</h3>
              <button onClick={() => { const u = gearCheck.map(g => ({ ...g, checked: false })); setGearCheck(u); setItem('myne:hike:gear:check', u); }}
                className="text-xs text-gray-500 hover:text-gray-300 flex items-center gap-1 transition-colors">
                <RotateCcw size={11} /> Reset
              </button>
            </div>
            <div className="flex gap-2 mb-3">
              <input className="flex-1 bg-gray-800 border border-gray-700 rounded-lg px-3 py-2 text-sm text-white placeholder-gray-500 focus:outline-none focus:border-[var(--accent)] transition-colors"
                placeholder="Ajouter un article..." value={newLabel} onChange={e => setNewLabel(e.target.value)} onKeyDown={e => e.key === 'Enter' && addCheck()} />
              <button onClick={addCheck} className="px-3 py-2 btn-accent rounded-lg">
                <Plus size={14} />
              </button>
            </div>
            <div className="space-y-1.5">
              {gearCheck.length === 0 && <p className="text-xs text-gray-600 text-center py-3">Aucun article</p>}
              {gearCheck.map(g => (
                <div key={g.id} className="flex items-center gap-2.5 py-1">
                  <button onClick={() => saveCheck(gearCheck.map(x => x.id === g.id ? { ...x, checked: !x.checked } : x))}
                    className={`w-5 h-5 rounded border-2 flex items-center justify-center shrink-0 transition-colors ${g.checked ? 'border-[var(--accent)] bg-[var(--accent)]' : 'border-gray-600 hover:border-[var(--accent)]'}`}>
                    {g.checked && <Check size={10} className="text-white" />}
                  </button>
                  {editCheckId === g.id ? (
                    <input
                      className="flex-1 bg-gray-800 border border-[var(--accent)] rounded px-2 py-0.5 text-sm text-white focus:outline-none"
                      value={editCheckLabel}
                      onChange={e => setEditCheckLabel(e.target.value)}
                      onBlur={() => submitEditCheck(g.id)}
                      onKeyDown={e => { if (e.key === 'Enter') submitEditCheck(g.id); if (e.key === 'Escape') setEditCheckId(null); }}
                      autoFocus
                    />
                  ) : (
                    <span className={`text-sm flex-1 cursor-pointer ${g.checked ? 'line-through text-gray-500' : 'text-gray-200'}`}
                      onDoubleClick={() => { setEditCheckId(g.id); setEditCheckLabel(g.label); }}>
                      {g.label}
                    </span>
                  )}
                  <button onClick={() => { setEditCheckId(g.id); setEditCheckLabel(g.label); }} className="text-gray-700 hover:text-blue-400 transition-colors">
                    <Pencil size={11} />
                  </button>
                  <button onClick={() => saveCheck(gearCheck.filter(x => x.id !== g.id))} className="text-gray-700 hover:text-red-400 transition-colors">
                    <Trash2 size={12} />
                  </button>
                </div>
              ))}
            </div>
            {gearCheck.length > 0 && (
              <p className="text-xs text-gray-600 mt-3">{gearCheck.filter(g => g.checked).length}/{gearCheck.length} packés</p>
            )}
          </div>

          {/* Shop list */}
          <div className="bg-gray-900 border border-gray-800 rounded-xl p-4">
            <div className="flex items-center justify-between mb-3">
              <h3 className="font-medium text-white text-sm flex items-center gap-1.5">
                <ShoppingBag size={14} style={{ color: 'var(--accent)' }} /> Matériel à acheter
              </h3>
              <button onClick={() => { setShowAddShop(v => !v); setEditShop(null); }}
                className="text-xs text-[var(--accent)] hover:opacity-80 flex items-center gap-1 transition-colors">
                <Plus size={12} /> Ajouter
              </button>
            </div>

            {showAddShop && !editShop && (
              <div className="bg-gray-800/60 rounded-lg p-3 mb-3 space-y-2">
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
              <div className="bg-gray-800/60 border border-[var(--accent)] rounded-lg p-3 mb-3 space-y-2">
                <p className="text-xs font-semibold text-gray-400">Modifier</p>
                <input className={INPUT} value={shopForm.title} onChange={e => setShopForm(f => ({ ...f, title: e.target.value }))} autoFocus />
                <input className={INPUT} placeholder="Lien boutique" value={shopForm.link} onChange={e => setShopForm(f => ({ ...f, link: e.target.value }))} />
                <input type="number" step="0.01" className={INPUT} placeholder="Prix (€)" value={shopForm.price} onChange={e => setShopForm(f => ({ ...f, price: e.target.value }))} />
                <div className="flex gap-2 justify-end">
                  <button onClick={() => setEditShop(null)} className={BTN_GHOST}>Annuler</button>
                  <button onClick={submitEditShop} className={BTN_PRIMARY}>Sauvegarder</button>
                </div>
              </div>
            )}

            <div className="space-y-2">
              {gearShop.length === 0 && <p className="text-xs text-gray-600 text-center py-3">Aucun article</p>}
              {gearShop.map(g => (
                <div key={g.id} className={`flex items-start gap-2.5 p-2 rounded-lg transition-colors ${g.bought ? 'opacity-50' : 'hover:bg-gray-800/40'}`}>
                  <button onClick={() => saveShop(gearShop.map(x => x.id === g.id ? { ...x, bought: !x.bought } : x))}
                    className={`w-5 h-5 rounded border-2 flex items-center justify-center shrink-0 mt-0.5 transition-colors ${g.bought ? 'border-green-500 bg-green-500' : 'border-gray-600 hover:border-green-400'}`}>
                    {g.bought && <Check size={10} className="text-white" />}
                  </button>
                  <div className="flex-1 min-w-0">
                    <p className={`text-sm ${g.bought ? 'line-through text-gray-500' : 'text-gray-200'}`}>{g.title}</p>
                    <div className="flex items-center gap-2 mt-0.5">
                      {g.price !== undefined && <span className="text-xs text-gray-500">€{g.price.toFixed(2)}</span>}
                      {g.link && (
                        <a href={g.link} target="_blank" rel="noopener noreferrer" className="text-xs text-[var(--accent)] hover:opacity-80 flex items-center gap-0.5 transition-colors">
                          <ExternalLink size={9} /> Boutique
                        </a>
                      )}
                    </div>
                  </div>
                  <button onClick={() => openEditShop(g)} className="text-gray-700 hover:text-blue-400 transition-colors shrink-0">
                    <Pencil size={12} />
                  </button>
                  <button onClick={() => saveShop(gearShop.filter(x => x.id !== g.id))} className="text-gray-700 hover:text-red-400 transition-colors shrink-0">
                    <Trash2 size={12} />
                  </button>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>

      {/* Done modal (add + edit) */}
      <Modal isOpen={doneModal} onClose={() => { setDoneModal(false); setEditDoneTarget(null); }} title={editDoneTarget ? 'Modifier la randonnée' : 'Randonnée effectuée'}>
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
              <label className={LABEL}>Dénivelé positif (m)</label>
              <input type="number" className={INPUT} placeholder="500" value={doneForm.elevation} onChange={e => setDoneForm(f => ({ ...f, elevation: e.target.value }))} />
            </div>
          </div>
          <div>
            <label className={LABEL}>Note *</label>
            <Stars value={doneForm.rating} onChange={v => setDoneForm(f => ({ ...f, rating: v }))} />
          </div>
          <div>
            <label className={LABEL}>Commentaire (optionnel)</label>
            <textarea className={INPUT} rows={2} placeholder="Impressions, conditions..." value={doneForm.comment} onChange={e => setDoneForm(f => ({ ...f, comment: e.target.value }))} />
          </div>
          <div className="flex gap-2 justify-end pt-1">
            <button onClick={() => { setDoneModal(false); setEditDoneTarget(null); }} className={BTN_GHOST}>Annuler</button>
            <button onClick={submitDone} disabled={!doneForm.name.trim() || !doneForm.rating} className={`${BTN_PRIMARY} disabled:opacity-40 disabled:cursor-not-allowed`}>
              Enregistrer
            </button>
          </div>
        </div>
      </Modal>
    </div>
  );
}
