import { useState } from 'react'

export default function ListEditor({ items = [], onChange, placeholder = 'Ajouter un élément…' }) {
  const [draft, setDraft] = useState('')

  const add = () => {
    const trimmed = draft.trim()
    if (!trimmed) return
    onChange([...items, trimmed])
    setDraft('')
  }

  const remove = (index) => onChange(items.filter((_, i) => i !== index))
  const handleKey = (e) => { if (e.key === 'Enter') { e.preventDefault(); add() } }

  return (
    <div className="space-y-2">
      <ul className="space-y-1.5">
        {items.map((item, i) => (
          <li key={i}
            className="flex items-center gap-2.5 bg-forest-950/60 border border-forest-900/60 rounded-xl px-3 py-2.5 group">
            <span className="w-1.5 h-1.5 rounded-full bg-forest-700 flex-shrink-0"/>
            <span className="flex-1 text-sm text-stone-300 font-sans">{item}</span>
            <button type="button" onClick={() => remove(i)}
              className="opacity-0 group-hover:opacity-100 text-stone-700 hover:text-red-400 transition-all flex-shrink-0">
              <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <path d="M18 6L6 18M6 6l12 12"/>
              </svg>
            </button>
          </li>
        ))}
      </ul>
      <div className="flex gap-2">
        <input type="text" value={draft} onChange={e => setDraft(e.target.value)} onKeyDown={handleKey}
          placeholder={placeholder} className="input text-sm py-2"/>
        <button type="button" onClick={add} disabled={!draft.trim()} className="btn-secondary text-sm py-2 px-3 flex-shrink-0">
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
            <path d="M12 5v14M5 12h14"/>
          </svg>
        </button>
      </div>
    </div>
  )
}
