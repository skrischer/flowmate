// Pure prediction-to-display mapping for the Flower home (issue #25). Maps the
// FlowerPrediction view-model to German labels and the days-to-next-period count
// the screen renders. Kept pure and synchronous so it is unit-testable without a
// React renderer (spec-flower-experience: Phase 4 adds unit tests for the
// prediction-mapping helpers). No clock access here — `today` arrives via the
// view-model, which read it once at the wiring boundary.
// buildWeekDays (#77) and greeting (#80) helpers are also pure and added here.

import { addDays, daysBetween } from '../../lib/prediction/dates';
import type { Confidence, Phase } from '../../lib/prediction';
import type { FlowerPrediction } from './prediction';
import type { WeekDay } from '../../components/WeekGlance';

const WEEKDAY_LABELS = ['Mo', 'Di', 'Mi', 'Do', 'Fr', 'Sa', 'So'] as const;

// Days since the nearest preceding Monday for a given ISO date.
// Uses the same known-Monday anchor (1970-01-05) as the calendar grid.
function mondayOffset(date: string): number {
  const diff = daysBetween('1970-01-05', date);
  return ((diff % 7) + 7) % 7;
}

/**
 * Builds the 7 WeekDay entries for the Mon-Sun week that contains `today`.
 * `loggedDates` is the set of ISO dates that have a period log (used for dots).
 * `moodDates` is the set of ISO dates that have a mood log (used for dots).
 */
export function buildWeekDays(
  today: string,
  loggedDates: ReadonlySet<string>,
  moodDates: ReadonlySet<string>,
): WeekDay[] {
  const offset = mondayOffset(today);
  const monday = addDays(today, -offset);
  return Array.from({ length: 7 }, (_, i) => {
    const date = addDays(monday, i);
    const dayNum = Number(date.slice(8, 10));
    return {
      date,
      day: dayNum,
      weekLabel: WEEKDAY_LABELS[i] ?? '',
      isToday: date === today,
      hasPeriodLog: loggedDates.has(date),
      hasMoodLog: moodDates.has(date),
    };
  });
}

/** Returns a time-of-day greeting in German for the given hour (0-23). */
export function greeting(hour: number): string {
  if (hour < 12) return 'Guten Morgen';
  if (hour < 18) return 'Guten Tag';
  return 'Guten Abend';
}

/**
 * Display headline for the phase card: 'Periode in X Tagen' / 'Periode heute
 * erwartet'. Distinct from nextPeriodLabel which produces the shorter stat-row
 * form ('In X Tagen'). Both cover the same three-branch structure intentionally.
 */
export function periodHeadline(days: number): string {
  if (days <= 0) return 'Periode heute erwartet';
  if (days === 1) return 'Periode in 1 Tag';
  return `Periode in ${days} Tagen`;
}

/** One-line reassurance text per confidence state. */
export function reassuranceLine(confidence: Confidence): string {
  if (confidence === 'none') return 'Noch zu wenige Zyklen fuer eine Prognose.';
  if (confidence === 'low') return 'Unregelmaessige Zyklen — Prognose mit Vorbehalt.';
  return 'Dein Zyklus laeuft ruhig und regelmaessig.';
}

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
