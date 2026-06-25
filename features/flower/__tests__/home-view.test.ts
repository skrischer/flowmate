/// <reference types="jest" />
import {
  BACKFILL_TARGET,
  backfillCounter,
  confidenceCaveat,
  daysToNextPeriod,
  isInsufficient,
  nextPeriodLabel,
  phaseLabel,
} from '../home-view';
import type { FlowerPrediction } from '../prediction';
import type { Prediction } from '../../../lib/prediction';

// A minimal medium-confidence prediction fixture; the home-view helpers are pure
// so no data layer or engine is touched here.
const prediction: Prediction = {
  currentPhase: 'follicular',
  nextPeriodDate: '2026-04-23',
  ovulationDate: '2026-04-09',
  fertileWindow: { start: '2026-04-04', end: '2026-04-10' },
  confidence: 'medium',
};

describe('phaseLabel', () => {
  it('maps each phase to its German label', () => {
    expect(phaseLabel('menstrual')).toBe('Menstruation');
    expect(phaseLabel('follicular')).toBe('Follikelphase');
    expect(phaseLabel('ovulation')).toBe('Eisprung');
    expect(phaseLabel('luteal')).toBe('Lutealphase');
  });
});

describe('daysToNextPeriod', () => {
  it('counts whole days from today to the next period start', () => {
    expect(daysToNextPeriod('2026-04-13', '2026-04-23')).toBe(10);
  });

  it('never returns a negative count once the period is due or overdue', () => {
    expect(daysToNextPeriod('2026-04-23', '2026-04-23')).toBe(0);
    expect(daysToNextPeriod('2026-04-25', '2026-04-23')).toBe(0);
  });
});

describe('nextPeriodLabel', () => {
  it('phrases the day count, with singular and due-today special cases', () => {
    expect(nextPeriodLabel(0)).toBe('Heute erwartet');
    expect(nextPeriodLabel(1)).toBe('In 1 Tag');
    expect(nextPeriodLabel(10)).toBe('In 10 Tagen');
  });
});

describe('confidenceCaveat', () => {
  it('returns a caveat only for low confidence', () => {
    expect(confidenceCaveat('low')).not.toBeNull();
    expect(confidenceCaveat('medium')).toBeNull();
    expect(confidenceCaveat('high')).toBeNull();
    expect(confidenceCaveat('none')).toBeNull();
  });
});

describe('backfillCounter', () => {
  it('reads "N von 3 Perioden" and clamps to the target', () => {
    expect(backfillCounter(0)).toBe(`0 von ${BACKFILL_TARGET} Perioden`);
    expect(backfillCounter(2)).toBe(`2 von ${BACKFILL_TARGET} Perioden`);
    expect(backfillCounter(BACKFILL_TARGET)).toBe(`3 von ${BACKFILL_TARGET} Perioden`);
    expect(backfillCounter(5)).toBe(`3 von ${BACKFILL_TARGET} Perioden`);
    expect(backfillCounter(-1)).toBe(`0 von ${BACKFILL_TARGET} Perioden`);
  });
});

describe('isInsufficient', () => {
  it('is true when there is no prediction or confidence is none', () => {
    const noPrediction: FlowerPrediction = { today: '2026-04-13', prediction: null, confidence: 'none' };
    const sufficient: FlowerPrediction = { today: '2026-04-13', prediction, confidence: 'medium' };
    expect(isInsufficient(noPrediction)).toBe(true);
    expect(isInsufficient(sufficient)).toBe(false);
  });
});
