// German display labels for the curated mood set (issue #27, spec
// spec-flower-experience.md). The stored value is the English `Mood` literal
// from lib/data; the UI shows these labels. Kept as a pure lookup so it is
// unit-testable and never duplicated inline in the screen. Mood-only by design
// (vision non-goal: no quantified-self tracker) — no symptoms, no free-text note.

import { MOODS, type Mood } from '../../lib/data';

const MOOD_LABELS: Record<Mood, string> = {
  content: 'Zufrieden',
  calm: 'Ruhig',
  sensitive: 'Sensibel',
  irritable: 'Gereizt',
  low: 'Niedergeschlagen',
  anxious: 'Ängstlich',
};

/** The curated moods in display order, paired with their German label. */
export const MOOD_OPTIONS: readonly { value: Mood; label: string }[] = MOODS.map(
  (value) => ({ value, label: MOOD_LABELS[value] }),
);

/** The German display label for a stored mood value. */
export function moodLabel(mood: Mood): string {
  return MOOD_LABELS[mood];
}

/**
 * Narrows a stored string to a curated `Mood`, or null when it is not in the
 * set. The DB CHECK constraint mirrors `MOODS`, so a stored row is normally
 * valid; this guards the boundary without an unchecked cast.
 */
export function parseMood(value: string): Mood | null {
  return (MOODS as readonly string[]).includes(value) ? (value as Mood) : null;
}
