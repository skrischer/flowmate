// React hook that exposes the Flower prediction view-model to the UI (#25 home,
// #26 calendar). It loads the owner's periods through lib/data, injects `today`
// once at the wiring boundary, and runs the pure engine — components consume the
// result, never the data layer or the engine directly.

import { useCallback, useState } from 'react';
import { useFocusEffect } from 'expo-router';

import { loadFlowerPrediction, type FlowerPrediction } from './prediction';
import { todayIso } from './today';

/** Async state of the Flower prediction load for a UI surface. */
export type FlowerPredictionState = {
  /** The view-model once loaded, or `null` while loading or after an error. */
  data: FlowerPrediction | null;
  /** True until the first load settles. */
  isLoading: boolean;
  /** The load error, or `null` when none occurred. */
  error: Error | null;
};

/**
 * Loads the Flower prediction view-model whenever the screen gains focus, so a
 * period logged on another screen is reflected on return (the home and calendar
 * stay mounted under the stack, so a mount-only load would go stale). `today` is
 * read at the wiring boundary; pass an explicit value to pin the reference day
 * (e.g. in a screenshot or test). The clock is not re-read mid-focus — a date
 * rollover while the screen is open is out of scope for v1.
 */
export function useFlowerPrediction(today: string = todayIso()): FlowerPredictionState {
  const [data, setData] = useState<FlowerPrediction | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<Error | null>(null);

  useFocusEffect(
    useCallback(() => {
      let active = true;
      setError(null);

      loadFlowerPrediction(today)
        .then((result) => {
          if (!active) return;
          setData(result);
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

  return { data, isLoading, error };
}
