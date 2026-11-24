import React, { createContext, useContext, useState, useEffect, useCallback, useRef } from 'react';
import {
  Subject,
  StudySession,
  UserSettings,
  ActiveTimerState,
  ToastMessage,
  SyncStatus,
} from '../types';
import { storageService, DEFAULT_SETTINGS } from '../services/storage';
import { syncService, generatePairingCode, getSyncEndpoint, isPairingCode, mergeSyncData } from '../services/syncService';
import { playStartChime, playCompletionChime } from '../utils/audio';

interface AppContextType {
  // Navigation
  activeTab: string;
  setActiveTab: (tab: string) => void;

  // Data
  subjects: Subject[];
  sessions: StudySession[];
  settings: UserSettings;

  // Subject actions
  addSubject: (name: string, color: string, description?: string) => Subject;
  updateSubject: (id: string, name: string, color: string, description?: string) => void;
  deleteSubject: (id: string) => void;

  // Session actions
  addSession: (session: Omit<StudySession, 'id'>) => StudySession;
  updateSession: (id: string, session: Partial<StudySession>) => void;
  deleteSession: (id: string) => void;

  // Settings
  updateSettings: (newSettings: Partial<UserSettings>) => void;
  resetAllData: () => void;
  exportDataCSV: () => void;
  exportDataJSON: () => void;

  // Timer
  activeTimer: ActiveTimerState | null;
  timerSeconds: number;
  isTimerRunning: boolean;
  startTimer: (subjectId: string, topic: string, notes?: string) => boolean;
  pauseTimer: () => void;
  resumeTimer: () => void;
  finishTimer: () => StudySession | null;
  discardTimer: () => void;

  // Sync (Cross-Device without account)
  syncKey: string | null;
  syncStatus: SyncStatus;
  lastSyncTime: Date | null;
  isSyncModalOpen: boolean;
  setIsSyncModalOpen: (val: boolean) => void;
  setupDeviceSyncKey: () => Promise<void>;
  connectExistingSyncKey: (key: string) => Promise<boolean>;
  disconnectDeviceSync: () => void;
  forceSyncNow: () => Promise<void>;

  // Toasts
  toasts: ToastMessage[];
  addToast: (title: string, message?: string, type?: 'success' | 'error' | 'info') => void;
  removeToast: (id: string) => void;
}

const AppContext = createContext<AppContextType | null>(null);

export const AppProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [activeTab, setActiveTab] = useState<string>('dashboard');
  const [subjects, setSubjects] = useState<Subject[]>(() => storageService.getSubjects());
  const [sessions, setSessions] = useState<StudySession[]>(() => storageService.getSessions());
  const [settings, setSettings] = useState<UserSettings>(() => storageService.getSettings());

  // Timer states
  const [activeTimer, setActiveTimer] = useState<ActiveTimerState | null>(() => storageService.getActiveTimer());
  const [timerSeconds, setTimerSeconds] = useState<number>(() => {
    const saved = storageService.getActiveTimer();
    if (!saved) return 0;
    if (saved.isRunning && saved.lastResumedAt) {
      const added = Math.floor((Date.now() - new Date(saved.lastResumedAt).getTime()) / 1000);
      return saved.elapsedSeconds + Math.max(0, added);
    }
    return saved.elapsedSeconds;
  });
  const [isTimerRunning, setIsTimerRunning] = useState<boolean>(() => {
    const saved = storageService.getActiveTimer();
    return saved ? saved.isRunning : false;
  });

  // Sync states
  const [syncKey, setSyncKey] = useState<string | null>(() => {
    const saved = storageService.getSyncKey();
    return saved && isPairingCode(saved) ? saved : null;
  });
  const [syncStatus, setSyncStatus] = useState<SyncStatus>('idle');
  const [lastSyncTime, setLastSyncTime] = useState<Date | null>(null);
  const [isSyncModalOpen, setIsSyncModalOpen] = useState<boolean>(false);

  // Toasts
  const [toasts, setToasts] = useState<ToastMessage[]>([]);

  const addToast = useCallback((title: string, message?: string, type: 'success' | 'error' | 'info' = 'success') => {
    const id = Math.random().toString(36).slice(2, 9);
    setToasts((prev) => [...prev, { id, title, message, type }]);
    setTimeout(() => {
      setToasts((prev) => prev.filter((t) => t.id !== id));
    }, 4000);
  }, []);

  const removeToast = useCallback((id: string) => {
    setToasts((prev) => prev.filter((t) => t.id !== id));
  }, []);

  // Theme synchronization with document element
  useEffect(() => {
    const root = document.documentElement;
    if (settings.theme === 'dark') {
      root.classList.add('dark');
      root.classList.remove('light');
    } else {
      root.classList.remove('dark');
      root.classList.add('light');
    }
  }, [settings.theme]);

  // Timer tick interval effect
  const timerRef = useRef<number | null>(null);

  useEffect(() => {
    if (isTimerRunning && activeTimer) {
      timerRef.current = window.setInterval(() => {
        const lastResume = activeTimer.lastResumedAt ? new Date(activeTimer.lastResumedAt).getTime() : Date.now();
        const added = Math.floor((Date.now() - lastResume) / 1000);
        const currentTotal = activeTimer.elapsedSeconds + Math.max(0, added);
        setTimerSeconds(currentTotal);
      }, 1000);
    } else {
      if (timerRef.current) {
        clearInterval(timerRef.current);
        timerRef.current = null;
      }
    }

    return () => {
      if (timerRef.current) {
        clearInterval(timerRef.current);
      }
    };
  }, [isTimerRunning, activeTimer]);

  const syncRequest = useRef<AbortController | null>(null);
  const scheduledSync = useRef<number | undefined>(undefined);

  const exchange = useCallback(async (key: string, mode: 'create' | 'join' | 'sync') => {
    if (syncRequest.current) return false;
    if (!navigator.onLine) {
      setSyncStatus('offline');
      return false;
    }
    const request = new AbortController();
    syncRequest.current = request;
    setSyncStatus('syncing');

    try {
      const data = await syncService.exchange(key, () => storageService.getSyncData(), mode, request.signal);
      if (request.signal.aborted) return false;
      const merged = mergeSyncData(storageService.getSyncData(), data);
      if (merged.hasChanges) {
        storageService.saveSubjects(merged.subjects);
        storageService.saveSessions(merged.sessions);
        storageService.saveSettings(merged.settings);
        storageService.saveDeletedIds(merged.deletedIds ?? []);
        setSubjects(merged.subjects);
        setSessions(merged.sessions);
        setSettings(merged.settings);
      }
      storageService.saveSyncKey(key);
      setSyncKey(key);
      setLastSyncTime(new Date());
      setSyncStatus('synced');
      return true;
    } catch {
      if (!request.signal.aborted) setSyncStatus('error');
      return false;
    } finally {
      if (syncRequest.current === request) syncRequest.current = null;
    }
  }, []);

  const triggerCloudSync = useCallback(async () => {
    const key = storageService.getSyncKey();
    if (key && isPairingCode(key)) await exchange(key, 'sync');
  }, [exchange]);

  const scheduleCloudPush = () => {
    if (!syncKey && !syncRequest.current) return;
    window.clearTimeout(scheduledSync.current);
    const flush = () => {
      if (syncRequest.current) {
        scheduledSync.current = window.setTimeout(flush, 1200);
      } else {
        void triggerCloudSync();
      }
    };
    scheduledSync.current = window.setTimeout(flush, 1200);
  };

  useEffect(() => {
    const syncWhenVisible = () => {
      if (document.visibilityState === 'visible' && navigator.onLine) void triggerCloudSync();
    };
    const handleOffline = () => setSyncStatus('offline');
    const interval = window.setInterval(syncWhenVisible, 25000);
    document.addEventListener('visibilitychange', syncWhenVisible);
    window.addEventListener('online', triggerCloudSync);
    window.addEventListener('offline', handleOffline);

    return () => {
      window.clearInterval(interval);
      window.clearTimeout(scheduledSync.current);
      syncRequest.current?.abort();
      syncRequest.current = null;
      document.removeEventListener('visibilitychange', syncWhenVisible);
      window.removeEventListener('online', triggerCloudSync);
      window.removeEventListener('offline', handleOffline);
    };
  }, [triggerCloudSync]);

  useEffect(() => {
    let active = true;
    queueMicrotask(() => {
      if (!active) return;
      const url = new URL(window.location.href);
      const fragment = new URLSearchParams(url.hash.slice(1));
      const key = fragment.get('sync') ?? url.searchParams.get('sync');
      if (!key) return;
      if (fragment.has('sync')) {
        fragment.delete('sync');
        url.hash = fragment.toString();
      }
      url.searchParams.delete('sync');
      window.history.replaceState(window.history.state, '', url);
      if (key !== storageService.getSyncKey()) void connectExistingSyncKey(key);
    });
    return () => { active = false; };
  }, []);

  // Subject actions
  const addSubject = (name: string, color: string, description?: string): Subject => {
    const now = new Date().toISOString();
    const newSubject: Subject = {
      id: `subj-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`,
      name: name.trim(),
      color,
      description: description?.trim(),
      createdAt: now,
      updatedAt: now,
    };
    const updated = [...storageService.getSubjects(), newSubject];
    setSubjects(updated);
    storageService.saveSubjects(updated);
    scheduleCloudPush();
    addToast('Matéria criada', `"${name}" adicionada ao APREVO.`);
    return newSubject;
  };

  const updateSubject = (id: string, name: string, color: string, description?: string) => {
    const now = new Date().toISOString();
    const updated = storageService.getSubjects().map((s) =>
      s.id === id ? { ...s, name: name.trim(), color, description: description?.trim(), updatedAt: now } : s
    );
    setSubjects(updated);
    storageService.saveSubjects(updated);
    scheduleCloudPush();
    addToast('Matéria atualizada', `Alterações em "${name}" salvas.`);
  };

  const deleteSubject = (id: string) => {
    storageService.saveDeletedIds([...new Set([...storageService.getDeletedIds(), id])]);
    const target = subjects.find((s) => s.id === id);
    const updated = storageService.getSubjects().filter((s) => s.id !== id);
    setSubjects(updated);
    storageService.saveSubjects(updated);
    scheduleCloudPush();
    addToast('Matéria excluída', target ? `"${target.name}" foi removida.` : undefined, 'info');
  };

  // Session actions
  const addSession = (sessionData: Omit<StudySession, 'id'>): StudySession => {
    const now = new Date().toISOString();
    const newSession: StudySession = {
      ...sessionData,
      id: `sess-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`,
      updatedAt: now,
    };
    const updated = [newSession, ...storageService.getSessions()];
    setSessions(updated);
    storageService.saveSessions(updated);
    scheduleCloudPush();
    addToast('Sessão registrada!', `${sessionData.topic} salvo com sucesso.`);
    return newSession;
  };

  const updateSession = (id: string, sessionData: Partial<StudySession>) => {
    const now = new Date().toISOString();
    const updated = storageService.getSessions().map((s) => (s.id === id ? { ...s, ...sessionData, updatedAt: now } : s));
    setSessions(updated);
    storageService.saveSessions(updated);
    scheduleCloudPush();
    addToast('Sessão atualizada', 'O registro foi modificado.');
  };

  const deleteSession = (id: string) => {
    storageService.saveDeletedIds([...new Set([...storageService.getDeletedIds(), id])]);
    const updated = storageService.getSessions().filter((s) => s.id !== id);
    setSessions(updated);
    storageService.saveSessions(updated);
    scheduleCloudPush();
    addToast('Registro excluído', 'A sessão foi removida.', 'info');
  };

  // Settings & Data actions
  const updateSettings = (newSettings: Partial<UserSettings>) => {
    const updated = { ...storageService.getSettings(), ...newSettings, updatedAt: new Date().toISOString() };
    setSettings(updated);
    storageService.saveSettings(updated);
    scheduleCloudPush();
    addToast('Configurações salvas', 'Preferências atualizadas.');
  };

  const resetAllData = () => {
    cancelSync();
    storageService.clearAllData();
    setSubjects(storageService.getSubjects());
    setSessions(storageService.getSessions());
    setSettings(DEFAULT_SETTINGS);
    setSyncKey(null);
    setSyncStatus('idle');
    setLastSyncTime(null);
    setActiveTimer(null);
    setIsTimerRunning(false);
    setTimerSeconds(0);
    addToast('Dados restaurados', 'O APREVO foi restaurado com sucesso.', 'info');
  };

  const exportDataCSV = () => {
    storageService.exportToCSV(sessions, subjects);
    addToast('Download iniciado', 'Relatório CSV exportado com sucesso.');
  };

  const exportDataJSON = () => {
    const backup = storageService.getFullBackupData();
    const dataStr = 'data:text/json;charset=utf-8,' + encodeURIComponent(JSON.stringify(backup, null, 2));
    const link = document.createElement('a');
    link.setAttribute('href', dataStr);
    link.setAttribute('download', `aprevo_backup_${new Date().toISOString().slice(0, 10)}.json`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    addToast('Backup JSON Gerado', 'Arquivo de segurança exportado.');
  };

  // Sync methods
  const setupDeviceSyncKey = async () => {
    if (!getSyncEndpoint()) {
      addToast('Banco de sincronização ausente', 'Informe o endpoint do Firebase em Configurações.', 'error');
      return;
    }
    try {
      const key = generatePairingCode();
      if (await exchange(key, 'create')) {
        addToast('Código de pareamento criado', 'Use o código no outro dispositivo.');
        return;
      }
    } catch {
      setSyncStatus('error');
    }
    addToast('Falha ao criar o código', 'Verifique a conexão e tente novamente.', 'error');
  };

  const connectExistingSyncKey = async (key: string): Promise<boolean> => {
    const cleanKey = key.trim().toUpperCase();
    if (!isPairingCode(cleanKey)) {
      addToast('Código incompatível', 'Gere um código novo no outro dispositivo.', 'error');
      return false;
    }
    if (!getSyncEndpoint()) {
      addToast('Banco de sincronização ausente', 'Configure o mesmo endpoint do outro dispositivo.', 'error');
      return false;
    }
    if (!await exchange(cleanKey, 'join')) {
      addToast('Não foi possível parear', 'Confira o código, o banco configurado e a conexão.', 'error');
      return false;
    }
    addToast('Dispositivo conectado', 'Dados sincronizados entre seus dispositivos.');
    return true;
  };

  const cancelSync = () => {
    window.clearTimeout(scheduledSync.current);
    syncRequest.current?.abort();
    syncRequest.current = null;
  };

  const disconnectDeviceSync = () => {
    cancelSync();
    setSyncKey(null);
    storageService.saveSyncKey(null);
    setSyncStatus('idle');
    setLastSyncTime(null);
    addToast('Sincronização Desconectada', 'Este dispositivo não está mais pareado com a nuvem.', 'info');
  };

  const forceSyncNow = async () => {
    if (!syncKey) {
      await setupDeviceSyncKey();
      return;
    }
    await triggerCloudSync();
  };

  // Timer actions
  const startTimer = (subjectId: string, topic: string, notes?: string): boolean => {
    if (!subjectId || !topic.trim()) {
      addToast('Atenção', 'Selecione uma matéria e informe o conteúdo.', 'error');
      return false;
    }

    const now = new Date().toISOString();
    const newTimer: ActiveTimerState = {
      subjectId,
      topic: topic.trim(),
      notes: notes?.trim(),
      startedAt: now,
      elapsedSeconds: 0,
      isRunning: true,
      lastResumedAt: now,
    };

    setActiveTimer(newTimer);
    setTimerSeconds(0);
    setIsTimerRunning(true);
    storageService.saveActiveTimer(newTimer);
    playStartChime();
    addToast('Cronômetro iniciado!', `Foco total em: ${topic}`);
    return true;
  };

  const pauseTimer = () => {
    if (!activeTimer || !isTimerRunning) return;

    const lastResume = activeTimer.lastResumedAt ? new Date(activeTimer.lastResumedAt).getTime() : Date.now();
    const currentRun = Math.floor((Date.now() - lastResume) / 1000);
    const totalElapsed = activeTimer.elapsedSeconds + Math.max(0, currentRun);

    const updatedTimer: ActiveTimerState = {
      ...activeTimer,
      elapsedSeconds: totalElapsed,
      isRunning: false,
      lastResumedAt: undefined,
    };

    setActiveTimer(updatedTimer);
    setTimerSeconds(totalElapsed);
    setIsTimerRunning(false);
    storageService.saveActiveTimer(updatedTimer);
    addToast('Cronômetro pausado', 'Faça uma pausa e retome quando estiver pronto.', 'info');
  };

  const resumeTimer = () => {
    if (!activeTimer || isTimerRunning) return;

    const now = new Date().toISOString();
    const updatedTimer: ActiveTimerState = {
      ...activeTimer,
      isRunning: true,
      lastResumedAt: now,
    };

    setActiveTimer(updatedTimer);
    setIsTimerRunning(true);
    storageService.saveActiveTimer(updatedTimer);
    playStartChime();
    addToast('Cronômetro retomado', 'Voltando aos estudos!');
  };

  const finishTimer = (): StudySession | null => {
    if (!activeTimer) return null;

    let finalSeconds = activeTimer.elapsedSeconds;
    if (isTimerRunning && activeTimer.lastResumedAt) {
      const added = Math.floor((Date.now() - new Date(activeTimer.lastResumedAt).getTime()) / 1000);
      finalSeconds += Math.max(0, added);
    }

    if (finalSeconds < 5) {
      addToast('Sessão muito curta', 'Sessões com menos de 5 segundos não são salvas.', 'info');
      discardTimer();
      return null;
    }

    const now = new Date().toISOString();
    const savedSession: StudySession = {
      id: `sess-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`,
      subjectId: activeTimer.subjectId,
      topic: activeTimer.topic,
      notes: activeTimer.notes,
      durationSeconds: finalSeconds,
      startedAt: activeTimer.startedAt,
      endedAt: now,
      type: 'timer',
      updatedAt: now,
    };

    const updatedSessions = [savedSession, ...storageService.getSessions()];
    setSessions(updatedSessions);
    storageService.saveSessions(updatedSessions);

    setActiveTimer(null);
    setIsTimerRunning(false);
    setTimerSeconds(0);
    storageService.saveActiveTimer(null);

    scheduleCloudPush();
    playCompletionChime();
    addToast('Parabéns!', `Sessão finalizada: ${Math.round(finalSeconds / 60)} min registrados no APREVO.`);
    return savedSession;
  };

  const discardTimer = () => {
    setActiveTimer(null);
    setIsTimerRunning(false);
    setTimerSeconds(0);
    storageService.saveActiveTimer(null);
    addToast('Cronômetro cancelado', 'Sessão descartada.', 'info');
  };

  return (
    <AppContext.Provider
      value={{
        activeTab,
        setActiveTab,
        subjects,
        sessions,
        settings,
        addSubject,
        updateSubject,
        deleteSubject,
        addSession,
        updateSession,
        deleteSession,
        updateSettings,
        resetAllData,
        exportDataCSV,
        exportDataJSON,
        activeTimer,
        timerSeconds,
        isTimerRunning,
        startTimer,
        pauseTimer,
        resumeTimer,
        finishTimer,
        discardTimer,
        syncKey,
        syncStatus,
        lastSyncTime,
        isSyncModalOpen,
        setIsSyncModalOpen,
        setupDeviceSyncKey,
        connectExistingSyncKey,
        disconnectDeviceSync,
        forceSyncNow,
        toasts,
        addToast,
        removeToast,
      }}
    >
      {children}
    </AppContext.Provider>
  );
};

export const useApp = () => {
  const context = useContext(AppContext);
  if (!context) {
    throw new Error('useApp must be used within an AppProvider');
  }
  return context;
};
