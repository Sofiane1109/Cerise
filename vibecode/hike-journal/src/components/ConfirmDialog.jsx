export default function ConfirmDialog({ title, message, confirmLabel = 'Confirmer', onConfirm, onCancel }) {
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 animate-fade-in"
      style={{ background: 'rgba(9,15,4,0.8)', backdropFilter: 'blur(8px)' }}>
      <div className="card max-w-sm w-full p-6 space-y-4 animate-scale-in">
        <h3 className="font-serif text-xl text-stone-100">{title}</h3>
        {message && <p className="text-stone-400 text-sm font-sans leading-relaxed">{message}</p>}
        <div className="flex gap-3 justify-end pt-1">
          <button onClick={onCancel} className="btn-secondary text-sm">Annuler</button>
          <button onClick={onConfirm} className="btn-danger text-sm">{confirmLabel}</button>
        </div>
      </div>
    </div>
  )
}
