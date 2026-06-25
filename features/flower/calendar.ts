// Pure month-grid model for the hand-rolled Flower calendar (issue #26). Builds a
// Monday-first weeks-by-days grid for a given month and marks each day from the
// logged periods and the prediction view-model: logged period days, the predicted
// next-period start day, and the fertile-window range. Kept pure and synchronous
// (no clock, no React) so it is unit-testable per the spec — `today` and the
// month anchor are passed in. The screen consumes this; prediction is never
// reimplemented here.

import { addDays, daysBetween, isIsoDate } from '../../lib/prediction/dates';
import type { Period } from '../../lib/data';
import { MENSTRUAL_DAYS, type DateRange, type Prediction } from '../../lib/prediction';

/** How a single day is highlighted on the calendar grid. */
export type DayMarker = 'logged' | 'predicted' | 'ovulation' | 'fertile' | 'none';

/** One day cell in the month grid. */
export type DayCell = {
  /** The day's ISO date (YYYY-MM-DD). */
  date: string;
  /** Day of month (1-31), for the label. */
  day: number;
  /** False for the leading/trailing days that pad the grid to whole weeks. */
  inMonth: boolean;
  /** True when this cell is the reference `today`. */
  isToday: boolean;
  /** The primary highlight for the day (logged > predicted > ovulation > fertile). */
  marker: DayMarker;
};

/** A whole month laid out as Monday-first weeks of seven day cells. */
export type MonthGrid = {
  /** First day of the month (YYYY-MM-01), the anchor the grid is built around. */
  monthStart: string;
  /** Year of the month, for the header. */
  year: number;
  /** Month of year (1-12), for the header. */
  month: number;
  /** Weeks, each exactly seven cells, padded with adjacent-month days. */
  weeks: DayCell[][];
};

const DAYS_PER_WEEK = 7;

const MONTH_NAMES = [
  'Januar',
  'Februar',
  'März',
  'April',
  'Mai',
  'Juni',
  'Juli',
  'August',
  'September',
  'Oktober',
  'November',
  'Dezember',
] as const;

/** Monday-first weekday initials for the grid header (German). */
export const WEEKDAY_LABELS = ['Mo', 'Di', 'Mi', 'Do', 'Fr', 'Sa', 'So'] as const;

/** German "Monat Jahr" title for a built grid (e.g. "Juni 2026"). */
export function monthTitle(grid: MonthGrid): string {
  const name = MONTH_NAMES[grid.month - 1] ?? '';
  return `${name} ${grid.year}`;
}

/** The first day of the month that `date` falls in, as YYYY-MM-01. */
export function monthStartOf(date: string): string {
  const [year, month] = splitIso(date);
  return `${pad(year, 4)}-${pad(month, 2)}-01`;
}

/** The first day of the month `delta` months from `monthStart` (delta may be negative). */
export function shiftMonth(monthStart: string, delta: number): string {
  const [year, month] = splitIso(monthStart);
  const zeroBased = month - 1 + delta;
  const nextYear = year + Math.floor(zeroBased / 12);
  const nextMonth = ((zeroBased % 12) + 12) % 12;
  return `${pad(nextYear, 4)}-${pad(nextMonth + 1, 2)}-01`;
}

/**
 * Builds the month grid for the month `monthStart` falls in, marking each day
 * from the logged periods and the prediction. `today` is the reference day passed
 * in by the screen boundary; `prediction` is `null` when no prediction exists
 * (then only logged days are marked — no fabricated window).
 */
export function buildMonthGrid(
  monthStart: string,
  periods: readonly Period[],
  prediction: Prediction | null,
  today: string,
): MonthGrid {
  const start = monthStartOf(monthStart);
  const [year, month] = splitIso(start);
  const logged = loggedDays(periods);
  const fertile = prediction?.fertileWindow ?? null;
  const ovulation = prediction?.ovulationDate ?? null;
  const predicted = predictedSpan(prediction?.nextPeriodDate ?? null);
  const cells = gridDays(start).map((date) =>
    toCell(date, year, month, today, logged, fertile, ovulation, predicted),
  );
  return { monthStart: start, year, month, weeks: chunkWeeks(cells) };
}

// The predicted next period as an inclusive 5-day span starting on the predicted
// start day (nextPeriodDate .. nextPeriodDate + MENSTRUAL_DAYS - 1). Reuses the
// engine's MENSTRUAL_DAYS so the band length stays in lockstep with prediction.
function predictedSpan(nextPeriodDate: string | null): DateRange | null {
  if (nextPeriodDate === null) {
    return null;
  }
  return { start: nextPeriodDate, end: addDays(nextPeriodDate, MENSTRUAL_DAYS - 1) };
}

/** Expands logged periods into the set of ISO days they cover (inclusive). */
export function loggedDays(periods: readonly Period[]): ReadonlySet<string> {
  const days = new Set<string>();
  for (const period of periods) {
    if (!isIsoDate(period.start_date)) {
      continue;
    }
    const end =
      period.end_date && isIsoDate(period.end_date) && period.end_date >= period.start_date
        ? period.end_date
        : period.start_date;
    for (let day = period.start_date; day <= end; day = addDays(day, 1)) {
      days.add(day);
    }
  }
  return days;
}

// Resolves a single day's highlight. Logged days win, then the predicted period
// span, then the ovulation day, then the fertile window — so an overlap reads as
// the more certain signal (ovulation lies inside the fertile window).
function toCell(
  date: string,
  year: number,
  month: number,
  today: string,
  logged: ReadonlySet<string>,
  fertile: DateRange | null,
  ovulation: string | null,
  predicted: DateRange | null,
): DayCell {
  const [cellYear, cellMonth, cellDay] = splitIso(date);
  return {
    date,
    day: cellDay,
    inMonth: cellYear === year && cellMonth === month,
    isToday: date === today,
    marker: markerFor(date, logged, fertile, ovulation, predicted),
  };
}

function markerFor(
  date: string,
  logged: ReadonlySet<string>,
  fertile: DateRange | null,
  ovulation: string | null,
  predicted: DateRange | null,
): DayMarker {
  if (logged.has(date)) {
    return 'logged';
  }
  if (predicted !== null && date >= predicted.start && date <= predicted.end) {
    return 'predicted';
  }
  if (ovulation !== null && date === ovulation) {
    return 'ovulation';
  }
  if (fertile !== null && date >= fertile.start && date <= fertile.end) {
    return 'fertile';
  }
  return 'none';
}

// The 7-aligned span of ISO days covering the month, padded with the
// adjacent-month days that fill the leading and trailing partial weeks.
function gridDays(monthStart: string): string[] {
  const lead = mondayIndex(monthStart);
  const gridStart = addDays(monthStart, -lead);
  const monthLength = daysBetween(monthStart, shiftMonth(monthStart, 1));
  const totalCells = Math.ceil((lead + monthLength) / DAYS_PER_WEEK) * DAYS_PER_WEEK;
  const days: string[] = [];
  for (let offset = 0; offset < totalCells; offset += 1) {
    days.push(addDays(gridStart, offset));
  }
  return days;
}

// Days from the preceding Monday to `date` (0 = Monday .. 6 = Sunday). Derived
// from a known Monday (1970-01-05) so no Date object or locale is involved.
function mondayIndex(date: string): number {
  const fromMonday = daysBetween('1970-01-05', date);
  return ((fromMonday % DAYS_PER_WEEK) + DAYS_PER_WEEK) % DAYS_PER_WEEK;
}

function chunkWeeks(cells: DayCell[]): DayCell[][] {
  const weeks: DayCell[][] = [];
  for (let i = 0; i < cells.length; i += DAYS_PER_WEEK) {
    weeks.push(cells.slice(i, i + DAYS_PER_WEEK));
  }
  return weeks;
}

function splitIso(date: string): [number, number, number] {
  const parts = date.split('-');
  return [Number(parts[0]), Number(parts[1]), Number(parts[2])];
}

function pad(value: number, length: number): string {
  return String(value).padStart(length, '0');
}
