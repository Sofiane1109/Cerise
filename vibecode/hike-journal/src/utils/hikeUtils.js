export const DIFFICULTIES = [
  { value: 'easy',     label: 'Facile',    badge: 'badge-easy',     accent: '#72a43b' },
  { value: 'moderate', label: 'Modéré',   badge: 'badge-moderate', accent: '#d97706' },
  { value: 'hard',     label: 'Difficile', badge: 'badge-hard',     accent: '#ea580c' },
  { value: 'extreme',  label: 'Extrême',  badge: 'badge-extreme',  accent: '#dc2626' },
]

export const DIFFICULTY_MAP = Object.fromEntries(DIFFICULTIES.map(d => [d.value, d]))

// Card gradient per difficulty — used as placeholder background
export const CARD_GRADIENTS = {
  easy:     'from-forest-950 via-forest-900 to-forest-800',
  moderate: 'from-stone-950 via-stone-900 to-stone-800',
  hard:     'from-orange-950 via-orange-900 to-stone-900',
  extreme:  'from-red-950   via-red-900   to-stone-900',
}

// Accent glow color per difficulty
export const CARD_GLOWS = {
  easy:     'rgba(114,164,59,0.15)',
  moderate: 'rgba(217,119,6,0.12)',
  hard:     'rgba(234,88,12,0.12)',
  extreme:  'rgba(220,38,38,0.12)',
}

export const DEFAULT_CHECKLIST = [
  { id: 'dc1',  label: 'Eau (minimum 2L)',                  checked: false },
  { id: 'dc2',  label: 'Nourriture pour la durée',          checked: false },
  { id: 'dc3',  label: 'Carte / GPS téléchargé hors ligne', checked: false },
  { id: 'dc4',  label: 'Kit premiers secours',              checked: false },
  { id: 'dc5',  label: 'Téléphone chargé',                  checked: false },
  { id: 'dc6',  label: 'Lampe frontale',                    checked: false },
  { id: 'dc7',  label: 'Couverture de survie',              checked: false },
  { id: 'dc8',  label: 'Vêtements de pluie',                checked: false },
  { id: 'dc9',  label: 'Crème solaire + lunettes',          checked: false },
  { id: 'dc10', label: 'Sifflet de signalisation',          checked: false },
]

export function formatDate(dateStr) {
  if (!dateStr) return ''
  const d = new Date(dateStr + 'T00:00:00')
  return d.toLocaleDateString('fr-FR', { day: 'numeric', month: 'long', year: 'numeric' })
}

export function formatDateShort(dateStr) {
  if (!dateStr) return ''
  const d = new Date(dateStr + 'T00:00:00')
  return d.toLocaleDateString('fr-FR', { day: 'numeric', month: 'short', year: 'numeric' })
}

export function totalStats(hikes) {
  return hikes.reduce(
    (acc, h) => ({
      km:        acc.km + (Number(h.distance) || 0),
      elevation: acc.elevation + (Number(h.elevation) || 0),
    }),
    { km: 0, elevation: 0 },
  )
}

export function placeholderGradient(hike) {
  return CARD_GRADIENTS[hike.difficulty] ?? CARD_GRADIENTS.moderate
}
