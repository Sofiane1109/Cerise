import { useState } from 'react';
import { getTodayStr, addDaysStr, DEFAULT_LOCATIONS } from '../store.js';

const UNITS = ['unités', 'g', 'kg', 'L', 'mL', 'cl', 'sachet', 'paquet', 'boîte'];
const TYPES = ['FRAIS', 'SEC', 'SURGELÉ', 'CONSERVE'];

export default function AddManual({ initial = {}, locations: locsProp = DEFAULT_LOCATIONS, onSave, onClose }) {
  const locations = locsProp.filter(l => l.enabled);
  const defaultExpiry = addDaysStr(getTodayStr(), 7);

  const [form, setForm] = useState({
    name: initial.name || '',
    brand: initial.brand || '',
    quantity: '1',
    unit: 'unités',
    expiryDate: defaultExpiry,
    type: initial.type || 'FRAIS',
    location: locations[0]?.name || 'Frigo',
    price: '',
    ...initial,
  });

  function set(key, val) {
    setForm(f => ({ ...f, [key]: val }));
  }

  function handleSave() {
    if (!form.name.trim()) return;
    const product = {
      id: genId(),
      name: form.name.trim(),
      brand: form.brand.trim(),
      quantity: parseFloat(form.quantity) || 1,
      unit: form.unit,
      expiryDate: form.expiryDate,
      location: form.location,
      type: form.type,
      addedDate: getTodayStr(),
      status: 'active',
      price: parseFloat(form.price) || 0,
    };
    onSave(product);
  }

  return (
    <div className="screen">
      <div className="header">
        <button className="back-btn" onClick={onClose}>← Retour</button>
        <span className="header-title" style={{ fontSize: 18 }}>Ajouter à la main</span>
        <button
          onClick={handleSave}
          style={{ fontFamily: 'var(--font-mono)', fontSize: 11, fontWeight: 600, color: form.name ? 'var(--black)' : 'var(--gray)', background: 'none', border: 'none', cursor: 'pointer', textTransform: 'uppercase', letterSpacing: '0.06em' }}
        >
          ENREGISTRER
        </button>
      </div>

      <div className="screen-body" style={{ padding: '8px 20px' }}>
        <div className="form-group">
          <label className="form-label">Nom du produit</label>
          <input
            className="form-input"
            placeholder="ex. Filet de poulet"
            value={form.name}
            onChange={e => set('name', e.target.value)}
            autoFocus
          />
        </div>

        <div className="form-group">
          <label className="form-label">Marque (optionnel)</label>
          <input
            className="form-input"
            placeholder="ex. Danone"
            value={form.brand}
            onChange={e => set('brand', e.target.value)}
          />
        </div>

        <div className="form-row">
          <div className="form-group">
            <label className="form-label">Quantité</label>
            <input
              className="form-input"
              type="number"
              min="0"
              step="any"
              value={form.quantity}
              onChange={e => set('quantity', e.target.value)}
              inputMode="decimal"
            />
          </div>
          <div className="form-group">
            <label className="form-label">Unité</label>
            <select
              className="form-input"
              value={form.unit}
              onChange={e => set('unit', e.target.value)}
              style={{ cursor: 'pointer' }}
            >
              {UNITS.map(u => <option key={u} value={u}>{u}</option>)}
            </select>
          </div>
        </div>

        <div className="form-group">
          <label className="form-label">Date de péremption</label>
          <input
            className="form-input"
            type="date"
            value={form.expiryDate}
            onChange={e => set('expiryDate', e.target.value)}
          />
        </div>

        <div className="form-group">
          <label className="form-label">Type de produit</label>
          <div className="tag-row">
            {TYPES.map(t => (
              <button
                key={t}
                className={`tag-btn${form.type === t ? ' active' : ''}`}
                onClick={() => set('type', t)}
              >
                {t}
              </button>
            ))}
          </div>
        </div>

        <div className="form-group">
          <label className="form-label">Lieu de stockage</label>
          <div className="tag-row">
            {locations.map(l => (
              <button
                key={l.id}
                className={`tag-btn${form.location === l.name ? ' active' : ''}`}
                onClick={() => set('location', l.name)}
              >
                {l.name}
              </button>
            ))}
          </div>
        </div>

        <div className="form-group">
          <label className="form-label">Prix (optionnel)</label>
          <input
            className="form-input"
            type="number"
            min="0"
            step="0.01"
            placeholder="ex. 2,40"
            value={form.price}
            onChange={e => set('price', e.target.value)}
            inputMode="decimal"
          />
        </div>

        <div style={{ height: 8 }} />
        <button className="btn btn-primary" onClick={handleSave} disabled={!form.name.trim()}>
          Ajouter au stock
        </button>
        <div style={{ height: 12 }} />
        <button className="btn btn-secondary" style={{ marginBottom: 16 }}>
          + encore un
        </button>
      </div>
    </div>
  );
}
