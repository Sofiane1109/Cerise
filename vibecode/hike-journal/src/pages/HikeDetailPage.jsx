import { useState } from 'react'
import { useParams, useNavigate, Link } from 'react-router-dom'
import { useHikes } from '../context/HikesContext'
import { PhotoGallery } from '../components/PhotoGallery'
import { ChecklistViewer } from '../components/ChecklistEditor'
import ConfirmDialog from '../components/ConfirmDialog'
import { formatDate } from '../utils/hikeUtils'

const DIFF = {
  easy:     { label: 'Facile',    color: '#22C55E', bg: 'rgba(34,197,94,0.15)',  border: 'rgba(34,197,94,0.4)',  hero1:'#0F2318', hero2:'#14532D' },
  moderate: { label: 'Modéré',   color: '#F59E0B', bg: 'rgba(245,158,11,0.15)', border: 'rgba(245,158,11,0.4)', hero1:'#1C1400', hero2:'#78350F' },
  hard:     { label: 'Difficile', color: '#F97316', bg: 'rgba(249,115,22,0.15)', border: 'rgba(249,115,22,0.4)', hero1:'#1C0D00', hero2:'#7C2D12' },
  extreme:  { label: 'Extrême',  color: '#EF4444', bg: 'rgba(239,68,68,0.15)',  border: 'rgba(239,68,68,0.4)',  hero1:'#1C0000', hero2:'#7F1D1D' },
}

function HeroIllustration({ hike }) {
  const d = DIFF[hike.difficulty] ?? DIFF.moderate
  return (
    <svg viewBox="0 0 1200 420" className="w-full h-full" preserveAspectRatio="xMidYMid slice">
      <defs>
        <linearGradient id="dh-bg" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor={d.hero1}/>
          <stop offset="100%" stopColor={d.hero2}/>
        </linearGradient>
        <radialGradient id="dh-glow" cx="72%" cy="18%" r="28%">
          <stop offset="0%" stopColor={d.color} stopOpacity="0.25"/>
          <stop offset="100%" stopColor={d.color} stopOpacity="0"/>
        </radialGradient>
        <linearGradient id="dh-peak" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor={d.color} stopOpacity="0.3"/>
          <stop offset="100%" stopColor={d.hero2} stopOpacity="0.7"/>
        </linearGradient>
      </defs>
      <rect width="1200" height="420" fill="url(#dh-bg)"/>
      <rect width="1200" height="420" fill="url(#dh-glow)"/>
      {[[60,25],[180,12],[360,38],[600,20],[840,30],[1050,16],[150,60],[700,55]].map(([x,y],i)=>(
        <circle key={i} cx={x} cy={y} r="1.8" fill="white" opacity="0.45"/>
      ))}
      {/* Sun */}
      <circle cx="864" cy="58" r="26" fill={d.color} opacity="0.20"/>
      <circle cx="864" cy="58" r="16" fill={d.color} opacity="0.30"/>
      {/* Far range */}
      <polygon points="-50,420 120,220 280,420" fill={d.hero2} opacity="0.35"/>
      <polygon points="800,420 1000,200 1250,420" fill={d.hero2} opacity="0.3"/>
      {/* Main peak */}
      <polygon points="200,420 600,45 1000,420" fill="url(#dh-peak)"/>
      {/* Snow */}
      <polygon points="600,45 572,100 628,100" fill="white" opacity="0.35"/>
      <polygon points="600,45 558,120 642,120" fill="white" opacity="0.12"/>
      {/* Right peak */}
      <polygon points="750,420 950,130 1150,420" fill={d.hero2} opacity="0.6"/>
      <polygon points="950,130 933,165 967,165" fill="white" opacity="0.2"/>
      {/* Trees */}
      {[0,50,100,150,200,700,760,820,880,950,1020,1080,1140].map((x,i)=>(
        <g key={i} fill={d.hero1}>
          <rect x={x+9} y={358} width="4" height="62"/>
          <polygon points={`${x+11},318 ${x-4},362 ${x+26},362`}/>
        </g>
      ))}
      <rect x="0" y="385" width="1200" height="35" fill="black" opacity="0.35"/>
    </svg>
  )
}

function Section({ icon, title, children }) {
  return (
    <div className="rounded-2xl p-5 sm:p-6" style={{ background: 'var(--surface)', border: '1px solid var(--border)' }}>
      <h2 className="font-serif text-lg mb-4 flex items-center gap-2.5" style={{ color: 'var(--text)' }}>
        <span className="text-xl">{icon}</span>{title}
      </h2>
      {children}
    </div>
  )
}

export default function HikeDetailPage() {
  const { id } = useParams()
  const navigate = useNavigate()
  const { getHike, updateHike, deleteHike } = useHikes()
  const [confirmDelete, setConfirmDelete] = useState(false)

  const hike = getHike(id)
  if (!hike) {
    return (
      <div className="text-center py-28 animate-fade-in page-container">
        <p className="font-serif text-2xl mb-6" style={{ color: 'var(--text-3)' }}>Randonnée introuvable.</p>
        <Link to="/" className="btn-secondary">← Retour</Link>
      </div>
    )
  }

  const d = DIFF[hike.difficulty] ?? DIFF.moderate
  const doneChecks  = hike.checklist?.filter(i => i.checked).length ?? 0
  const totalChecks = hike.checklist?.length ?? 0
  const pct = totalChecks ? Math.round((doneChecks / totalChecks) * 100) : 0

  const toggleChecklistItem = (itemId) =>
    updateHike(id, { checklist: hike.checklist.map(i => i.id === itemId ? { ...i, checked: !i.checked } : i) })

  return (
    <div className="animate-fade-in" style={{ background: 'var(--bg)', minHeight: '100vh' }}>

      {/* ── Hero ────────────────────────────────────────────── */}
      <div className="relative overflow-hidden" style={{ height: 'clamp(260px,40vw,420px)' }}>
        {hike.coverImage
          ? <img src={hike.coverImage} alt={hike.name} className="w-full h-full object-cover" loading="lazy"/>
          : <div className="w-full h-full"><HeroIllustration hike={hike}/></div>
        }
        {/* Gradient */}
        <div className="absolute inset-0 pointer-events-none"
          style={{ background: 'linear-gradient(to bottom, rgba(17,24,39,0.5) 0%, transparent 40%, rgba(17,24,39,0.95) 100%)' }}/>

        {/* Actions */}
        <div className="absolute top-4 left-4 right-4 flex items-start justify-between z-10">
          <Link to="/" className="btn-ghost text-xs px-3 py-2 rounded-xl"
            style={{ background: 'rgba(17,24,39,0.6)', backdropFilter: 'blur(8px)', border: '1px solid rgba(255,255,255,0.1)' }}>
            <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <path d="M19 12H5M12 5l-7 7 7 7"/>
            </svg>
            Retour
          </Link>
          <div className="flex gap-2">
            <Link to={`/hike/${id}/edit`} className="btn-ghost text-xs px-3 py-2 rounded-xl"
              style={{ background: 'rgba(17,24,39,0.6)', backdropFilter: 'blur(8px)', border: '1px solid rgba(255,255,255,0.1)' }}>
              <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"/>
                <path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z"/>
              </svg>
              Modifier
            </Link>
            <button onClick={() => setConfirmDelete(true)} className="btn-ghost text-xs px-3 py-2 rounded-xl"
              style={{ background: 'rgba(17,24,39,0.6)', backdropFilter: 'blur(8px)', border: '1px solid rgba(239,68,68,0.25)', color: '#FCA5A5' }}>
              <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <polyline points="3 6 5 6 21 6"/>
                <path d="M19 6l-1 14H6L5 6M10 11v6M14 11v6M9 6V4h6v2"/>
              </svg>
              Supprimer
            </button>
          </div>
        </div>

        {/* Title */}
        <div className="absolute bottom-0 left-0 right-0 px-5 sm:px-8 pb-6 z-10">
          <div className="flex items-center gap-2 mb-2">
            <span className="font-sans text-[11px] font-semibold px-2.5 py-1 rounded-full"
              style={{ color: d.color, background: d.bg, border: `1px solid ${d.border}` }}>
              {d.label}
            </span>
            {hike.rating > 0 && (
              <div className="flex gap-0.5">
                {[1,2,3,4,5].map(n=>(
                  <svg key={n} width="13" height="13" viewBox="0 0 24 24"
                    fill={n<=hike.rating?'#CA8A04':'none'} stroke={n<=hike.rating?'#CA8A04':'#374151'} strokeWidth="1.5">
                    <path d="M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z"/>
                  </svg>
                ))}
              </div>
            )}
          </div>
          <h1 className="font-serif text-white leading-tight"
            style={{ fontSize:'clamp(1.6rem,4vw,3rem)', textShadow:'0 2px 12px rgba(0,0,0,0.5)', fontWeight:500 }}>
            {hike.name}
          </h1>
          {hike.location && (
            <p className="font-sans text-xs flex items-center gap-1.5 mt-1.5" style={{ color:'rgba(255,255,255,0.5)' }}>
              <svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0 1 18 0z"/><circle cx="12" cy="10" r="3"/>
              </svg>
              {hike.location}
            </p>
          )}
        </div>
      </div>

      {/* ── Content ─────────────────────────────────────────── */}
      <div className="max-w-4xl mx-auto px-4 sm:px-6 py-6 space-y-3 pb-16">

        {/* Meta */}
        <div className="flex flex-wrap gap-2 py-1">
          {[
            hike.date      && ['📅', formatDate(hike.date)],
            hike.duration  && ['⏱', hike.duration],
            hike.distance>0  && ['↔', `${hike.distance} km`],
            hike.elevation>0 && ['↑', `+${hike.elevation} m`],
          ].filter(Boolean).map(([icon, text], i) => (
            <span key={i} className="font-sans text-xs px-3 py-1.5 rounded-lg flex items-center gap-1.5"
              style={{ color:'var(--text-2)', background:'var(--surface)', border:'1px solid var(--border)' }}>
              <span style={{ color:'var(--text-3)' }}>{icon}</span>{text}
            </span>
          ))}
        </div>

        {hike.description && (
          <Section icon="📖" title="Description">
            <p className="font-sans text-sm leading-relaxed whitespace-pre-line" style={{ color:'var(--text-2)' }}>
              {hike.description}
            </p>
          </Section>
        )}

        <Section icon="📷" title="Photos & Vidéos">
          <PhotoGallery photos={hike.photos}/>
        </Section>

        <div className="grid sm:grid-cols-2 gap-3">
          <Section icon="🎒" title="Matériel emporté">
            {hike.equipment?.length > 0 ? (
              <ul className="space-y-2">
                {hike.equipment.map((item,i) => (
                  <li key={i} className="flex items-start gap-2.5 font-sans text-sm" style={{ color:'var(--text-2)' }}>
                    <span className="w-1.5 h-1.5 rounded-full flex-shrink-0 mt-1.5" style={{ background:d.color, opacity:0.8 }}/>
                    {item}
                  </li>
                ))}
              </ul>
            ) : <p className="font-sans text-sm" style={{ color:'var(--text-3)' }}>Aucun matériel listé.</p>}
          </Section>

          <Section icon="🍫" title="Nourriture prévue">
            {hike.food?.length > 0 ? (
              <ul className="space-y-2">
                {hike.food.map((item,i) => (
                  <li key={i} className="flex items-start gap-2.5 font-sans text-sm" style={{ color:'var(--text-2)' }}>
                    <span className="w-1.5 h-1.5 rounded-full flex-shrink-0 mt-1.5" style={{ background:'#CA8A04', opacity:0.8 }}/>
                    {item}
                  </li>
                ))}
              </ul>
            ) : <p className="font-sans text-sm" style={{ color:'var(--text-3)' }}>Aucun aliment listé.</p>}
          </Section>
        </div>

        {hike.checklist?.length > 0 && (
          <Section icon="✅" title="Check-list avant départ">
            <div className="flex items-center gap-3 mb-4">
              <span className="font-sans text-xs" style={{ color:'var(--text-3)' }}>{doneChecks}/{totalChecks}</span>
              <div className="flex-1 h-1.5 rounded-full overflow-hidden" style={{ background:'var(--bg)' }}>
                <div className="h-full rounded-full transition-all duration-500"
                  style={{ width:`${pct}%`, background:`linear-gradient(90deg, ${d.color}, ${d.color}aa)` }}/>
              </div>
              <span className="font-sans text-xs font-semibold" style={{ color:d.color }}>{pct}%</span>
            </div>
            <ChecklistViewer items={hike.checklist} onToggle={toggleChecklistItem}/>
          </Section>
        )}

        <Section icon="📓" title="Notes & Journal de bord">
          {hike.notes
            ? <p className="font-sans text-sm leading-relaxed whitespace-pre-line" style={{ color:'var(--text-2)' }}>{hike.notes}</p>
            : <p className="font-sans text-sm italic" style={{ color:'var(--text-3)' }}>Aucune note pour cette randonnée.</p>
          }
        </Section>

        {/* Map placeholder */}
        <div className="rounded-2xl p-5 sm:p-6" style={{ background:'var(--surface)', border:'1px solid var(--border)' }}>
          <h2 className="font-serif text-lg mb-4" style={{ color:'var(--text)' }}>🗺 Carte du tracé</h2>
          <div className="h-40 rounded-xl flex flex-col items-center justify-center gap-2 border border-dashed"
            style={{ borderColor:'var(--border)' }}>
            <svg width="30" height="30" viewBox="0 0 24 24" fill="none" stroke="var(--text-4)" strokeWidth="1.5">
              <polygon points="3 6 9 3 15 6 21 3 21 18 15 21 9 18 3 21 3 6"/>
              <line x1="9" y1="3" x2="9" y2="18"/><line x1="15" y1="6" x2="15" y2="21"/>
            </svg>
            <p className="font-sans text-xs text-center" style={{ color:'var(--text-4)' }}>
              Intégration Leaflet à venir
            </p>
          </div>
        </div>
      </div>

      {confirmDelete && (
        <ConfirmDialog
          title="Supprimer cette randonnée ?"
          message={`"${hike.name}" sera définitivement supprimée.`}
          confirmLabel="Supprimer"
          onConfirm={() => { deleteHike(id); navigate('/') }}
          onCancel={() => setConfirmDelete(false)}
        />
      )}
    </div>
  )
}
