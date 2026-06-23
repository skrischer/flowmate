// Pure mapping for the Mate attunement view (spec-mate-push.md). Turns the
// owner's derived `shared_state` row into the phase-level display model the Mate
// screen renders: a German phase label, a phase-derived attunement hint
// ("informiert, nicht beauftragt"), and a discreet next-period heads-up.
//
// This is the Mate's only window onto the cycle: phase + heads-up + hint, NEVER
// raw data. The attunement hint is DERIVED from the phase here (spec-pairing.md:
// the hint is not stored; her raw mood stays in daily_logs, follower-
// inaccessible). The heads-up is framed as "~N Tage" -- a discreet countdown,
// never an exact date string. Pure and synchronous so it is unit-testable
// without a renderer; `today` arrives from the wiring boundary, never read here.

import { daysBetween } from '../../lib/prediction/dates';
import type { Phase } from '../../lib/prediction';
import type { SharedState } from '../../lib/data';

/** The known cycle phases, used to validate the stored phase string. */
const PHASES: readonly Phase[] = ['menstrual', 'follicular', 'ovulation', 'luteal'];

/** German display label for each cycle phase (mirrors the Flower labels). */
const PHASE_LABELS: Record<Phase, string> = {
  menstrual: 'Menstruation',
  follicular: 'Follikelphase',
  ovulation: 'Eisprung',
  luteal: 'Lutealphase',
};

// Phase-derived attunement hint -- "informed, not instructed". Gentle, no task.
const PHASE_HINTS: Record<Phase, string> = {
  menstrual: 'Ihre Periode laeuft gerade. Etwas Ruhe und Waerme tun jetzt gut.',
  follicular: 'Energie steigt -- eine gute Zeit fuer gemeinsame Plaene.',
  ovulation: 'Rund um den Eisprung -- oft besonders energiegeladen.',
  luteal: 'Vor der Periode kann mehr Ruhe und Geduld guttun.',
};

/** The phase-level model the Mate screen renders; no raw data ever appears. */
export type MateAttunement = {
  /** The typed Phase enum value, or `null` when not yet known. Used by PhaseChip/PhaseTrack. */
  phase: Phase | null;
  /** German label for the owner's current phase, or `null` when not yet known. */
  phaseLabel: string | null;
  /** Phase-derived attunement hint, or `null` when the phase is unknown. */
  hint: string | null;
  /** Discreet next-period heads-up ("~N Tage"), or `null` when none is shareable. */
  headsUp: string | null;
};

/** Narrows the stored nullable phase string to a known {@link Phase}, or `null`. */
function toPhase(value: string | null): Phase | null {
  return PHASES.find((phase) => phase === value) ?? null;
}

/**
 * A discreet next-period heads-up: a "~N Tage" countdown from `today`, never an
 * exact date (constitution: discreet, raw-data-free). Returns `null` when there
 * is no shareable next-period date or it is already in the past.
 */
function headsUp(nextPeriodDate: string | null, today: string): string | null {
  if (nextPeriodDate === null) {
    return null;
  }
  const days = daysBetween(today, nextPeriodDate);
  if (days <= 0) {
    return 'Periode etwa jetzt erwartet';
  }
  if (days === 1) {
    return 'Periode in etwa 1 Tag';
  }
  return `Periode in etwa ${days} Tagen`;
}

/**
 * Maps the followed owner's `shared_state` to the Mate attunement model. A
 * `null` state (no active edge / no shared row) yields an all-`null` model that
 * the screen renders as its ended/empty state. `today` is injected by the caller.
 */
export function toMateAttunement(state: SharedState | null, today: string): MateAttunement {
  if (state === null) {
    return { phase: null, phaseLabel: null, hint: null, headsUp: null };
  }
  const phase = toPhase(state.current_phase);
  return {
    phase,
    phaseLabel: phase === null ? null : PHASE_LABELS[phase],
    hint: phase === null ? null : PHASE_HINTS[phase],
    headsUp: headsUp(state.next_period_date, today),
  };
}

/** True when there is nothing attunement-level to show (drives the empty state). */
export function isAttunementEmpty(view: MateAttunement): boolean {
  return view.phaseLabel === null && view.headsUp === null;
}
