import { useState, useEffect } from 'react'
import { useParams, useNavigate, Link } from 'react-router-dom'
import { useHikes } from '../context/HikesContext'
import ListEditor from '../components/ListEditor'
import { ChecklistEditor } from '../components/ChecklistEditor'
import { PhotoEditor } from '../components/PhotoGallery'
import { DIFFICULTIES, DEFAULT_CHECKLIST } from '../utils/hikeUtils'

function FormSection({ title, icon, hint, children }) {
  return (
    <div className="card p-5 sm:p-6">
      <div className="mb-5 pb-4 border-b border-forest-900/60 flex items-start gap-3">
        <span className="text-2xl mt-0.5">{icon}</span>
        <div>
          <h2 className="font-serif text-lg text-stone-200 leading-none mb-0.5">{title}</h2>
          {hint && <p className="text-stone-600 text-xs font-sans mt-1">{hint}</p>}
        </div>
      </div>
      <div className="space-y-4">{children}</div>
    </div>
  )
}

function Field({ label, required, error, children }) {
  return (
    <div>
      <label className="label">
        {label}{required && <span className="text-forest-500 ml-0.5">*</span>}
      </label>
      {children}
      {error && <p className="text-red-400 text-xs mt-1 font-sans">{error}</p>}
    </div>
  )
}

const emptyForm = {
  name: '', date: '', location: '', duration: '',
  distance: '', elevation: '', difficulty: 'moderate',
  description: '', coverImage: '',
  photos: [], equipment: [], food: [],
  checklist: DEFAULT_CHECKLIST.map(i => ({ ...i })),
  notes: '', rating: 0,
}

export default function HikeFormPage() {
  const { id } = useParams()
  const navigate = useNavigate()
  const { getHike, addHike, updateHike } = useHikes()
  const isEdit = Boolean(id)

  const [form, setForm] = useState(emptyForm)
  const [errors, setErrors] = useState({})

  useEffect(() => {
    if (isEdit) {
      const hike = getHike(id)
      if (hike) setForm({ ...emptyForm, ...hike })
    }
  }, [id, isEdit]) // eslint-disable-line react-hooks/exhaustive-deps

  const set = (field, value) => {
    setForm(f => ({ ...f, [field]: value }))
    if (errors[field]) setErrors(e => ({ ...e, [field]: undefined }))
  }

  const validate = () => {
    const e = {}
    if (!form.name.trim()) e.name = 'Le nom est obligatoire.'
    setErrors(e)
    return Object.keys(e).length === 0
  }

  const handleSubmit = (e) => {
    e.preventDefault()
    if (!validate()) return
    const data = {
      ...form,
      distance:  Number(form.distance)  || 0,
      elevation: Number(form.elevation) || 0,
      rating:    Number(form.rating)    || 0,
    }
    if (isEdit) {
      updateHike(id, data)
      navigate(`/hike/${id}`)
    } else {
      const newId = addHike(data)
      navigate(`/hike/${newId}`)
    }
  }

  return (
    <div className="max-w-3xl mx-auto px-4 sm:px-6 py-6 pb-16 animate-fade-up">

      {/* Header */}
      <div className="mb-8">
        <Link to={isEdit ? `/hike/${id}` : '/'} className="btn-ghost text-xs mb-5 inline-flex -ml-2">
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <path d="M19 12H5M12 5l-7 7 7 7"/>
          </svg>
          {isEdit ? 'Retour à la randonnée' : 'Retour'}
        </Link>
        <p className="eyebrow mb-2">{isEdit ? 'Modification' : 'Nouvelle randonnée'}</p>
        <h1 className="font-serif text-3xl sm:text-4xl text-stone-100">
          {isEdit ? 'Modifier la fiche' : 'Créer une fiche'}
        </h1>
      </div>

      <form onSubmit={handleSubmit} className="space-y-4">

        {/* ── Infos générales ── */}
        <FormSection title="Informations générales" icon="🏔" hint="Les données essentielles de ta sortie.">
          <Field label="Nom de la randonnée" required error={errors.name}>
            <input type="text" value={form.name} onChange={e => set('name', e.target.value)}
              placeholder="Ex : Tour du Canigou"
              className={`input ${errors.name ? 'border-red-800 focus:ring-red-700/50' : ''}`}/>
          </Field>

          <div className="grid sm:grid-cols-2 gap-4">
            <Field label="Date">
              <input type="date" value={form.date} onChange={e => set('date', e.target.value)} className="input"/>
            </Field>
            <Field label="Localisation">
              <input type="text" value={form.location} onChange={e => set('location', e.target.value)}
                placeholder="Ex : Pyrénées-Orientales" className="input"/>
            </Field>
          </div>

          <div className="grid grid-cols-3 gap-3">
            <Field label="Distance (km)">
              <input type="number" min="0" step="0.1" value={form.distance}
                onChange={e => set('distance', e.target.value)} placeholder="0" className="input"/>
            </Field>
            <Field label="Dénivelé (m)">
              <input type="number" min="0" step="10" value={form.elevation}
                onChange={e => set('elevation', e.target.value)} placeholder="0" className="input"/>
            </Field>
            <Field label="Durée">
              <input type="text" value={form.duration} onChange={e => set('duration', e.target.value)}
                placeholder="5h30" className="input"/>
            </Field>
          </div>

          <div className="grid sm:grid-cols-2 gap-4">
            <Field label="Difficulté">
              <select value={form.difficulty} onChange={e => set('difficulty', e.target.value)} className="select">
                {DIFFICULTIES.map(d => <option key={d.value} value={d.value}>{d.label}</option>)}
              </select>
            </Field>
            <Field label="Note personnelle">
              <div className="flex items-center gap-1 mt-0.5">
                {[1,2,3,4,5].map(n => (
                  <button key={n} type="button"
                    onClick={() => set('rating', form.rating === n ? 0 : n)}
                    className="transition-all duration-150 hover:scale-110 active:scale-95">
                    <svg width="30" height="30" viewBox="0 0 24 24"
                      fill={n <= form.rating ? '#d4a030' : 'none'}
                      stroke={n <= form.rating ? '#d4a030' : '#38301e'} strokeWidth="1.5">
                      <path d="M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z"/>
                    </svg>
                  </button>
                ))}
                {form.rating > 0 && (
                  <button type="button" onClick={() => set('rating', 0)}
                    className="text-stone-600 hover:text-stone-400 text-xs font-sans ml-1">effacer</button>
                )}
              </div>
            </Field>
          </div>
        </FormSection>

        {/* ── Description ── */}
        <FormSection title="Description" icon="📖">
          <textarea value={form.description} onChange={e => set('description', e.target.value)}
            rows={5} placeholder="Parcours, ambiance, points remarquables…" className="textarea"/>
        </FormSection>

        {/* ── Photos ── */}
        <FormSection title="Photos" icon="📷" hint="Colle des URLs de photos hébergées en ligne.">
          <Field label="Image de couverture (URL)">
            <input type="url" value={form.coverImage} onChange={e => set('coverImage', e.target.value)}
              placeholder="https://…" className="input"/>
            {form.coverImage && (
              <img src={form.coverImage} alt="Aperçu couverture"
                className="mt-2 w-full h-28 object-cover rounded-lg border border-forest-800"
                onError={e => e.target.style.display='none'}/>
            )}
          </Field>
          <Field label="Galerie photos">
            <PhotoEditor photos={form.photos} onChange={val => set('photos', val)}/>
          </Field>
        </FormSection>

        {/* ── Matériel ── */}
        <FormSection title="Matériel emporté" icon="🎒">
          <ListEditor items={form.equipment} onChange={val => set('equipment', val)}
            placeholder="Ex : Tente MSR, bâtons, frontale…"/>
        </FormSection>

        {/* ── Nourriture ── */}
        <FormSection title="Nourriture prévue" icon="🍫">
          <ListEditor items={form.food} onChange={val => set('food', val)}
            placeholder="Ex : Lyophilisés, barres énergétiques…"/>
        </FormSection>

        {/* ── Check-list ── */}
        <FormSection title="Check-list avant départ" icon="✅"
          hint="Personnalise ta liste. Les cases seront cochables sur la fiche.">
          <ChecklistEditor items={form.checklist} onChange={val => set('checklist', val)}/>
        </FormSection>

        {/* ── Notes ── */}
        <FormSection title="Notes & Journal de bord" icon="📓">
          <textarea value={form.notes} onChange={e => set('notes', e.target.value)}
            rows={6} placeholder="Impressions, conseils, météo, anecdotes…" className="textarea"/>
        </FormSection>

        {/* ── Submit ── */}
        <div className="flex gap-3 pt-2">
          <button type="submit" className="btn-primary flex-1 justify-center py-3 text-sm">
            <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
              <path d="M19 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h11l5 5v11a2 2 0 0 1-2 2z"/>
              <polyline points="17 21 17 13 7 13 7 21"/>
              <polyline points="7 3 7 8 15 8"/>
            </svg>
            {isEdit ? 'Enregistrer les modifications' : 'Créer la randonnée'}
          </button>
          <Link to={isEdit ? `/hike/${id}` : '/'} className="btn-secondary py-3 px-5 text-sm">
            Annuler
          </Link>
        </div>
      </form>
    </div>
  )
}
