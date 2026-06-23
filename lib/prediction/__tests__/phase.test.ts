/// <reference types="jest" />
import {
  buildPrediction,
  currentPhase,
  fertileWindow,
  predictionConfidence,
  type Phase,
} from '../phase';
import { type PeriodStart } from '../cycle-stats';

const periods = (...dates: string[]): PeriodStart[] => dates.map((startDate) => ({ startDate }));

// A regular 28-day history (4 starts => 3 cycle lengths). Last start 2026-03-26,
// next period predicted 2026-04-23, ovulation 2026-04-09, fertile 2026-04-04..10.
const regular = periods('2026-01-01', '2026-01-29', '2026-02-26', '2026-03-26');

describe('fertileWindow', () => {
  it('spans ovulation −5 .. +1 inclusive', () => {
    expect(fertileWindow('2026-04-09')).toEqual({ start: '2026-04-04', end: '2026-04-10' });
  });

  it('crosses a month boundary correctly', () => {
    expect(fertileWindow('2026-05-02')).toEqual({ start: '2026-04-27', end: '2026-05-03' });
  });
});

describe('currentPhase', () => {
  // Current cycle: start 2026-03-26, next 2026-04-23, ovulation 2026-04-09.
  const cycleStart = '2026-03-26';
  const nextPeriodDate = '2026-04-23';
  const ovulationDate = '2026-04-09';
  const phaseOn = (today: string): Phase => currentPhase(today, cycleStart, nextPeriodDate, ovulationDate);

  it('reports menstrual on the cycle start day', () => {
    expect(phaseOn('2026-03-26')).toBe('menstrual');
  });

  it('reports menstrual on the last bleed day (day 4) and follicular on day 5', () => {
    expect(phaseOn('2026-03-30')).toBe('menstrual');
    expect(phaseOn('2026-03-31')).toBe('follicular');
  });

  it('reports follicular the day before ovulation', () => {
    expect(phaseOn('2026-04-08')).toBe('follicular');
  });

  it('reports ovulation exactly on the ovulation day', () => {
    expect(phaseOn('2026-04-09')).toBe('ovulation');
  });

  it('reports luteal the day after ovulation', () => {
    expect(phaseOn('2026-04-10')).toBe('luteal');
  });

  it('reports luteal the day before the next period', () => {
    expect(phaseOn('2026-04-22')).toBe('luteal');
  });

  it('rolls over to menstrual on and after the predicted next period', () => {
    expect(phaseOn('2026-04-23')).toBe('menstrual');
    expect(phaseOn('2026-05-01')).toBe('menstrual');
  });
});

describe('predictionConfidence', () => {
  it('is none below the three-period threshold', () => {
    expect(predictionConfidence(periods())).toBe('none');
    expect(predictionConfidence(periods('2026-01-01'))).toBe('none');
    expect(predictionConfidence(periods('2026-01-01', '2026-01-29'))).toBe('none');
  });

  it('is medium for a regular history of three to five cycle lengths', () => {
    expect(predictionConfidence(regular)).toBe('medium');
  });

  it('is high for a regular history of six or more cycle lengths', () => {
    const history = periods(
      '2026-01-01',
      '2026-01-29',
      '2026-02-26',
      '2026-03-26',
      '2026-04-23',
      '2026-05-21',
      '2026-06-18',
    );
    expect(predictionConfidence(history)).toBe('high');
  });

  it('is low when the recent cycle-length spread exceeds nine days', () => {
    // lengths [28, 28, 40] => spread 12 > 9, even though there are enough periods.
    const irregular = periods('2026-01-01', '2026-01-29', '2026-02-26', '2026-04-07');
    expect(predictionConfidence(irregular)).toBe('low');
  });

  it('stays medium at exactly the nine-day spread boundary', () => {
    // lengths [28, 28, 37] => spread 9, not > 9.
    const borderline = periods('2026-01-01', '2026-01-29', '2026-02-26', '2026-04-04');
    expect(predictionConfidence(borderline)).toBe('medium');
  });
});

describe('buildPrediction', () => {
  it('returns null when fewer than two valid starts make a cycle length impossible', () => {
    expect(buildPrediction(periods(), '2026-01-15')).toBeNull();
    expect(buildPrediction(periods('2026-01-01'), '2026-01-15')).toBeNull();
  });

  it('withholds the fertile window with confidence none for a two-start history', () => {
    const result = buildPrediction(periods('2026-01-01', '2026-01-29'), '2026-02-05');
    expect(result).not.toBeNull();
    expect(result?.confidence).toBe('none');
    expect(result?.fertileWindow).toBeNull();
    // The next period and phase are still anchored on real data.
    expect(result?.nextPeriodDate).toBe('2026-02-26');
    expect(result?.ovulationDate).toBe('2026-02-12');
  });

  it('builds the full prediction for a regular history', () => {
    const result = buildPrediction(regular, '2026-04-05');
    expect(result).toEqual({
      currentPhase: 'follicular',
      nextPeriodDate: '2026-04-23',
      ovulationDate: '2026-04-09',
      fertileWindow: { start: '2026-04-04', end: '2026-04-10' },
      confidence: 'medium',
    });
  });

  it('reports the ovulation phase on the estimated ovulation day', () => {
    expect(buildPrediction(regular, '2026-04-09')?.currentPhase).toBe('ovulation');
  });

  it('surfaces the prediction with low confidence for irregular cycles', () => {
    const irregular = periods('2026-01-01', '2026-01-29', '2026-02-26', '2026-04-07');
    const result = buildPrediction(irregular, '2026-04-15');
    expect(result?.confidence).toBe('low');
    // Low confidence still surfaces the window (only none withholds it).
    expect(result?.fertileWindow).not.toBeNull();
  });

  it('builds a valid prediction when the median cycle length is fractional', () => {
    // Regression: three starts => lengths [27, 28] => raw median 27.5, which once
    // made the next-period date "2026-06-29.5" and threw RangeError downstream.
    const threeStarts = periods('2026-04-08', '2026-05-05', '2026-06-02');
    expect(() => buildPrediction(threeStarts, '2026-06-22')).not.toThrow();
    const result = buildPrediction(threeStarts, '2026-06-22');
    expect(result).toEqual({
      currentPhase: 'luteal',
      nextPeriodDate: '2026-06-30',
      ovulationDate: '2026-06-16',
      fertileWindow: { start: '2026-06-11', end: '2026-06-17' },
      confidence: 'medium',
    });
  });

  it('rejects an invalid reference date', () => {
    expect(() => buildPrediction(regular, '2026-13-40')).toThrow(RangeError);
  });
});
