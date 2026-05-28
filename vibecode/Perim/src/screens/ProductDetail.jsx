import { daysUntil, expiryStatus, formatDays, formatDate, productEmoji } from '../store.js';

export default function ProductDetail({ product, onClose, onEaten, onThrown, onEdit }) {
  const days = daysUntil(product.expiryDate);
  const status = expiryStatus(product.expiryDate);

  const expiryCardClass = status === 'expired' ? 'expired' : (status === 'ok' ? 'ok' : '');

  return (
    <div className="screen">
      <div className="header">
        <button className="back-btn" onClick={onClose}>← Retour</button>
        <span className="header-title" style={{ fontSize: 18 }}>Produit</span>
        <button style={{ fontFamily: 'var(--font-mono)', fontSize: 11, color: 'var(--gray)', background: 'none', border: 'none', cursor: 'pointer' }}>
          •••
        </button>
      </div>

      <div className="screen-body">
        <div className="detail-hero-img">{productEmoji(product.type)}</div>

        <div style={{ padding: '12px 16px 4px' }}>
          <h2 style={{ fontFamily: 'var(--font-display)', fontSize: 24, fontWeight: 700, color: 'var(--black)', marginBottom: 4 }}>
            {product.name}
          </h2>
          {product.brand && (
            <p style={{ fontFamily: 'var(--font-mono)', fontSize: 12, color: 'var(--gray)' }}>
              {product.brand}
              {product.quantity ? ` · ${product.quantity} ${product.unit}` : ''}
            </p>
          )}
          <div style={{ display: 'flex', gap: 8, marginTop: 8, flexWrap: 'wrap' }}>
            <span className="type-tag">{product.type}</span>
            <span className="type-tag">{product.location.toUpperCase()}</span>
          </div>
        </div>

        <div className={`expiry-card${expiryCardClass ? ' ' + expiryCardClass : ''}`}>
          <div className="expiry-card-label">
            {status === 'expired' ? 'Expiré' : 'Expire'}
          </div>
          <div className="expiry-card-value">
            {status === 'urgent' ? "aujourd'hui" : status === 'expired' ? `il y a ${Math.abs(days)} j` : formatDays(days).toLowerCase()}
          </div>
          <div className="expiry-card-sub">{formatDate(product.expiryDate)}</div>
        </div>

        <div className="detail-table">
          <div className="detail-row">
            <span className="detail-row-key">Quantité</span>
            <span className="detail-row-val">×{product.quantity}</span>
          </div>
          <div className="detail-row">
            <span className="detail-row-key">Ajouté le</span>
            <span className="detail-row-val">{formatDate(product.addedDate)}</span>
          </div>
          {product.price > 0 && (
            <div className="detail-row">
              <span className="detail-row-key">Prix</span>
              <span className="detail-row-val">{product.price.toFixed(2)} €</span>
            </div>
          )}
        </div>

        {product.status === 'active' && (
          <div className="action-row">
            <button
              className="btn btn-secondary btn-sm"
              style={{ flex: 1 }}
              onClick={() => onEaten(product.id)}
            >
              ✓ Mangé
            </button>
            <button
              className="btn btn-secondary btn-sm"
              style={{ flex: 1 }}
              onClick={() => onEaten(product.id, -1)}
            >
              −1
            </button>
            <button
              className="btn btn-secondary btn-sm"
              style={{ flex: 1, color: 'var(--orange)', borderColor: 'var(--orange-border)' }}
              onClick={() => onThrown(product.id)}
            >
              Jeté
            </button>
          </div>
        )}

        {product.status !== 'active' && (
          <div style={{ padding: '8px 16px' }}>
            <div style={{
              padding: '12px 16px',
              borderRadius: 'var(--r-lg)',
              background: 'var(--gray-light)',
              fontFamily: 'var(--font-mono)',
              fontSize: 12,
              color: 'var(--gray)',
              textAlign: 'center',
            }}>
              {product.status === 'eaten' ? '✓ Mangé' : '🗑 Jeté'}
            </div>
          </div>
        )}

        <div style={{ height: 16 }} />
      </div>
    </div>
  );
}
