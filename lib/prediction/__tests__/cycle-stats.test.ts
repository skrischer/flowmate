/// <reference types="jest" />
import {
  MAX_CYCLE_SAMPLE,
  cycleLengthStats,
  cycleLengths,
  predictNextPeriodDate,
  type PeriodStart,
} from '../cycle-stats';

const periods = (...dates: string[]): PeriodStart[] => dates.map((startDate) => ({ startDate }));

describe('cycleLengths', () => {
  it('computes consecutive day gaps for a regular 28-day history', () => {
    expect(cycleLengths(periods('2026-01-01', '2026-01-29', '2026-02-26'))).toEqual([28, 28]);
  });

  it('sorts the input ascending before differencing', () => {
    expect(cycleLengths(periods('2026-02-26', '2026-01-01', '2026-01-29'))).toEqual([28, 28]);
  });

  it('drops duplicate and invalid starts', () => {
    expect(cycleLengths(periods('2026-01-01', '2026-01-01', 'not-a-date', '2026-01-29'))).toEqual([28]);
  });

  it('returns an empty list for zero or one valid start', () => {
    expect(cycleLengths(periods())).toEqual([]);
    expect(cycleLengths(periods('2026-01-01'))).toEqual([]);
  });
});

describe('cycleLengthStats', () => {
  it('returns null when no cycle length can be derived', () => {
    expect(cycleLengthStats(periods('2026-01-01'))).toBeNull();
  });

  it('reports median, mean, min, max for a regular history', () => {
    const stats = cycleLengthStats(periods('2026-01-01', '2026-01-29', '2026-02-26', '2026-03-26'));
    expect(stats).toEqual({ count: 3, median: 28, mean: 28, min: 28, max: 28 });
  });

  it('takes the median of the last <=6 cycle lengths only', () => {
    // 9 starts => 8 lengths; only the last 6 (all 30) feed the stats, the early 90s are ignored.
    const stats = cycleLengthStats(
      periods(
        '2026-01-01',
        '2026-04-01', // 90
        '2026-06-30', // 90
        '2026-07-30', // 30
        '2026-08-29', // 30
        '2026-09-28', // 30
        '2026-10-28', // 30
        '2026-11-27', // 30
        '2026-12-27', // 30
      ),
    );
    expect(stats).toEqual({ count: MAX_CYCLE_SAMPLE, median: 30, mean: 30, min: 30, max: 30 });
  });

  it('averages the two middle values for an even sample', () => {
    const stats = cycleLengthStats(periods('2026-01-01', '2026-01-29', '2026-02-28'));
    // lengths [28, 30] => median 29, mean 29
    expect(stats).toEqual({ count: 2, median: 29, mean: 29, min: 28, max: 30 });
  });

  it('rounds an even sample with a .5 raw median to whole days', () => {
    const stats = cycleLengthStats(periods('2026-04-08', '2026-05-05', '2026-06-02'));
    // lengths [27, 28] => raw median 27.5 => rounded to 28 whole days (mean stays exact)
    expect(stats).toEqual({ count: 2, median: 28, mean: 27.5, min: 27, max: 28 });
  });

  it('uses the median to resist a one-off irregular outlier', () => {
    // lengths [28, 28, 60, 28] => median 28 despite the 60-day outlier
    const stats = cycleLengthStats(periods('2026-01-01', '2026-01-29', '2026-02-26', '2026-04-27', '2026-05-25'));
    expect(stats?.median).toBe(28);
    expect(stats?.max).toBe(60);
  });
});

describe('predictNextPeriodDate', () => {
  it('predicts last start + median length for a regular history', () => {
    const result = predictNextPeriodDate(periods('2026-01-01', '2026-01-29', '2026-02-26'), '2026-03-01');
    expect(result?.nextPeriodDate).toBe('2026-03-26');
    expect(result?.stats.median).toBe(28);
  });

  it('anchors on the most recent start regardless of input order', () => {
    const result = predictNextPeriodDate(periods('2026-02-26', '2026-01-01', '2026-01-29'), '2026-03-01');
    expect(result?.nextPeriodDate).toBe('2026-03-26');
  });

  it('yields a valid whole-day date when the median is fractional', () => {
    // Regression: lengths [27, 28] => raw median 27.5 once made addDays emit a
    // malformed "2026-06-29.5" that failed ISO validation downstream.
    const result = predictNextPeriodDate(periods('2026-04-08', '2026-05-05', '2026-06-02'), '2026-06-22');
    expect(result?.nextPeriodDate).toBe('2026-06-30');
  });

  it('returns null when history is insufficient', () => {
    expect(predictNextPeriodDate(periods('2026-01-01'), '2026-01-15')).toBeNull();
    expect(predictNextPeriodDate(periods(), '2026-01-15')).toBeNull();
  });

  it('crosses month and year boundaries correctly', () => {
    const result = predictNextPeriodDate(periods('2026-11-15', '2026-12-13'), '2026-12-20');
    // 28-day cycle from 2026-12-13 => 2027-01-10
    expect(result?.nextPeriodDate).toBe('2027-01-10');
  });

  it('rejects an invalid reference date', () => {
    expect(() => predictNextPeriodDate(periods('2026-01-01', '2026-01-29'), '2026-13-40')).toThrow(RangeError);
  });
});
