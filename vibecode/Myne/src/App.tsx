import { useState, useEffect } from 'react';
import { Menu, Loader2, LogOut } from 'lucide-react';
import type { Session } from '@supabase/supabase-js';
import type { ModuleId } from './types';
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

type AppState = 'checking' | 'login' | 'syncing' | 'ready';

export default function App() {
  const [appState, setAppState] = useState<AppState>('checking');
  const [session, setSession]   = useState<Session | null>(null);
  const [active, setActive]     = useState<ModuleId>('dashboard');
  const [sidebarOpen, setSidebarOpen] = useState(false);

  useEffect(() => {
    // onAuthStateChange fires INITIAL_SESSION on load — no need for a separate getSession() call
    const { data: { subscription } } = supabase.auth.onAuthStateChange((event, session) => {
      setSession(session);
      if (session) {
        // Only run the heavy sync on initial load or explicit sign-in, not on every token refresh
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

  if (appState === 'checking' || appState === 'syncing') {
    return (
      <div className="min-h-screen bg-gray-950 flex flex-col items-center justify-center gap-3">
        <Loader2 size={32} className="animate-spin text-indigo-500" />
        <p className="text-sm text-gray-500">
          {appState === 'syncing' ? 'Synchronisation…' : 'Chargement…'}
        </p>
      </div>
    );
  }

  if (appState === 'login') return <Login />;

  return (
    <div className="flex h-screen bg-gray-950 text-gray-100 overflow-hidden">
      <Sidebar active={active} onNavigate={navigate} isOpen={sidebarOpen} onClose={() => setSidebarOpen(false)} />

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
          {active === 'dashboard' && <Dashboard onNavigate={navigate} />}
          {active === 'calendar'  && <Calendar />}
          {active === 'tasks'     && <Tasks />}
          {active === 'hike'      && <Hike />}
          {active === 'nutrition' && <Nutrition />}
          {active === 'budget'    && <Budget />}
        </main>
      </div>
    </div>
  );
}
