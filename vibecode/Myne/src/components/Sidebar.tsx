import { useState, useRef, useLayoutEffect } from 'react';
import type { ModuleId, UserSettings } from '../types';
import {
  LayoutDashboard, Calendar, Kanban, Mountain, Apple, Wallet,
  Music2, Settings, X, BookOpen, CreditCard, Link2, ChevronLeft, ChevronRight, NotebookPen,
} from 'lucide-react';
import logo from "../img/Myne.png";

const NAV: { id: ModuleId; label: string; Icon: React.ElementType }[] = [
  { id: 'dashboard',     label: 'Dashboard',   Icon: LayoutDashboard },
  { id: 'calendar',      label: 'Calendar',    Icon: Calendar },
  { id: 'tasks',         label: 'Tasks',       Icon: Kanban },
  { id: 'hike',          label: 'Hike',        Icon: Mountain },
  { id: 'nutrition',     label: 'Nutrition',   Icon: Apple },
  { id: 'budget',        label: 'Budget',      Icon: Wallet },
  { id: 'subscriptions', label: 'Abonnements', Icon: CreditCard },
  { id: 'study',         label: 'Study',       Icon: BookOpen },
  { id: 'hub',           label: 'Hub',         Icon: Link2 },
  { id: 'soundlog',      label: 'SoundLog',    Icon: Music2 },
  { id: 'notes',         label: 'Notes',       Icon: NotebookPen },
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
  const [collapsed, setCollapsed] = useState(() => {
    try { return localStorage.getItem('myne:sidebar:collapsed') === 'true'; } catch { return false; }
  });

  const toggleCollapse = () => {
    const next = !collapsed;
    setCollapsed(next);
    try { localStorage.setItem('myne:sidebar:collapsed', String(next)); } catch {}
  };

  const w = collapsed ? 'w-[68px]' : 'w-56';

  const navRef   = useRef<HTMLElement>(null);
  const itemRefs = useRef<(HTMLButtonElement | null)[]>([]);
  const [pill, setPill] = useState({ top: 0, height: 40, show: false });

  useLayoutEffect(() => {
    const idx = NAV.findIndex(n => n.id === active);
    if (idx < 0 || !navRef.current || !itemRefs.current[idx]) {
      setPill(p => ({ ...p, show: false }));
      return;
    }
    const nav = navRef.current;
    const el  = itemRefs.current[idx]!;
    const navRect = nav.getBoundingClientRect();
    const elRect  = el.getBoundingClientRect();
    setPill({ top: elRect.top - navRect.top + nav.scrollTop, height: elRect.height, show: true });
  }, [active, collapsed]);

  return (
    <>
      {isOpen && (
        <div className="fixed inset-0 bg-black/60 z-20 md:hidden" onClick={onClose} />
      )}
      <aside
        className={`relative fixed md:static inset-y-0 left-0 z-30 flex flex-col bg-gray-900 border-r border-gray-800 transition-all duration-300 ${w} ${
          isOpen ? 'translate-x-0' : '-translate-x-full md:translate-x-0'
        }`}
      >
        {/* Collapse handle — right edge, vertically centered, desktop only */}
        <button
          onClick={toggleCollapse}
          title={collapsed ? 'Agrandir' : 'Réduire'}
          className="hidden md:flex absolute -right-3 top-1/2 -translate-y-1/2 z-40 items-center justify-center w-6 h-6 rounded-full bg-gray-800 border border-gray-700 text-gray-500 hover:text-white hover:bg-gray-700 transition-colors"
        >
          {collapsed ? <ChevronRight size={12} /> : <ChevronLeft size={12} />}
        </button>
        {/* Logo */}
        <div className={`flex items-center h-16 border-b border-gray-800 shrink-0 ${collapsed ? 'justify-center px-0' : 'justify-between px-4'}`}>
          {collapsed ? (
            <div className="w-9 h-9 flex items-center justify-center">
              <img src={logo} alt="Myne" className="w-full h-full object-contain rounded-lg" />
            </div>
          ) : (
            <>
              <div className="flex items-center gap-2.5">
                <div className="w-10 h-10 flex items-center justify-center shrink-0">
                  <img src={logo} alt="Myne logo" className="w-full h-full object-contain rounded-xl" />
                </div>
                <span className="font-bold text-white text-lg tracking-tight">Myne</span>
              </div>
              <button onClick={onClose} className="md:hidden text-gray-400 hover:text-white transition-colors">
                <X size={18} />
              </button>
            </>
          )}
        </div>

        {/* Nav */}
        <nav ref={navRef} className={`relative flex-1 py-3 space-y-0.5 overflow-y-auto overflow-x-hidden ${collapsed ? 'px-2' : 'px-3'}`}>
          {/* Sliding active pill */}
          {pill.show && (
            <div
              aria-hidden
              style={{
                position: 'absolute',
                left: collapsed ? 8 : 12,
                right: collapsed ? 8 : 12,
                top: pill.top,
                height: pill.height,
                backgroundColor: accent,
                borderRadius: 8,
                boxShadow: `0 0 12px ${accent}60`,
                transition: 'top 0.22s cubic-bezier(0.4,0,0.2,1), left 0.3s, right 0.3s',
                pointerEvents: 'none',
                zIndex: 0,
              }}
            />
          )}
          {NAV.map(({ id, label, Icon }, idx) => {
            const isActive = active === id;
            return (
              <button
                key={id}
                ref={el => { itemRefs.current[idx] = el; }}
                onClick={() => onNavigate(id)}
                title={collapsed ? label : undefined}
                className={`relative z-10 w-full flex items-center rounded-lg text-sm font-medium transition-colors ${
                  collapsed ? 'justify-center p-2.5' : 'gap-3 px-3 py-2.5'
                } ${
                  isActive ? 'text-white' : 'text-gray-400 hover:text-white hover:bg-gray-800'
                }`}
              >
                <Icon size={18} className="shrink-0" />
                {!collapsed && <span className="truncate">{label}</span>}
              </button>
            );
          })}
        </nav>

        {/* Settings + collapse toggle */}
        <div className={`border-t border-gray-800 ${collapsed ? 'p-2 space-y-1' : 'p-3 space-y-1'}`}>
          {/* Settings button */}
          <button
            onClick={() => onNavigate('settings')}
            title={collapsed ? 'Settings' : undefined}
            className={`w-full flex items-center rounded-lg text-sm font-medium transition-all ${
              collapsed ? 'justify-center p-2.5' : 'gap-3 px-3 py-2.5'
            } ${
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
            {!collapsed && <span className="truncate">Settings</span>}
          </button>

          {!collapsed && (
            <p className="text-center text-[10px] text-gray-700 pt-1 pb-0.5 tracking-wide select-none">
              Myne v2 · Cerise
            </p>
          )}
        </div>
      </aside>
    </>
  );
}
