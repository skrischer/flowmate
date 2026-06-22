// Builds the discreet push payload from a phase ONLY.
//
// The payload is assembled from a fixed phase -> copy map; no raw field
// (dates, mood, symptoms, next_period_date) is ever referenced. This is the
// sanitizing boundary the constitution requires: no raw health data in push
// payloads or logs. Spec: docs/specs/spec-mate-push.md.

import type { Phase, PushPayload } from './types.ts';

/**
 * Fixed phase -> discreet copy. Intentionally vague: a lock-screen-safe nudge to
 * stay attuned, never an exact date, value, or instruction ("informed, not
 * instructed"). No phase string other than the four below can occur (DB CHECK).
 */
const PHASE_COPY: Record<Phase, { title: string; body: string }> = {
  menstrual: { title: 'A new cycle has begun', body: 'A little extra care goes a long way today.' },
  follicular: { title: 'Energy is rising', body: 'A good moment to plan something together.' },
  ovulation: { title: 'Peak of the cycle', body: 'Spirits tend to run high right about now.' },
  luteal: { title: 'Winding down', body: 'Patience and quiet support are welcome now.' },
};

/**
 * Builds the Expo push payload for a phase transition. Carries only the new
 * phase name plus fixed attunement copy — no dates, no mood, no raw values.
 */
export function buildPushPayload(token: string, phase: Phase): PushPayload {
  const copy = PHASE_COPY[phase];
  return {
    to: token,
    title: copy.title,
    body: copy.body,
    data: { kind: 'phase_change', phase },
  };
}
