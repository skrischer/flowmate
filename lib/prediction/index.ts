// Public contract of the prediction engine.
//
// Phase 4 (Flower experience) and Phase 6 (Mate push) consume the engine only
// through this barrel — the internal date math is an implementation detail.
// This step (issue #17) ships cycle-length statistics and next-period
// prediction; current-phase and fertile-window prediction land with their own
// issues against the same module.

export { MAX_CYCLE_SAMPLE, cycleLengthStats, cycleLengths, predictNextPeriodDate } from './cycle-stats';
export type { CycleLengthStats, NextPeriodPrediction, PeriodStart } from './cycle-stats';
