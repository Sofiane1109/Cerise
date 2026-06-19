import { Link, useLocation } from 'react-router-dom'

const MountainLogo = () => (
  <svg width="32" height="32" viewBox="0 0 64 64" className="flex-shrink-0">
    <defs>
      <linearGradient id="peak-g" x1="0" y1="0" x2="1" y2="1">
        <stop offset="0%" stopColor="#92be5e"/>
        <stop offset="100%" stopColor="#406a1e"/>
      </linearGradient>
    </defs>
    <polygon points="32,6 56,52 8,52" fill="url(#peak-g)"/>
    <polygon points="12,32 30,52 -6,52" fill="#1e350e" opacity="0.85"/>
    <polygon points="46,20 60,52 32,52" fill="#2e4f16" opacity="0.9"/>
    <circle cx="50" cy="14" r="5" fill="#d4a030" opacity="0.9"/>
    <polygon points="32,6 38,20 26,20" fill="white" opacity="0.12"/>
  </svg>
)

export default function Navbar() {
  const { pathname } = useLocation()
  const isHome = pathname === '/'

  return (
    <header className="sticky top-0 z-50 border-b border-forest-900/80"
      style={{ background: 'rgba(9,15,4,0.85)', backdropFilter: 'blur(16px)' }}>
      {/* Top accent line */}
      <div className="h-px bg-gradient-to-r from-transparent via-forest-600/60 to-transparent"/>

      <div className="max-w-6xl mx-auto px-4 sm:px-6 h-14 flex items-center justify-between">
        {/* Logo */}
        <Link to="/" className="flex items-center gap-2.5 group">
          <MountainLogo />
          <div className="flex flex-col leading-none">
            <span className="font-serif text-base text-stone-100 group-hover:text-forest-300 transition-colors tracking-wide">
              Trail Journal
            </span>
            <span className="text-[10px] text-stone-600 tracking-widest uppercase font-sans">
              Journal de randonnée
            </span>
          </div>
        </Link>

        {/* Nav actions */}
        <nav className="flex items-center gap-2">
          {!isHome && (
            <Link to="/" className="btn-ghost text-xs gap-1.5">
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <path d="M19 12H5M12 5l-7 7 7 7"/>
              </svg>
              <span className="hidden sm:inline">Accueil</span>
            </Link>
          )}
          <Link to="/hike/new" className="btn-primary text-xs py-2 px-4">
            <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
              <path d="M12 5v14M5 12h14"/>
            </svg>
            Nouvelle rando
          </Link>
        </nav>
      </div>
    </header>
  )
}
