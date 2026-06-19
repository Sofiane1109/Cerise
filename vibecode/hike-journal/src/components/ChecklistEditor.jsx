import { useState } from 'react'

function genId() {
  return 'cl-' + Date.now().toString(36) + Math.random().toString(36).slice(2)
}

export function ChecklistEditor({ items = [], onChange }) {
  const [draft, setDraft] = useState('')

  const add = () => {
    const label = draft.trim()
    if (!label) return
    onChange([...items, { id: genId(), label, checked: false }])
    setDraft('')
  }

  const remove = (id) => onChange(items.filter(i => i.id !== id))
  const updateLabel = (id, label) => onChange(items.map(i => i.id === id ? { ...i, label } : i))
  const handleKey = (e) => { if (e.key === 'Enter') { e.preventDefault(); add() } }

  return (
    <div className="space-y-2">
      <ul className="space-y-1.5">
        {items.map(item => (
          <li key={item.id}
            className="flex items-center gap-2.5 bg-forest-950/60 border border-forest-900/60 rounded-xl px-3 py-2.5 group">
            <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="#406a1e" strokeWidth="2" className="flex-shrink-0">
              <rect x="3" y="3" width="18" height="18" rx="3"/>
            </svg>
            <input type="text" value={item.label} onChange={e => updateLabel(item.id, e.target.value)}
              className="flex-1 bg-transparent text-sm text-stone-300 font-sans focus:outline-none"/>
            <button type="button" onClick={() => remove(item.id)}
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
          placeholder="Ajouter une vérification…" className="input text-sm py-2"/>
        <button type="button" onClick={add} disabled={!draft.trim()} className="btn-secondary text-sm py-2 px-3 flex-shrink-0">
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
            <path d="M12 5v14M5 12h14"/>
          </svg>
        </button>
      </div>
    </div>
  )
}

export function ChecklistViewer({ items = [], onToggle }) {
  return (
    <ul className="space-y-2">
      {items.map(item => (
        <li key={item.id} onClick={() => onToggle(item.id)}
          className={`flex items-center gap-3 px-3.5 py-3 rounded-xl cursor-pointer
                      transition-all duration-150 border select-none
                      ${item.checked
                        ? 'bg-forest-950/60 border-forest-800/40'
                        : 'bg-transparent border-forest-950 hover:border-forest-900 hover:bg-forest-950/30'
                      }`}>
          {/* Checkbox */}
          <div className={`w-5 h-5 rounded-md flex-shrink-0 flex items-center justify-center
                           border-2 transition-all duration-200
                           ${item.checked ? 'bg-forest-500 border-forest-500' : 'border-forest-800'}`}>
            {item.checked && (
              <svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="3">
                <path d="M20 6L9 17l-5-5"/>
              </svg>
            )}
          </div>
          <span className={`text-sm font-sans transition-all duration-150
                            ${item.checked ? 'line-through text-stone-600' : 'text-stone-300'}`}>
            {item.label}
          </span>
        </li>
      ))}
    </ul>
  )
}
