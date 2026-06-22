// Public contract of the prediction engine.
//
// Phase 4 (Flower experience) and Phase 6 (Mate push) consume the engine only
// through this barrel — the internal date math is an implementation detail.
// Issue #17 ships cycle-length statistics and next-period prediction; issue #18
// adds current-phase, ovulation, and fertile-window prediction on top, assembled
// into the cross-phase Prediction result type.

export {
  MAX_CYCLE_SAMPLE,
  cycleLengthStats,
  cycleLengths,
  latestPeriodStart,
  predictNextPeriodDate,
} from './cycle-stats';
export type { CycleLengthStats, NextPeriodPrediction, PeriodStart } from './cycle-stats';

export {
  FERTILE_DAYS_AFTER,
  FERTILE_DAYS_BEFORE,
  HIGH_CONFIDENCE_SAMPLE,
  IRREGULAR_SPREAD_DAYS,
  LUTEAL_DAYS,
  MENSTRUAL_DAYS,
  MIN_PERIODS_FOR_PREDICTION,
  buildPrediction,
  currentPhase,
  fertileWindow,
  predictionConfidence,
} from './phase';
export type { Confidence, DateRange, Phase, Prediction } from './phase';
