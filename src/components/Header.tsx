import React from 'react';
import { useApp } from '../context/AppContext';
import {
  Menu,
  Timer,
  Play,
  Pause,
  Sun,
  Moon,
  Plus,
  CheckCircle2,
} from 'lucide-react';
import { formatSecondsToHMS } from '../utils/formatters';

interface HeaderProps {
  onOpenMobileMenu: () => void;
  onOpenNewStudyModal: () => void;
}

export const Header: React.FC<HeaderProps> = ({
  onOpenMobileMenu,
  onOpenNewStudyModal,
}) => {
  const {
    activeTab,
    setActiveTab,
    activeTimer,
    timerSeconds,
    isTimerRunning,
    pauseTimer,
    resumeTimer,
    settings,
    updateSettings,
    subjects,
  } = useApp();

  const getPageInfo = () => {
    switch (activeTab) {
      case 'dashboard':
        return { title: 'Dashboard', desc: 'Visão geral da sua produtividade e métricas de foco' };
      case 'timer':
        return { title: 'Cronômetro de Foco', desc: 'Registre suas sessões de estudo em tempo real' };
      case 'studies':
        return { title: 'Meus Estudos', desc: 'Histórico completo, filtros e anotações dos conteúdos' };
      case 'calendar':
        return { title: 'Calendário de Estudos', desc: 'Acompanhamento diário e mapa de consistência mensal' };
      case 'subjects':
        return { title: 'Matérias & Disciplinas', desc: 'Organização, métricas dedicadas e paleta visual' };
      case 'stats':
        return { title: 'Estatísticas & Análise', desc: 'Evolução temporal, gráficos e mapa de constância' };
      case 'goals':
        return { title: 'Metas de Estudo', desc: 'Acompanhe suas metas diárias, semanais e conquistas' };
      case 'settings':
        return { title: 'Configurações', desc: 'Personalize seu perfil, temas e sincronização' };
      default:
        return { title: 'APREVO', desc: 'Plataforma de estudos' };
    }
  };

  const pageInfo = getPageInfo();
  const currentSubject = subjects.find((s) => s.id === activeTimer?.subjectId);

  const toggleTheme = () => {
    updateSettings({ theme: settings.theme === 'dark' ? 'light' : 'dark' });
  };

  return (
    <header className="sticky top-0 z-30 h-16 border-b border-[#383838] bg-[#1b1b1b]/90 backdrop-blur-md px-3 sm:px-6 flex items-center justify-between">
      {/* Left side: hamburger + title */}
      <div className="flex items-center gap-3">
        <button
          onClick={onOpenMobileMenu}
          className="md:hidden text-slate-400 hover:text-white p-2 rounded-xl hover:bg-[#2c2c2c] transition-colors"
          aria-label="Abrir menu"
        >
          <Menu className="w-5 h-5" />
        </button>

        <div>
          <h2 className="text-base sm:text-lg font-bold text-white tracking-tight flex items-center gap-2">
            {pageInfo.title}
          </h2>
          <p className="hidden sm:block text-xs text-slate-400 truncate max-w-xs md:max-w-md">
            {pageInfo.desc}
          </p>
        </div>
      </div>

      {/* Right side: Active timer + Actions */}
      <div className="flex items-center gap-1.5 sm:gap-3">
        {/* Active Timer Mini-Pill (visible outside timer tab) */}
        {activeTimer && activeTab !== 'timer' && (
          <div className="flex items-center gap-2 pl-3 pr-2 py-1.5 rounded-full bg-brand-500/15 border border-brand-500/35 text-white shadow-glow-sm">
            <button
              onClick={() => setActiveTab('timer')}
              className="flex items-center gap-1.5 text-xs font-mono text-brand-300 hover:text-white transition-colors"
            >
              <span className="w-2 h-2 rounded-full bg-emerald-400 animate-ping" />
              <Timer className="w-3.5 h-3.5 text-brand-400" />
              <span className="font-bold">{formatSecondsToHMS(timerSeconds)}</span>
              {currentSubject && (
                <span className="hidden lg:inline text-[11px] text-slate-400 max-w-[100px] truncate">
                  • {currentSubject.name}
                </span>
              )}
            </button>

            <button
              onClick={() => (isTimerRunning ? pauseTimer() : resumeTimer())}
              aria-label={isTimerRunning ? 'Pausar cronômetro' : 'Continuar cronômetro'}
              className="p-1 rounded-full hover:bg-brand-500/20 text-brand-300 hover:text-white transition-colors"
              title={isTimerRunning ? 'Pausar' : 'Continuar'}
            >
              {isTimerRunning ? <Pause className="w-3.5 h-3.5" /> : <Play className="w-3.5 h-3.5" />}
            </button>
          </div>
        )}

        {/* Quick New Study Button */}
        <button
          onClick={onOpenNewStudyModal}
          aria-label="Registrar novo estudo"
          className="flex items-center gap-1.5 px-3 py-1.5 min-h-[36px] rounded-xl bg-brand-600 hover:bg-brand-500 text-white text-xs font-medium shadow-sm transition-all hover:shadow-glow-sm active:scale-[0.98]"
        >
          <Plus className="w-4 h-4" />
          <span className="hidden sm:inline">Estudo</span>
        </button>

        {/* Theme Toggle */}
        <button
          onClick={toggleTheme}
          aria-label={settings.theme === 'dark' ? 'Mudar para tema claro' : 'Mudar para tema escuro'}
          className="p-2 min-h-[36px] min-w-[36px] flex items-center justify-center rounded-xl text-slate-400 hover:text-white hover:bg-[#2c2c2c] transition-colors"
          title={settings.theme === 'dark' ? 'Mudar para tema claro' : 'Mudar para tema escuro'}
        >
          {settings.theme === 'dark' ? <Sun className="w-4 h-4" /> : <Moon className="w-4 h-4" />}
        </button>
      </div>
    </header>
  );
};
