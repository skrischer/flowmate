// React hook feeding the Flower month calendar (#26). The calendar needs both the
// logged periods (to mark logged days) and the prediction view-model (predicted
// start day + fertile window), built against a single `today`. It loads periods
// on focus through lib/data and runs the same pure mapping the home uses —
// prediction is never reimplemented here.

import { useCallback, useState } from 'react';
import { useFocusEffect } from 'expo-router';

import { listPeriods, type Period } from '../../lib/data';
import { toFlowerPrediction, type FlowerPrediction } from './prediction';
import { todayIso } from './today';

/** Async state for the calendar: the periods plus the prediction view-model. */
export type FlowerCalendarState = {
  /** The logged periods, or `null` while loading or after an error. */
  periods: readonly Period[] | null;
  /** The prediction view-model (today carried through), or `null`. */
  prediction: FlowerPrediction | null;
  /** True until the first load settles. */
  isLoading: boolean;
  /** The load error, or `null` when none occurred. */
  error: Error | null;
};

/**
 * Loads the owner's periods and builds the prediction view-model whenever the
 * screen gains focus, so a period logged on another screen is reflected on
 * return (the calendar stays mounted under the stack, so a mount-only load would
 * go stale). `today` is read at the wiring boundary and passed into the pure
 * pipeline; pass an explicit value to pin the reference day in tests.
 */
export function useFlowerCalendar(today: string = todayIso()): FlowerCalendarState {
  const [periods, setPeriods] = useState<readonly Period[] | null>(null);
  const [prediction, setPrediction] = useState<FlowerPrediction | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<Error | null>(null);

  useFocusEffect(
    useCallback(() => {
      let active = true;
      setError(null);

      listPeriods()
        .then((loaded) => {
          if (!active) return;
          setPeriods(loaded);
          setPrediction(toFlowerPrediction(loaded, today));
          setIsLoading(false);
        })
        .catch((cause: unknown) => {
          if (!active) return;
          setError(cause instanceof Error ? cause : new Error(String(cause)));
          setIsLoading(false);
        });

      return () => {
        active = false;
      };
    }, [today]),
  );

  return { periods, prediction, isLoading, error };
}
