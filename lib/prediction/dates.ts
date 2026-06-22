// Pure ISO DATE (YYYY-MM-DD) helpers for the prediction engine.
//
// The engine works on calendar days only (periods.start_date is a DATE), so all
// arithmetic is done on the proleptic Gregorian day number to avoid timezone
// drift. No clock access and no `Date` construction here: the reference "today"
// is always passed in by the caller (constitution: the engine is pure and
// deterministic).

const ISO_DATE = /^(\d{4})-(\d{2})-(\d{2})$/;

/** Returns true when the value is a valid YYYY-MM-DD calendar date. */
export function isIsoDate(value: string): boolean {
  const dayNumber = toDayNumber(value);
  return dayNumber !== null && fromDayNumber(dayNumber) === value;
}

/** Whole-day count from `from` to `to` (negative when `to` precedes `from`). */
export function daysBetween(from: string, to: string): number {
  const fromDay = requireDayNumber(from);
  const toDay = requireDayNumber(to);
  return toDay - fromDay;
}

/** Returns `date` shifted by `days` whole days, as a YYYY-MM-DD string. */
export function addDays(date: string, days: number): string {
  return fromDayNumber(requireDayNumber(date) + days);
}

function requireDayNumber(value: string): number {
  const dayNumber = toDayNumber(value);
  if (dayNumber === null) {
    throw new RangeError(`Invalid ISO date: ${value}`);
  }
  return dayNumber;
}

// Days since the Gregorian epoch (1970-01-01 = 0), computed arithmetically.
function toDayNumber(value: string): number | null {
  const match = ISO_DATE.exec(value);
  if (match === null) {
    return null;
  }
  const year = Number(match[1]);
  const month = Number(match[2]);
  const day = Number(match[3]);
  if (month < 1 || month > 12 || day < 1 || day > daysInMonth(year, month)) {
    return null;
  }
  return daysFromCivil(year, month, day);
}

function fromDayNumber(dayNumber: number): string {
  const { year, month, day } = civilFromDays(dayNumber);
  return `${pad(year, 4)}-${pad(month, 2)}-${pad(day, 2)}`;
}

function isLeapYear(year: number): boolean {
  return (year % 4 === 0 && year % 100 !== 0) || year % 400 === 0;
}

function daysInMonth(year: number, month: number): number {
  if (month === 2) {
    return isLeapYear(year) ? 29 : 28;
  }
  return [4, 6, 9, 11].includes(month) ? 30 : 31;
}

// Howard Hinnant's days_from_civil: serial day number for a civil date.
function daysFromCivil(year: number, month: number, day: number): number {
  const y = month <= 2 ? year - 1 : year;
  const era = Math.floor((y >= 0 ? y : y - 399) / 400);
  const yoe = y - era * 400;
  const doy = Math.floor((153 * (month > 2 ? month - 3 : month + 9) + 2) / 5) + day - 1;
  const doe = yoe * 365 + Math.floor(yoe / 4) - Math.floor(yoe / 100) + doy;
  return era * 146097 + doe - 719468;
}

// Inverse of daysFromCivil: civil date for a serial day number.
function civilFromDays(serial: number): { year: number; month: number; day: number } {
  const z = serial + 719468;
  const era = Math.floor((z >= 0 ? z : z - 146096) / 146097);
  const doe = z - era * 146097;
  const yoe = Math.floor((doe - Math.floor(doe / 1460) + Math.floor(doe / 36524) - Math.floor(doe / 146096)) / 365);
  const y = yoe + era * 400;
  const doy = doe - (365 * yoe + Math.floor(yoe / 4) - Math.floor(yoe / 100));
  const mp = Math.floor((5 * doy + 2) / 153);
  const day = doy - Math.floor((153 * mp + 2) / 5) + 1;
  const month = mp < 10 ? mp + 3 : mp - 9;
  return { year: month <= 2 ? y + 1 : y, month, day };
}

function pad(value: number, length: number): string {
  return String(value).padStart(length, '0');
}
