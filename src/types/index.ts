export interface Subject {
  id: string;
  name: string;
  color: string;
  description?: string;
  createdAt: string;
  updatedAt?: string;
}

export interface StudySession {
  id: string;
  subjectId: string;
  topic: string;
  notes?: string;
  durationSeconds: number; // in seconds
  startedAt: string; // ISO string
  endedAt: string; // ISO string
  type: 'timer' | 'manual';
  updatedAt?: string;
}

export interface UserSettings {
  userName: string;
  theme: 'dark' | 'light';
  dailyGoalMinutes: number;
  weeklyGoalMinutes: number;
  updatedAt?: string;
}

export interface ActiveTimerState {
  subjectId: string;
  topic: string;
  notes?: string;
  startedAt: string;
  elapsedSeconds: number;
  isRunning: boolean;
  lastResumedAt?: string;
}

export interface ToastMessage {
  id: string;
  title: string;
  message?: string;
  type: 'success' | 'error' | 'info';
}

export type SyncStatus = 'idle' | 'syncing' | 'synced' | 'offline' | 'error';

export interface SyncData {
  subjects: Subject[];
  sessions: StudySession[];
  settings: UserSettings;
  deletedIds?: string[];
}
