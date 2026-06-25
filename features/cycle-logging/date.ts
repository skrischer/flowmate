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

// German full month names, indexed 0–11. Long-date display only — the stored
// representation stays the ISO `DATE` string.
const DE_MONTHS = [
  'Januar', 'Februar', 'März', 'April', 'Mai', 'Juni',
  'Juli', 'August', 'September', 'Oktober', 'November', 'Dezember',
] as const;

// German weekday abbreviations indexed by JS `Date.getDay()` (Sunday = 0).
const DE_WEEKDAYS = ['So', 'Mo', 'Di', 'Mi', 'Do', 'Fr', 'Sa'] as const;

/**
 * Renders an ISO day as a German long date, e.g. "15. Juni 2026". With
 * `withWeekday` it prefixes the weekday abbreviation: "Do · 15. Juni 2026".
 * Passthrough if the value is not a valid ISO day.
 */
export function formatLongDe(value: string, withWeekday = false): string {
  if (!isValidIso(value)) {
    return value;
  }
  const parts = value.split('-');
  const year = Number(parts[0]);
  const month = Number(parts[1]);
  const day = Number(parts[2]);
  const longDate = `${day}. ${DE_MONTHS[month - 1] ?? ''} ${year}`;
  if (!withWeekday) {
    return longDate;
  }
  const weekday = DE_WEEKDAYS[new Date(year, month - 1, day).getDay()] ?? '';
  return `${weekday} · ${longDate}`;
}

interface DateParts {
  day: number;
  month: number; // 1-12
  year: number;
}

function isoParts(iso: string): DateParts | null {
  if (!isValidIso(iso)) return null;
  const [year, month, day] = iso.split('-');
  return { day: Number(day), month: Number(month), year: Number(year) };
}

/**
 * Renders a date range with German month names but WITHOUT the year, for the
 * compact Flower-Home fertile-window row:
 * - same month:    "22.–28. Juni"   (en dash, single month name)
 * - cross-month:   "28. Mai – 3. Juni"
 * Mirrors PeriodHistoryScreen's year-bearing range form; year-less by design
 * (spec-design-reconciliation-2, "Fertile window (Home)"). Falls back to the
 * raw ISO strings when a value is not a valid date.
 */
export function formatRangeShortDe(startIso: string, endIso: string): string {
  const start = isoParts(startIso);
  const end = isoParts(endIso);
  if (!start || !end) {
    return `${startIso} – ${endIso}`;
  }
  if (start.month === end.month && start.year === end.year) {
    return `${start.day}.–${end.day}. ${DE_MONTHS[start.month - 1] ?? ''}`;
  }
  const startDay = `${start.day}. ${DE_MONTHS[start.month - 1] ?? ''}`;
  const endDay = `${end.day}. ${DE_MONTHS[end.month - 1] ?? ''}`;
  return `${startDay} – ${endDay}`;
}
