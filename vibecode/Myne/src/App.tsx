import { useState, useEffect } from 'react';
import { Menu, LogOut, Maximize2, Minimize2 } from 'lucide-react';
import type { Session } from '@supabase/supabase-js';
import type { ModuleId, UserSettings } from './types';
import { getItem } from './utils/storage';
import { supabase } from './lib/supabase';
import { syncOnLogin, initSync } from './lib/sync';
import Sidebar from './components/Sidebar';
import Login from './components/Login';
import Dashboard from './modules/Dashboard';
import Calendar from './modules/Calendar';
import Tasks from './modules/Tasks';
import Hike from './modules/Hike';
import Nutrition from './modules/Nutrition';
import Budget from './modules/Budget';
import Settings from './modules/Settings';
import SoundLog from './modules/SoundLog';
import Study from './modules/Study';
import Subscriptions from './modules/Subscriptions';
import Hub from './modules/Hub';
import { handleCallback } from './lib/spotify';

const DEFAULT_SETTINGS: UserSettings = { name: '', accentColor: '#6366f1' };

type AppState = 'checking' | 'login' | 'syncing' | 'ready';

const MODULE_LABELS: Record<ModuleId, string> = {
  dashboard:     'Dashboard',
  calendar:      'Calendrier',
  tasks:         'Tâches',
  hike:          'Hike',
  nutrition:     'Nutrition',
  budget:        'Budget',
  subscriptions: 'Abonnements',
  study:         'Study',
  hub:           'Hub',
  soundlog:      'SoundLog',
  settings:      'Paramètres',
};

export default function App() {
  const [appState, setAppState]       = useState<AppState>('checking');
  const [session, setSession]         = useState<Session | null>(null);
  const [active, setActive]           = useState<ModuleId>('dashboard');
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [focusMode, setFocusMode]     = useState(false);
  const [settings, setSettings]       = useState<UserSettings>(() =>
    getItem<UserSettings>('myne:settings', DEFAULT_SETTINGS)
  );
  const [pendingTaskId, setPendingTaskId] = useState<string | null>(null);

  useEffect(() => {
    document.documentElement.style.setProperty('--accent', settings.accentColor);
  }, [settings.accentColor]);

  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const code   = params.get('code');
    if (window.location.pathname === '/callback' && code) {
      handleCallback(code)
        .then(() => { window.history.replaceState({}, '', '/'); setActive('soundlog'); })
        .catch(err => console.error('Spotify callback error:', err));
    }
  }, []);

  useEffect(() => {
    const { data: { subscription } } = supabase.auth.onAuthStateChange((event, session) => {
      setSession(session);
      if (session) {
        if (event === 'INITIAL_SESSION' || event === 'SIGNED_IN') handleSignedIn();
      } else {
        setAppState('login');
      }
    });
    return () => subscription.unsubscribe();
  }, []);

  // ESC exits focus mode
  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && focusMode && !e.defaultPrevented) setFocusMode(false);
    };
    window.addEventListener('keydown', handler);
    return () => window.removeEventListener('keydown', handler);
  }, [focusMode]);

  async function handleSignedIn() {
    setAppState('syncing');
    initSync();
    await syncOnLogin();
    setAppState('ready');
  }

  const logout = async () => { await supabase.auth.signOut(); setAppState('login'); };

  const navigate = (id: ModuleId) => { setActive(id); setSidebarOpen(false); };

  const navigateToTask = (taskId: string) => { setPendingTaskId(taskId); navigate('tasks'); };

  if (appState === 'checking' || appState === 'syncing') {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center gap-3" style={{ background: '#09090f' }}>
        <div className="w-8 h-8 rounded-full border-2 border-transparent animate-spin" style={{ borderTopColor: 'var(--accent)', borderRightColor: 'var(--accent)40' }} />
        <p className="text-sm text-gray-500">
          {appState === 'syncing' ? 'Synchronisation…' : 'Chargement…'}
        </p>
      </div>
    );
  }

  if (appState === 'login') return <Login />;

  return (
    <div className="flex h-screen text-gray-100 overflow-hidden" style={{ background: '#09090f' }}>

      {/* Sidebar — conditionally rendered (focus mode hides it on desktop) */}
      {(!focusMode || sidebarOpen) && (
        <Sidebar
          active={active}
          onNavigate={navigate}
          isOpen={sidebarOpen}
          onClose={() => setSidebarOpen(false)}
          settings={settings}
        />
      )}

      <div className="flex-1 flex flex-col min-w-0 overflow-hidden">

        {/* Top bar */}
        <div
          className="flex items-center gap-3 px-5 shrink-0"
          style={{
            height: '52px',
            background: '#0f0f17',
            borderBottom: '1px solid rgba(255,255,255,0.06)',
          }}
        >
          {/* Mobile hamburger */}
          <button
            onClick={() => setSidebarOpen(true)}
            className="md:hidden text-gray-500 hover:text-white transition-colors"
          >
            <Menu size={20} />
          </button>

          {/* Module name — desktop */}
          <span className="hidden md:block text-sm font-semibold text-white tracking-tight">
            {MODULE_LABELS[active]}
          </span>

          {/* Brand — mobile */}
          <span className="font-bold text-white text-sm md:hidden">Myne</span>

          <div className="flex-1" />

          {/* Focus mode toggle — desktop only */}
          <button
            onClick={() => setFocusMode(f => !f)}
            title={focusMode ? 'Quitter le focus (Échap)' : 'Mode focus'}
            className={`hidden md:flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium transition-all ${
              focusMode
                ? 'text-white'
                : 'text-gray-500 hover:text-gray-200 hover:bg-white/5'
            }`}
            style={focusMode ? { backgroundColor: 'var(--accent)' } : {}}
          >
            {focusMode ? <Minimize2 size={12} /> : <Maximize2 size={12} />}
            {focusMode ? 'Quitter focus' : 'Mode focus'}
          </button>

          <div className="hidden md:block h-4 w-px mx-1" style={{ background: 'rgba(255,255,255,0.07)' }} />

          {/* Email */}
          <span className="text-xs text-gray-600 hidden lg:block">{session?.user.email}</span>

          {/* Logout */}
          <button
            onClick={logout}
            title="Se déconnecter"
            className="flex items-center gap-1.5 text-xs text-gray-500 hover:text-white transition-colors px-2 py-1.5 rounded-lg hover:bg-white/5"
          >
            <LogOut size={14} />
            <span className="hidden md:inline">Déconnexion</span>
          </button>
        </div>

        {/* Content */}
        <main className="flex-1 overflow-y-auto">
          {active === 'dashboard'     && <Dashboard onNavigate={navigate} />}
          {active === 'calendar'      && <Calendar onNavigate={navigate} onNavigateToTask={navigateToTask} />}
          {active === 'tasks'         && <Tasks pendingTaskId={pendingTaskId} onClearPending={() => setPendingTaskId(null)} />}
          {active === 'hike'          && <Hike />}
          {active === 'nutrition'     && <Nutrition />}
          {active === 'budget'        && <Budget />}
          {active === 'soundlog'      && <SoundLog />}
          {active === 'study'         && <Study />}
          {active === 'subscriptions' && <Subscriptions />}
          {active === 'hub'           && <Hub />}
          {active === 'settings'      && <Settings onSettingsChange={s => setSettings(s)} />}
        </main>
      </div>
    </div>
  );
}
