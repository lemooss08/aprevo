import { describe, expect, it } from 'vitest';
import {
  formatDateBR, formatSecondsToHMS, formatSecondsToHuman, getStartOfWeek, isSameDay,
} from './formatters';

describe('duration formatting', () => {
  it('floors fractions, clamps negative values and supports long sessions', () => {
    expect(formatSecondsToHMS(-15)).toBe('00:00:00');
    expect(formatSecondsToHMS(3661.9)).toBe('01:01:01');
    expect(formatSecondsToHMS(360000)).toBe('100:00:00');
  });

  it('formats durations at unit boundaries', () => {
    expect(formatSecondsToHuman(59)).toBe('59s');
    expect(formatSecondsToHuman(60)).toBe('1 min');
    expect(formatSecondsToHuman(3600)).toBe('1h');
    expect(formatSecondsToHuman(3660)).toBe('1h 1m');
  });
});

describe('calendar formatting', () => {
  it('preserves the calendar day for date-only strings', () => {
    expect(formatDateBR('2026-11-23')).toBe('23/11/2026');
    expect(formatDateBR('invalid')).toBe('invalid');
  });

  it('uses local time for timestamps and starts the week on Monday', () => {
    expect(formatDateBR(new Date(2026, 10, 23, 1).toISOString())).toBe('23/11/2026');
    const sunday = new Date(2026, 10, 29, 14);
    expect(getStartOfWeek(sunday)).toEqual(new Date(2026, 10, 23));
    expect(isSameDay(sunday, new Date(2026, 10, 29, 23))).toBe(true);
  });
});
