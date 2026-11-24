import { afterEach, describe, expect, it, vi } from 'vitest';
import { generatePairingCode, isPairingCode, mergeSyncData, syncService } from './syncService';
import { DEFAULT_SETTINGS } from './storage';
import type { StudySession, Subject, SyncData } from '../types';

const oldDate = '2026-11-23T12:00:00.000Z';
const newDate = '2026-11-24T12:00:00.000Z';
const subject = (id: string, updatedAt = oldDate): Subject => ({
  id, name: id, color: '#fff', createdAt: oldDate, updatedAt,
});
const session = (id: string, startedAt = oldDate): StudySession => ({
  id, subjectId: 'math', topic: 'Private notes', durationSeconds: 30,
  startedAt, endedAt: startedAt, type: 'manual',
});
const data = (overrides: Partial<SyncData> = {}): SyncData => ({
  subjects: [], sessions: [], settings: DEFAULT_SETTINGS, ...overrides,
});

afterEach(() => vi.unstubAllGlobals());

describe('mergeSyncData', () => {
  it('preserves both devices’ records, deduplicates by ID and sorts sessions', () => {
    const local = data({ subjects: [subject('math')], sessions: [session('desktop')] });
    const remote = data({
      subjects: [subject('math', newDate), subject('history')],
      sessions: [session('phone', newDate), session('desktop')],
    });
    const merged = mergeSyncData(local, remote);
    expect(merged.subjects).toEqual(remote.subjects);
    expect(merged.sessions).toEqual(remote.sessions);
    expect(merged.hasChanges).toBe(true);
    expect(mergeSyncData(merged, remote).hasChanges).toBe(false);
  });

  it('preserves local edits against older remote copies', () => {
    const edited = { ...session('one'), durationSeconds: 50, updatedAt: newDate };
    const merged = mergeSyncData(data({ sessions: [edited] }), data({ sessions: [session('one')] }));
    expect(merged.sessions).toEqual([edited]);
    expect(merged.hasChanges).toBe(false);
  });

  it('propagates deletions and newer settings', () => {
    const settings = { ...DEFAULT_SETTINGS, dailyGoalMinutes: 80, updatedAt: newDate };
    const local = data({ subjects: [subject('math')], deletedIds: ['session'] });
    const remote = data({ settings, sessions: [session('session')], deletedIds: ['math'] });
    const merged = mergeSyncData(local, remote);
    expect(merged.subjects).toEqual([]);
    expect(merged.sessions).toEqual([]);
    expect(merged.settings).toEqual(settings);
    expect(merged.hasChanges).toBe(true);
  });
});

describe('cloud exchange', () => {
  function mockFirebase() {
    vi.stubGlobal('localStorage', { getItem: () => 'https://example.firebaseio.com/rooms' });
    let envelope: string | null = null;
    let version = 0;
    const fetch = vi.fn(async (_url: string, options: RequestInit) => {
      const etag = String(version);
      if (options.method !== 'PUT') {
        return new Response(envelope ?? 'null', { headers: { ETag: etag } });
      }
      if (new Headers(options.headers).get('If-Match') !== etag) {
        return new Response(null, { status: 412 });
      }
      envelope = String(options.body);
      version++;
      return new Response(envelope);
    });
    vi.stubGlobal('fetch', fetch);
    return { fetch, envelope: () => envelope };
  }

  it('encrypts the cloud payload and preserves concurrent writes', async () => {
    const { fetch, envelope } = mockFirebase();
    const code = generatePairingCode();
    expect(isPairingCode(code)).toBe(true);
    await syncService.exchange(code, () => data(), 'create');
    const [desktop, phone] = await Promise.all([
      syncService.exchange(code, () => data({ sessions: [session('desktop')] }), 'join'),
      syncService.exchange(code, () => data({ sessions: [session('phone')] }), 'join'),
    ]);
    expect(Math.max(desktop.sessions.length, phone.sessions.length)).toBe(2);
    const final = await syncService.exchange(code, () => data(), 'sync');
    expect(final.sessions.map(({ id }) => id).sort()).toEqual(['desktop', 'phone']);
    expect(envelope()).not.toContain('Private notes');
    expect(fetch.mock.calls.every(([url, options]) => !url.includes(code) && !String(options.body).includes(code))).toBe(true);
  });

  it('does not create a missing room while joining or send legacy codes', async () => {
    const { fetch } = mockFirebase();
    await expect(syncService.exchange(generatePairingCode(), () => data(), 'join')).rejects.toThrow();
    await expect(syncService.exchange('APRV-ABCD-EFGH', () => data(), 'sync')).rejects.toThrow();
    expect(fetch).toHaveBeenCalledTimes(1);
  });
});
