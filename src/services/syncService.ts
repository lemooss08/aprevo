import { Subject, StudySession, ReviewItem, UserSettings, SyncPayload, SyncStatus } from '../types';
import { storageService } from './storage';

const DEFAULT_FIREBASE_RTDB = 'https://aprevo-sync-default-rtdb.firebaseio.com';

export function generatePairingCode(): string {
  const chars = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789';
  let part1 = '';
  for (let i = 0; i < 4; i++) {
    part1 += chars.charAt(Math.floor(Math.random() * chars.length));
  }
  let part2 = '';
  for (let i = 0; i < 2; i++) {
    part2 += chars.charAt(Math.floor(Math.random() * chars.length));
  }
  return `APRV-${part1}-${part2}`;
}

export interface SyncMergeResult {
  subjects: Subject[];
  sessions: StudySession[];
  reviews: ReviewItem[];
  settings: UserSettings;
  hasChanges: boolean;
}

export function mergeSyncData(
  local: {
    subjects: Subject[];
    sessions: StudySession[];
    reviews: ReviewItem[];
    settings: UserSettings;
  },
  remote: {
    subjects: Subject[];
    sessions: StudySession[];
    reviews: ReviewItem[];
    settings: UserSettings;
  }
): SyncMergeResult {
  let hasChanges = false;

  // Merge Subjects by ID
  const subjectMap = new Map<string, Subject>();
  local.subjects.forEach((s) => subjectMap.set(s.id, s));
  remote.subjects.forEach((remSub) => {
    const locSub = subjectMap.get(remSub.id);
    if (!locSub) {
      subjectMap.set(remSub.id, remSub);
      hasChanges = true;
    } else {
      const remTime = new Date(remSub.updatedAt || remSub.createdAt).getTime();
      const locTime = new Date(locSub.updatedAt || locSub.createdAt).getTime();
      if (remTime > locTime) {
        subjectMap.set(remSub.id, remSub);
        hasChanges = true;
      }
    }
  });

  // Merge Sessions by ID (Union: no session lost)
  const sessionMap = new Map<string, StudySession>();
  local.sessions.forEach((s) => sessionMap.set(s.id, s));
  remote.sessions.forEach((remSess) => {
    const locSess = sessionMap.get(remSess.id);
    if (!locSess) {
      sessionMap.set(remSess.id, remSess);
      hasChanges = true;
    } else {
      const remTime = new Date(remSess.updatedAt || remSess.endedAt).getTime();
      const locTime = new Date(locSess.updatedAt || locSess.endedAt).getTime();
      if (remTime > locTime) {
        sessionMap.set(remSess.id, remSess);
        hasChanges = true;
      }
    }
  });

  // Merge Reviews by ID
  const reviewMap = new Map<string, ReviewItem>();
  local.reviews.forEach((r) => reviewMap.set(r.id, r));
  remote.reviews.forEach((remRev) => {
    const locRev = reviewMap.get(remRev.id);
    if (!locRev) {
      reviewMap.set(remRev.id, remRev);
      hasChanges = true;
    } else {
      const remTime = new Date(remRev.updatedAt || remRev.createdAt).getTime();
      const locTime = new Date(locRev.updatedAt || locRev.createdAt).getTime();
      if (remTime > locTime) {
        reviewMap.set(remRev.id, remRev);
        hasChanges = true;
      }
    }
  });

  return {
    subjects: Array.from(subjectMap.values()),
    sessions: Array.from(sessionMap.values()).sort(
      (a, b) => new Date(b.startedAt).getTime() - new Date(a.startedAt).getTime()
    ),
    reviews: Array.from(reviewMap.values()),
    settings: {
      ...local.settings,
      ...remote.settings,
    },
    hasChanges,
  };
}

export const syncService = {
  getEndpoint(syncKey: string): string {
    const custom = storageService.getCustomSyncEndpoint();
    if (custom && custom.trim()) {
      return `${custom.replace(/\/$/, '')}/${encodeURIComponent(syncKey)}.json`;
    }
    return `${DEFAULT_FIREBASE_RTDB}/rooms/${encodeURIComponent(syncKey)}.json`;
  },

  async pushToCloud(payload: SyncPayload): Promise<boolean> {
    if (!navigator.onLine) return false;

    try {
      const url = this.getEndpoint(payload.syncKey);
      const res = await fetch(url, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });

      return res.ok;
    } catch (err) {
      console.warn('Sync push error:', err);
      return false;
    }
  },

  async pullFromCloud(syncKey: string): Promise<SyncPayload | null> {
    if (!navigator.onLine) return null;

    try {
      const url = this.getEndpoint(syncKey);
      const res = await fetch(url, {
        method: 'GET',
        headers: { 'Accept': 'application/json' },
      });

      if (!res.ok) return null;
      const data = await res.json();
      if (!data || !data.data) return null;
      return data as SyncPayload;
    } catch (err) {
      console.warn('Sync pull error:', err);
      return null;
    }
  },
};
