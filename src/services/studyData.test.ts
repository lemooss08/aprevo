import { describe, expect, it } from 'vitest';
import { mergeStudyData } from './studyData';
import { DEFAULT_SETTINGS } from './storage';
import type { StudySession, Subject, StudyData } from '../types';

const oldDate = '2026-11-23T12:00:00.000Z';
const newDate = '2026-11-24T12:00:00.000Z';
const subject = (id: string, updatedAt = oldDate): Subject => ({
  id, name: id, color: '#fff', createdAt: oldDate, updatedAt,
});
const session = (id: string, startedAt = oldDate): StudySession => ({
  id, subjectId: 'math', topic: 'Private notes', durationSeconds: 30,
  startedAt, endedAt: startedAt, type: 'manual',
});
const data = (overrides: Partial<StudyData> = {}): StudyData => ({
  subjects: [], sessions: [], settings: DEFAULT_SETTINGS, ...overrides,
});

describe('mergeStudyData', () => {
  it('preserves both devices’ records, deduplicates by ID and sorts sessions', () => {
    const local = data({ subjects: [subject('math')], sessions: [session('desktop')] });
    const remote = data({
      subjects: [subject('math', newDate), subject('history')],
      sessions: [session('phone', newDate), session('desktop')],
    });
    const merged = mergeStudyData(local, remote);
    expect(merged.subjects).toEqual(remote.subjects);
    expect(merged.sessions).toEqual(remote.sessions);
    expect(merged.hasChanges).toBe(true);
    expect(mergeStudyData(merged, remote).hasChanges).toBe(false);
  });

  it('preserves local edits against older remote copies', () => {
    const edited = { ...session('one'), durationSeconds: 50, updatedAt: newDate };
    const merged = mergeStudyData(data({ sessions: [edited] }), data({ sessions: [session('one')] }));
    expect(merged.sessions).toEqual([edited]);
    expect(merged.hasChanges).toBe(false);
  });

  it('propagates deletions and newer settings', () => {
    const settings = { ...DEFAULT_SETTINGS, dailyGoalMinutes: 80, updatedAt: newDate };
    const local = data({ subjects: [subject('math')], deletedIds: ['session'] });
    const remote = data({ settings, sessions: [session('session')], deletedIds: ['math'] });
    const merged = mergeStudyData(local, remote);
    expect(merged.subjects).toEqual([]);
    expect(merged.sessions).toEqual([]);
    expect(merged.settings).toEqual(settings);
    expect(merged.hasChanges).toBe(true);
  });
});

