import { useState, useRef } from 'react';
import type { UserSettings } from '../types';
import { getItem, setItem } from '../utils/storage';
import { Camera, Save, Palette, User, Lock, Settings as SettingsIcon } from 'lucide-react';
import { INPUT, LABEL, BTN_PRIMARY } from '../components/ui';

async function sha256(text: string): Promise<string> {
  const buf = await crypto.subtle.digest('SHA-256', new TextEncoder().encode(text));
  return Array.from(new Uint8Array(buf)).map(b => b.toString(16).padStart(2, '0')).join('');
}

const DEFAULT_SETTINGS: UserSettings = { name: '', avatar: undefined, accentColor: '#6366f1' };

const ACCENT_PRESETS = [
  { name: 'Indigo',  color: '#6366f1' },
  { name: 'Violet',  color: '#8b5cf6' },
  { name: 'Blauw',   color: '#3b82f6' },
  { name: 'Groen',   color: '#22c55e' },
  { name: 'Rose',    color: '#f43f5e' },
  { name: 'Oranje',  color: '#f97316' },
  { name: 'Amber',   color: '#f59e0b' },
  { name: 'Cyaan',   color: '#06b6d4' },
];

function applyAccent(color: string) {
  // darken by ~15% for hover state
  document.documentElement.style.setProperty('--accent', color);
}

export default function Settings({ onSettingsChange }: { onSettingsChange: (s: UserSettings) => void }) {
  const [settings, setSettings] = useState<UserSettings>(() =>
    getItem<UserSettings>('myne:settings', DEFAULT_SETTINGS)
  );
  const [saved, setSaved] = useState(false);
  const fileRef = useRef<HTMLInputElement>(null);
  const [newPin, setNewPin]       = useState('');
  const [confirmPin, setConfirmPin] = useState('');
  const [pinMsg, setPinMsg]       = useState('');

  const update = (patch: Partial<UserSettings>) =>
    setSettings(s => {
      const next = { ...s, ...patch };
      if ('accentColor' in patch && patch.accentColor) {
        document.documentElement.style.setProperty('--accent', patch.accentColor);
        const r = parseInt(patch.accentColor.slice(1, 3), 16);
        const g = parseInt(patch.accentColor.slice(3, 5), 16);
        const b = parseInt(patch.accentColor.slice(5, 7), 16);
        document.documentElement.style.setProperty('--accent-faint', `rgba(${r},${g},${b},0.1)`);
      }
      return next;
    });

  const handleAvatar = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = ev => update({ avatar: ev.target?.result as string });
    reader.readAsDataURL(file);
  };

  const save = () => {
    setItem('myne:settings', settings);
    applyAccent(settings.accentColor);
    onSettingsChange(settings);
    setSaved(true);
    setTimeout(() => setSaved(false), 2000);
  };

  const handleSetPin = async () => {
    if (!/^\d{4}$/.test(newPin)) { setPinMsg('Le PIN doit être 4 chiffres'); return; }
    if (newPin !== confirmPin)   { setPinMsg('Les PIN ne correspondent pas'); return; }
    const hash = await sha256(newPin);
    const next = { ...settings, budgetPin: hash };
    setSettings(next);
    setItem('myne:settings', next);
    onSettingsChange(next);
    setNewPin(''); setConfirmPin('');
    setPinMsg(settings.budgetPin ? 'PIN modifié !' : 'PIN défini !');
    setTimeout(() => setPinMsg(''), 3000);
  };

  const handleRemovePin = () => {
    const { budgetPin: _removed, ...rest } = settings;
    const next = rest as UserSettings;
    setSettings(next);
    setItem('myne:settings', next);
    onSettingsChange(next);
    setPinMsg('PIN supprimé');
    setTimeout(() => setPinMsg(''), 3000);
  };

  const GLASS: React.CSSProperties = {
    background: 'rgba(255,255,255,0.03)',
    border: '1px solid rgba(255,255,255,0.07)',
    backdropFilter: 'blur(16px)',
    WebkitBackdropFilter: 'blur(16px)',
    borderRadius: 16,
  };

  return (
    <div className="p-6 max-w-xl mx-auto space-y-6">
      <div className="flex items-center gap-3">
        <div className="w-10 h-10 rounded-xl flex items-center justify-center shrink-0"
          style={{ background: 'rgba(99,102,241,0.12)', border: '1px solid rgba(99,102,241,0.25)' }}>
          <SettingsIcon size={18} style={{ color: 'var(--accent)' }} />
        </div>
        <h1 className="text-xl font-bold text-white">Paramètres</h1>
      </div>

      {/* Profile */}
      <section className="p-6 space-y-5" style={GLASS}>
        <h2 className="text-sm font-semibold text-gray-400 uppercase tracking-wider flex items-center gap-2">
          <User size={15} /> Profil
        </h2>

        {/* Avatar */}
        <div className="flex items-center gap-5">
          <div className="relative shrink-0">
            <div
              className="w-20 h-20 rounded-full overflow-hidden border-2 border-gray-700 flex items-center justify-center bg-gray-800 cursor-pointer hover:opacity-80 transition-opacity"
              onClick={() => fileRef.current?.click()}
            >
              {settings.avatar
                ? <img src={settings.avatar} alt="avatar" className="w-full h-full object-cover" />
                : <span className="text-2xl font-bold text-gray-400">
                    {settings.name ? settings.name[0].toUpperCase() : '?'}
                  </span>
              }
            </div>
            <button
              onClick={() => fileRef.current?.click()}
              className="absolute bottom-0 right-0 w-7 h-7 rounded-full flex items-center justify-center text-white shadow-lg"
              style={{ backgroundColor: settings.accentColor }}
            >
              <Camera size={13} />
            </button>
            <input ref={fileRef} type="file" accept="image/*" className="hidden" onChange={handleAvatar} />
          </div>
          <div className="flex-1">
            <p className="text-xs text-gray-500 mb-1">Klik op de foto om te wijzigen</p>
            {settings.avatar && (
              <button
                onClick={() => update({ avatar: undefined })}
                className="text-xs text-red-400 hover:text-red-300 transition-colors"
              >
                Foto verwijderen
              </button>
            )}
          </div>
        </div>

        {/* Name */}
        <div>
          <label className={LABEL}>Jouw naam</label>
          <input
            className={INPUT}
            placeholder="bv. Sofiane"
            value={settings.name}
            onChange={e => update({ name: e.target.value })}
          />
          <p className="text-xs text-gray-600 mt-1">Wordt gebruikt in de begroeting op het dashboard</p>
        </div>
      </section>

      {/* Accent colour */}
      <section className="p-6 space-y-4" style={GLASS}>
        <h2 className="text-sm font-semibold text-gray-400 uppercase tracking-wider flex items-center gap-2">
          <Palette size={15} /> Accentkleur
        </h2>
        <div className="flex flex-wrap gap-3">
          {ACCENT_PRESETS.map(p => (
            <button
              key={p.color}
              title={p.name}
              onClick={() => update({ accentColor: p.color })}
              className="w-9 h-9 rounded-full transition-transform hover:scale-110"
              style={{
                backgroundColor: p.color,
                outline: settings.accentColor === p.color ? `3px solid ${p.color}` : 'none',
                outlineOffset: '3px',
              }}
            />
          ))}
        </div>
        <div className="flex items-center gap-3 pt-1">
          <label className="text-xs text-gray-400">Aangepaste kleur</label>
          <input
            type="color"
            value={settings.accentColor}
            onChange={e => update({ accentColor: e.target.value })}
            className="w-9 h-9 rounded-lg cursor-pointer border border-gray-700 bg-gray-800 p-0.5"
          />
          <span className="text-xs text-gray-600 font-mono">{settings.accentColor}</span>
        </div>
      </section>

      {/* PIN Budget */}
      <section className="p-6 space-y-4" style={GLASS}>
        <h2 className="text-sm font-semibold text-gray-400 uppercase tracking-wider flex items-center gap-2">
          <Lock size={15} /> PIN Budget
        </h2>
        <p className="text-sm text-gray-500">
          {settings.budgetPin
            ? 'Un PIN est actif — changez-le ou supprimez-le.'
            : 'Protégez le module Budget avec un code à 4 chiffres.'}
        </p>
        <div className="flex flex-wrap gap-2 items-center">
          <input
            type="password"
            inputMode="numeric"
            maxLength={4}
            placeholder="Nouveau PIN"
            value={newPin}
            onChange={e => setNewPin(e.target.value.replace(/\D/g, ''))}
            className={INPUT}
            style={{ maxWidth: 130 }}
          />
          <input
            type="password"
            inputMode="numeric"
            maxLength={4}
            placeholder="Confirmer"
            value={confirmPin}
            onChange={e => setConfirmPin(e.target.value.replace(/\D/g, ''))}
            className={INPUT}
            style={{ maxWidth: 130 }}
          />
          <button onClick={handleSetPin} className={BTN_PRIMARY}>
            {settings.budgetPin ? 'Changer' : 'Définir'}
          </button>
        </div>
        {settings.budgetPin && (
          <button onClick={handleRemovePin} className="text-xs text-red-400 hover:text-red-300 transition-colors">
            Supprimer le PIN
          </button>
        )}
        {pinMsg && (
          <p className={`text-sm ${pinMsg.includes('!') ? 'text-green-400' : 'text-red-400'}`}>{pinMsg}</p>
        )}
      </section>

      {/* Save */}
      <div className="flex items-center gap-3">
        <button onClick={save} className={BTN_PRIMARY + ' flex items-center gap-2'}>
          <Save size={15} />
          Opslaan
        </button>
        {saved && <span className="text-sm text-green-400">Opgeslagen!</span>}
      </div>
    </div>
  );
}
