// Pure range-selection model for the Flower period range picker
// (spec-period-range-picker.md). One month calendar selects a start plus an
// optional end; an open end ("läuft noch") is the default resting state. Kept
// pure and synchronous (no clock, no React) so it is unit-testable, mirroring
// the pure month-grid model in features/flower/calendar.ts: tap + current state
// → next state. ISO `DATE` strings (YYYY-MM-DD) compare lexicographically, so no
// Date object is needed. No raw health data here — just calendar days.

/** A start day plus an optional (nullable) end — null end means "läuft noch". */
export type RangeSelection = {
  /** Selected start day as YYYY-MM-DD, or '' when no start is chosen yet. */
  start: string;
  /** Selected end day as YYYY-MM-DD, or null for an open end ("läuft noch"). */
  end: string | null;
};

/** Where a day sits relative to the current range, for styling the grid cell. */
export type RangeRole = 'start' | 'end' | 'between' | 'none';

/**
 * The next selection after tapping `day` (YYYY-MM-DD). A tap before the current
 * start — or when no start is set yet — (re-)anchors the start and clears the
 * end; a tap on or after the start sets the end (the span between is filled). An
 * end can therefore never precede the start: a tap before it becomes a new start
 * rather than an invalid end (the min-date guarantee).
 */
export function selectDay(state: RangeSelection, day: string): RangeSelection {
  if (state.start === '' || day < state.start) {
    return { start: day, end: null };
  }
  return { start: state.start, end: day };
}

/**
 * Classifies `day` against the current range so the grid can fill the span:
 * the start and end endpoints, the days strictly between them, or none. With an
 * open end only the start is marked; a single-day range (start === end) reads as
 * the start.
 */
export function rangeRoleOf(state: RangeSelection, day: string): RangeRole {
  if (state.start === '') {
    return 'none';
  }
  if (day === state.start) {
    return 'start';
  }
  if (state.end === null) {
    return 'none';
  }
  if (day === state.end) {
    return 'end';
  }
  if (day > state.start && day < state.end) {
    return 'between';
  }
  return 'none';
}
