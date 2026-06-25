// Pure ongoing-period detection for the context-aware period CTA
// (spec-period-range-picker.md). An "ongoing" period is the most recent (by
// start_date) period whose end_date is still null — the one the Flower can close
// out via "Periode-Ende eintragen". Kept pure and synchronous (no clock, no
// React, no DB) so it is unit-testable, mirroring the pure models in
// range-selection.ts and features/flower/calendar.ts. ISO `DATE` strings
// (YYYY-MM-DD) compare lexicographically, so no Date object is needed. The input
// order is not assumed — older open rows are a data-entry edge, so the most
// recent open row wins (spec risk note).

import type { Period } from '../../lib/data';

/**
 * The ongoing period: the most recent (by `start_date`) period whose `end_date`
 * is null, or null when none is open. Multiple open rows resolve to the most
 * recent one; periods with an end are ignored.
 */
export function findOngoingPeriod(periods: readonly Period[]): Period | null {
  let ongoing: Period | null = null;
  for (const period of periods) {
    if (period.end_date !== null) continue;
    if (ongoing === null || period.start_date > ongoing.start_date) {
      ongoing = period;
    }
  }
  return ongoing;
}
