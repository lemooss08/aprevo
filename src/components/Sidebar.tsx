import React from 'react';
import { useApp } from '../context/AppContext';
import {
  LayoutDashboard,
  Timer,
  BookOpen,
  RotateCcw,
  Calendar,
  FolderKanban,
  BarChart3,
  Target,
  Settings,
  ChevronLeft,
  ChevronRight,
  Flame,
  Cloud,
  X,
} from 'lucide-react';

interface SidebarProps {
  isCollapsed: boolean;
  setIsCollapsed: (val: boolean) => void;
  isMobileOpen: boolean;
  setIsMobileOpen: (val: boolean) => void;
}

export const Sidebar: React.FC<SidebarProps> = ({
  isCollapsed,
  setIsCollapsed,
  isMobileOpen,
  setIsMobileOpen,
}) => {
  const {
    activeTab,
    setActiveTab,
    isTimerRunning,
    reviews,
    syncKey,
    syncStatus,
    setIsSyncModalOpen,
  } = useApp();

  const todayStr = new Date().toISOString().slice(0, 10);
  const pendingReviewsCount = reviews.filter(
    (r) => r.status === 'pending' && r.nextReviewDate <= todayStr
  ).length;

  const navItems = [
    { id: 'dashboard', label: 'Dashboard', icon: LayoutDashboard },
    { id: 'timer', label: 'Cronômetro', icon: Timer, hasLiveBadge: isTimerRunning },
    { id: 'studies', label: 'Meus Estudos', icon: BookOpen },
    { id: 'reviews', label: 'Revisões', icon: RotateCcw, countBadge: pendingReviewsCount },
    { id: 'calendar', label: 'Calendário', icon: Calendar },
    { id: 'subjects', label: 'Matérias', icon: FolderKanban },
    { id: 'stats', label: 'Estatísticas', icon: BarChart3 },
    { id: 'goals', label: 'Metas', icon: Target },
    { id: 'settings', label: 'Configurações', icon: Settings },
  ];

  const handleSelect = (id: string) => {
    setActiveTab(id);
    setIsMobileOpen(false);
  };

  return (
    <>
      {/* Mobile Backdrop */}
      {isMobileOpen && (
        <div
          className="fixed inset-0 bg-black/75 backdrop-blur-sm z-40 md:hidden transition-opacity"
          onClick={() => setIsMobileOpen(false)}
        />
      )}

      {/* Main Sidebar Container */}
      <aside
        className={`fixed md:sticky top-0 left-0 z-40 h-screen transition-all duration-300 ease-in-out border-r border-[#232836] bg-[#0c0e14] flex flex-col justify-between ${
          isMobileOpen ? 'translate-x-0 w-64' : '-translate-x-full md:translate-x-0'
        } ${isCollapsed ? 'md:w-20' : 'md:w-64'}`}
      >
        {/* Header / Logo APREVO */}
        <div>
          <div className="h-16 flex items-center justify-between px-4 border-b border-[#232836]">
            <div
              onClick={() => handleSelect('dashboard')}
              className="flex items-center gap-3 cursor-pointer select-none group"
            >
              {/* APREVO Stylized Logo Mark */}
              <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-brand-700 via-brand-600 to-violet-400 flex items-center justify-center text-white shadow-glow-sm group-hover:shadow-glow transition-all">
                <svg className="w-6 h-6" viewBox="0 0 24 24" fill="none">
                  <path d="M4 20L12 4L15 4L20 20H16.5L14.8 15H9.2L7.5 20H4Z" fill="white" />
                  <path d="M10.2 12H13.8L12 6.8L10.2 12Z" fill="#1e1b4b" />
                </svg>
              </div>

              {(!isCollapsed || isMobileOpen) && (
                <div>
                  <h1 className="font-extrabold text-base tracking-tight text-white flex items-center gap-1.5">
                    APREVO
                    <span className="text-[9px] font-bold uppercase tracking-wider px-1.5 py-0.2 rounded-full bg-brand-500/15 text-brand-300 border border-brand-500/25">
                      v2.0
                    </span>
                  </h1>
                  <p className="text-[10px] text-slate-400 tracking-tight">Evolução & Foco</p>
                </div>
              )}
            </div>

            {/* Mobile close button */}
            <button
              onClick={() => setIsMobileOpen(false)}
              className="md:hidden text-slate-400 hover:text-white p-1 rounded-lg"
            >
              <X className="w-5 h-5" />
            </button>
          </div>

          {/* Navigation Links */}
          <nav className="p-3 space-y-1">
            {navItems.map((item) => {
              const Icon = item.icon;
              const isActive = activeTab === item.id;

              return (
                <button
                  key={item.id}
                  onClick={() => handleSelect(item.id)}
                  title={isCollapsed ? item.label : undefined}
                  className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-xl font-medium text-xs sm:text-sm transition-all duration-150 relative ${
                    isActive
                      ? 'bg-brand-600/15 text-brand-300 border border-brand-500/30 shadow-sm'
                      : 'text-slate-400 hover:text-slate-100 hover:bg-[#161922] border border-transparent'
                  } ${isCollapsed && !isMobileOpen ? 'justify-center px-0' : ''}`}
                >
                  <div className="relative">
                    <Icon className={`w-4 h-4 sm:w-5 sm:h-5 ${isActive ? 'text-brand-400' : 'text-slate-400'}`} />
                    {item.hasLiveBadge && (
                      <span className="absolute -top-1 -right-1 w-2.5 h-2.5 bg-brand-500 rounded-full animate-ping" />
                    )}
                    {item.hasLiveBadge && (
                      <span className="absolute -top-1 -right-1 w-2.5 h-2.5 bg-brand-500 rounded-full" />
                    )}
                  </div>

                  {(!isCollapsed || isMobileOpen) && (
                    <span className="flex-1 text-left tracking-tight truncate">{item.label}</span>
                  )}

                  {/* Review pending count badge */}
                  {(!isCollapsed || isMobileOpen) && item.countBadge && item.countBadge > 0 && (
                    <span className="text-[10px] font-bold px-1.5 py-0.2 rounded-full bg-amber-500/20 text-amber-300 border border-amber-500/30">
                      {item.countBadge}
                    </span>
                  )}

                  {(!isCollapsed || isMobileOpen) && item.hasLiveBadge && (
                    <span className="text-[9px] uppercase font-bold tracking-wider px-1.5 py-0.5 rounded-full bg-brand-500/20 text-brand-300 border border-brand-500/30 flex items-center gap-1">
                      <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
                      Ativo
                    </span>
                  )}
                </button>
              );
            })}
          </nav>
        </div>

        {/* Footer Area: Sync status button & Desktop collapse toggle */}
        <div className="p-3 border-t border-[#232836] space-y-2">
          {(!isCollapsed || isMobileOpen) && (
            <button
              onClick={() => setIsSyncModalOpen(true)}
              className="w-full p-2.5 rounded-xl bg-[#141722] border border-[#232836] hover:border-brand-500/40 text-left flex items-center gap-3 transition-all"
            >
              <div className="w-8 h-8 rounded-lg bg-brand-500/10 text-brand-400 flex items-center justify-center shrink-0">
                <Cloud className="w-4 h-4" />
              </div>
              <div className="min-w-0 flex-1">
                <p className="text-xs font-semibold text-slate-200 truncate">
                  {syncKey ? 'Nuvem Pareada' : 'Sincronizar Celular'}
                </p>
                <p className="text-[10px] text-slate-400 truncate">
                  {syncKey ? syncKey : 'Sem conta necessária'}
                </p>
              </div>
            </button>
          )}

          {/* Desktop collapse toggle */}
          <button
            onClick={() => setIsCollapsed(!isCollapsed)}
            className="hidden md:flex w-full items-center justify-center gap-2 p-2 rounded-xl text-slate-400 hover:text-white hover:bg-[#161922] transition-colors text-xs font-medium"
          >
            {isCollapsed ? (
              <ChevronRight className="w-4 h-4" />
            ) : (
              <>
                <ChevronLeft className="w-4 h-4" />
                <span>Recolher menu</span>
              </>
            )}
          </button>
        </div>
      </aside>
    </>
  );
};
