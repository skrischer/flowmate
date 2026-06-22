// Local calendar-day helpers for the period logging surfaces. Periods are
// stored as ISO `DATE` strings (YYYY-MM-DD, no time) to avoid timezone drift
// (spec: cycle logging). These helpers keep that representation in one place so
// the screens never juggle Date objects or timestamps directly.

const ISO_DATE = /^\d{4}-\d{2}-\d{2}$/;

/** Today as a local YYYY-MM-DD string (the default start date for a new log). */
export function todayIso(): string {
  const now = new Date();
  const year = now.getFullYear();
  const month = `${now.getMonth() + 1}`.padStart(2, '0');
  const day = `${now.getDate()}`.padStart(2, '0');
  return `${year}-${month}-${day}`;
}

/**
 * Validates a YYYY-MM-DD string as a real calendar day. Returns true only when
 * the shape matches and the parts form an existing date (e.g. rejects 2026-02-30).
 */
export function isValidIso(value: string): boolean {
  if (!ISO_DATE.test(value)) {
    return false;
  }
  const parts = value.split('-');
  const year = Number(parts[0]);
  const month = Number(parts[1]);
  const day = Number(parts[2]);
  if (month < 1 || month > 12 || day < 1 || day > 31) {
    return false;
  }
  const date = new Date(year, month - 1, day);
  return (
    date.getFullYear() === year &&
    date.getMonth() === month - 1 &&
    date.getDate() === day
  );
}

/** True when `end` is on or after `start`; both must be valid ISO days. */
export function isOnOrAfter(start: string, end: string): boolean {
  return end >= start;
}

/** Renders an ISO day for display (de-DE, e.g. 22.06.2026); passthrough if odd. */
export function formatIso(value: string): string {
  if (!isValidIso(value)) {
    return value;
  }
  const [year, month, day] = value.split('-');
  return `${day ?? ''}.${month ?? ''}.${year ?? ''}`;
}
