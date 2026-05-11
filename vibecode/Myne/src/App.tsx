import { useState, useEffect } from 'react';
import { Menu, Loader2, LogOut } from 'lucide-react';
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

export default function App() {
  const [appState, setAppState]     = useState<AppState>('checking');
  const [session, setSession]       = useState<Session | null>(null);
  const [active, setActive]         = useState<ModuleId>('dashboard');
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [settings, setSettings]     = useState<UserSettings>(() =>
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
        .then(() => {
          window.history.replaceState({}, '', '/');
          setActive('soundlog');
        })
        .catch(err => console.error('Spotify callback error:', err));
    }
  }, []);

  useEffect(() => {
    const { data: { subscription } } = supabase.auth.onAuthStateChange((event, session) => {
      setSession(session);
      if (session) {
        if (event === 'INITIAL_SESSION' || event === 'SIGNED_IN') {
          handleSignedIn();
        }
      } else {
        setAppState('login');
      }
    });
    return () => subscription.unsubscribe();
  }, []);

  async function handleSignedIn() {
    setAppState('syncing');
    initSync();
    await syncOnLogin();
    setAppState('ready');
  }

  const logout = async () => {
    await supabase.auth.signOut();
    setAppState('login');
  };

  const navigate = (id: ModuleId) => {
    setActive(id);
    setSidebarOpen(false);
  };

  const navigateToTask = (taskId: string) => {
    setPendingTaskId(taskId);
    navigate('tasks');
  };

  if (appState === 'checking' || appState === 'syncing') {
    return (
      <div className="min-h-screen bg-gray-950 flex flex-col items-center justify-center gap-3">
        <Loader2 size={32} className="animate-spin" style={{ color: 'var(--accent)' }} />
        <p className="text-sm text-gray-500">
          {appState === 'syncing' ? 'Synchronisation…' : 'Chargement…'}
        </p>
      </div>
    );
  }

  if (appState === 'login') return <Login />;

  return (
    <div className="flex h-screen bg-gray-950 text-gray-100 overflow-hidden">
      <Sidebar
        active={active}
        onNavigate={navigate}
        isOpen={sidebarOpen}
        onClose={() => setSidebarOpen(false)}
        settings={settings}
      />

      <div className="flex-1 flex flex-col min-w-0 overflow-hidden">
        <div className="flex items-center gap-3 px-4 py-3 bg-gray-900 border-b border-gray-800 shrink-0">
          <button onClick={() => setSidebarOpen(true)} className="md:hidden text-gray-400 hover:text-white transition-colors">
            <Menu size={22} />
          </button>
          <span className="font-bold text-white md:hidden">Myne</span>
          <div className="flex-1" />
          <span className="text-xs text-gray-600 hidden md:block">{session?.user.email}</span>
          <button
            onClick={logout}
            title="Se déconnecter"
            className="flex items-center gap-1.5 text-xs text-gray-500 hover:text-white transition-colors px-2 py-1.5 rounded-lg hover:bg-gray-800"
          >
            <LogOut size={14} />
            <span className="hidden md:inline">Déconnexion</span>
          </button>
        </div>

        <main className="flex-1 overflow-y-auto">
          {active === 'dashboard'     && <Dashboard onNavigate={navigate} />}
          {active === 'calendar'      && (
            <Calendar
              onNavigate={navigate}
              onNavigateToTask={navigateToTask}
            />
          )}
          {active === 'tasks'         && (
            <Tasks
              pendingTaskId={pendingTaskId}
              onClearPending={() => setPendingTaskId(null)}
            />
          )}
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
