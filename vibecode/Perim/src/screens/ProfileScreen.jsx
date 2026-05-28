import { useState } from 'react';

export default function ProfileScreen({ products, locations: locsProp = [], onSaveLocation }) {
  const [locations, setLocations] = useState(locsProp);

  async function toggleLoc(id) {
    const loc = locations.find(l => l.id === id);
    const updated = { ...loc, enabled: !loc.enabled };
    setLocations(locs => locs.map(l => l.id === id ? updated : l));
    await onSaveLocation(updated);
  }

  const active = products.filter(p => p.status === 'active');
  const locCounts = locations.reduce((acc, l) => {
    acc[l.name] = active.filter(p => p.location === l.name).length;
    return acc;
  }, {});

  return (
    <div className="screen">
      <div className="header">
        <span className="header-icon-btn" style={{ background: 'none', fontSize: 20 }}>☰</span>
        <span className="header-title">Moi</span>
        <button style={{ fontFamily: 'var(--font-mono)', fontSize: 11, color: 'var(--gray)', background: 'none', border: 'none', cursor: 'pointer', textTransform: 'uppercase', letterSpacing: '0.06em' }}>
          ÉDITER
        </button>
      </div>

      <div className="screen-body">
        <div style={{ padding: '8px 20px 24px', display: 'flex', alignItems: 'center', gap: 14 }}>
          <div style={{
            width: 56,
            height: 56,
            borderRadius: '50%',
            background: 'var(--gray-light)',
            border: '1.5px solid var(--border)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            fontSize: 22,
            fontFamily: 'var(--font-display)',
            fontWeight: 700,
            color: 'var(--black)',
          }}>
            L
          </div>
          <div>
            <div style={{ fontFamily: 'var(--font-display)', fontSize: 22, fontWeight: 700, color: 'var(--black)' }}>Léa</div>
            <div style={{ fontFamily: 'var(--font-mono)', fontSize: 11, color: 'var(--gray)', marginTop: 2 }}>membre depuis mai 2026</div>
          </div>
        </div>

        <div style={{ padding: '0 20px', marginBottom: 8 }}>
          <div style={{ fontFamily: 'var(--font-mono)', fontSize: 10, fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.06em', color: 'var(--gray)', marginBottom: 8 }}>Mes lieux</div>
        </div>

        <div className="profile-section">
          {locations.map(loc => (
            <div key={loc.id} className="profile-row" style={{ cursor: 'default' }}>
              <div className="profile-row-left">
                <div className="profile-row-icon">🗄️</div>
                <div>
                  <div className="profile-row-name">{loc.name}</div>
                  <div className="profile-row-sub">{locCounts[loc.name] || 0} produits</div>
                </div>
              </div>
              <label className="toggle">
                <input type="checkbox" checked={loc.enabled} onChange={() => toggleLoc(loc.id)} />
                <span className="toggle-track" />
                <span className="toggle-thumb" />
              </label>
            </div>
          ))}
          <div className="profile-row" style={{ color: 'var(--gray)' }}>
            <div className="profile-row-left">
              <div className="profile-row-icon" style={{ fontSize: 20 }}>+</div>
              <div className="profile-row-name" style={{ color: 'var(--gray)', fontWeight: 400 }}>Nouveau lieu</div>
            </div>
          </div>
        </div>

        <div style={{ padding: '0 20px', marginBottom: 8 }}>
          <div style={{ fontFamily: 'var(--font-mono)', fontSize: 10, fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.06em', color: 'var(--gray)', marginBottom: 8 }}>Préférences</div>
        </div>

        <div className="profile-section">
          {[
            { icon: '🔔', name: 'Alerter avant péremption', sub: '3 jours avant' },
            { icon: '🕘', name: 'Heure des rappels', sub: '09:00' },
            { icon: '📅', name: 'Récap hebdo', sub: 'Dimanche' },
            { icon: '🍳', name: 'Recettes anti-gaspi', sub: 'Activé' },
          ].map(row => (
            <div key={row.name} className="profile-row">
              <div className="profile-row-left">
                <div className="profile-row-icon">{row.icon}</div>
                <div>
                  <div className="profile-row-name">{row.name}</div>
                  <div className="profile-row-sub">{row.sub}</div>
                </div>
              </div>
              <span className="profile-row-chevron">›</span>
            </div>
          ))}
        </div>

        <div className="profile-section">
          {[
            { icon: '💾', name: 'Données & export', sub: 'CSV · sauvegarde' },
            { icon: '❓', name: 'Aide', sub: 'FAQ · contact' },
            { icon: 'ℹ️', name: 'À propos', sub: 'Version 1.0' },
          ].map(row => (
            <div key={row.name} className="profile-row">
              <div className="profile-row-left">
                <div className="profile-row-icon">{row.icon}</div>
                <div>
                  <div className="profile-row-name">{row.name}</div>
                  <div className="profile-row-sub">{row.sub}</div>
                </div>
              </div>
              <span className="profile-row-chevron">›</span>
            </div>
          ))}
        </div>

        <div style={{ height: 16 }} />
      </div>
    </div>
  );
}
