// Typed wrappers for the pairing invite flow.
//
// This module is the ONLY access path to the invite/accept RPCs -- components
// never call Supabase directly (constitution). The trust anchor (the pairing
// edge) is created exclusively server-side inside the SECURITY DEFINER
// `accept_invite` function; clients have no direct INSERT on pairing. The owner
// mints an invite via `create_invite`, which returns the plaintext token ONCE
// (only its hash is stored) to share out-of-band. No raw health data flows
// through either path.

import { supabase } from './client';
import type { Tables } from './database.types';

/** A pairing edge row as stored (owner <-> follower, with status). */
export type Pairing = Tables<'pairing'>;

/** Resolves the authenticated user's id, throwing when no session exists. */
async function requireUserId(): Promise<string> {
  const { data, error } = await supabase.auth.getUser();
  if (error) {
    throw error;
  }
  if (!data.user) {
    throw new Error('No authenticated user: cannot resolve pairings.');
  }
  return data.user.id;
}

/**
 * A freshly minted invite. `token` is the plaintext code the owner shares with
 * the Mate out-of-band; it exists only in this response and is never persisted
 * (the server stores only its hash). `expiresAt` is the ISO expiry timestamp.
 */
export type Invite = {
  token: string;
  expiresAt: string;
};

/**
 * Mints a single-use, expiring invite for the current owner. Defaults to a 24h
 * expiry (spec). The server generates the random token, stores only its hash,
 * and returns the plaintext once for the owner to share. Returns the token and
 * its expiry.
 */
export async function createInvite(expiresInHours?: number): Promise<Invite> {
  const { data, error } = await supabase.rpc(
    'create_invite',
    expiresInHours === undefined ? {} : { expires_in_hours: expiresInHours },
  );
  if (error) {
    throw error;
  }
  const row = data[0];
  if (!row) {
    throw new Error('create_invite returned no row.');
  }
  return { token: row.token, expiresAt: row.expires_at };
}

/**
 * Redeems a plaintext invite token for the current follower. The server hashes
 * the token, validates it (exists, unexpired, unused), and creates the active
 * pairing edge atomically (owner from the invite, follower = the caller). Throws
 * on an invalid, expired, or already-used token. Returns the new pairing id.
 */
export async function acceptInvite(token: string): Promise<string> {
  const { data, error } = await supabase.rpc('accept_invite', { token });
  if (error) {
    throw error;
  }
  return data;
}

/**
 * Lists the current owner's ACTIVE pairing edges (the Mates following them). The
 * `pairing_select_own_edge` RLS policy returns the caller's edges in BOTH
 * directions (owner and follower), so this scopes explicitly to `owner_id` -- in
 * the n:m-capable substrate a person may also be a follower elsewhere, and this
 * management view is owner-only. Narrowed to `status = 'active'`; revoked history
 * stays out. v1 is single-follower, but the query stays n:m-capable (returns a
 * list). Ordered newest-first. Returns `[]` when nothing is active.
 */
export async function listActivePairings(): Promise<Pairing[]> {
  const ownerId = await requireUserId();
  const { data, error } = await supabase
    .from('pairing')
    .select()
    .eq('owner_id', ownerId)
    .eq('status', 'active')
    .order('created_at', { ascending: false });
  if (error) {
    throw error;
  }
  return data;
}

/**
 * Revokes a pairing edge: flips its `status` to `revoked`, keeping the row as
 * history (no hard delete). The owner-only `pairing_update_owner` RLS policy is
 * the enforcing boundary -- a follower cannot revoke. Because the follower's
 * `shared_state` SELECT policy matches only `active` edges, this cuts the Mate's
 * derived read immediately. Re-pairing later mints a fresh `active` row. No raw
 * health data is touched.
 */
export async function revokePairing(pairingId: string): Promise<void> {
  const { error } = await supabase
    .from('pairing')
    .update({ status: 'revoked' })
    .eq('id', pairingId)
    .eq('status', 'active');
  if (error) {
    throw error;
  }
}
