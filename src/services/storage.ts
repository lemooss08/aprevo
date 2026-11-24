import { Subject, StudySession, UserSettings, ActiveTimerState, StudyData } from '../types';

const STORAGE_KEYS = {
  SUBJECTS: 'aprevo_subjects_v2',
  SESSIONS: 'aprevo_sessions_v2',
  SETTINGS: 'aprevo_settings_v2',
  TIMER: 'aprevo_timer_v2',
  DELETED_IDS: 'aprevo_deleted_ids_v3',
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

export function createStudyStorage(uid?: string) {
  const scoped = (key: string) => uid ? `aprevo:account:${uid}:${key}` : key;
  return {
    getSubjects(): Subject[] {
      const raw = localStorage.getItem(scoped(STORAGE_KEYS.SUBJECTS));
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
      localStorage.setItem(scoped(STORAGE_KEYS.SUBJECTS), JSON.stringify(subjects));
    },

    getSessions(): StudySession[] {
      const raw = localStorage.getItem(scoped(STORAGE_KEYS.SESSIONS));
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
      localStorage.setItem(scoped(STORAGE_KEYS.SESSIONS), JSON.stringify(sessions));
    },

    getSettings(): UserSettings {
      const raw = localStorage.getItem(scoped(STORAGE_KEYS.SETTINGS));
      if (!raw) {
        localStorage.setItem(scoped(STORAGE_KEYS.SETTINGS), JSON.stringify(DEFAULT_SETTINGS));
        return DEFAULT_SETTINGS;
      }
      try {
        return { ...DEFAULT_SETTINGS, ...JSON.parse(raw) };
      } catch {
        return DEFAULT_SETTINGS;
      }
    },

    saveSettings(settings: UserSettings): void {
      localStorage.setItem(scoped(STORAGE_KEYS.SETTINGS), JSON.stringify(settings));
    },

    getStudyData(): StudyData {
      return {
        subjects: this.getSubjects(),
        sessions: this.getSessions(),
        settings: this.getSettings(),
        deletedIds: this.getDeletedIds(),
      };
    },

    getDeletedIds(): string[] {
      try {
        const ids: unknown = JSON.parse(localStorage.getItem(scoped(STORAGE_KEYS.DELETED_IDS)) ?? '[]');
        return Array.isArray(ids) ? ids.filter((id): id is string => typeof id === 'string') : [];
      } catch {
        return [];
      }
    },

    saveDeletedIds(ids: string[]): void {
      localStorage.setItem(scoped(STORAGE_KEYS.DELETED_IDS), JSON.stringify(ids));
    },

    getActiveTimer(): ActiveTimerState | null {
      const raw = localStorage.getItem(scoped(STORAGE_KEYS.TIMER));
      if (!raw) return null;
      try {
        return JSON.parse(raw);
      } catch {
        return null;
      }
    },

    saveActiveTimer(timer: ActiveTimerState | null): void {
      if (!timer) {
        localStorage.removeItem(scoped(STORAGE_KEYS.TIMER));
      } else {
        localStorage.setItem(scoped(STORAGE_KEYS.TIMER), JSON.stringify(timer));
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

  };
}
