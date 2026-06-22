// React hook exposing the Mate attunement model to the screen (spec-mate-push).
// It loads the followed owner's `shared_state` through the read-only lib/data
// follower path, injects `today` once at the wiring boundary, and runs the pure
// mapping -- the component consumes the result, never the data layer directly.

import { useEffect, useState } from 'react';

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
 * Loads the Mate attunement model on mount. Reads ONLY `shared_state` via the
 * follower path; after a revoke that path returns no row and the model renders
 * the ended/empty state. `today` is read once here and passed into the pure
 * mapping; pass an explicit value to pin the reference day (e.g. in tests). The
 * clock is not re-read after mount (a date rollover while open is out of scope).
 */
export function useMateAttunement(today: string = todayIso()): MateAttunementState {
  const [data, setData] = useState<MateAttunement | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<Error | null>(null);

  useEffect(() => {
    let active = true;

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
  }, [today]);

  return { data, isLoading, error };
}
