/// <reference types="jest" />
import type { Period } from '../../../lib/data';
import { findOngoingPeriod } from '../ongoing-period';

// Minimal Period fixture: only start_date / end_date drive the detection.
const period = (start_date: string, end_date: string | null): Period => ({
  id: `id-${start_date}`,
  owner_id: 'owner-uuid',
  start_date,
  end_date,
  created_at: '2026-01-01T00:00:00.000Z',
});

describe('findOngoingPeriod', () => {
  it('returns null for an empty list', () => {
    expect(findOngoingPeriod([])).toBeNull();
  });

  it('returns null when every period has an end_date', () => {
    const periods = [
      period('2026-06-01', '2026-06-05'),
      period('2026-05-01', '2026-05-06'),
    ];
    expect(findOngoingPeriod(periods)).toBeNull();
  });

  it('returns the open period when one is ongoing', () => {
    const periods = [period('2026-06-10', null), period('2026-05-01', '2026-05-06')];
    expect(findOngoingPeriod(periods)?.id).toBe('id-2026-06-10');
  });

  it('returns the most recent open period when several are open', () => {
    const periods = [
      period('2026-04-01', null),
      period('2026-06-10', null),
      period('2026-05-01', null),
    ];
    expect(findOngoingPeriod(periods)?.id).toBe('id-2026-06-10');
  });

  it('ignores ended periods even when newer than the open one', () => {
    const periods = [period('2026-06-20', '2026-06-25'), period('2026-06-10', null)];
    expect(findOngoingPeriod(periods)?.id).toBe('id-2026-06-10');
  });

  it('does not assume the input is sorted', () => {
    const periods = [
      period('2026-03-01', '2026-03-05'),
      period('2026-07-01', null),
      period('2026-01-01', '2026-01-04'),
    ];
    expect(findOngoingPeriod(periods)?.id).toBe('id-2026-07-01');
  });
});
