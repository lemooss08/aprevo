import React, { createContext, useContext, useState, useEffect, useCallback, useMemo, useRef } from 'react';
import {
  Subject,
  StudySession,
  UserSettings,
  ActiveTimerState,
  ToastMessage,
  StudyData,
} from '../types';
import { createStudyStorage, DEFAULT_SETTINGS } from '../services/storage';
import { firebaseAuth, firebaseDatabase } from '../services/firebase';
import { signOut, type User } from 'firebase/auth';
import { onValue, ref, runTransaction } from 'firebase/database';
import { accountUsername } from '../services/accountName';
import { mergeStudyData } from '../services/studyData';
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

  accountName: string | null;
  cloudStatus: 'loading' | 'saving' | 'saved' | 'error';
  hasLegacyData: boolean;
  importLegacyData: () => void;
  logout: () => Promise<void>;

  // Toasts
  toasts: ToastMessage[];
  addToast: (title: string, message?: string, type?: 'success' | 'error' | 'info') => void;
  removeToast: (id: string) => void;
}

const AppContext = createContext<AppContextType | null>(null);

export const AppProvider: React.FC<{ children: React.ReactNode; user: User | null }> = ({ children, user }) => {
  const uid = user?.uid;
  const storageService = useMemo(() => createStudyStorage(uid), [uid]);
  const [hasLegacyData, setHasLegacyData] = useState(() => {
    const legacy = createStudyStorage();
    return Boolean(uid && (legacy.getSubjects().length > 0 || legacy.getSessions().length > 0));
  });
  const [cloudStatus, setCloudStatus] = useState<AppContextType['cloudStatus']>('loading');
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

  const requestSave = useRef<() => void>(() => {});

  const applyStudyData = useCallback((data: StudyData) => {
    storageService.saveSubjects(data.subjects);
    storageService.saveSessions(data.sessions);
    storageService.saveSettings(data.settings);
    storageService.saveDeletedIds(data.deletedIds ?? []);
    setSubjects(data.subjects);
    setSessions(data.sessions);
    setSettings(data.settings);
  }, [storageService]);

  useEffect(() => {
    if (!firebaseDatabase || !uid) return;
    const accountData = ref(firebaseDatabase, `users/${uid}/studyData`);
    let active = true;
    let saving = false;
    let pending = false;
    let timer: number | undefined;

    function applyRemote(raw: unknown) {
      if (typeof raw !== 'string') return;
      const merged = mergeStudyData(storageService.getStudyData(), JSON.parse(raw) as StudyData);
      if (merged.hasChanges) applyStudyData(merged);
    }

    async function save() {
      if (!active || saving || !pending) return;
      pending = false;
      saving = true;
      setCloudStatus('saving');
      try {
        const result = await runTransaction(accountData, (raw: string | null) => {
          const local = storageService.getStudyData();
          if (raw === null) return JSON.stringify(local);
          const { hasChanges, ...merged } = mergeStudyData(local, JSON.parse(raw) as StudyData);
          return JSON.stringify(merged);
        }, { applyLocally: false });
        if (active) {
          applyRemote(result.snapshot.val());
          setCloudStatus(pending ? 'saving' : 'saved');
        }
      } catch {
        if (active) setCloudStatus('error');
      } finally {
        saving = false;
        if (active && pending) void save();
      }
    }

    const queueSave = () => {
      pending = true;
      setCloudStatus('saving');
      window.clearTimeout(timer);
      timer = window.setTimeout(() => void save(), 300);
    };
    requestSave.current = queueSave;

    const stop = onValue(accountData, (snapshot) => {
      if (!active) return;
      try {
        applyRemote(snapshot.val());
        if (!saving && !pending) setCloudStatus((status) => status === 'loading' ? 'saved' : status);
      } catch {
        setCloudStatus('error');
      }
    }, () => { if (active) setCloudStatus('error'); });

    const local = storageService.getStudyData();
    if (local.sessions.length || local.subjects.length || local.settings.updatedAt || local.deletedIds?.length) {
      queueSave();
    }

    const reconnect = () => {
      if (navigator.onLine) queueSave();
    };
    window.addEventListener('online', reconnect);

    return () => {
      active = false;
      window.clearTimeout(timer);
      window.removeEventListener('online', reconnect);
      requestSave.current = () => {};
      stop();
    };
  }, [applyStudyData, storageService, uid]);

  const importLegacyData = () => {
    const legacy = createStudyStorage().getStudyData();
    const local = storageService.getStudyData();
    if (!legacy.sessions.length && !legacy.subjects.length) return;
    applyStudyData(mergeStudyData(local, {
      ...legacy,
      deletedIds: [],
      settings: local.settings,
    }));
    setHasLegacyData(false);
    requestSave.current();
    addToast('Estudos importados', 'Os dados deste navegador foram adicionados à sua conta.');
  };

  const logout = async () => {
    if (!firebaseAuth) return;
    try {
      await signOut(firebaseAuth);
    } catch {
      addToast('Não foi possível sair', 'Tente novamente.', 'error');
    }
  };

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
    requestSave.current();
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
    requestSave.current();
    addToast('Matéria atualizada', `Alterações em "${name}" salvas.`);
  };

  const deleteSubject = (id: string) => {
    storageService.saveDeletedIds([...new Set([...storageService.getDeletedIds(), id])]);
    const target = subjects.find((s) => s.id === id);
    const updated = storageService.getSubjects().filter((s) => s.id !== id);
    setSubjects(updated);
    storageService.saveSubjects(updated);
    requestSave.current();
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
    requestSave.current();
    addToast('Sessão registrada!', `${sessionData.topic} salvo com sucesso.`);
    return newSession;
  };

  const updateSession = (id: string, sessionData: Partial<StudySession>) => {
    const now = new Date().toISOString();
    const updated = storageService.getSessions().map((s) => (s.id === id ? { ...s, ...sessionData, updatedAt: now } : s));
    setSessions(updated);
    storageService.saveSessions(updated);
    requestSave.current();
    addToast('Sessão atualizada', 'O registro foi modificado.');
  };

  const deleteSession = (id: string) => {
    storageService.saveDeletedIds([...new Set([...storageService.getDeletedIds(), id])]);
    const updated = storageService.getSessions().filter((s) => s.id !== id);
    setSessions(updated);
    storageService.saveSessions(updated);
    requestSave.current();
    addToast('Registro excluído', 'A sessão foi removida.', 'info');
  };

  // Settings & Data actions
  const updateSettings = (newSettings: Partial<UserSettings>) => {
    const updated = { ...storageService.getSettings(), ...newSettings, updatedAt: new Date().toISOString() };
    setSettings(updated);
    storageService.saveSettings(updated);
    requestSave.current();
    addToast('Configurações salvas', 'Preferências atualizadas.');
  };

  const resetAllData = () => {
    const data = storageService.getStudyData();
    applyStudyData({
      subjects: [],
      sessions: [],
      settings: { ...DEFAULT_SETTINGS, updatedAt: new Date().toISOString() },
      deletedIds: [...new Set([
        ...(data.deletedIds ?? []),
        ...data.subjects.map(({ id }) => id),
        ...data.sessions.map(({ id }) => id),
      ])],
    });
    setActiveTimer(null);
    setIsTimerRunning(false);
    setTimerSeconds(0);
    storageService.saveActiveTimer(null);
    requestSave.current();
    addToast('Dados restaurados', 'As sessões, matérias e preferências foram limpas.', 'info');
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

    requestSave.current();
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
        accountName: user ? accountUsername(user.email) : null,
        cloudStatus,
        hasLegacyData,
        importLegacyData,
        logout,
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
