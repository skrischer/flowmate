/// <reference types="jest" />
import type { Period } from '../../../lib/data';
import { periodsToStarts, toFlowerPrediction } from '../prediction';

// The data barrel transitively loads the Supabase client, which throws at import
// time without env config. The pure mapping under test never touches the client,
// so a bare stub keeps module init from failing (mirrors the secure-store test).
jest.mock('../../../lib/data/client', () => ({ supabase: {} }));

// Builds a stored period row from a start date; the unused stored columns are
// filled with stable placeholders so the fixture matches the Period Row type.
const period = (startDate: string): Period => ({
  id: `id-${startDate}`,
  owner_id: 'owner',
  start_date: startDate,
  end_date: null,
  created_at: '2026-01-01T00:00:00.000Z',
});

// A regular 28-day history (4 starts => 3 cycle lengths), mirroring the engine
// suite: last start 2026-03-26, next predicted 2026-04-23, ovulation 2026-04-09.
const regular = [
  period('2026-01-01'),
  period('2026-01-29'),
  period('2026-02-26'),
  period('2026-03-26'),
];

describe('periodsToStarts', () => {
  it('maps period rows to the engine PeriodStart shape (start_date only)', () => {
    expect(periodsToStarts([period('2026-01-01'), period('2026-02-01')])).toEqual([
      { startDate: '2026-01-01' },
      { startDate: '2026-02-01' },
    ]);
  });

  it('preserves order and drops the non-start columns', () => {
    expect(periodsToStarts(regular)).toEqual([
      { startDate: '2026-01-01' },
      { startDate: '2026-01-29' },
      { startDate: '2026-02-26' },
      { startDate: '2026-03-26' },
    ]);
  });

  it('returns an empty list for an empty history', () => {
    expect(periodsToStarts([])).toEqual([]);
  });
});

describe('toFlowerPrediction', () => {
  it('passes the injected today through to the engine result', () => {
    const result = toFlowerPrediction(regular, '2026-04-05');
    expect(result.today).toBe('2026-04-05');
    expect(result.prediction).toEqual({
      currentPhase: 'follicular',
      nextPeriodDate: '2026-04-23',
      ovulationDate: '2026-04-09',
      fertileWindow: { start: '2026-04-04', end: '2026-04-10' },
      confidence: 'medium',
    });
    expect(result.confidence).toBe('medium');
  });

  it('reflects today: the same history yields a later phase further into the cycle', () => {
    expect(toFlowerPrediction(regular, '2026-04-09').prediction?.currentPhase).toBe('ovulation');
    expect(toFlowerPrediction(regular, '2026-04-15').prediction?.currentPhase).toBe('luteal');
  });

  it('yields a null prediction and confidence none when history cannot anchor a cycle', () => {
    const result = toFlowerPrediction([period('2026-01-01')], '2026-01-15');
    expect(result.prediction).toBeNull();
    expect(result.confidence).toBe('none');
    expect(result.today).toBe('2026-01-15');
  });

  it('surfaces confidence none with no fertile window for a two-start history', () => {
    const result = toFlowerPrediction([period('2026-01-01'), period('2026-01-29')], '2026-02-05');
    expect(result.confidence).toBe('none');
    expect(result.prediction?.fertileWindow).toBeNull();
    expect(result.prediction?.nextPeriodDate).toBe('2026-02-26');
  });

  it('propagates an invalid reference date as a RangeError from the engine', () => {
    expect(() => toFlowerPrediction(regular, '2026-13-40')).toThrow(RangeError);
  });
});
