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
