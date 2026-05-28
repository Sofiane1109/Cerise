import { useState } from 'react';
import { daysUntil, expiryStatus, formatDays, productEmoji } from '../store.js';

function ExpiryBadge({ dateStr }) {
  const days = daysUntil(dateStr);
  const status = expiryStatus(dateStr);
  return <span className={`badge badge-${status}`}>{formatDays(days)}</span>;
}

const FILTERS = [
  { key: 'all', label: 'Tout' },
  { key: 'FRAIS', label: 'Frais' },
  { key: 'SEC', label: 'Sec' },
  { key: 'SURGELÉ', label: 'Surgelé' },
  { key: 'CONSERVE', label: 'Conserve' },
];

export default function StockScreen({ products, onProductClick, onAddClick }) {
  const [filter, setFilter] = useState('all');

  const active = products.filter(p => p.status === 'active');
  const filtered = filter === 'all' ? active : active.filter(p => p.type === filter);
  const sorted = [...filtered].sort((a, b) => new Date(a.expiryDate) - new Date(b.expiryDate));

  const counts = FILTERS.reduce((acc, f) => {
    acc[f.key] = f.key === 'all' ? active.length : active.filter(p => p.type === f.key).length;
    return acc;
  }, {});

  return (
    <div className="screen">
      <div className="header">
        <span className="header-icon-btn" style={{ background: 'none', fontSize: 20 }}>☰</span>
        <span className="header-title">Stock</span>
        <button className="header-icon-btn">🔍</button>
      </div>

      <div style={{ flexShrink: 0 }}>
        <div className="chips">
          {FILTERS.map(f => (
            <button
              key={f.key}
              className={`chip${filter === f.key ? ' active' : ''}`}
              onClick={() => setFilter(f.key)}
            >
              {f.label} · {counts[f.key]}
            </button>
          ))}
        </div>

        <div style={{ display: 'flex', justifyContent: 'space-between', padding: '0 20px 8px' }}>
          <span style={{ fontFamily: 'var(--font-mono)', fontSize: 10, color: 'var(--gray)', textTransform: 'uppercase', letterSpacing: '0.06em' }}>
            Trier par · Péremption ↑
          </span>
          <span style={{ fontFamily: 'var(--font-mono)', fontSize: 10, color: 'var(--gray)', textTransform: 'uppercase', letterSpacing: '0.06em' }}>
            Filtre
          </span>
        </div>
      </div>

      <div className="screen-body" style={{ paddingBottom: 88 }}>
        {sorted.length === 0 ? (
          <div className="empty-state">
            <div className="empty-state-icon">📦</div>
            <div className="empty-state-title">Aucun produit</div>
            <div className="empty-state-sub">Ajoute des produits avec le bouton +</div>
          </div>
        ) : (
          <div className="week-list" style={{ margin: '0 16px' }}>
            {sorted.map(p => (
              <div key={p.id} className="product-card" onClick={() => onProductClick(p)}>
                <div className="product-thumb">{productEmoji(p.type)}</div>
                <div className="product-info">
                  <div className="product-name">{p.name}</div>
                  <div className="product-meta">{p.location.toLowerCase()} · {p.quantity} {p.unit !== 'unités' ? p.unit : `×${p.quantity}`}</div>
                </div>
                <ExpiryBadge dateStr={p.expiryDate} />
              </div>
            ))}
          </div>
        )}
        <div style={{ height: 16 }} />
      </div>

      <button className="fab" onClick={onAddClick}>+</button>
    </div>
  );
}
