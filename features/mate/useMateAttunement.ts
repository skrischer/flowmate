// React hook exposing the Mate attunement model to the screen (spec-mate-push).
// It loads the followed owner's `shared_state` through the read-only lib/data
// follower path, injects `today` once at the wiring boundary, and runs the pure
// mapping -- the component consumes the result, never the data layer directly.

import { useCallback, useState } from 'react';
import { useFocusEffect } from 'expo-router';

import { getFollowedSharedState } from '../../lib/data';
import { todayIso } from '../flower/today';
import { toMateAttunement, type MateAttunement } from './attunement-view';

/** Async state of the Mate attunement load for the screen. */
export type MateAttunementState = {
  /** The phase-level model once loaded, or `null` while loading or after an error. */
  data: MateAttunement | null;
  /** True until the first load settles. */
  isLoading: boolean;
  /** The load error, or `null` when none occurred. */
  error: Error | null;
};

/**
 * Loads the Mate attunement model whenever the screen gains focus, so a pairing
 * change made on another screen is reflected on return (the tab stays mounted
 * under the stack, so a mount-only load would go stale). Reads ONLY
 * `shared_state` via the follower path; after a revoke that path returns no row
 * and the model renders the ended/empty state. `today` is read at the wiring
 * boundary; pass an explicit value to pin the reference day (e.g. in tests). The
 * clock is not re-read mid-focus (a date rollover while open is out of scope).
 */
export function useMateAttunement(today: string = todayIso()): MateAttunementState {
  const [data, setData] = useState<MateAttunement | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<Error | null>(null);

  useFocusEffect(
    useCallback(() => {
      let active = true;
      setError(null);

      getFollowedSharedState()
        .then((state) => {
          if (!active) return;
          setData(toMateAttunement(state, today));
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
