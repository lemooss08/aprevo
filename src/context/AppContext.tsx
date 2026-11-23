import React, { createContext, useContext, useState, useEffect, useCallback, useRef } from 'react';
import {
  Subject,
  StudySession,
  UserSettings,
  ActiveTimerState,
  ToastMessage,
  ReviewItem,
  SyncStatus,
  SyncPayload,
} from '../types';
import { storageService, DEFAULT_SETTINGS } from '../services/storage';
import { syncService, generatePairingCode, mergeSyncData } from '../services/syncService';
import { playStartChime, playCompletionChime } from '../utils/audio';

interface AppContextType {
  // Navigation
  activeTab: string;
  setActiveTab: (tab: string) => void;

  // Data
  subjects: Subject[];
  sessions: StudySession[];
  reviews: ReviewItem[];
  settings: UserSettings;

  // Subject actions
  addSubject: (name: string, color: string, description?: string) => Subject;
  updateSubject: (id: string, name: string, color: string, description?: string) => void;
  deleteSubject: (id: string) => void;

  // Session actions
  addSession: (session: Omit<StudySession, 'id'>) => StudySession;
  updateSession: (id: string, session: Partial<StudySession>) => void;
  deleteSession: (id: string) => void;

  // Review actions (Spaced Repetition)
  addReview: (subjectId: string, topic: string, notes?: string, intervals?: number[]) => ReviewItem;
  advanceReview: (id: string) => void;
  postponeReview: (id: string, days?: number) => void;
  deleteReview: (id: string) => void;

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
  setupDeviceSyncKey: () => string;
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
  const [reviews, setReviews] = useState<ReviewItem[]>(() => storageService.getReviews());
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
  const [syncKey, setSyncKey] = useState<string | null>(() => storageService.getSyncKey());
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

  // Online / Offline window listeners
  useEffect(() => {
    const handleOnline = () => {
      if (syncKey) {
        setSyncStatus('idle');
        addToast('Conexão restabelecida', 'Sincronizando com a nuvem...', 'info');
        triggerCloudSync();
      }
    };
    const handleOffline = () => {
      setSyncStatus('offline');
      addToast('Modo Offline', 'Seus dados continuam salvos localmente no dispositivo.', 'info');
    };

    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);

    return () => {
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
    };
  }, [syncKey]);

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

  // Sync: Push and Pull Logic
  const syncTimeoutRef = useRef<number | null>(null);

  const scheduleCloudPush = useCallback(() => {
    if (!syncKey) return;
    if (!navigator.onLine) {
      setSyncStatus('offline');
      return;
    }

    if (syncTimeoutRef.current) {
      clearTimeout(syncTimeoutRef.current);
    }

    syncTimeoutRef.current = window.setTimeout(async () => {
      setSyncStatus('syncing');
      const payload: SyncPayload = {
        syncKey,
        timestamp: Date.now(),
        version: 1,
        data: {
          subjects,
          sessions,
          reviews,
          settings,
        },
      };

      const ok = await syncService.pushToCloud(payload);
      if (ok) {
        setSyncStatus('synced');
        setLastSyncTime(new Date());
      } else {
        setSyncStatus('error');
      }
    }, 1500);
  }, [syncKey, subjects, sessions, reviews, settings]);

  const triggerCloudSync = useCallback(async () => {
    if (!syncKey) return;
    if (!navigator.onLine) {
      setSyncStatus('offline');
      return;
    }

    setSyncStatus('syncing');
    const remote = await syncService.pullFromCloud(syncKey);

    if (remote && remote.data) {
      const merged = mergeSyncData(
        { subjects, sessions, reviews, settings },
        remote.data
      );

      if (merged.hasChanges) {
        setSubjects(merged.subjects);
        storageService.saveSubjects(merged.subjects);

        setSessions(merged.sessions);
        storageService.saveSessions(merged.sessions);

        setReviews(merged.reviews);
        storageService.saveReviews(merged.reviews);

        setSettings(merged.settings);
        storageService.saveSettings(merged.settings);

        addToast('Dados Sincronizados', 'Atualizado com alterações de outro dispositivo.', 'info');
      }
    }

    // Now push current merged state to cloud
    const currentPayload: SyncPayload = {
      syncKey,
      timestamp: Date.now(),
      version: 1,
      data: {
        subjects,
        sessions,
        reviews,
        settings,
      },
    };

    const pushOk = await syncService.pushToCloud(currentPayload);
    if (pushOk) {
      setSyncStatus('synced');
      setLastSyncTime(new Date());
    } else {
      setSyncStatus('error');
    }
  }, [syncKey, subjects, sessions, reviews, settings, addToast]);

  // Periodic pull from cloud (every 25 seconds if active tab)
  useEffect(() => {
    if (!syncKey) return;

    const interval = setInterval(() => {
      if (document.visibilityState === 'visible' && navigator.onLine) {
        triggerCloudSync();
      }
    }, 25000);

    const handleVisibilityChange = () => {
      if (document.visibilityState === 'visible' && navigator.onLine) {
        triggerCloudSync();
      }
    };
    document.addEventListener('visibilitychange', handleVisibilityChange);

    return () => {
      clearInterval(interval);
      document.removeEventListener('visibilitychange', handleVisibilityChange);
    };
  }, [syncKey, triggerCloudSync]);

  // Check URL query on initial load for automatic pairing link (e.g. ?sync=APRV-XXXX)
  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const urlSyncKey = params.get('sync');
    if (urlSyncKey && urlSyncKey.startsWith('APRV-') && urlSyncKey !== syncKey) {
      connectExistingSyncKey(urlSyncKey);
      // Clean query parameter from URL without reload
      window.history.replaceState({}, document.title, window.location.pathname);
    }
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
    const updated = [...subjects, newSubject];
    setSubjects(updated);
    storageService.saveSubjects(updated);
    scheduleCloudPush();
    addToast('Matéria criada', `"${name}" adicionada ao APREVO.`);
    return newSubject;
  };

  const updateSubject = (id: string, name: string, color: string, description?: string) => {
    const now = new Date().toISOString();
    const updated = subjects.map((s) =>
      s.id === id ? { ...s, name: name.trim(), color, description: description?.trim(), updatedAt: now } : s
    );
    setSubjects(updated);
    storageService.saveSubjects(updated);
    scheduleCloudPush();
    addToast('Matéria atualizada', `Alterações em "${name}" salvas.`);
  };

  const deleteSubject = (id: string) => {
    const target = subjects.find((s) => s.id === id);
    const updated = subjects.filter((s) => s.id !== id);
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
    const updated = [newSession, ...sessions];
    setSessions(updated);
    storageService.saveSessions(updated);
    scheduleCloudPush();
    addToast('Sessão registrada!', `${sessionData.topic} salvo com sucesso.`);
    return newSession;
  };

  const updateSession = (id: string, sessionData: Partial<StudySession>) => {
    const now = new Date().toISOString();
    const updated = sessions.map((s) => (s.id === id ? { ...s, ...sessionData, updatedAt: now } : s));
    setSessions(updated);
    storageService.saveSessions(updated);
    scheduleCloudPush();
    addToast('Sessão atualizada', 'O registro foi modificado.');
  };

  const deleteSession = (id: string) => {
    const updated = sessions.filter((s) => s.id !== id);
    setSessions(updated);
    storageService.saveSessions(updated);
    scheduleCloudPush();
    addToast('Registro excluído', 'A sessão foi removida.', 'info');
  };

  // Review Actions (Spaced Repetition)
  const addReview = (
    subjectId: string,
    topic: string,
    notes?: string,
    intervals: number[] = [1, 3, 7, 15, 30]
  ): ReviewItem => {
    const now = new Date();
    const firstInterval = intervals[0] || 1;
    const nextDate = new Date(now.getTime() + firstInterval * 86400000).toISOString().slice(0, 10);

    const newReview: ReviewItem = {
      id: `rev-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`,
      subjectId,
      topic: topic.trim(),
      stage: 0,
      intervals,
      nextReviewDate: nextDate,
      notes: notes?.trim(),
      createdAt: now.toISOString(),
      status: 'pending',
      updatedAt: now.toISOString(),
    };

    const updated = [newReview, ...reviews];
    setReviews(updated);
    storageService.saveReviews(updated);
    scheduleCloudPush();
    addToast('Revisão agendada', `Primeira revisão de "${topic}" agendada para ${firstInterval} dia(s).`);
    return newReview;
  };

  const advanceReview = (id: string) => {
    const target = reviews.find((r) => r.id === id);
    if (!target) return;

    const nextStage = target.stage + 1;
    const now = new Date();
    const isCompleted = nextStage >= target.intervals.length;

    let nextDate = target.nextReviewDate;
    if (!isCompleted) {
      const nextInterval = target.intervals[nextStage];
      nextDate = new Date(now.getTime() + nextInterval * 86400000).toISOString().slice(0, 10);
    }

    const updated = reviews.map((r) =>
      r.id === id
        ? {
            ...r,
            stage: nextStage,
            status: isCompleted ? ('completed' as const) : ('pending' as const),
            nextReviewDate: nextDate,
            lastReviewedAt: now.toISOString(),
            updatedAt: now.toISOString(),
          }
        : r
    );

    setReviews(updated);
    storageService.saveReviews(updated);
    scheduleCloudPush();

    if (isCompleted) {
      playCompletionChime();
      addToast('Ciclo de Revisão Concluído!', `"${target.topic}" foi fixado com sucesso!`, 'success');
    } else {
      addToast('Revisão Registrada', `Próxima revisão em ${target.intervals[nextStage]} dia(s).`, 'info');
    }
  };

  const postponeReview = (id: string, days: number = 1) => {
    const now = new Date();
    const newDate = new Date(now.getTime() + days * 86400000).toISOString().slice(0, 10);

    const updated = reviews.map((r) =>
      r.id === id ? { ...r, nextReviewDate: newDate, updatedAt: now.toISOString() } : r
    );

    setReviews(updated);
    storageService.saveReviews(updated);
    scheduleCloudPush();
    addToast('Revisão adiada', `Reagendada para daqui a ${days} dia(s).`, 'info');
  };

  const deleteReview = (id: string) => {
    const updated = reviews.filter((r) => r.id !== id);
    setReviews(updated);
    storageService.saveReviews(updated);
    scheduleCloudPush();
    addToast('Revisão removida', 'Item de revisão excluído.', 'info');
  };

  // Settings & Data actions
  const updateSettings = (newSettings: Partial<UserSettings>) => {
    const updated = { ...settings, ...newSettings };
    setSettings(updated);
    storageService.saveSettings(updated);
    scheduleCloudPush();
    addToast('Configurações salvas', 'Preferências atualizadas.');
  };

  const resetAllData = () => {
    storageService.clearAllData();
    setSubjects(storageService.getSubjects());
    setSessions(storageService.getSessions());
    setReviews(storageService.getReviews());
    setSettings(DEFAULT_SETTINGS);
    setSyncKey(null);
    setSyncStatus('idle');
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
  const setupDeviceSyncKey = (): string => {
    const key = generatePairingCode();
    setSyncKey(key);
    storageService.saveSyncKey(key);

    const payload: SyncPayload = {
      syncKey: key,
      timestamp: Date.now(),
      version: 1,
      data: {
        subjects,
        sessions,
        reviews,
        settings,
      },
    };

    setSyncStatus('syncing');
    syncService.pushToCloud(payload).then((ok) => {
      setSyncStatus(ok ? 'synced' : 'error');
      if (ok) setLastSyncTime(new Date());
    });

    addToast('Código de Pareamento Criado', `Use o código ${key} no outro dispositivo.`);
    return key;
  };

  const connectExistingSyncKey = async (key: string): Promise<boolean> => {
    const cleanKey = key.trim().toUpperCase();
    if (!cleanKey) return false;

    setSyncStatus('syncing');
    const remote = await syncService.pullFromCloud(cleanKey);

    if (remote && remote.data) {
      const merged = mergeSyncData(
        { subjects, sessions, reviews, settings },
        remote.data
      );

      setSubjects(merged.subjects);
      storageService.saveSubjects(merged.subjects);

      setSessions(merged.sessions);
      storageService.saveSessions(merged.sessions);

      setReviews(merged.reviews);
      storageService.saveReviews(merged.reviews);

      setSettings(merged.settings);
      storageService.saveSettings(merged.settings);

      setSyncKey(cleanKey);
      storageService.saveSyncKey(cleanKey);
      setSyncStatus('synced');
      setLastSyncTime(new Date());

      // Push combined data back to cloud
      syncService.pushToCloud({
        syncKey: cleanKey,
        timestamp: Date.now(),
        version: 1,
        data: {
          subjects: merged.subjects,
          sessions: merged.sessions,
          reviews: merged.reviews,
          settings: merged.settings,
        },
      });

      addToast('Dispositivo Conectado com Sucesso!', 'Dados sincronizados entre seus dispositivos.', 'success');
      return true;
    } else {
      // If no remote yet, set sync key and push current data
      setSyncKey(cleanKey);
      storageService.saveSyncKey(cleanKey);

      await syncService.pushToCloud({
        syncKey: cleanKey,
        timestamp: Date.now(),
        version: 1,
        data: {
          subjects,
          sessions,
          reviews,
          settings,
        },
      });

      setSyncStatus('synced');
      setLastSyncTime(new Date());
      addToast('Dispositivo Pareado', `Espaço de sincronização ${cleanKey} ativo.`, 'success');
      return true;
    }
  };

  const disconnectDeviceSync = () => {
    setSyncKey(null);
    storageService.saveSyncKey(null);
    setSyncStatus('idle');
    setLastSyncTime(null);
    addToast('Sincronização Desconectada', 'Este dispositivo não está mais pareado com a nuvem.', 'info');
  };

  const forceSyncNow = async () => {
    if (!syncKey) {
      setupDeviceSyncKey();
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

    const updatedSessions = [savedSession, ...sessions];
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
        reviews,
        settings,
        addSubject,
        updateSubject,
        deleteSubject,
        addSession,
        updateSession,
        deleteSession,
        addReview,
        advanceReview,
        postponeReview,
        deleteReview,
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
