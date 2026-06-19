import { useState } from 'react'
import { Link } from 'react-router-dom'
import { useHikes } from '../context/HikesContext'
import HikeCard from '../components/HikeCard'
import { totalStats } from '../utils/hikeUtils'

const FILTERS = [
  { value: 'all',      label: 'Toutes' },
  { value: 'easy',     label: 'Facile' },
  { value: 'moderate', label: 'Modéré' },
  { value: 'hard',     label: 'Difficile' },
  { value: 'extreme',  label: 'Extrême' },
]

const DIFF_COLOR = {
  easy: '#22C55E', moderate: '#F59E0B', hard: '#F97316', extreme: '#EF4444'
}

function EmptyState() {
  return (
    <div className="text-center py-24 animate-fade-up">
      <div className="w-20 h-20 rounded-2xl flex items-center justify-center mx-auto mb-6"
        style={{ background: 'rgba(34,197,94,0.1)', border: '1px solid rgba(34,197,94,0.2)' }}>
        <svg width="36" height="36" viewBox="0 0 24 24" fill="none" stroke="#22C55E" strokeWidth="1.5">
          <path d="M3 17l4-8 4 4 3-5 4 9H3z"/>
          <circle cx="18" cy="6" r="2" fill="#CA8A04" stroke="none"/>
        </svg>
      </div>
      <h2 className="font-serif text-2xl mb-2" style={{ color: 'var(--text)' }}>Aucune randonnée</h2>
      <p className="font-sans text-sm mb-8" style={{ color: 'var(--text-3)' }}>
        Chaque sommet commence par un premier pas.
      </p>
      <Link to="/hike/new" className="btn-primary">
        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
          <path d="M12 5v14M5 12h14"/>
        </svg>
        Nouvelle randonnée
      </Link>
    </div>
  )
}

export default function HomePage() {
  const { hikes } = useHikes()
  const [filter, setFilter] = useState('all')
  const [sortBy, setSortBy] = useState('date')

  const filtered = hikes
    .filter(h => filter === 'all' || h.difficulty === filter)
    .sort((a, b) => {
      if (sortBy === 'date')      return new Date(b.date || 0) - new Date(a.date || 0)
      if (sortBy === 'distance')  return (b.distance || 0) - (a.distance || 0)
      if (sortBy === 'elevation') return (b.elevation || 0) - (a.elevation || 0)
      return 0
    })

  const stats = totalStats(hikes)
  const [featured, ...rest] = filtered

  return (
    <div style={{ background: 'var(--bg)', minHeight: '100vh' }}>

      {/* ── Header ─────────────────────────────────────────── */}
      <div style={{ background: 'var(--surface)', borderBottom: '1px solid var(--border)' }}>
        <div className="max-w-6xl mx-auto px-4 sm:px-6 py-10 sm:py-14">

          {/* Eyebrow */}
          <p className="font-sans text-xs font-semibold tracking-widest uppercase mb-4"
            style={{ color: 'var(--primary)' }}>
            Journal de trail &amp; aventure
          </p>

          {/* Title */}
          <h1 className="font-serif font-normal leading-none mb-8"
            style={{ fontSize: 'clamp(3rem,8vw,6rem)', color: 'var(--text)' }}>
            Mes{' '}
            <span style={{
              fontStyle: 'italic',
              background: 'linear-gradient(90deg, #22C55E 0%, #CA8A04 100%)',
              WebkitBackgroundClip: 'text',
              WebkitTextFillColor: 'transparent',
              backgroundClip: 'text',
            }}>
              Randonnées
            </span>
          </h1>

          {/* Stats — from skill: show key metrics prominently */}
          {hikes.length > 0 && (
            <div className="grid grid-cols-3 gap-4">
              {[
                { n: hikes.length,                            suf: '',    label: 'Sorties',         icon: '⛰' },
                { n: Math.round(stats.km),                    suf: ' km', label: 'Parcourus',       icon: '↔' },
                { n: stats.elevation.toLocaleString('fr-FR'), suf: ' m',  label: 'Dénivelé cumulé', icon: '↑' },
              ].map((s, i) => (
                <div key={i} className="rounded-2xl p-4 sm:p-5"
                  style={{ background: 'var(--bg)', border: '1px solid var(--border)' }}>
                  <div className="text-lg mb-1" style={{ color: 'var(--text-3)' }}>{s.icon}</div>
                  <div className="font-serif leading-none" style={{ fontSize: 'clamp(1.5rem,4vw,2.25rem)', color: 'var(--text)' }}>
                    {s.n}
                    <span className="font-sans text-sm font-normal ml-1" style={{ color: 'var(--primary)' }}>
                      {s.suf}
                    </span>
                  </div>
                  <div className="font-sans text-xs mt-1.5 tracking-wide" style={{ color: 'var(--text-3)' }}>
                    {s.label}
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* ── Filters ─────────────────────────────────────────── */}
      {hikes.length > 0 && (
        <div className="max-w-6xl mx-auto px-4 sm:px-6 py-5 flex flex-wrap items-center gap-3">
          <div className="flex items-center gap-2 flex-wrap flex-1">
            {FILTERS.map(f => {
              const active = filter === f.value
              const col = DIFF_COLOR[f.value]
              return (
                <button key={f.value} onClick={() => setFilter(f.value)}
                  className="font-sans text-xs font-medium px-4 py-2 rounded-full border transition-all duration-150"
                  style={{
                    background:  active ? (col ? `${col}1A` : 'var(--surface)') : 'transparent',
                    borderColor: active ? (col ?? 'var(--primary)') : 'var(--border)',
                    color:       active ? (col ?? 'var(--text)')     : 'var(--text-3)',
                  }}>
                  {f.label}
                </button>
              )
            })}
          </div>
          <select value={sortBy} onChange={e => setSortBy(e.target.value)}
            className="select text-xs py-2 px-3 w-auto rounded-xl">
            <option value="date">Plus récentes</option>
            <option value="distance">Distance ↓</option>
            <option value="elevation">Dénivelé ↓</option>
          </select>
        </div>
      )}

      {/* ── Content ─────────────────────────────────────────── */}
      <div className="max-w-6xl mx-auto px-4 sm:px-6 pb-28">
        {hikes.length === 0 ? (
          <EmptyState />
        ) : filtered.length === 0 ? (
          <p className="text-center py-16 font-sans text-sm" style={{ color: 'var(--text-3)' }}>
            Aucune randonnée pour ce filtre.
          </p>
        ) : (
          <div className="space-y-4">
            {/* Featured */}
            {featured && <HikeCard hike={featured} featured style={{ animationDelay: '0ms' }}/>}
            {/* Grid */}
            {rest.length > 0 && (
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                {rest.map((h, i) => (
                  <HikeCard key={h.id} hike={h} style={{ animationDelay: `${(i+1)*60}ms` }}/>
                ))}
              </div>
            )}
          </div>
        )}
      </div>

      {/* ── FAB ─────────────────────────────────────────────── */}
      <Link to="/hike/new"
        className="fixed bottom-8 right-6 sm:right-8 z-40 btn-primary rounded-full px-5 py-3 shadow-lg"
        style={{ boxShadow: '0 4px 20px rgba(34,197,94,0.3)' }}>
        <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
          <path d="M12 5v14M5 12h14"/>
        </svg>
        <span className="hidden sm:inline">Nouvelle rando</span>
      </Link>
    </div>
  )
}
