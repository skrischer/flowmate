/// <reference types="jest" />
import { formatRangeShortDe } from '../date';

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
