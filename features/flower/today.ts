// The single clock-read boundary for the Flower experience (spec: today is read
// in exactly one place and passed into the pure prediction engine; lib/prediction
// never reads the clock itself).
//
// Returns the LOCAL calendar day as an ISO date (YYYY-MM-DD). Date#toISOString is
// deliberately avoided: it is UTC and would roll the day over near midnight in
// non-UTC timezones, shifting the predicted phase by a day.

/**
 * Today's local calendar day as an ISO date (YYYY-MM-DD).
 *
 * `now` is injectable so callers and tests can pin the clock; production callers
 * omit it and get the real wall clock. This is the only place the Flower feature
 * constructs a `Date` from the clock — every prediction call downstream takes the
 * resulting string, keeping `lib/prediction` pure.
 */
export function todayIso(now: Date = new Date()): string {
  const year = now.getFullYear();
  const month = now.getMonth() + 1;
  const day = now.getDate();
  return `${pad(year, 4)}-${pad(month, 2)}-${pad(day, 2)}`;
}

function pad(value: number, length: number): string {
  return String(value).padStart(length, '0');
}
