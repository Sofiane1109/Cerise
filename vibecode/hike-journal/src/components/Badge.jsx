import { DIFFICULTY_MAP } from '../utils/hikeUtils'

export function DifficultyBadge({ difficulty, size = 'sm' }) {
  const d = DIFFICULTY_MAP[difficulty]
  if (!d) return null
  return (
    <span className={`inline-flex items-center font-sans font-medium rounded-full border
      ${size === 'sm' ? 'text-[10px] px-2 py-0.5' : 'text-xs px-3 py-1'}
      ${d.badge}`}>
      {d.label}
    </span>
  )
}

export function MetaBadge({ icon, value, unit, className = '' }) {
  if (!value && value !== 0) return null
  return (
    <span className={`inline-flex items-center gap-1.5 text-xs font-sans
      text-stone-300 bg-forest-950/60 border border-forest-900 px-3 py-1.5 rounded-lg ${className}`}>
      <span className="text-stone-500 text-[11px]">{icon}</span>
      <span className="font-medium text-stone-200">{value}</span>
      {unit && <span className="text-stone-500">{unit}</span>}
    </span>
  )
}

export function RatingStars({ value, size = 14 }) {
  return (
    <div className="flex gap-0.5">
      {[1,2,3,4,5].map(n => (
        <svg key={n} width={size} height={size} viewBox="0 0 24 24"
          fill={n <= value ? '#d4a030' : 'none'}
          stroke={n <= value ? '#d4a030' : '#38301e'}
          strokeWidth="1.5">
          <path d="M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z"/>
        </svg>
      ))}
    </div>
  )
}

// Compact stat pill used inside cards
export function StatPill({ children }) {
  return (
    <span className="inline-flex items-center gap-1 text-[11px] font-sans text-stone-300 bg-black/40 backdrop-blur-sm px-2 py-1 rounded-md border border-white/5">
      {children}
    </span>
  )
}
