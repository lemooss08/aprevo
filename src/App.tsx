import React, { useState } from 'react';
import { AppProvider, useApp } from './context/AppContext';
import { Sidebar } from './components/Sidebar';
import { Header } from './components/Header';
import { MobileNav } from './components/MobileNav';
import { ToastContainer } from './components/ToastContainer';
import { StudyModal } from './components/StudyModal';
import { SyncModal } from './components/SyncModal';
import { DashboardView } from './views/DashboardView';
import { TimerView } from './views/TimerView';
import { StudyLogsView } from './views/StudyLogsView';
import { CalendarView } from './views/CalendarView';
import { SubjectsView } from './views/SubjectsView';
import { StatsView } from './views/StatsView';
import { GoalsView } from './views/GoalsView';
import { SettingsView } from './views/SettingsView';

const MainLayout: React.FC = () => {
  const { activeTab } = useApp();
  const [isSidebarCollapsed, setIsSidebarCollapsed] = useState<boolean>(false);
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState<boolean>(false);
  const [isCreateStudyModalOpen, setIsCreateStudyModalOpen] = useState<boolean>(false);

  return (
    <div className="min-h-screen flex bg-[#f8fafc] dark:bg-[#090a0f] text-slate-900 dark:text-slate-100 font-sans selection:bg-brand-500 selection:text-white pb-16 md:pb-0 transition-colors duration-200">
      {/* Collapsible / Responsive Sidebar */}
      <Sidebar
        isCollapsed={isSidebarCollapsed}
        setIsCollapsed={setIsSidebarCollapsed}
        isMobileOpen={isMobileMenuOpen}
        setIsMobileOpen={setIsMobileMenuOpen}
      />

      {/* Main Content Area */}
      <div className="flex-1 flex flex-col min-w-0">
        <Header
          onOpenMobileMenu={() => setIsMobileMenuOpen(true)}
          onOpenNewStudyModal={() => setIsCreateStudyModalOpen(true)}
        />

        <main className="flex-1 p-3.5 sm:p-6 lg:p-8 max-w-7xl w-full mx-auto">
          {activeTab === 'dashboard' && (
            <DashboardView onOpenNewStudy={() => setIsCreateStudyModalOpen(true)} />
          )}
          {activeTab === 'timer' && <TimerView />}
          {activeTab === 'studies' && (
            <StudyLogsView onOpenCreate={() => setIsCreateStudyModalOpen(true)} />
          )}
          {activeTab === 'calendar' && <CalendarView />}
          {activeTab === 'subjects' && <SubjectsView />}
          {activeTab === 'stats' && <StatsView />}
          {activeTab === 'goals' && <GoalsView />}
          {activeTab === 'settings' && <SettingsView />}
        </main>
      </div>

      {/* Mobile Bottom Navigation Bar */}
      <MobileNav onOpenMenu={() => setIsMobileMenuOpen(true)} />

      {/* Modais Globais */}
      <StudyModal
        isOpen={isCreateStudyModalOpen}
        onClose={() => setIsCreateStudyModalOpen(false)}
      />

      <SyncModal />

      {/* Notificações Toast Reativas */}
      <ToastContainer />
    </div>
  );
};

export function App() {
  return (
    <AppProvider>
      <MainLayout />
    </AppProvider>
  );
}

export default App;
