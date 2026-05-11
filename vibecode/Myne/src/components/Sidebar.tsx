import type { ModuleId, UserSettings } from '../types';
import {
  LayoutDashboard, Calendar, Kanban, Mountain, Apple, Wallet,
  Music2, Settings, X, BookOpen, CreditCard, Link2,
} from 'lucide-react';
import logo from "../img/Myne.png";

const NAV: { id: ModuleId; label: string; Icon: React.ElementType }[] = [
  { id: 'dashboard',     label: 'Dashboard',     Icon: LayoutDashboard },
  { id: 'calendar',      label: 'Calendar',      Icon: Calendar },
  { id: 'tasks',         label: 'Tasks',         Icon: Kanban },
  { id: 'hike',          label: 'Hike',          Icon: Mountain },
  { id: 'nutrition',     label: 'Nutrition',     Icon: Apple },
  { id: 'budget',        label: 'Budget',        Icon: Wallet },
  { id: 'subscriptions', label: 'Abonnements',   Icon: CreditCard },
  { id: 'study',         label: 'Study',         Icon: BookOpen },
  { id: 'hub',           label: 'Hub',           Icon: Link2 },
  { id: 'soundlog',      label: 'SoundLog',      Icon: Music2 },
];

interface Props {
  active: ModuleId;
  onNavigate: (id: ModuleId) => void;
  isOpen: boolean;
  onClose: () => void;
  settings: UserSettings;
}

export default function Sidebar({ active, onNavigate, isOpen, onClose, settings }: Props) {
  const accent = settings.accentColor;

  return (
    <>
      {isOpen && (
        <div className="fixed inset-0 bg-black/60 z-20 md:hidden" onClick={onClose} />
      )}
      <aside
        className={`fixed md:static inset-y-0 left-0 z-30 w-56 flex flex-col bg-gray-900 border-r border-gray-800 transition-transform duration-300 ${
          isOpen ? 'translate-x-0' : '-translate-x-full md:translate-x-0'
        }`}
      >
        {/* Logo */}
        <div className="flex items-center justify-between px-5 h-16 border-b border-gray-800 shrink-0">
          <div className="flex items-center gap-2.5">
            <div className="w-12 h-12 flex items-center justify-center">
              <img src={logo} alt="Myne logo" className="w-full h-full object-contain rounded-xl" />
            </div>
            <span className="font-bold text-white text-lg tracking-tight">Myne</span>
          </div>
          <button onClick={onClose} className="md:hidden text-gray-400 hover:text-white transition-colors">
            <X size={18} />
          </button>
        </div>

        {/* Nav */}
        <nav className="flex-1 p-3 space-y-0.5 overflow-y-auto">
          {NAV.map(({ id, label, Icon }) => {
            const isActive = active === id;
            return (
              <button
                key={id}
                onClick={() => onNavigate(id)}
                className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-colors ${
                  isActive ? 'text-white shadow-lg' : 'text-gray-400 hover:text-white hover:bg-gray-800'
                }`}
                style={isActive ? { backgroundColor: accent } : {}}
              >
                <Icon size={18} />
                {label}
              </button>
            );
          })}
        </nav>

        {/* Settings / user */}
        <div className="border-t border-gray-800 p-3">
          <button
            onClick={() => onNavigate('settings')}
            className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-colors ${
              active === 'settings' ? 'text-white' : 'text-gray-400 hover:text-white hover:bg-gray-800'
            }`}
            style={active === 'settings' ? { backgroundColor: accent } : {}}
          >
            <div className="w-[18px] h-[18px] rounded-full overflow-hidden shrink-0 flex items-center justify-center bg-gray-700">
              {settings.avatar
                ? <img src={settings.avatar} alt="" className="w-full h-full object-cover" />
                : <Settings size={12} className="text-gray-400" />
              }
            </div>
            <span className="truncate">{settings.name || 'Paramètres'}</span>
          </button>
        </div>
      </aside>
    </>
  );
}
