import React from 'react';
import { useApp } from '../context/AppContext';
import {
  LayoutDashboard,
  Timer,
  BookOpen,
  Calendar,
  Menu,
} from 'lucide-react';

interface MobileNavProps {
  onOpenMenu: () => void;
}

export const MobileNav: React.FC<MobileNavProps> = ({ onOpenMenu }) => {
  const { activeTab, setActiveTab, isTimerRunning } = useApp();

  const items = [
    { id: 'dashboard', label: 'Início', icon: LayoutDashboard },
    { id: 'timer', label: 'Foco', icon: Timer, hasBadge: isTimerRunning },
    { id: 'studies', label: 'Estudos', icon: BookOpen },
    { id: 'calendar', label: 'Calendário', icon: Calendar },
  ];

  return (
    <nav className="md:hidden fixed bottom-0 left-0 right-0 z-40 bg-[#0c0e14]/95 backdrop-blur-lg border-t border-[#232836] px-2 py-1.5 flex items-center justify-around safe-bottom">
      {items.map((item) => {
        const Icon = item.icon;
        const isActive = activeTab === item.id;

        return (
          <button
            key={item.id}
            onClick={() => setActiveTab(item.id)}
            aria-label={item.label}
            className={`flex flex-col items-center justify-center flex-1 py-1 px-1 min-h-[44px] rounded-xl transition-all relative ${
              isActive ? 'text-brand-400 font-semibold' : 'text-slate-400 hover:text-slate-200'
            }`}
          >
            <div className="relative">
              <Icon className="w-5 h-5" />
              {item.hasBadge && (
                <span className="absolute -top-1 -right-1 w-2 h-2 rounded-full bg-emerald-400 animate-ping" />
              )}
            </div>
            <span className="text-[10px] mt-0.5 tracking-tight">{item.label}</span>
          </button>
        );
      })}

      {/* Menu / Mais */}
      <button
        onClick={onOpenMenu}
        aria-label="Abrir menu de navegação"
        className="flex flex-col items-center justify-center flex-1 py-1 px-1 min-h-[44px] rounded-xl text-slate-400 hover:text-slate-200 transition-all"
      >
        <Menu className="w-5 h-5" />
        <span className="text-[10px] mt-0.5 tracking-tight">Menu</span>
      </button>
    </nav>
  );
};
