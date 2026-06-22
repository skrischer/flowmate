// Current-phase, fertile-window, and ovulation prediction (calendar method).
//
// Pure, deterministic, no I/O: callers pass the full periods history and a
// reference "today" (constitution: the engine is pure and unit-testable). This
// step (issue #18) assembles the cross-phase Prediction result on top of the
// cycle-length statistics and next-period prediction from issue #17.
//
// These are PREDICTIONS, not guarantees: the calendar method estimates the
// fertile window and ovulation from past cycle lengths only and can be wrong,
// especially for irregular cycles. The Phase 4 UI renders the mandatory
// "prediction, not a guarantee" disclaimer; this module computes the values.
// Spec: docs/specs/spec-prediction.md.

import { cycleLengthStats, latestPeriodStart, predictNextPeriodDate, type PeriodStart } from './cycle-stats';
import { addDays, daysBetween, isIsoDate } from './dates';

/** The four cycle phases, ordered as they occur within a cycle. */
export type Phase = 'menstrual' | 'follicular' | 'ovulation' | 'luteal';

/** How much the calendar prediction can be trusted, given the logged history. */
export type Confidence = 'none' | 'low' | 'medium' | 'high';

/** An inclusive ISO-date range (YYYY-MM-DD). */
export type DateRange = {
  /** First day of the range (inclusive). */
  start: string;
  /** Last day of the range (inclusive). */
  end: string;
};

/**
 * The cross-phase prediction result rendered in Phase 4 and pushed on in Phase 6.
 *
 * This is a PREDICTION, not a guarantee — the consuming surface must render the
 * "prediction, not a guarantee" disclaimer (constitution).
 */
export type Prediction = {
  /** The cycle phase `today` falls in. */
  currentPhase: Phase;
  /** Predicted next period start as an ISO calendar date (YYYY-MM-DD). */
  nextPeriodDate: string;
  /** Estimated ovulation day (next period − 14 days), as an ISO calendar date. */
  ovulationDate: string;
  /** Fertile window (ovulation −5 .. +1), or `null` when withheld for low trust. */
  fertileWindow: DateRange | null;
  /** Confidence in the prediction, derived from the logged history. */
  confidence: Confidence;
};

/** Whole days of bleed assumed at the start of a cycle (standard calendar value). */
export const MENSTRUAL_DAYS = 5;

/** Luteal-phase length in days; ovulation is estimated this far before the next period. */
export const LUTEAL_DAYS = 14;

/** Fertile window opens this many days before ovulation (sperm survival ~5 days). */
export const FERTILE_DAYS_BEFORE = 5;

/** Fertile window closes this many days after ovulation (ovum survival ~1 day). */
export const FERTILE_DAYS_AFTER = 1;

/** Minimum logged period starts before any prediction is surfaced (conservative policy). */
export const MIN_PERIODS_FOR_PREDICTION = 3;

/** Spread (max − min) of recent cycle lengths above which cycles count as irregular. */
export const IRREGULAR_SPREAD_DAYS = 9;

/** Cycle-length count at or above which a regular history reaches the highest confidence. */
export const HIGH_CONFIDENCE_SAMPLE = 6;

/**
 * Builds the full prediction (current phase, next period, ovulation, fertile
 * window, confidence) from the periods history and a reference `today`.
 *
 * Returns `null` when no cycle length can be derived at all (fewer than two
 * logged period starts) — there is then nothing to anchor a phase on. With
 * enough history to derive a cycle length but below the conservative threshold,
 * a prediction is returned with `confidence: 'none'` and `fertileWindow: null`.
 */
export function buildPrediction(
  periods: readonly PeriodStart[],
  today: string,
): Prediction | null {
  if (!isIsoDate(today)) {
    throw new RangeError(`Invalid reference date "today": ${today}`);
  }
  const next = predictNextPeriodDate(periods, today);
  const cycleStart = latestPeriodStart(periods);
  if (next === null || cycleStart === null) {
    return null;
  }
  const ovulationDate = addDays(next.nextPeriodDate, -LUTEAL_DAYS);
  const confidence = predictionConfidence(periods);
  return {
    currentPhase: currentPhase(today, cycleStart, next.nextPeriodDate, ovulationDate),
    nextPeriodDate: next.nextPeriodDate,
    ovulationDate,
    fertileWindow: confidence === 'none' ? null : fertileWindow(ovulationDate),
    confidence,
  };
}

/** The fertile window (ovulation −5 .. +1) around an estimated ovulation day. */
export function fertileWindow(ovulationDate: string): DateRange {
  return {
    start: addDays(ovulationDate, -FERTILE_DAYS_BEFORE),
    end: addDays(ovulationDate, FERTILE_DAYS_AFTER),
  };
}

/**
 * The phase `today` falls in for the current cycle.
 *
 * The cycle runs from `cycleStart` (the most recent logged period start) to the
 * predicted `nextPeriodDate`, with the estimated `ovulationDate` 14 days before
 * the next period. Menstruation spans the first {@link MENSTRUAL_DAYS} days, the
 * remainder splits into follicular (pre-ovulation) and luteal (post-ovulation),
 * and the ovulation day itself is its own phase. On or after the predicted next
 * period the cycle has rolled over, so `today` is reported as menstrual again.
 */
export function currentPhase(
  today: string,
  cycleStart: string,
  nextPeriodDate: string,
  ovulationDate: string,
): Phase {
  if (daysBetween(today, nextPeriodDate) <= 0) {
    // The period is due or overdue: the next cycle has effectively begun.
    return 'menstrual';
  }
  if (daysBetween(cycleStart, today) < MENSTRUAL_DAYS) {
    return 'menstrual';
  }
  const ovulationOffset = daysBetween(today, ovulationDate);
  if (ovulationOffset > 0) {
    return 'follicular';
  }
  if (ovulationOffset === 0) {
    return 'ovulation';
  }
  return 'luteal';
}

/** Confidence in the prediction per the conservative insufficient/irregular policy. */
export function predictionConfidence(periods: readonly PeriodStart[]): Confidence {
  const validStarts = periods.filter((period) => isIsoDate(period.startDate)).length;
  const stats = cycleLengthStats(periods);
  if (stats === null || validStarts < MIN_PERIODS_FOR_PREDICTION) {
    return 'none';
  }
  if (stats.max - stats.min > IRREGULAR_SPREAD_DAYS) {
    return 'low';
  }
  return stats.count >= HIGH_CONFIDENCE_SAMPLE ? 'high' : 'medium';
}
