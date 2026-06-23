/// <reference types="jest" />
// Verifies the pure Mate attunement mapping: a stored shared_state row becomes a
// phase label + phase-derived hint + a discreet "~N Tage" heads-up (never an
// exact date), an unknown/null phase degrades gracefully, and a null state
// yields the empty model that drives the ended/revoked view.

import { isAttunementEmpty, toMateAttunement } from '../attunement-view';
import type { SharedState } from '../../../lib/data';

const state = (
  current_phase: string | null,
  next_period_date: string | null,
): SharedState => ({
  owner_id: 'owner-uuid',
  current_phase,
  next_period_date,
  updated_at: '2026-03-01T00:00:00.000Z',
});

describe('toMateAttunement', () => {
  it('maps a known phase to a German label plus a phase-derived hint', () => {
    const view = toMateAttunement(state('follicular', null), '2026-03-01');
    expect(view.phase).toBe('follicular');
    expect(view.phaseLabel).toBe('Follikelphase');
    expect(view.hint).not.toBeNull();
    expect(isAttunementEmpty(view)).toBe(false);
  });

  it('renders a discreet "~N Tage" heads-up, never an exact date', () => {
    const view = toMateAttunement(state('luteal', '2026-03-06'), '2026-03-01');
    expect(view.headsUp).toBe('Periode in etwa 5 Tagen');
    expect(view.headsUp).not.toContain('2026');
  });

  it('uses the singular phrasing one day out', () => {
    const view = toMateAttunement(state('luteal', '2026-03-02'), '2026-03-01');
    expect(view.headsUp).toBe('Periode in etwa 1 Tag');
  });

  it('treats a due-or-past next-period date as "etwa jetzt"', () => {
    const due = toMateAttunement(state('menstrual', '2026-03-01'), '2026-03-01');
    expect(due.headsUp).toBe('Periode etwa jetzt erwartet');

    const past = toMateAttunement(state('menstrual', '2026-02-28'), '2026-03-01');
    expect(past.headsUp).toBe('Periode etwa jetzt erwartet');
  });

  it('degrades an unknown or null phase to no label and no hint', () => {
    const unknown = toMateAttunement(state('zzz', '2026-03-06'), '2026-03-01');
    expect(unknown.phase).toBeNull();
    expect(unknown.phaseLabel).toBeNull();
    expect(unknown.hint).toBeNull();
    expect(unknown.headsUp).toBe('Periode in etwa 5 Tagen');

    const noPhase = toMateAttunement(state(null, null), '2026-03-01');
    expect(noPhase.phase).toBeNull();
    expect(noPhase.phaseLabel).toBeNull();
    expect(isAttunementEmpty(noPhase)).toBe(true);
  });

  it('returns an empty model for a null state (revoked / no edge)', () => {
    const view = toMateAttunement(null, '2026-03-01');
    expect(view).toEqual({ phase: null, phaseLabel: null, hint: null, headsUp: null });
    expect(isAttunementEmpty(view)).toBe(true);
  });
});
