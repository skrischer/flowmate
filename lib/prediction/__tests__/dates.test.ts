/// <reference types="jest" />
import { addDays, daysBetween, isIsoDate } from '../dates';

describe('isIsoDate', () => {
  it('accepts well-formed calendar dates', () => {
    expect(isIsoDate('2026-01-01')).toBe(true);
    expect(isIsoDate('2024-02-29')).toBe(true); // leap day
  });

  it('rejects malformed or overflowing dates', () => {
    expect(isIsoDate('2026-1-1')).toBe(false);
    expect(isIsoDate('2026-13-01')).toBe(false);
    expect(isIsoDate('2026-02-30')).toBe(false);
    expect(isIsoDate('2025-02-29')).toBe(false); // not a leap year
    expect(isIsoDate('not-a-date')).toBe(false);
    expect(isIsoDate('')).toBe(false);
  });
});

describe('daysBetween', () => {
  it('counts whole days forward and backward', () => {
    expect(daysBetween('2026-01-01', '2026-01-29')).toBe(28);
    expect(daysBetween('2026-01-29', '2026-01-01')).toBe(-28);
    expect(daysBetween('2026-01-01', '2026-01-01')).toBe(0);
  });

  it('counts across a leap-year February', () => {
    expect(daysBetween('2024-02-28', '2024-03-01')).toBe(2);
    expect(daysBetween('2025-02-28', '2025-03-01')).toBe(1);
  });

  it('counts across a year boundary', () => {
    expect(daysBetween('2026-12-31', '2027-01-01')).toBe(1);
  });
});

describe('addDays', () => {
  it('shifts within a month', () => {
    expect(addDays('2026-01-01', 28)).toBe('2026-01-29');
  });

  it('rolls over month and year boundaries', () => {
    expect(addDays('2026-12-13', 28)).toBe('2027-01-10');
    expect(addDays('2026-01-31', 1)).toBe('2026-02-01');
  });

  it('handles leap-day arithmetic', () => {
    expect(addDays('2024-02-28', 1)).toBe('2024-02-29');
    expect(addDays('2025-02-28', 1)).toBe('2025-03-01');
  });

  it('is the inverse of daysBetween', () => {
    expect(addDays('2026-03-15', daysBetween('2026-03-15', '2026-09-02'))).toBe('2026-09-02');
  });
});
