import { Link } from 'react-router-dom'
import { formatDateShort } from '../utils/hikeUtils'

// Skill colors.csv: difficulty mapped to vivid accent colors
const DIFF = {
  easy:     { label: 'Facile',    color: '#22C55E', bg: 'rgba(34,197,94,0.15)',  border: 'rgba(34,197,94,0.4)'  },
  moderate: { label: 'Modéré',   color: '#F59E0B', bg: 'rgba(245,158,11,0.15)', border: 'rgba(245,158,11,0.4)' },
  hard:     { label: 'Difficile', color: '#F97316', bg: 'rgba(249,115,22,0.15)', border: 'rgba(249,115,22,0.4)' },
  extreme:  { label: 'Extrême',  color: '#EF4444', bg: 'rgba(239,68,68,0.15)',  border: 'rgba(239,68,68,0.4)'  },
}

// Card background colors per difficulty — NOT too dark, uses #111827 as base
const CARD_BG = {
  easy:     { from: '#111827', to: '#14532D' },
  moderate: { from: '#111827', to: '#78350F' },
  hard:     { from: '#111827', to: '#7C2D12' },
  extreme:  { from: '#111827', to: '#7F1D1D' },
}

function IllustrationPlaceholder({ hike }) {
  const d = DIFF[hike.difficulty] ?? DIFF.moderate
  const bg = CARD_BG[hike.difficulty] ?? CARD_BG.moderate

  return (
    <svg viewBox="0 0 600 300" className="w-full h-full" preserveAspectRatio="xMidYMid slice">
      <defs>
        <linearGradient id={`bg-${hike.id}`} x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor={bg.from}/>
          <stop offset="100%" stopColor={bg.to}/>
        </linearGradient>
        <radialGradient id={`glow-${hike.id}`} cx="70%" cy="20%" r="30%">
          <stop offset="0%" stopColor={d.color} stopOpacity="0.2"/>
          <stop offset="100%" stopColor={d.color} stopOpacity="0"/>
        </radialGradient>
        <linearGradient id={`peak-${hike.id}`} x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor={d.color} stopOpacity="0.25"/>
          <stop offset="100%" stopColor={bg.to} stopOpacity="0.6"/>
        </linearGradient>
      </defs>

      {/* Background */}
      <rect width="600" height="300" fill={`url(#bg-${hike.id})`}/>
      <rect width="600" height="300" fill={`url(#glow-${hike.id})`}/>

      {/* Stars */}
      {[[40,20],[120,35],[250,15],[380,28],[500,18],[80,55],[320,45]].map(([x,y],i)=>(
        <circle key={i} cx={x} cy={y} r="1.5" fill="white" opacity="0.5"/>
      ))}

      {/* Celestial body */}
      <circle cx="480" cy="45" r="20" fill={d.color} opacity="0.18"/>
      <circle cx="480" cy="45" r="12" fill={d.color} opacity="0.25"/>

      {/* Background mountains */}
      <polygon points="0,300 100,160 200,300" fill={bg.to} opacity="0.4"/>
      <polygon points="300,300 480,120 660,300" fill={bg.to} opacity="0.35"/>

      {/* Main mountain */}
      <polygon points="80,300 300,40 520,300" fill={`url(#peak-${hike.id})`}/>
      {/* Snow cap */}
      <polygon points="300,40 278,85 322,85" fill="white" opacity="0.35"/>
      <polygon points="300,40 264,100 336,100" fill="white" opacity="0.10"/>

      {/* Right mountain */}
      <polygon points="400,300 540,100 680,300" fill={bg.to} opacity="0.5"/>
      <polygon points="540,100 525,128 555,128" fill="white" opacity="0.2"/>

      {/* Pine trees */}
      {[0,40,80,120,380,420,460,510,555].map((x,i) => (
        <g key={i} fill={bg.from}>
          <rect x={x+7} y={248} width="3" height="52"/>
          <polygon points={`${x+8.5},215 ${x-3},252 ${x+20},252`}/>
        </g>
      ))}

      {/* Ground fog */}
      <rect x="0" y="270" width="600" height="30" fill="black" opacity="0.3"/>
    </svg>
  )
}

export default function HikeCard({ hike, featured = false, style }) {
  const d = DIFF[hike.difficulty] ?? DIFF.moderate

  return (
    <Link
      to={`/hike/${hike.id}`}
      className="group block rounded-2xl overflow-hidden transition-all duration-250 animate-fade-up"
      style={{
        background: 'var(--surface)',
        border: '1px solid var(--border)',
        boxShadow: '0 1px 8px rgba(0,0,0,0.25)',
        animationDelay: style?.animationDelay ?? '0ms',
      }}
      onMouseEnter={e => {
        e.currentTarget.style.borderColor = d.border
        e.currentTarget.style.boxShadow = `0 4px 24px rgba(0,0,0,0.35), 0 0 0 1px ${d.border}`
        e.currentTarget.style.transform = 'translateY(-2px)'
      }}
      onMouseLeave={e => {
        e.currentTarget.style.borderColor = 'var(--border)'
        e.currentTarget.style.boxShadow = '0 1px 8px rgba(0,0,0,0.25)'
        e.currentTarget.style.transform = 'translateY(0)'
      }}
    >
      {/* Image */}
      <div className="relative overflow-hidden" style={{ height: featured ? '320px' : '220px' }}>
        {hike.coverImage ? (
          <img src={hike.coverImage} alt={hike.name}
            className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
            loading="lazy"/>
        ) : (
          <div className="w-full h-full">
            <IllustrationPlaceholder hike={hike}/>
          </div>
        )}

        {/* Bottom scrim */}
        <div className="absolute inset-0 pointer-events-none"
          style={{ background: 'linear-gradient(to bottom, transparent 50%, rgba(17,24,39,0.95) 100%)' }}/>

        {/* Top badges */}
        <div className="absolute top-3 left-3 right-3 flex justify-between items-start gap-2">
          {hike.location && (
            <span className="flex items-center gap-1 font-sans text-[10px] text-white/75 truncate max-w-[55%] px-2 py-1 rounded-lg"
              style={{ background: 'rgba(17,24,39,0.7)', backdropFilter: 'blur(4px)', border: '1px solid rgba(255,255,255,0.1)' }}>
              <svg width="8" height="8" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" className="flex-shrink-0">
                <path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0 1 18 0z"/><circle cx="12" cy="10" r="3"/>
              </svg>
              {hike.location}
            </span>
          )}
          <span className="flex-shrink-0 font-sans text-[10px] font-semibold px-2.5 py-1 rounded-full"
            style={{ color: d.color, background: d.bg, border: `1px solid ${d.border}` }}>
            {d.label}
          </span>
        </div>

        {/* Bottom stats */}
        <div className="absolute bottom-3 left-3 flex flex-wrap gap-1.5">
          {hike.distance > 0 && (
            <span className="font-sans text-[11px] font-medium text-white/90 px-2 py-1 rounded-lg flex items-center gap-1"
              style={{ background: 'rgba(17,24,39,0.7)', backdropFilter: 'blur(4px)' }}>
              <span style={{ color: d.color }}>↔</span>{hike.distance} km
            </span>
          )}
          {hike.elevation > 0 && (
            <span className="font-sans text-[11px] font-medium text-white/90 px-2 py-1 rounded-lg flex items-center gap-1"
              style={{ background: 'rgba(17,24,39,0.7)', backdropFilter: 'blur(4px)' }}>
              <span style={{ color: d.color }}>↑</span>+{hike.elevation} m
            </span>
          )}
          {hike.duration && (
            <span className="font-sans text-[11px] font-medium text-white/90 px-2 py-1 rounded-lg"
              style={{ background: 'rgba(17,24,39,0.7)', backdropFilter: 'blur(4px)' }}>
              {hike.duration}
            </span>
          )}
        </div>
      </div>

      {/* Text */}
      <div className="px-4 py-3.5" style={{ background: 'var(--surface)' }}>
        <div className="flex items-start justify-between gap-2">
          <h3 className="font-serif text-base leading-snug flex-1 line-clamp-2 transition-colors duration-150"
            style={{ color: 'var(--text)', fontWeight: 500 }}>
            {hike.name}
          </h3>
          {hike.rating > 0 && (
            <div className="flex gap-0.5 flex-shrink-0 pt-0.5">
              {[1,2,3,4,5].map(n => (
                <svg key={n} width="11" height="11" viewBox="0 0 24 24"
                  fill={n <= hike.rating ? '#CA8A04' : 'none'}
                  stroke={n <= hike.rating ? '#CA8A04' : 'var(--text-4)'} strokeWidth="1.5">
                  <path d="M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z"/>
                </svg>
              ))}
            </div>
          )}
        </div>
        <p className="font-sans text-[11px] mt-1" style={{ color: 'var(--text-3)' }}>
          {formatDateShort(hike.date)}
        </p>
      </div>
    </Link>
  )
}
