// Cycle-length statistics and next-period prediction (calendar method).
//
// Pure, deterministic, no I/O: callers pass the full periods history and a
// reference "today". Cycle length is derived from consecutive start_date values
// only (end_date is not a prediction input in v1). The calendar method pins the
// expected cycle length to the median of the last <=6 cycle lengths so a one-off
// irregular cycle does not skew the prediction (spec: docs/specs/spec-prediction.md).

import { addDays, daysBetween, isIsoDate } from './dates';

/** The maximum number of recent cycle lengths the median is taken over. */
export const MAX_CYCLE_SAMPLE = 6;

/** A single logged period start. The engine reads start_date only. */
export type PeriodStart = {
  /** Period start as an ISO calendar date (YYYY-MM-DD). */
  startDate: string;
};

/**
 * Cycle-length statistics over the recent sample (last <=6 cycle lengths).
 * `null` when there are fewer than two period starts, so no cycle length exists.
 */
export type CycleLengthStats = {
  /** Number of cycle lengths in the sample the stats were computed over. */
  count: number;
  /** Median cycle length in whole days — the value used for prediction. */
  median: number;
  /** Arithmetic mean cycle length in whole days (not rounded). */
  mean: number;
  /** Shortest cycle length in the sample, in whole days. */
  min: number;
  /** Longest cycle length in the sample, in whole days. */
  max: number;
};

/**
 * Next-period prediction. `null` when history is insufficient to derive a cycle
 * length (fewer than two logged period starts).
 */
export type NextPeriodPrediction = {
  /** Predicted next period start as an ISO calendar date (YYYY-MM-DD). */
  nextPeriodDate: string;
  /** The stats the prediction was derived from. */
  stats: CycleLengthStats;
};

/**
 * Cycle lengths in whole days between consecutive period starts, oldest first.
 * Input order is irrelevant: the history is sorted ascending internally and
 * invalid / duplicate dates are dropped (callers need not pre-clean).
 */
export function cycleLengths(periods: readonly PeriodStart[]): number[] {
  const starts = sortedUniqueStarts(periods);
  const lengths: number[] = [];
  for (let i = 1; i < starts.length; i += 1) {
    const previous = starts[i - 1];
    const current = starts[i];
    if (previous !== undefined && current !== undefined) {
      lengths.push(daysBetween(previous, current));
    }
  }
  return lengths;
}

/**
 * Cycle-length statistics over the last <=6 cycle lengths, or `null` when fewer
 * than two valid period starts are available.
 */
export function cycleLengthStats(periods: readonly PeriodStart[]): CycleLengthStats | null {
  const lengths = cycleLengths(periods);
  if (lengths.length === 0) {
    return null;
  }
  const sample = lengths.slice(-MAX_CYCLE_SAMPLE);
  const sum = sample.reduce((total, length) => total + length, 0);
  return {
    count: sample.length,
    // Whole days (the field's contract): an even sample can yield a .5 raw
    // median, which would make addDays() produce a malformed (fractional) date.
    median: Math.round(median(sample)),
    mean: sum / sample.length,
    min: Math.min(...sample),
    max: Math.max(...sample),
  };
}

/**
 * Predicts the next period start from the most recent logged start plus the
 * median cycle length. `today` is accepted for caller symmetry but does not
 * shift the anchor: the prediction is always relative to the last logged start.
 * Returns `null` when history is insufficient to derive a cycle length.
 */
export function predictNextPeriodDate(
  periods: readonly PeriodStart[],
  today: string,
): NextPeriodPrediction | null {
  if (!isIsoDate(today)) {
    throw new RangeError(`Invalid reference date "today": ${today}`);
  }
  const stats = cycleLengthStats(periods);
  if (stats === null) {
    return null;
  }
  const starts = sortedUniqueStarts(periods);
  const lastStart = starts[starts.length - 1];
  if (lastStart === undefined) {
    return null;
  }
  return {
    nextPeriodDate: addDays(lastStart, stats.median),
    stats,
  };
}

/**
 * The most recent valid period start (the current cycle's anchor), or `null`
 * when the history holds no valid start. Input order is irrelevant.
 */
export function latestPeriodStart(periods: readonly PeriodStart[]): string | null {
  const starts = sortedUniqueStarts(periods);
  return starts[starts.length - 1] ?? null;
}

/** Valid, de-duplicated period starts, sorted ascending by date. */
function sortedUniqueStarts(periods: readonly PeriodStart[]): string[] {
  const valid = periods
    .map((period) => period.startDate)
    .filter((startDate) => isIsoDate(startDate));
  const unique = Array.from(new Set(valid));
  return unique.sort((a, b) => daysBetween(b, a));
}

/** Median of a non-empty list of numbers (mean of the two middle values when even). */
function median(values: readonly number[]): number {
  const sorted = [...values].sort((a, b) => a - b);
  const mid = Math.floor(sorted.length / 2);
  const upper = sorted[mid] ?? 0;
  if (sorted.length % 2 === 1) {
    return upper;
  }
  const lower = sorted[mid - 1] ?? 0;
  return (lower + upper) / 2;
}
