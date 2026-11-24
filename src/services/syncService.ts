import { SyncData, Subject, StudySession } from '../types';
import { storageService } from './storage';

const encoder = new TextEncoder();

export const getSyncEndpoint = () =>
  storageService.getCustomSyncEndpoint() || import.meta.env.VITE_SYNC_ENDPOINT?.trim() || '';

const toHex = (bytes: Uint8Array) =>
  Array.from(bytes, (byte) => byte.toString(16).padStart(2, '0')).join('').toUpperCase();

export const isPairingCode = (code: string) => /^APRV3-[0-9A-F]{32}$/.test(code);

export function generatePairingCode(): string {
  return `APRV3-${toHex(crypto.getRandomValues(new Uint8Array(16)))}`;
}

export interface SyncMergeResult extends SyncData {
  hasChanges: boolean;
}

export function mergeSyncData(local: SyncData, remote: SyncData): SyncMergeResult {
  const deleted = new Set([...(local.deletedIds ?? []), ...(remote.deletedIds ?? [])]);
  let hasChanges = deleted.size !== (local.deletedIds?.length ?? 0);

  // Merge Subjects by ID (Union with latest updatedAt winning)
  const subjectMap = new Map<string, Subject>();
  local.subjects.forEach((s) => subjectMap.set(s.id, s));
  remote.subjects.forEach((remSub) => {
    if (deleted.has(remSub.id)) return;
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

  // Merge Sessions by ID (Union: no session lost, latest edit wins)
  const sessionMap = new Map<string, StudySession>();
  local.sessions.forEach((s) => sessionMap.set(s.id, s));
  remote.sessions.forEach((remSess) => {
    if (deleted.has(remSess.id)) return;
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

  for (const id of deleted) {
    const subjectRemoved = subjectMap.delete(id);
    const sessionRemoved = sessionMap.delete(id);
    hasChanges ||= subjectRemoved || sessionRemoved;
  }

  // Legacy preferences have no edit timestamp.
  const remoteSettingsWin = (remote.settings.updatedAt ?? '') > (local.settings.updatedAt ?? '');
  const settings = remoteSettingsWin ? remote.settings : local.settings;
  hasChanges ||= remoteSettingsWin;

  return {
    deletedIds: [...deleted],
    subjects: Array.from(subjectMap.values()),
    sessions: Array.from(sessionMap.values()).sort(
      (a, b) => new Date(b.startedAt).getTime() - new Date(a.startedAt).getTime()
    ),
    settings,
    hasChanges,
  };
}

function toBase64(bytes: Uint8Array): string {
  let binary = '';
  for (const byte of bytes) binary += String.fromCharCode(byte);
  return btoa(binary);
}

const fromBase64 = (value: string) => Uint8Array.from(atob(value), (char) => char.charCodeAt(0));

export const syncService = {
  async exchange(
    code: string,
    readLocal: () => SyncData,
    mode: 'create' | 'join' | 'sync',
    signal?: AbortSignal
  ): Promise<SyncData> {
    if (!isPairingCode(code)) throw new Error('Invalid pairing code');

    // Derive independent values so reading room IDs never reveals encryption keys.
    const room = toHex(new Uint8Array(await crypto.subtle.digest('SHA-256', encoder.encode(`room:${code}`))));
    const secret = await crypto.subtle.digest('SHA-256', encoder.encode(`key:${code}`));
    const key = await crypto.subtle.importKey('raw', secret, 'AES-GCM', false, ['encrypt', 'decrypt']);
    const endpoint = new URL(getSyncEndpoint());
    if (endpoint.protocol !== 'https:' || endpoint.username || endpoint.password || endpoint.search || endpoint.hash) {
      throw new Error('Invalid sync endpoint');
    }
    const url = `${endpoint.href.replace(/\/$/, '')}/${room}.json`;

    for (let attempt = 0; attempt < 4; attempt++) {
      const response = await fetch(url, { headers: { 'X-Firebase-ETag': 'true' }, signal });
      const etag = response.headers.get('ETag');
      if (!response.ok || !etag) throw new Error('Could not read sync room');

      const envelope = await response.json();
      if ((mode === 'create') !== (envelope === null)) throw new Error('Unexpected room state');

      let remote: SyncData | null = null;
      if (envelope) {
        const plaintext = await crypto.subtle.decrypt(
          { name: 'AES-GCM', iv: fromBase64(envelope.iv) }, key, fromBase64(envelope.ciphertext)
        );
        remote = JSON.parse(new TextDecoder().decode(plaintext)) as SyncData;
      }

      const local = readLocal();
      const merged = remote ? mergeSyncData(local, remote) : {
        ...local,
        settings: { ...local.settings, updatedAt: local.settings.updatedAt ?? new Date().toISOString() },
      };
      const data: SyncData = {
        subjects: merged.subjects,
        sessions: merged.sessions,
        settings: merged.settings,
        deletedIds: merged.deletedIds,
      };
      if (remote && JSON.stringify(remote) === JSON.stringify(data)) return data;

      const iv = crypto.getRandomValues(new Uint8Array(12));
      const ciphertext = await crypto.subtle.encrypt(
        { name: 'AES-GCM', iv }, key, encoder.encode(JSON.stringify(data))
      );
      const write = await fetch(url, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json', 'If-Match': etag },
        body: JSON.stringify({ iv: toBase64(iv), ciphertext: toBase64(new Uint8Array(ciphertext)) }),
        signal,
      });
      if (write.ok) return data;
      if (write.status !== 412) throw new Error('Could not write sync room');
    }
    throw new Error('Sync room changed repeatedly');
  },
};
