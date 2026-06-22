/// <reference types="jest" />
import { todayIso } from '../today';

describe('todayIso', () => {
  it('formats the injected local date as YYYY-MM-DD', () => {
    // Month is zero-based in the Date constructor: 0 => January.
    expect(todayIso(new Date(2026, 0, 1))).toBe('2026-01-01');
    expect(todayIso(new Date(2026, 5, 22))).toBe('2026-06-22');
  });

  it('zero-pads single-digit months and days', () => {
    expect(todayIso(new Date(2026, 8, 9))).toBe('2026-09-09');
  });

  it('uses the local calendar day, not the UTC day', () => {
    // 23:30 local on 2026-03-15: a UTC-based formatter could roll to the 16th in
    // positive offsets; the local-parts formatter must stay on the 15th.
    expect(todayIso(new Date(2026, 2, 15, 23, 30))).toBe('2026-03-15');
  });

  it('returns a valid ISO date for the real wall clock', () => {
    expect(todayIso()).toMatch(/^\d{4}-\d{2}-\d{2}$/);
  });
});
