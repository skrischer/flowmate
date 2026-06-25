/// <reference types="jest" />
import { formatDateRange, formatRangeShortDe } from '../date';

describe('formatRangeShortDe', () => {
  it('collapses a same-month range to one month name (en dash)', () => {
    expect(formatRangeShortDe('2026-06-22', '2026-06-28')).toBe('22.–28. Juni');
  });

  it('keeps both month names for a cross-month range and omits the year', () => {
    expect(formatRangeShortDe('2026-05-28', '2026-06-03')).toBe('28. Mai – 3. Juni');
  });

  it('omits the year even when the range crosses years', () => {
    expect(formatRangeShortDe('2025-12-28', '2026-01-03')).toBe('28. Dezember – 3. Januar');
  });

  it('falls back to the raw ISO strings when a value is not a valid date', () => {
    expect(formatRangeShortDe('not-a-date', '2026-06-28')).toBe('not-a-date – 2026-06-28');
  });
});

describe('formatDateRange', () => {
  it('collapses a same-month range to one month name and keeps the year', () => {
    expect(formatDateRange('2026-06-12', '2026-06-17')).toBe('12.–17. Juni 2026');
  });

  it('keeps both month names for a cross-month range within one year', () => {
    expect(formatDateRange('2026-05-28', '2026-06-03')).toBe('28. Mai – 3. Juni 2026');
  });

  it('repeats the year on both sides for a cross-year range', () => {
    expect(formatDateRange('2025-12-28', '2026-01-03')).toBe(
      '28. Dezember 2025 – 3. Januar 2026',
    );
  });

  it('renders the single start day when there is no end date', () => {
    expect(formatDateRange('2026-06-17', null)).toBe('17. Juni 2026');
  });

  it('falls back to the raw start string when the start is invalid', () => {
    expect(formatDateRange('not-a-date', null)).toBe('not-a-date');
    expect(formatDateRange('not-a-date', '2026-06-28')).toBe('not-a-date – 2026-06-28');
  });

  it('shows only the start day when the end date is invalid', () => {
    expect(formatDateRange('2026-06-12', 'not-a-date')).toBe('12. Juni 2026');
  });
});
