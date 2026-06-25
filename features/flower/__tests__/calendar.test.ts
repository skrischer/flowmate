/// <reference types="jest" />
import {
  WEEKDAY_LABELS,
  buildMonthGrid,
  loggedDays,
  monthStartOf,
  monthTitle,
  shiftMonth,
} from '../calendar';
import type { Period } from '../../../lib/data';
import type { Prediction } from '../../../lib/prediction';

// A minimal logged period fixture; only the date fields matter to the grid model.
function period(start: string, end: string | null = null): Period {
  return {
    id: `id-${start}`,
    owner_id: 'owner',
    created_at: '2026-01-01T00:00:00Z',
    start_date: start,
    end_date: end,
  };
}

const prediction: Prediction = {
  currentPhase: 'follicular',
  nextPeriodDate: '2026-06-28',
  ovulationDate: '2026-06-14',
  fertileWindow: { start: '2026-06-09', end: '2026-06-15' },
  confidence: 'medium',
};

describe('monthStartOf', () => {
  it('returns the first day of the date\'s month', () => {
    expect(monthStartOf('2026-06-22')).toBe('2026-06-01');
    expect(monthStartOf('2026-12-31')).toBe('2026-12-01');
  });
});

describe('shiftMonth', () => {
  it('shifts months and rolls the year over boundaries', () => {
    expect(shiftMonth('2026-06-01', 1)).toBe('2026-07-01');
    expect(shiftMonth('2026-12-01', 1)).toBe('2027-01-01');
    expect(shiftMonth('2026-01-01', -1)).toBe('2025-12-01');
    expect(shiftMonth('2026-06-01', -7)).toBe('2025-11-01');
  });
});

describe('loggedDays', () => {
  it('includes a single-day period with no end date', () => {
    const days = loggedDays([period('2026-06-10')]);
    expect(days.has('2026-06-10')).toBe(true);
    expect(days.size).toBe(1);
  });

  it('expands a range inclusively from start to end', () => {
    const days = loggedDays([period('2026-06-10', '2026-06-13')]);
    expect([...days].sort()).toEqual(['2026-06-10', '2026-06-11', '2026-06-12', '2026-06-13']);
  });

  it('ignores invalid or inverted date ranges', () => {
    const days = loggedDays([period('not-a-date'), period('2026-06-10', '2026-06-05')]);
    expect(days.has('2026-06-10')).toBe(true);
    expect(days.size).toBe(1);
  });
});

describe('buildMonthGrid', () => {
  const grid = buildMonthGrid('2026-06-15', [period('2026-06-10', '2026-06-12')], prediction, '2026-06-22');

  it('builds Monday-first whole weeks for the month', () => {
    expect(grid.year).toBe(2026);
    expect(grid.month).toBe(6);
    grid.weeks.forEach((week) => expect(week).toHaveLength(WEEKDAY_LABELS.length));
    // June 2026 starts on a Monday, so the first cell is June 1 with no lead pad.
    expect(grid.weeks[0]?.[0]?.date).toBe('2026-06-01');
    expect(grid.weeks[0]?.[0]?.inMonth).toBe(true);
  });

  it('marks logged days, the predicted span, ovulation, and the fertile window', () => {
    const cells = grid.weeks.flat();
    const byDate = (date: string) => cells.find((cell) => cell.date === date);
    expect(byDate('2026-06-10')?.marker).toBe('logged');
    expect(byDate('2026-06-12')?.marker).toBe('logged');
    // Predicted next period is a 5-day span from nextPeriodDate (MENSTRUAL_DAYS).
    expect(byDate('2026-06-28')?.marker).toBe('predicted');
    expect(byDate('2026-06-30')?.marker).toBe('predicted');
    // The span spills into the trailing July pad of June's grid.
    expect(byDate('2026-07-02')?.marker).toBe('predicted');
    expect(byDate('2026-07-03')?.marker).toBe('none');
    // Ovulation wins over the fertile window it sits inside.
    expect(byDate('2026-06-14')?.marker).toBe('ovulation');
    expect(byDate('2026-06-09')?.marker).toBe('fertile');
    expect(byDate('2026-06-15')?.marker).toBe('fertile');
    expect(byDate('2026-06-20')?.marker).toBe('none');
  });

  it('flags today and pads adjacent-month cells out of month', () => {
    const cells = grid.weeks.flat();
    expect(cells.find((cell) => cell.date === '2026-06-22')?.isToday).toBe(true);
    const trailing = cells.filter((cell) => !cell.inMonth);
    expect(trailing.every((cell) => cell.date < '2026-06-01' || cell.date > '2026-06-30')).toBe(true);
  });

  it('marks only logged days when no prediction exists (no fabricated window)', () => {
    const noPred = buildMonthGrid('2026-06-01', [period('2026-06-10')], null, '2026-06-22');
    const markers = noPred.weeks.flat().map((cell) => cell.marker);
    expect(markers).toContain('logged');
    expect(markers).not.toContain('predicted');
    expect(markers).not.toContain('ovulation');
    expect(markers).not.toContain('fertile');
  });

  it('lets logged days win over an overlapping predicted span', () => {
    const overlap = buildMonthGrid(
      '2026-06-01',
      [period('2026-06-28', '2026-06-29')],
      prediction,
      '2026-06-22',
    );
    const byDate = (date: string) =>
      overlap.weeks.flat().find((cell) => cell.date === date);
    expect(byDate('2026-06-28')?.marker).toBe('logged');
    expect(byDate('2026-06-30')?.marker).toBe('predicted');
  });
});

describe('monthTitle', () => {
  it('renders the German month name and year', () => {
    const grid = buildMonthGrid('2026-06-01', [], null, '2026-06-22');
    expect(monthTitle(grid)).toBe('Juni 2026');
  });
});
