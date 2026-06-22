// Pure prediction-to-display mapping for the Flower home (issue #25). Maps the
// FlowerPrediction view-model to German labels and the days-to-next-period count
// the screen renders. Kept pure and synchronous so it is unit-testable without a
// React renderer (spec-flower-experience: Phase 4 adds unit tests for the
// prediction-mapping helpers). No clock access here — `today` arrives via the
// view-model, which read it once at the wiring boundary.

import { daysBetween } from '../../lib/prediction/dates';
import type { Confidence, Phase } from '../../lib/prediction';
import type { FlowerPrediction } from './prediction';

/** German display label for each cycle phase. */
const PHASE_LABELS: Record<Phase, string> = {
  menstrual: 'Menstruation',
  follicular: 'Follikelphase',
  ovulation: 'Eisprung',
  luteal: 'Lutealphase',
};

/** Returns the German label for a cycle phase. */
export function phaseLabel(phase: Phase): string {
  return PHASE_LABELS[phase];
}

/**
 * Whole days from `today` until the predicted next period start (never below 0;
 * on or past the predicted day the next cycle has begun and the count is 0).
 */
export function daysToNextPeriod(today: string, nextPeriodDate: string): number {
  return Math.max(0, daysBetween(today, nextPeriodDate));
}

/** Renders a days-to-next-period count as a short German phrase. */
export function nextPeriodLabel(days: number): string {
  if (days <= 0) {
    return 'Heute erwartet';
  }
  if (days === 1) {
    return 'In 1 Tag';
  }
  return `In ${days} Tagen`;
}

/**
 * The low-confidence caveat shown alongside (and distinct from) the always-on
 * disclaimer, or `null` when the confidence does not warrant one. `none` shows a
 * dedicated backfill state instead of a caveat, so it returns `null` here too.
 */
export function confidenceCaveat(confidence: Confidence): string | null {
  if (confidence === 'low') {
    return 'Unregelmaessige Zyklen — diese Prognose ist weniger sicher.';
  }
  return null;
}

/** True when the history is too short to anchor a prediction (backfill state). */
export function isInsufficient(view: FlowerPrediction): boolean {
  return view.prediction === null || view.confidence === 'none';
}
