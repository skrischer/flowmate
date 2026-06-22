// Glue between the typed periods data layer and the pure prediction engine.
//
// This is the wiring boundary the spec pins: logged periods (lib/data/periods)
// are mapped to the engine's PeriodStart shape, `today` is injected here (read
// once via features/flower/today), and buildPrediction (lib/prediction) produces
// the view-model the Flower home (#25) and calendar (#26) render. Prediction is
// never reimplemented here — only mapped and assembled.

import { listPeriods, type Period } from '../../lib/data';
import { buildPrediction, type Confidence, type Prediction, type PeriodStart } from '../../lib/prediction';

import { todayIso } from './today';

/**
 * The prediction view-model for the Flower home. `prediction` is `null` when the
 * history is too short to anchor a cycle (fewer than two logged starts); the
 * `confidence` is then `none` so the UI can show the backfill CTA without a
 * fabricated window. `today` is carried through so the calendar can mark "today"
 * against the same reference the prediction used.
 */
export type FlowerPrediction = {
  /** The reference day the prediction was built against (ISO YYYY-MM-DD). */
  today: string;
  /** The full prediction, or `null` when history cannot anchor a cycle. */
  prediction: Prediction | null;
  /** Confidence in the prediction; `none` whenever `prediction` is `null`. */
  confidence: Confidence;
};

/** Maps logged period rows to the engine's PeriodStart shape (start_date only). */
export function periodsToStarts(periods: readonly Period[]): PeriodStart[] {
  return periods.map((period) => ({ startDate: period.start_date }));
}

/**
 * Builds the Flower prediction view-model from logged periods and a reference
 * `today`. Pure and synchronous: the caller supplies both inputs, so this is the
 * unit-testable seam over the engine. `today` defaults to the single clock source
 * for ergonomics but is overridable for tests and deterministic callers.
 */
export function toFlowerPrediction(
  periods: readonly Period[],
  today: string = todayIso(),
): FlowerPrediction {
  const prediction = buildPrediction(periodsToStarts(periods), today);
  return {
    today,
    prediction,
    confidence: prediction?.confidence ?? 'none',
  };
}

/**
 * Loads the owner's periods via the data layer and builds the prediction
 * view-model, injecting `today` at this boundary. The async glue UI calls; the
 * pure mapping above is what tests exercise.
 */
export async function loadFlowerPrediction(today: string = todayIso()): Promise<FlowerPrediction> {
  const periods = await listPeriods();
  return toFlowerPrediction(periods, today);
}
