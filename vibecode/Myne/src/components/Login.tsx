import { useState } from 'react';
import { supabase } from '../lib/supabase';
import { LogIn, UserPlus, Loader2 } from 'lucide-react';
import { INPUT, LABEL } from './ui';
import logo from '../img/Myne.png';

export default function Login() {
  const [mode, setMode]       = useState<'signin' | 'signup'>('signin');
  const [email, setEmail]     = useState('');
  const [password, setPass]   = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError]     = useState<string | null>(null);
  const [info, setInfo]       = useState<string | null>(null);

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setInfo(null);
    setLoading(true);

    try {
      if (mode === 'signin') {
        const { error } = await supabase.auth.signInWithPassword({ email, password });
        if (error) throw error;
      } else {
        const { error } = await supabase.auth.signUp({ email, password });
        if (error) throw error;
        setInfo('Compte créé ! Vérifie ton email pour confirmer, puis connecte-toi.');
        setMode('signin');
      }
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : 'Erreur inconnue');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gray-950 flex items-center justify-center p-4">
      <div className="w-full max-w-sm">
        {/* Logo / title */}
        <div className="text-center mb-8">
          <div className="w-14 h-14 mx-auto mb-4">
            <img src={logo} alt="Myne" className="w-full h-full object-contain rounded-xl" />
          </div>
          <h1 className="text-2xl font-bold text-white">Myne</h1>
          <p className="text-gray-500 text-sm mt-1">Ton espace personnel</p>
        </div>

        {/* Card */}
        <div className="bg-gray-900 border border-gray-800 rounded-2xl p-6 shadow-xl">
          <h2 className="text-base font-semibold text-white mb-5">
            {mode === 'signin' ? 'Se connecter' : 'Créer un compte'}
          </h2>

          {error && (
            <div className="mb-4 px-3 py-2.5 bg-red-950/50 border border-red-900/50 rounded-lg text-sm text-red-400">
              {error}
            </div>
          )}
          {info && (
            <div className="mb-4 px-3 py-2.5 bg-green-950/50 border border-green-900/50 rounded-lg text-sm text-green-400">
              {info}
            </div>
          )}

          <form onSubmit={submit} className="space-y-4">
            <div>
              <label className={LABEL}>Email</label>
              <input
                type="email"
                className={INPUT}
                placeholder="toi@exemple.com"
                value={email}
                onChange={e => setEmail(e.target.value)}
                required
                autoFocus
              />
            </div>
            <div>
              <label className={LABEL}>Mot de passe</label>
              <input
                type="password"
                className={INPUT}
                placeholder="••••••••"
                value={password}
                onChange={e => setPass(e.target.value)}
                required
                minLength={6}
              />
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full flex items-center justify-center gap-2 px-4 py-2.5 bg-indigo-600 hover:bg-indigo-700 disabled:opacity-50 text-white text-sm font-medium rounded-lg transition-colors mt-2"
            >
              {loading
                ? <Loader2 size={16} className="animate-spin" />
                : mode === 'signin'
                  ? <LogIn size={16} />
                  : <UserPlus size={16} />
              }
              {mode === 'signin' ? 'Se connecter' : 'Créer un compte'}
            </button>
          </form>

          <div className="mt-4 text-center">
            {mode === 'signin' ? (
              <p className="text-xs text-gray-500">
                Pas encore de compte ?{' '}
                <button onClick={() => { setMode('signup'); setError(null); setInfo(null); }} className="text-indigo-400 hover:text-indigo-300 transition-colors">
                  S'inscrire
                </button>
              </p>
            ) : (
              <p className="text-xs text-gray-500">
                Déjà un compte ?{' '}
                <button onClick={() => { setMode('signin'); setError(null); setInfo(null); }} className="text-indigo-400 hover:text-indigo-300 transition-colors">
                  Se connecter
                </button>
              </p>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
