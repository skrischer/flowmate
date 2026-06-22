// Core dispatch logic: transition detection + active-follower resolution.
//
// Pure-ish orchestration kept out of the HTTP handler so it stays small and
// unit-reasoned. Transition is decided from the webhook body's old vs new row
// only — never a re-read (race-free). The recipient is gated by an ACTIVE
// pairing edge, so a revoked pairing yields no recipient. The service role is
// used only to read the follower's enabled push_tokens (no client could).
// Spec: docs/specs/spec-mate-push.md.

import { createClient, type SupabaseClient } from 'https://esm.sh/@supabase/supabase-js@2.108.2';

import { buildPushPayload } from './payload.ts';
import { sendExpoPush } from './expo.ts';
import type { Phase, SharedStateWebhookBody } from './types.ts';

/**
 * The new phase IFF the webhook represents a real `current_phase` transition;
 * otherwise `null` (no change, or either side missing a phase). Comparing old
 * vs new is the spam guard — a non-phase `shared_state` write yields `null`.
 */
export function phaseTransition(body: SharedStateWebhookBody): Phase | null {
  const next = body.record?.current_phase ?? null;
  const prev = body.old_record?.current_phase ?? null;
  if (next === null || next === prev) {
    return null;
  }
  return next;
}

/** A service-role Supabase client for the cross-user dispatch reads. */
export function serviceClient(url: string, serviceRoleKey: string): SupabaseClient {
  return createClient(url, serviceRoleKey, {
    auth: { persistSession: false, autoRefreshToken: false },
  });
}

/**
 * Resolves the Expo token of the ACTIVE follower paired with `ownerId`, or
 * `null` when there is no active edge or the follower has push disabled / no
 * token. v1 is 1:1 so the single active edge is taken.
 */
export async function activeFollowerToken(
  client: SupabaseClient,
  ownerId: string,
): Promise<string | null> {
  const { data: edge, error: edgeError } = await client
    .from('pairing')
    .select('follower_id')
    .eq('owner_id', ownerId)
    .eq('status', 'active')
    .maybeSingle<FollowerEdge>();
  if (edgeError || !edge) {
    return null;
  }
  const { data: token, error: tokenError } = await client
    .from('push_tokens')
    .select('expo_push_token')
    .eq('user_id', edge.follower_id)
    .eq('enabled', true)
    .maybeSingle<TokenRow>();
  if (tokenError || !token) {
    return null;
  }
  return token.expo_push_token;
}

/** The only `pairing` field this dispatch needs: who follows the owner. */
type FollowerEdge = { follower_id: string };

/** The only `push_tokens` field this dispatch needs: the Expo token. */
type TokenRow = { expo_push_token: string };

/**
 * Sends the phase-change push to the active follower of `ownerId`, if any.
 * Logs the constructed payload (raw-data-free: phase only) before the Expo call,
 * per the spec's verification step. Returns true when a push was dispatched.
 */
export async function dispatchPhaseChange(
  client: SupabaseClient,
  ownerId: string,
  phase: Phase,
): Promise<boolean> {
  const token = await activeFollowerToken(client, ownerId);
  if (token === null) {
    console.log('No active follower with push enabled; skipping.');
    return false;
  }
  const payload = buildPushPayload(token, phase);
  // Payload is phase-level only (no dates/mood/raw values) — safe to log.
  console.log('Dispatching phase-change push', {
    title: payload.title,
    body: payload.body,
    data: payload.data,
  });
  const status = await sendExpoPush(payload);
  console.log('Expo push responded', { status });
  return true;
}
