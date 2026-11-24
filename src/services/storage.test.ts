import { afterEach, expect, it, vi } from 'vitest';
import { createStudyStorage, DEFAULT_SETTINGS } from './storage';

afterEach(() => vi.unstubAllGlobals());

it('keeps legacy, first account, and second account data separate', () => {
  const values = new Map<string, string>();
  vi.stubGlobal('localStorage', {
    getItem: (key: string) => values.get(key) ?? null,
    setItem: (key: string, value: string) => values.set(key, value),
    removeItem: (key: string) => values.delete(key),
  });
  const legacy = createStudyStorage();
  const first = createStudyStorage('first');
  const second = createStudyStorage('second');
  legacy.saveSettings({ ...DEFAULT_SETTINGS, userName: 'Legacy' });
  first.saveSettings({ ...DEFAULT_SETTINGS, userName: 'First' });
  first.saveDeletedIds(['session-1']);
  expect(createStudyStorage('first').getSettings().userName).toBe('First');
  expect(legacy.getSettings().userName).toBe('Legacy');
  expect(second.getSettings()).toEqual(DEFAULT_SETTINGS);
  expect(second.getDeletedIds()).toEqual([]);
});
