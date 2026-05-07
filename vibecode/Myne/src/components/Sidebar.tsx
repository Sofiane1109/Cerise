import type { ModuleId } from '../types';
import { LayoutDashboard, Calendar, Kanban, Mountain, Apple, Wallet, X } from 'lucide-react';
import logo from "../img/Myne.png";

const NAV: { id: ModuleId; label: string; Icon: React.ElementType }[] = [
  { id: 'dashboard', label: 'Dashboard', Icon: LayoutDashboard },
  { id: 'calendar', label: 'Calendar', Icon: Calendar },
  { id: 'tasks', label: 'Tasks', Icon: Kanban },
  { id: 'hike', label: 'Hike', Icon: Mountain },
  { id: 'nutrition', label: 'Nutrition', Icon: Apple },
  { id: 'budget', label: 'Budget', Icon: Wallet },
];

interface Props {
  active: ModuleId;
  onNavigate: (id: ModuleId) => void;
  isOpen: boolean;
  onClose: () => void;
}

export default function Sidebar({ active, onNavigate, isOpen, onClose }: Props) {
  return (
    <>
      {isOpen && (
        <div className="fixed inset-0 bg-black/60 z-20 md:hidden" onClick={onClose} />
      )}
      <aside
        className={`fixed md:static inset-y-0 left-0 z-30 w-56 flex flex-col bg-gray-900 border-r border-gray-800 transition-transform duration-300 ${isOpen ? 'translate-x-0' : '-translate-x-full md:translate-x-0'
          }`}
      >
        {/* Logo */}
        <div className="flex items-center justify-between px-5 h-16 border-b border-gray-800 shrink-0">
          <div className="flex items-center gap-2.5">
            <div className="w-12 h-12 flex items-center justify-center">
              <img
                src={logo}
                alt="Myne logo"
                className="w-full h-full object-contain rounded-xl"
              />
            </div>
            <span className="font-bold text-white text-lg tracking-tight">Myne</span>
          </div>
          <button onClick={onClose} className="md:hidden text-gray-400 hover:text-white transition-colors">
            <X size={18} />
          </button>
        </div>

        {/* Nav */}
        <nav className="flex-1 p-3 space-y-0.5 overflow-y-auto">
          {NAV.map(({ id, label, Icon }) => (
            <button
              key={id}
              onClick={() => onNavigate(id)}
              className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-colors ${active === id
                ? 'bg-indigo-600 text-white shadow-lg shadow-indigo-900/40'
                : 'text-gray-400 hover:text-white hover:bg-gray-800'
                }`}
            >
              <Icon size={18} />
              {label}
            </button>
          ))}
        </nav>

        <div className="px-5 py-4 border-t border-gray-800">
          <p className="text-xs text-gray-700">Personal Dashboard v1.0</p>
        </div>
      </aside>
    </>
  );
}
