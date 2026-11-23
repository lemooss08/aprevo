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

export interface ReviewItem {
  id: string;
  subjectId: string;
  topic: string;
  stage: number; // 0 (1d), 1 (3d), 2 (7d), 3 (15d), 4 (30d), 5 (concluído)
  intervals: number[]; // default [1, 3, 7, 15, 30]
  nextReviewDate: string; // YYYY-MM-DD
  lastReviewedAt?: string; // ISO string
  notes?: string;
  createdAt: string;
  status: 'pending' | 'completed';
  updatedAt?: string;
}

export interface UserSettings {
  userName: string;
  theme: 'dark' | 'light';
  dailyGoalMinutes: number;
  weeklyGoalMinutes: number;
  syncKey?: string;
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

export interface SyncPayload {
  syncKey: string;
  timestamp: number;
  version: number;
  data: {
    subjects: Subject[];
    sessions: StudySession[];
    reviews: ReviewItem[];
    settings: UserSettings;
  };
}
