import { useState } from 'react';
import { Menu } from 'lucide-react';
import type { ModuleId } from './types';
import Sidebar from './components/Sidebar';
import Dashboard from './modules/Dashboard';
import Calendar from './modules/Calendar';
import Tasks from './modules/Tasks';
import Hobbies from './modules/Hobbies';
import Nutrition from './modules/Nutrition';
import Wellbeing from './modules/Wellbeing';
import Budget from './modules/Budget';

export default function App() {
  const [active, setActive] = useState<ModuleId>('dashboard');
  const [sidebarOpen, setSidebarOpen] = useState(false);

  const navigate = (id: ModuleId) => {
    setActive(id);
    setSidebarOpen(false);
  };

  return (
    <div className="flex h-screen bg-gray-950 text-gray-100 overflow-hidden">
      <Sidebar active={active} onNavigate={navigate} isOpen={sidebarOpen} onClose={() => setSidebarOpen(false)} />

      <div className="flex-1 flex flex-col min-w-0 overflow-hidden">
        {/* Mobile top bar */}
        <div className="md:hidden flex items-center gap-3 px-4 py-3 bg-gray-900 border-b border-gray-800 shrink-0">
          <button onClick={() => setSidebarOpen(true)} className="text-gray-400 hover:text-white transition-colors">
            <Menu size={22} />
          </button>
          <span className="font-bold text-white">Myne</span>
        </div>

        <main className="flex-1 overflow-y-auto">
          {active === 'dashboard'  && <Dashboard onNavigate={navigate} />}
          {active === 'calendar'   && <Calendar />}
          {active === 'tasks'      && <Tasks />}
          {active === 'hobbies'    && <Hobbies />}
          {active === 'nutrition'  && <Nutrition />}
          {active === 'wellbeing'  && <Wellbeing />}
          {active === 'budget'     && <Budget />}
        </main>
      </div>
    </div>
  );
}
