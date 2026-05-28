import { computeStats } from '../store.js';

export default function StatsScreen({ products }) {
  const stats = computeStats(products);
  const maxWeek = Math.max(...stats.weeks.map(w => w.count), 1);

  return (
    <div className="screen">
      <div className="header">
        <span className="header-icon-btn" style={{ background: 'none', fontSize: 20 }}>☰</span>
        <span className="header-title">Anti-gaspi</span>
        <button style={{ fontFamily: 'var(--font-mono)', fontSize: 10, color: 'var(--gray)', background: 'none', border: 'none', cursor: 'pointer', textTransform: 'uppercase', letterSpacing: '0.06em' }}>
          MOIS
        </button>
      </div>

      <div className="screen-body">
        <div className="stat-hero">
          <div className="stat-hero-label">Économisé ce mois</div>
          <div className="stat-hero-value">{stats.savedValue.toFixed(2).replace('.', ',')} €</div>
          <div className="stat-hero-sub">
            {stats.savedValue > 0 ? '+18% vs mois dernier' : 'Commence à suivre tes produits !'}
          </div>
        </div>

        <div className="stat-row">
          <div className="stat-card">
            <div className="stat-card-value green">{stats.savedPct} %</div>
            <div className="stat-card-label">Mangé à temps</div>
          </div>
          <div className="stat-card">
            <div className="stat-card-value orange">{stats.thrownPct} %</div>
            <div className="stat-card-label">Jeté</div>
          </div>
        </div>

        <div className="bar-chart">
          <div className="bar-chart-title">Par semaine</div>
          <div className="bars">
            {stats.weeks.map((week, i) => (
              <div key={i} className="bar-col">
                <div
                  className={`bar-fill${week.current ? ' current' : ''}`}
                  style={{ height: `${Math.round((week.count / maxWeek) * 100)}%` }}
                />
                <span className="bar-label">{week.label}</span>
              </div>
            ))}
          </div>
        </div>

        <div className="streak-badge">
          💪 {stats.total > 0 ? `${stats.eaten} produits mangés à temps cette semaine` : 'Aucune donnée encore — commence à scanner !'}
        </div>

        <div style={{ margin: '0 16px 16px', padding: '16px', background: 'var(--cream)', border: '1.5px solid var(--border)', borderRadius: 'var(--r-lg)' }}>
          <div style={{ fontFamily: 'var(--font-mono)', fontSize: 10, fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.06em', color: 'var(--gray)', marginBottom: 12 }}>
            Au total
          </div>
          <div style={{ display: 'flex', justifyContent: 'space-around' }}>
            {[
              { v: stats.total, l: 'Produits suivis' },
              { v: stats.eaten, l: 'Mangés' },
              { v: stats.thrown, l: 'Jetés' },
            ].map(({ v, l }) => (
              <div key={l} style={{ textAlign: 'center' }}>
                <div style={{ fontFamily: 'var(--font-display)', fontSize: 28, fontWeight: 700, color: 'var(--black)' }}>{v}</div>
                <div style={{ fontFamily: 'var(--font-mono)', fontSize: 9, color: 'var(--gray)', textTransform: 'uppercase', letterSpacing: '0.06em', marginTop: 2 }}>{l}</div>
              </div>
            ))}
          </div>
        </div>

        <div style={{ height: 16 }} />
      </div>
    </div>
  );
}
