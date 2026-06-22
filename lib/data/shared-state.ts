// Typed OWNER write path for the derived `shared_state` row.
//
// This module is the ONLY write access path to shared_state -- components never
// call Supabase directly (constitution: cycle data only through lib/data/). The
// owner derives an attunement/phase-level snapshot from their own logged periods
// via the pure prediction engine (lib/prediction) and upserts it on their
// owner_id primary key; RLS (owner_id = auth.uid()) is the enforcing boundary,
// so a follower can never write here. The snapshot carries ONLY phase-level
// information -- `current_phase` and a `next_period_date` heads-up; NEVER raw
// health data (no logged period dates, no symptoms, no daily-log moods). The
// follower reads this derived row; her raw logs stay follower-inaccessible.
//
// Prediction is NEVER reimplemented here (constitution / spec: no prediction
// logic in SQL or duplicated in app code) -- periods are mapped to the engine's
// PeriodStart shape and `buildPrediction` (today injected by the caller) does
// the work. Spec: docs/specs/spec-pairing.md.

import { buildPrediction } from '../prediction';

import { supabase } from './client';
import { listPeriods } from './periods';
import type { Tables } from './database.types';

/** The owner's derived shared row as stored: phase-level fields only. */
export type SharedState = Tables<'shared_state'>;

/** Resolves the authenticated user's id, throwing when no session exists. */
async function requireOwnerId(): Promise<string> {
  const { data, error } = await supabase.auth.getUser();
  if (error) {
    throw error;
  }
  if (!data.user) {
    throw new Error('No authenticated user: cannot resolve the shared-state owner.');
  }
  return data.user.id;
}

/**
 * READ-ONLY follower path for the Mate attunement view (spec-mate-push.md):
 * reads the `shared_state` of the owner the current user follows on an ACTIVE
 * pairing edge. Resolves the active edge (`follower_id = auth.uid() AND status =
 * 'active'`) to find the owner, then SELECTs that owner's derived row.
 *
 * The follower never touches raw logs -- this reads ONLY `shared_state`, whose
 * follower-SELECT RLS policy (Phase 5) is keyed on the active edge. After revoke
 * the edge is no longer `active`, so no owner resolves and this returns `null`,
 * driving the Mate view's ended/empty state. Returns `null` when there is no
 * active following edge or no shared row exists yet. There is no write path here.
 */
export async function getFollowedSharedState(): Promise<SharedState | null> {
  const { data: userData, error: userError } = await supabase.auth.getUser();
  if (userError) {
    throw userError;
  }
  if (!userData.user) {
    return null;
  }
  const { data: edge, error: edgeError } = await supabase
    .from('pairing')
    .select('owner_id')
    .eq('follower_id', userData.user.id)
    .eq('status', 'active')
    .maybeSingle();
  if (edgeError) {
    throw edgeError;
  }
  if (!edge) {
    return null;
  }
  const { data, error } = await supabase
    .from('shared_state')
    .select()
    .eq('owner_id', edge.owner_id)
    .maybeSingle();
  if (error) {
    throw error;
  }
  return data;
}

/**
 * Recomputes and writes the current owner's `shared_state` from their logged
 * periods, anchoring the prediction on `today` (injected by the caller -- the
 * data layer reads no clock). Called on app open and after a log so the
 * follower's attunement view stays current (spec staleness mitigation).
 *
 * The written snapshot is phase-level ONLY: `current_phase` and a
 * `next_period_date` heads-up, both derived. When history is too short to anchor
 * a cycle, both are written as `null` (nothing shareable yet). Upserts on the
 * owner_id primary key so a refresh replaces the previous snapshot. Owner-only by
 * RLS. Returns the stored row.
 */
export async function refreshSharedState(today: string): Promise<SharedState> {
  const ownerId = await requireOwnerId();
  const periods = await listPeriods();
  const prediction = buildPrediction(
    periods.map((period) => ({ startDate: period.start_date })),
    today,
  );
  const { data, error } = await supabase
    .from('shared_state')
    .upsert(
      {
        owner_id: ownerId,
        current_phase: prediction?.currentPhase ?? null,
        next_period_date: prediction?.nextPeriodDate ?? null,
        updated_at: new Date().toISOString(),
      },
      { onConflict: 'owner_id' },
    )
    .select()
    .single();
  if (error) {
    throw error;
  }
  return data;
}
