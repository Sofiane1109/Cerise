import { daysUntil, expiryStatus, formatDays, productEmoji } from '../store.js';

function ExpiryBadge({ dateStr }) {
  const days = daysUntil(dateStr);
  const status = expiryStatus(dateStr);
  return <span className={`badge badge-${status}`}>{formatDays(days)}</span>;
}

function ProductCard({ product, onClick }) {
  return (
    <div className="product-card" onClick={() => onClick(product)}>
      <div className="product-thumb">{productEmoji(product.type)}</div>
      <div className="product-info">
        <div className="product-name">{product.name}</div>
        <div className="product-meta">
          {product.location.toLowerCase()} · {product.quantity}{product.unit !== 'unités' ? product.unit : `×${product.quantity}`}
        </div>
      </div>
      <ExpiryBadge dateStr={product.expiryDate} />
    </div>
  );
}

export default function Dashboard({ products, onProductClick, onAddClick }) {
  const active = products.filter(p => p.status === 'active');
  const sorted = [...active].sort((a, b) => new Date(a.expiryDate) - new Date(b.expiryDate));

  const urgent = sorted.filter(p => {
    const s = expiryStatus(p.expiryDate);
    return s === 'urgent' || s === 'expired' || s === 'soon';
  });

  const thisWeek = sorted.filter(p => {
    const d = daysUntil(p.expiryDate);
    return d >= 4 && d <= 14;
  });

  return (
    <div className="screen">
      <div className="header">
        <span className="header-title">Perim'</span>
        <button className="header-icon-btn">🔔</button>
      </div>

      <div className="screen-body">
        {urgent.length === 0 && thisWeek.length === 0 && active.length === 0 ? (
          <div className="empty-state">
            <div className="empty-state-icon">🥦</div>
            <div className="empty-state-title">Aucun produit</div>
            <div className="empty-state-sub">Commence par scanner ou ajouter un produit</div>
          </div>
        ) : (
          <>
            {urgent.length > 0 && (
              <>
                <div className="section-header">
                  <span className="section-label" style={{ color: 'var(--orange)' }}>À manger vite</span>
                  <span className="section-action" style={{ color: 'var(--orange)' }}>{urgent.length} produit{urgent.length > 1 ? 's' : ''}</span>
                </div>
                <div className="urgent-box">
                  <div className="urgent-box-head">
                    <span className="urgent-box-title">⚡ Urgent</span>
                    <span className="urgent-box-count">{urgent.length}</span>
                  </div>
                  {urgent.map(p => <ProductCard key={p.id} product={p} onClick={onProductClick} />)}
                </div>
              </>
            )}

            {thisWeek.length > 0 && (
              <>
                <div className="section-header" style={{ marginTop: urgent.length > 0 ? 20 : 12 }}>
                  <span className="section-label">Cette semaine</span>
                  <span className="section-action" onClick={() => {}}>VOIR TOUT</span>
                </div>
                <div className="week-list">
                  {thisWeek.slice(0, 5).map(p => <ProductCard key={p.id} product={p} onClick={onProductClick} />)}
                </div>
              </>
            )}

            {urgent.length === 0 && thisWeek.length === 0 && active.length > 0 && (
              <>
                <div className="section-header">
                  <span className="section-label">Tous les produits</span>
                  <span className="section-action">{active.length}</span>
                </div>
                <div className="week-list">
                  {sorted.slice(0, 6).map(p => <ProductCard key={p.id} product={p} onClick={onProductClick} />)}
                </div>
              </>
            )}

            <div style={{ height: 16 }} />
          </>
        )}
      </div>

      <button className="fab" onClick={onAddClick}>+</button>
    </div>
  );
}
