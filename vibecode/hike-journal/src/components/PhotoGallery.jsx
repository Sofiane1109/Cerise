import { useState } from 'react'

function LightboxModal({ src, onClose }) {
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 animate-fade-in"
      style={{ background: 'rgba(0,0,0,0.95)', backdropFilter: 'blur(4px)' }}
      onClick={onClose}>
      <button className="absolute top-4 right-4 text-white/50 hover:text-white btn-ghost" onClick={onClose}>
        <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
          <path d="M18 6L6 18M6 6l12 12"/>
        </svg>
      </button>
      <img src={src} alt="" className="max-w-full max-h-full object-contain rounded-xl animate-scale-in"
        onClick={e => e.stopPropagation()}/>
    </div>
  )
}

export function PhotoGallery({ photos = [] }) {
  const [lightbox, setLightbox] = useState(null)

  if (photos.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center gap-2
                      border border-dashed border-forest-800/40 rounded-xl py-10">
        <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="#2e4f16" strokeWidth="1.5">
          <rect x="3" y="3" width="18" height="18" rx="2"/>
          <circle cx="8.5" cy="8.5" r="1.5"/>
          <polyline points="21 15 16 10 5 21"/>
        </svg>
        <p className="text-stone-600 text-sm font-sans">Aucune photo ajoutée</p>
      </div>
    )
  }

  return (
    <>
      <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
        {photos.map((url, i) => (
          <button key={i} onClick={() => setLightbox(url)}
            className="aspect-video rounded-xl overflow-hidden border border-forest-900/60 hover:border-forest-700/60 transition-all group">
            <img src={url} alt={`Photo ${i+1}`}
              className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
              onError={e => { e.target.style.display='none' }}/>
          </button>
        ))}
      </div>
      {lightbox && <LightboxModal src={lightbox} onClose={() => setLightbox(null)}/>}
    </>
  )
}

export function PhotoEditor({ photos = [], onChange }) {
  const [draft, setDraft] = useState('')

  const add = () => {
    const url = draft.trim()
    if (!url) return
    onChange([...photos, url])
    setDraft('')
  }

  const remove = (i) => onChange(photos.filter((_, idx) => idx !== i))

  return (
    <div className="space-y-3">
      {photos.length > 0 && (
        <div className="grid grid-cols-3 gap-2">
          {photos.map((url, i) => (
            <div key={i} className="relative aspect-video rounded-xl overflow-hidden border border-forest-900/60 group">
              <img src={url} alt="" className="w-full h-full object-cover"
                onError={e => e.target.parentElement.classList.add('opacity-40')}/>
              <button type="button" onClick={() => remove(i)}
                className="absolute top-1.5 right-1.5 bg-black/60 text-white/80 hover:text-white
                           rounded-full p-1 opacity-0 group-hover:opacity-100 transition-all">
                <svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
                  <path d="M18 6L6 18M6 6l12 12"/>
                </svg>
              </button>
            </div>
          ))}
        </div>
      )}
      <div className="flex gap-2">
        <input type="url" value={draft} onChange={e => setDraft(e.target.value)}
          onKeyDown={e => e.key === 'Enter' && (e.preventDefault(), add())}
          placeholder="https://… (URL d'une photo)" className="input text-sm py-2"/>
        <button type="button" onClick={add} disabled={!draft.trim()} className="btn-secondary text-sm py-2 px-3 flex-shrink-0">
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
            <path d="M12 5v14M5 12h14"/>
          </svg>
        </button>
      </div>
      <p className="text-stone-600 text-xs font-sans">URL d'une photo hébergée (Imgur, iCloud, Google Photos…)</p>
    </div>
  )
}
