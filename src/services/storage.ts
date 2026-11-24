import { Subject, StudySession, UserSettings, ActiveTimerState, SyncData } from '../types';

const STORAGE_KEYS = {
  SUBJECTS: 'aprevo_subjects_v2',
  SESSIONS: 'aprevo_sessions_v2',
  SETTINGS: 'aprevo_settings_v2',
  TIMER: 'aprevo_timer_v2',
  DELETED_IDS: 'aprevo_deleted_ids_v3',
  SYNC_KEY: 'aprevo_synckey_v2',
  CUSTOM_SYNC_ENDPOINT: 'aprevo_sync_endpoint_v2',
};

export const DEFAULT_SUBJECT_COLORS = [
  '#8b5cf6', // Violeta APREVO
  '#3b82f6', // Azul
  '#06b6d4', // Ciano
  '#10b981', // Esmeralda
  '#f59e0b', // Âmbar
  '#ef4444', // Vermelho
  '#ec4899', // Rosa
  '#6366f1', // Índigo
];

export const DEFAULT_SETTINGS: UserSettings = {
  userName: 'Estudante APREVO',
  theme: 'dark',
  dailyGoalMinutes: 120, // 2 horas
  weeklyGoalMinutes: 720, // 12 horas
};

export const storageService = {
  getSubjects(): Subject[] {
    const raw = localStorage.getItem(STORAGE_KEYS.SUBJECTS);
    if (!raw) {
      return [];
    }
    try {
      return JSON.parse(raw);
    } catch {
      return [];
    }
  },

  saveSubjects(subjects: Subject[]): void {
    localStorage.setItem(STORAGE_KEYS.SUBJECTS, JSON.stringify(subjects));
  },

  getSessions(): StudySession[] {
    const raw = localStorage.getItem(STORAGE_KEYS.SESSIONS);
    if (!raw) {
      return [];
    }
    try {
      return JSON.parse(raw);
    } catch {
      return [];
    }
  },

  saveSessions(sessions: StudySession[]): void {
    localStorage.setItem(STORAGE_KEYS.SESSIONS, JSON.stringify(sessions));
  },

  getSettings(): UserSettings {
    const raw = localStorage.getItem(STORAGE_KEYS.SETTINGS);
    if (!raw) {
      localStorage.setItem(STORAGE_KEYS.SETTINGS, JSON.stringify(DEFAULT_SETTINGS));
      return DEFAULT_SETTINGS;
    }
    try {
      return { ...DEFAULT_SETTINGS, ...JSON.parse(raw) };
    } catch {
      return DEFAULT_SETTINGS;
    }
  },

  saveSettings(settings: UserSettings): void {
    localStorage.setItem(STORAGE_KEYS.SETTINGS, JSON.stringify(settings));
  },

  getSyncData(): SyncData {
    return {
      subjects: this.getSubjects(),
      sessions: this.getSessions(),
      settings: this.getSettings(),
      deletedIds: this.getDeletedIds(),
    };
  },

  getDeletedIds(): string[] {
    try {
      const ids: unknown = JSON.parse(localStorage.getItem(STORAGE_KEYS.DELETED_IDS) ?? '[]');
      return Array.isArray(ids) ? ids.filter((id): id is string => typeof id === 'string') : [];
    } catch {
      return [];
    }
  },

  saveDeletedIds(ids: string[]): void {
    localStorage.setItem(STORAGE_KEYS.DELETED_IDS, JSON.stringify(ids));
  },

  getActiveTimer(): ActiveTimerState | null {
    const raw = localStorage.getItem(STORAGE_KEYS.TIMER);
    if (!raw) return null;
    try {
      return JSON.parse(raw);
    } catch {
      return null;
    }
  },

  saveActiveTimer(timer: ActiveTimerState | null): void {
    if (!timer) {
      localStorage.removeItem(STORAGE_KEYS.TIMER);
    } else {
      localStorage.setItem(STORAGE_KEYS.TIMER, JSON.stringify(timer));
    }
  },

  getSyncKey(): string | null {
    return localStorage.getItem(STORAGE_KEYS.SYNC_KEY);
  },

  saveSyncKey(key: string | null): void {
    if (!key) {
      localStorage.removeItem(STORAGE_KEYS.SYNC_KEY);
    } else {
      localStorage.setItem(STORAGE_KEYS.SYNC_KEY, key);
    }
  },

  getCustomSyncEndpoint(): string | null {
    return localStorage.getItem(STORAGE_KEYS.CUSTOM_SYNC_ENDPOINT);
  },

  saveCustomSyncEndpoint(url: string | null): void {
    if (!url) {
      localStorage.removeItem(STORAGE_KEYS.CUSTOM_SYNC_ENDPOINT);
    } else {
      localStorage.setItem(STORAGE_KEYS.CUSTOM_SYNC_ENDPOINT, url);
    }
  },

  getFullBackupData() {
    return {
      version: 1,
      exportedAt: new Date().toISOString(),
      subjects: this.getSubjects(),
      sessions: this.getSessions(),
      settings: this.getSettings(),
    };
  },

  exportToCSV(sessions: StudySession[], subjects: Subject[]): void {
    const subjectMap = new Map(subjects.map((s) => [s.id, s.name]));
    const headers = ['ID', 'Matéria', 'Conteúdo / Tópico', 'Duração (Min)', 'Data Início', 'Data Fim', 'Tipo', 'Observações'];

    const rows = sessions.map((s) => [
      s.id,
      `"${(subjectMap.get(s.subjectId) || 'Outros').replace(/"/g, '""')}"`,
      `"${s.topic.replace(/"/g, '""')}"`,
      Math.round(s.durationSeconds / 60),
      s.startedAt,
      s.endedAt,
      s.type,
      `"${(s.notes || '').replace(/"/g, '""')}"`,
    ]);

    const csvContent = 'data:text/csv;charset=utf-8,\uFEFF' + [headers.join(','), ...rows.map((e) => e.join(','))].join('\n');
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement('a');
    link.setAttribute('href', encodedUri);
    link.setAttribute('download', `aprevo_estudos_${new Date().toISOString().slice(0, 10)}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  },

  clearAllData(): void {
    const keys = [
      'aprevo_subjects_v1', 'aprevo_sessions_v1', 'aprevo_reviews_v1', 'aprevo_settings_v1', 'aprevo_timer_v1', 'aprevo_synckey_v1',
      STORAGE_KEYS.SUBJECTS,
      STORAGE_KEYS.SESSIONS,
      'aprevo_reviews_v2',
      STORAGE_KEYS.SETTINGS,
      STORAGE_KEYS.TIMER,
      STORAGE_KEYS.SYNC_KEY,
      STORAGE_KEYS.DELETED_IDS,
      STORAGE_KEYS.CUSTOM_SYNC_ENDPOINT,
    ];
    keys.forEach((k) => localStorage.removeItem(k));
  },
};
