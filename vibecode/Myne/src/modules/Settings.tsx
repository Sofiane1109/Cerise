import { useState, useRef } from 'react';
import type { UserSettings } from '../types';
import { getItem, setItem } from '../utils/storage';
import { Camera, Save, Palette, User } from 'lucide-react';
import { INPUT, LABEL, BTN_PRIMARY } from '../components/ui';

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

  return (
    <div className="p-6 max-w-xl mx-auto space-y-8">
      <h1 className="text-2xl font-bold text-white">Paramètres</h1>

      {/* Profile */}
      <section className="bg-gray-900 border border-gray-800 rounded-xl p-6 space-y-5">
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
      <section className="bg-gray-900 border border-gray-800 rounded-xl p-6 space-y-4">
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
